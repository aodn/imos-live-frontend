/**
 * Ocean Current Atlas shaders — atlas-aware replacements for vectorFs and vectorFsUpdate.
 *
 * Uniform conventions (unchanged from VectorField.js):
 *   u_bounds        vec4      [nwMercatorX, seMercatorY, seMercatorX, nwMercatorY]
 *   u_data_bounds   vec4      [lonMin, latMax, lonMax, latMin]
 *   u_vector_min    vec2      [uMin_m/s, vMin_m/s]
 *   u_vector_max    vec2      [uMax_m/s, vMax_m/s]
 *
 * New atlas uniforms:
 *   u_atlas         sampler2D the 2048×2048 atlas texture
 *   u_slots         vec4[80]  [uvOffsetX, uvOffsetY, uvScaleX, uvScaleY] per slot
 *   u_loaded        int[80]   1 = slot has been uploaded, 0 = empty
 *   u_lod_grids     vec2[4]   grid [cols, rows] per LOD, ordered coarse→fine
 *   u_lod_offsets   int[4]    cumulative slot offset per LOD
 *   u_lod_count     int       number of active LODs (1–4)
 *   u_lod_blend     float     0.0→1.0, controls the final LOD transition
 */

export const oceanCurrentAtlasVs = `#version 300 es
precision highp float;

in float a_index;

uniform sampler2D u_particles;
uniform float u_particles_res;
uniform float u_point_size;

out vec2 v_particle_pos;

void main() {
    v_particle_pos = texture(u_particles, vec2(
        fract(a_index / u_particles_res),
        floor(a_index / u_particles_res) / u_particles_res)).rg;

    gl_PointSize = u_point_size;
    gl_Position = vec4(2.0 * v_particle_pos.x - 1.0, 1.0 - 2.0 * v_particle_pos.y, 0, 1);
}
`;

export const oceanCurrentAtlasVsQuad = `#version 300 es
precision highp float;

in vec2 a_pos;

out vec2 v_tex_pos;

void main() {
    v_tex_pos = a_pos;
    gl_Position = vec4(1.0 - 2.0 * a_pos, 0, 1);
}
`;

export const oceanCurrentAtlasFsScreen = `#version 300 es
precision highp float;

uniform sampler2D u_screen;
uniform float u_opacity;

in vec2 v_tex_pos;
out vec4 fragColor;

void main() {
    vec4 color = texture(u_screen, 1.0 - v_tex_pos);
    // a hack to guarantee opacity fade out even with a value close to 1.0
    fragColor = vec4(floor(255.0 * color * u_opacity) / 255.0);
}
`;

// Shared GLSL helpers embedded as a template string prefix.
// Duplicated across both shaders — GLSL has no #include system.
// totalSlots, totalVirtualChunks, atlasW, atlasH are injected at compile time so array sizes
// and bilinear filter pixel size match the actual atlas layout.
function makeSharedGlsl(
  totalSlots: number,
  totalVirtualChunks: number,
  atlasW: number,
  atlasH: number,
): string {
  return /* glsl */ `
uniform vec4 u_bounds;          // [nwX, seY, seX, nwY]
uniform vec4 u_data_bounds;     // [lonMin, latMax, lonMax, latMin]
uniform vec4 u_slots[${totalSlots}];           // static UV layout per physical slot
uniform int  u_chunk_slots[${totalVirtualChunks}]; // virtual chunk index → physical slot (−1 = not loaded)
uniform vec2 u_lod_grids[4];
uniform int  u_lod_offsets[4];
uniform vec2 u_uv_scale;        // chunkPx / storedPx — maps local [0,1] into data region
uniform vec2 u_uv_offset;       // padding / storedPx — shifts past the padding border

// ── Mercator → lon/lat ────────────────────────────────────────────────────────
vec2 returnLonLat(float x_domain, float y_domain, vec2 pos) {
    float mercator_x = fract(u_bounds.x + pos.x * x_domain);
    float mercator_y = u_bounds.w + pos.y * y_domain;
    float lon  = mercator_x * 360.0 - 180.0;
    float lat2 = 180.0 - mercator_y * 360.0;
    float lat  = 360.0 / 3.141592654 * atan(exp(lat2 * 3.141592654 / 180.0)) - 90.0;
    return vec2(lon, lat);
}

// ── Returns the physical atlas slot for this LOD/position, or −1 if not resident ──
// lodIdx is 0-based (0 = LOD1, 1 = LOD2, ...).
int physicalSlot(vec2 lonlat, int lodIdx) {
    vec2 grid = u_lod_grids[lodIdx];
    float lonRange = u_data_bounds.z - u_data_bounds.x;
    float latRange = u_data_bounds.y - u_data_bounds.w;
    int cx = clamp(int(floor((lonlat.x - u_data_bounds.x) / (lonRange / grid.x))), 0, int(grid.x) - 1);
    int cy = clamp(int(floor((u_data_bounds.y - lonlat.y) / (latRange / grid.y))), 0, int(grid.y) - 1);
    int virtualIdx = u_lod_offsets[lodIdx] + cy * int(grid.x) + cx;
    return u_chunk_slots[virtualIdx];
}

// ── World (lon, lat) → atlas UV (call only when physicalSlot >= 0) ────────────
// cx=0 = westernmost chunk, cy=0 = northernmost chunk.
vec2 worldToAtlasUV(vec2 lonlat, int lodIdx) {
    vec2 grid = u_lod_grids[lodIdx];
    float lonRange = u_data_bounds.z - u_data_bounds.x;
    float latRange = u_data_bounds.y - u_data_bounds.w;
    float chunkLonSize = lonRange / grid.x;
    float chunkLatSize = latRange / grid.y;

    int cx = clamp(int(floor((lonlat.x - u_data_bounds.x) / chunkLonSize)), 0, int(grid.x) - 1);
    int cy = clamp(int(floor((u_data_bounds.y - lonlat.y) / chunkLatSize)), 0, int(grid.y) - 1);

    // Northwest corner of the resolved chunk
    float chunkLonOrigin    = float(cx) * chunkLonSize + u_data_bounds.x;
    float chunkLatNorthEdge = u_data_bounds.y - float(cy) * chunkLatSize;

    float localU = (lonlat.x - chunkLonOrigin)    / chunkLonSize;
    float localV = (chunkLatNorthEdge - lonlat.y) / chunkLatSize;

    // Shift local [0,1] into the data region, skipping the padding border.
    localU = localU * u_uv_scale.x + u_uv_offset.x;
    localV = localV * u_uv_scale.y + u_uv_offset.y;

    int virtIdx = u_lod_offsets[lodIdx] + cy * int(grid.x) + cx;
    vec4 slot = u_slots[u_chunk_slots[virtIdx]];
    return slot.xy + vec2(localU, localV) * slot.zw;
}

// ── Manual bilinear filter in atlas UV space ──────────────────────────────────
// Matches the lookup_vector() approach in the original shaders for smooth
// interpolation — avoids relying solely on hardware LINEAR filtering.
// atlasW / atlasH are injected as compile-time constants by the factory function.
vec2 sampleAtlasRG(vec2 uv) {
    vec2 dims = vec2(${atlasW}.0, ${atlasH}.0);
    vec2 px   = 1.0 / dims;
    vec2 vc   = floor(uv * dims) / dims;
    vec2 f    = fract(uv * dims);
    vec2 tl = texture(u_atlas, vc).rg;
    vec2 tr = texture(u_atlas, vc + vec2(px.x, 0.0)).rg;
    vec2 bl = texture(u_atlas, vc + vec2(0.0, px.y)).rg;
    vec2 br = texture(u_atlas, vc + px).rg;
    return mix(mix(tl, tr, f.x), mix(bl, br, f.x), f.y);
}
`;
}

// ── Draw shader ───────────────────────────────────────────────────────────────
// Replaces vectorFs. Samples velocity from the atlas with LOD crossfade.

export function makeOceanCurrentAtlasFsParticle(
  totalSlots: number,
  totalVirtualChunks: number,
  atlasW: number,
  atlasH: number,
): string {
  return /* glsl */ `#version 300 es
precision highp float;

uniform sampler2D u_atlas;
uniform vec2      u_vector_min;
uniform vec2      u_vector_max;
uniform sampler2D u_color_ramp;
uniform float     u_max_speed;
uniform int       u_lod_count;
uniform float     u_lod_blend;

in  vec2 v_particle_pos;
out vec4 fragColor;

${makeSharedGlsl(totalSlots, totalVirtualChunks, atlasW, atlasH)}

void main() {
    float x_domain = abs(u_bounds.x - u_bounds.z);
    float y_domain = abs(u_bounds.y - u_bounds.w);
    vec2 lonlat = returnLonLat(x_domain, y_domain, v_particle_pos);

    // Discard particles outside the data region
    if (lonlat.y > u_data_bounds.y || lonlat.y < u_data_bounds.w ||
        lonlat.x > u_data_bounds.z || lonlat.x < u_data_bounds.x) {
        discard;
    }

    // Ocean mask — sampled from LOD1 B channel (always loaded, no guard needed)
    vec2 uv0 = worldToAtlasUV(lonlat, 0);
    if (texture(u_atlas, uv0).b < 0.99) discard;

    // LOD1 velocity — always available as the base
    vec2 velocity = mix(u_vector_min, u_vector_max, sampleAtlasRG(uv0));

    // Blend in finer LODs coarse→fine.
    // Intermediate LODs blend at 100% when resident; finest active LOD uses u_lod_blend.
    for (int i = 1; i < u_lod_count; i++) {
        if (physicalSlot(lonlat, i) >= 0) {
            vec2 finerVelocity = mix(u_vector_min, u_vector_max, sampleAtlasRG(worldToAtlasUV(lonlat, i)));
            float t = (i == u_lod_count - 1) ? u_lod_blend : 1.0;
            velocity = mix(velocity, finerVelocity, t);
        }
    }

    float max_speed = (u_max_speed > 0.0) ? u_max_speed : length(u_vector_max);
    float speed_t   = length(velocity) / max_speed;

    fragColor = texture(u_color_ramp, vec2(speed_t, 0.5));
}
`;
}

// ── Position-update shader ────────────────────────────────────────────────────
// Replaces vectorFsUpdate. Uses LOD1 only (lodIdx=0) — position updates don't
// need LOD2+ precision, and this avoids the u_loaded guard in the hot update path.

export function makeOceanCurrentAtlasFsUpdate(
  totalSlots: number,
  totalVirtualChunks: number,
  atlasW: number,
  atlasH: number,
): string {
  return /* glsl */ `#version 300 es
precision highp float;

uniform sampler2D u_particles;
uniform sampler2D u_atlas;
uniform vec2      u_vector_min;
uniform vec2      u_vector_max;
uniform float     u_rand_seed;
uniform float     u_speed_factor;
uniform float     u_drop_rate;
uniform float     u_drop_rate_bump;

in  vec2 v_tex_pos;
out vec4 fragColor;

// Pseudo-random generator — identical to vectorFsUpdate
const vec3 rand_constants = vec3(12.9898, 78.233, 4375.85453);
float rand(const vec2 co) {
    float t = dot(rand_constants.xy, co);
    return fract(sin(t) * (rand_constants.z + t));
}

${makeSharedGlsl(totalSlots, totalVirtualChunks, atlasW, atlasH)}

void main() {
    // Particle position stored as plain floats in RG (WebGL2 RG32F texture)
    vec2 pos = texture(u_particles, v_tex_pos).rg;

    float x_domain = abs(u_bounds.x - u_bounds.z);
    float y_domain = abs(u_bounds.y - u_bounds.w);
    vec2 lonlat = returnLonLat(x_domain, y_domain, pos);

    // Sample LOD1 (lodIdx=0) for velocity — always available, no guard needed
    vec2 uv0      = worldToAtlasUV(lonlat, 0);
    vec2 velocity = mix(u_vector_min, u_vector_max, sampleAtlasRG(uv0));

    float speed_t = length(velocity) / length(u_vector_max);

    // Advance position — negate v because Mercator y increases southward
    vec2 offset = vec2(velocity.x, -velocity.y) * 0.0001 * u_speed_factor;
    pos = fract(1.0 + pos + offset);

    // Random drop: restart particle at a new random position with probability drop_rate
    vec2 seed      = (pos + v_tex_pos) * u_rand_seed;
    float drop_rate = u_drop_rate + speed_t * u_drop_rate_bump;
    float drop      = step(1.0 - drop_rate, rand(seed));
    vec2 random_pos = vec2(rand(seed + 1.3), rand(seed + 2.1));
    pos = mix(pos, random_pos, drop);

    // Write updated position — stored as float in RG channels of the ping-pong texture
    fragColor = vec4(pos, 0.0, 1.0);
}
`;
}

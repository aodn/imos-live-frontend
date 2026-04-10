/**
 * Wind Atlas shaders — atlas-aware replacements for vectorFs and vectorFsUpdate.
 *
 * Uniform conventions (unchanged from VectorField.js):
 *   u_bounds      vec4  [nwMercatorX, seMercatorY, seMercatorX, nwMercatorY]
 *   u_data_bounds vec4  [lonMin, latMax, lonMax, latMin]
 *   u_vector_min  vec2  [uMin_m/s, vMin_m/s]
 *   u_vector_max  vec2  [uMax_m/s, vMax_m/s]
 *
 * New atlas uniforms:
 *   u_atlas       sampler2D  the 2048×2048 atlas texture
 *   u_slots       vec4[80]   [uvOffsetX, uvOffsetY, uvScaleX, uvScaleY] per slot
 *   u_loaded      int[80]    1 = slot has been uploaded, 0 = empty
 *   u_lod1_grid   vec2       (3.0, 3.0)
 *   u_lod2_grid   vec2       (6.0, 5.0)
 *   u_lod_blend   float      0.0 = LOD1 only, 1.0 = full LOD2
 *
 * Vertex shaders (vectorVs, vectorVsQuad) and screen shader (vectorFsScreen)
 * are unchanged — import them directly from shader.js.
 */

export const windAtlasVs = `#version 300 es
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

export const windAtlasVsQuad = `#version 300 es
precision highp float;

in vec2 a_pos;

out vec2 v_tex_pos;

void main() {
    v_tex_pos = a_pos;
    gl_Position = vec4(1.0 - 2.0 * a_pos, 0, 1);
}
`;

export const windAtlasFsScreen = `#version 300 es
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
const SHARED_GLSL = /* glsl */ `
// ── Mercator → lon/lat ────────────────────────────────────────────────────────
// Identical to the function in the original vectorFs / vectorFsUpdate.
vec2 returnLonLat(float x_domain, float y_domain, vec2 pos) {
    float mercator_x = fract(u_bounds.x + pos.x * x_domain);
    float mercator_y = u_bounds.w + pos.y * y_domain;
    float lon  = mercator_x * 360.0 - 180.0;
    float lat2 = 180.0 - mercator_y * 360.0;
    float lat  = 360.0 / 3.141592654 * atan(exp(lat2 * 3.141592654 / 180.0)) - 90.0;
    return vec2(lon, lat);
}

// ── World (lon, lat) → atlas UV ───────────────────────────────────────────────
// O(1): no loop, only arithmetic + one u_slots[] lookup.
//
// Coordinate system:
//   cx = 0 → westernmost chunk   (lon near u_data_bounds.x)
//   cy = 0 → northernmost chunk  (lat near u_data_bounds.y)
//   This matches the Python chunk generator (gsla_chunking.py).
//
// u_data_bounds: x=lonMin, y=latMax, z=lonMax, w=latMin
vec2 worldToAtlasUV(vec2 lonlat, vec2 grid, int slotOffset) {
    float lonRange = u_data_bounds.z - u_data_bounds.x;  // positive
    float latRange = u_data_bounds.y - u_data_bounds.w;  // positive (latMax - latMin)

    float chunkLonSize = lonRange / grid.x;
    float chunkLatSize = latRange / grid.y;

    int cx = clamp(int(floor((lonlat.x - u_data_bounds.x) / chunkLonSize)), 0, int(grid.x) - 1);
    int cy = clamp(int(floor((u_data_bounds.y - lonlat.y) / chunkLatSize)), 0, int(grid.y) - 1);
    int slotIdx = slotOffset + cy * int(grid.x) + cx;

    // Northwest corner of the resolved chunk
    float chunkLonOrigin    = float(cx) * chunkLonSize + u_data_bounds.x;
    float chunkLatNorthEdge = u_data_bounds.y - float(cy) * chunkLatSize;

    // Local UV in [0, 1]: (0,0) = NW corner, (1,1) = SE corner
    float localU = (lonlat.x - chunkLonOrigin)    / chunkLonSize;
    float localV = (chunkLatNorthEdge - lonlat.y) / chunkLatSize;

    // Padding correction: stored chunk is 242×194, data occupies inner 240×192.
    // Map [0,1] → [1/242, 241/242] in U and [1/194, 193/194] in V.
    localU = localU * (240.0 / 242.0) + (1.0 / 242.0);
    localV = localV * (192.0 / 194.0) + (1.0 / 194.0);

    vec4 slot = u_slots[slotIdx];
    return slot.xy + vec2(localU, localV) * slot.zw;
}


// ── Manual bilinear filter in atlas UV space ──────────────────────────────────
// Matches the lookup_vector() approach in the original shaders for smooth
// interpolation — avoids relying solely on hardware LINEAR filtering.
vec2 sampleAtlasRG(vec2 uv) {
    const float ATLAS_SIZE = 2048.0;
    vec2 px = vec2(1.0 / ATLAS_SIZE);
    vec2 vc = floor(uv * ATLAS_SIZE) / ATLAS_SIZE;
    vec2 f  = fract(uv * ATLAS_SIZE);
    vec2 tl = texture(u_atlas, vc).rg;
    vec2 tr = texture(u_atlas, vc + vec2(px.x, 0.0)).rg;
    vec2 bl = texture(u_atlas, vc + vec2(0.0, px.y)).rg;
    vec2 br = texture(u_atlas, vc + px).rg;
    return mix(mix(tl, tr, f.x), mix(bl, br, f.x), f.y);
}
`;

// ── Draw shader ───────────────────────────────────────────────────────────────
// Replaces vectorFs. Adds LOD1/LOD2 atlas sampling with crossfade.

export const windAtlasFsParticle = /* glsl */ `#version 300 es
precision highp float;

uniform sampler2D u_atlas;
uniform vec2      u_vector_min;
uniform vec2      u_vector_max;
uniform sampler2D u_color_ramp;
uniform float     u_max_speed;
uniform vec4      u_bounds;
uniform vec4      u_data_bounds;
uniform vec4      u_slots[80];
uniform int       u_loaded[80];
uniform vec2      u_lod1_grid;
uniform vec2      u_lod2_grid;
uniform float     u_lod_blend;

in  vec2 v_particle_pos;
out vec4 fragColor;

${SHARED_GLSL}

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
    vec2 uv1 = worldToAtlasUV(lonlat, u_lod1_grid, 0);
    if (texture(u_atlas, uv1).b < 0.99) discard;

    // LOD1 velocity (always available)
    vec2 wind1 = mix(u_vector_min, u_vector_max, sampleAtlasRG(uv1));

    // LOD2 velocity — only blend when the chunk covering this position is loaded
    float lonRange = u_data_bounds.z - u_data_bounds.x;
    float latRange = u_data_bounds.y - u_data_bounds.w;
    int cx2 = clamp(
        int(floor((lonlat.x - u_data_bounds.x) / (lonRange / u_lod2_grid.x))),
        0, int(u_lod2_grid.x) - 1
    );
    int cy2 = clamp(
        int(floor((u_data_bounds.y - lonlat.y) / (latRange / u_lod2_grid.y))),
        0, int(u_lod2_grid.y) - 1
    );
    int lod2SlotIdx = 9 + cy2 * int(u_lod2_grid.x) + cx2;
    bool has2 = u_loaded[lod2SlotIdx] == 1;

    vec2 wind2 = wind1;  // fallback: LOD1 value
    if (has2) {
        vec2 uv2 = worldToAtlasUV(lonlat, u_lod2_grid, 9);
        wind2 = mix(u_vector_min, u_vector_max, sampleAtlasRG(uv2));
    }

    vec2 velocity = mix(wind1, wind2, has2 ? u_lod_blend : 0.0);

    float max_speed = (u_max_speed > 0.0) ? u_max_speed : length(u_vector_max);
    float speed_t   = length(velocity) / max_speed;
    

    vec2 ramp_pos = vec2(fract(16.0 * speed_t), floor(16.0 * speed_t) / 16.0);
    fragColor = texture(u_color_ramp, ramp_pos);
}
`;

// ── Position-update shader ────────────────────────────────────────────────────
// Replaces vectorFsUpdate. Uses LOD1 only — position updates don't need
// LOD2 precision, and this avoids the u_loaded guard in the hot update path.

export const windAtlasFsUpdate = /* glsl */ `#version 300 es
precision highp float;

uniform sampler2D u_particles;
uniform sampler2D u_atlas;
uniform vec2      u_vector_min;
uniform vec2      u_vector_max;
uniform float     u_rand_seed;
uniform float     u_speed_factor;
uniform float     u_drop_rate;
uniform float     u_drop_rate_bump;
uniform vec4      u_bounds;
uniform vec4      u_data_bounds;
uniform vec4      u_slots[80];
uniform vec2      u_lod1_grid;

in  vec2 v_tex_pos;
out vec4 fragColor;

// Pseudo-random generator — identical to vectorFsUpdate
const vec3 rand_constants = vec3(12.9898, 78.233, 4375.85453);
float rand(const vec2 co) {
    float t = dot(rand_constants.xy, co);
    return fract(sin(t) * (rand_constants.z + t));
}

${SHARED_GLSL}

void main() {
    // Particle position stored as plain floats in RG (WebGL2 RG32F texture)
    vec2 pos = texture(u_particles, v_tex_pos).rg;

    float x_domain = abs(u_bounds.x - u_bounds.z);
    float y_domain = abs(u_bounds.y - u_bounds.w);
    vec2 lonlat = returnLonLat(x_domain, y_domain, pos);

    // Sample LOD1 for velocity — always available, no guard needed
    vec2 uv1      = worldToAtlasUV(lonlat, u_lod1_grid, 0);
    vec2 velocity = mix(u_vector_min, u_vector_max, sampleAtlasRG(uv1));

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

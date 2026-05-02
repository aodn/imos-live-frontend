/**
 * Scalar Atlas shaders — atlas-aware overlay renderer for scalar fields.
 *
 * Renders a full-viewport quad; each fragment:
 *   1. Reconstructs lon/lat from its Mercator position (via u_bounds).
 *   2. Discards if outside the data region or on land (A < 0.01).
 *   3. Samples LOD1 (always loaded), then blends in finer LODs as they arrive.
 *   4. Decodes the 24-bit RGB scalar value.
 *   5. Maps the value to a color ramp via u_color_ramp.
 *
 * Uniform conventions (shared with oceanCurrentAtlasShader):
 *   u_bounds        vec4      [nwMercatorX, seMercatorY, seMercatorX, nwMercatorY]
 *   u_data_bounds   vec4      [lonMin, latMax, lonMax, latMin]
 *   u_atlas         sampler2D the 2048×2048 atlas texture
 *   u_slots         vec4[80]  [uvOffsetX, uvOffsetY, uvScaleX, uvScaleY] per slot
 *   u_loaded        int[80]   1 = slot uploaded, 0 = empty
 *   u_lod_grids     vec2[4]   grid [cols, rows] per LOD, ordered coarse→fine
 *   u_lod_offsets   int[4]    cumulative slot offset per LOD
 *   u_lod_count     int       number of active LODs (1–4)
 *   u_lod_blend     float     0.0→1.0, controls the final LOD transition
 *   u_value_range   vec2      [rawMin, rawMax] — the dataset's actual value range
 *   u_legend_range  vec2      [legendMin, legendMax] — color ramp clamp range
 */

// Full-viewport quad vertex shader.
// a_pos is in [0,1]×[0,1] with (0,0)=bottom-left, (1,1)=top-right in clip space.
// v_screen_pos is flipped in Y so (0,0)=top-left matches the u_bounds NW convention.
export const scalarAtlasVs = `#version 300 es
precision highp float;

in vec2 a_pos;

out vec2 v_screen_pos;

void main() {
    v_screen_pos = vec2(a_pos.x, 1.0 - a_pos.y);
    gl_Position  = vec4(a_pos * 2.0 - 1.0, 0.0, 1.0);
}
`;

// Shared GLSL helpers (duplicated from oceanCurrentAtlasShader — GLSL has no #include).
// totalSlots and totalVirtualChunks are injected at compile time so array sizes match the manifest.
function makeSharedGlsl(totalSlots: number, totalVirtualChunks: number): string {
  return /* glsl */ `
uniform vec4 u_bounds;          // [nwX, seY, seX, nwY]
uniform vec4 u_data_bounds;     // [lonMin, latMax, lonMax, latMin]
uniform vec4 u_slots[${totalSlots}];           // static UV layout per physical slot
uniform int  u_chunk_slots[${totalVirtualChunks}]; // virtual chunk index → physical slot (−1 = not loaded)
uniform vec2 u_lod_grids[4];
uniform int  u_lod_offsets[4];
uniform vec2 u_uv_scale;        // chunkPx / storedPx — maps local [0,1] into data region
uniform vec2 u_uv_offset;       // padding / storedPx — shifts past the padding border

// Mercator position [0,1]×[0,1] → geographic lon/lat (degrees)
vec2 returnLonLat(float x_domain, float y_domain, vec2 pos) {
    float mercator_x = fract(u_bounds.x + pos.x * x_domain);
    float mercator_y = u_bounds.w + pos.y * y_domain;
    float lon  = mercator_x * 360.0 - 180.0;
    float lat2 = 180.0 - mercator_y * 360.0;
    float lat  = 360.0 / 3.141592654 * atan(exp(lat2 * 3.141592654 / 180.0)) - 90.0;
    return vec2(lon, lat);
}

// Returns the physical atlas slot for this LOD/position, or −1 if not resident.
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

// World (lon, lat) → atlas UV for a known loaded LOD (call only when physicalSlot >= 0).
// cx=0 is westernmost chunk, cy=0 is northernmost chunk.
vec2 worldToAtlasUV(vec2 lonlat, int lodIdx) {
    vec2 grid = u_lod_grids[lodIdx];
    float lonRange = u_data_bounds.z - u_data_bounds.x;
    float latRange = u_data_bounds.y - u_data_bounds.w;
    float chunkLonSize = lonRange / grid.x;
    float chunkLatSize = latRange / grid.y;

    int cx = clamp(int(floor((lonlat.x - u_data_bounds.x) / chunkLonSize)), 0, int(grid.x) - 1);
    int cy = clamp(int(floor((u_data_bounds.y - lonlat.y) / chunkLatSize)), 0, int(grid.y) - 1);

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
`;
}

export function makeScalarAtlasFs(totalSlots: number, totalVirtualChunks: number): string {
  return /* glsl */ `#version 300 es
precision highp float;

uniform sampler2D u_atlas;
uniform int       u_lod_count;
uniform float     u_lod_blend;
uniform vec2      u_value_range;
uniform vec2      u_legend_range;
uniform sampler2D u_color_ramp;

in  vec2 v_screen_pos;
out vec4 fragColor;

${makeSharedGlsl(totalSlots, totalVirtualChunks)}

// Decode 24-bit RGB scalar and normalise to [0, 1] for color ramp lookup.
float decodeScalar(vec3 rgb) {
    vec3 bytes = rgb * 255.0;
    float decoded = (bytes.r * 65536.0 + bytes.g * 256.0 + bytes.b) / 16777215.0;
    float rawValue = decoded * (u_value_range.y - u_value_range.x) + u_value_range.x;
    return clamp(
        (rawValue - u_legend_range.x) / (u_legend_range.y - u_legend_range.x),
        0.0, 1.0
    );
}

void main() {
    float x_domain = abs(u_bounds.x - u_bounds.z);
    float y_domain = abs(u_bounds.y - u_bounds.w);
    vec2 lonlat = returnLonLat(x_domain, y_domain, v_screen_pos);

    // Discard outside data region
    if (lonlat.y > u_data_bounds.y || lonlat.y < u_data_bounds.w ||
        lonlat.x > u_data_bounds.z || lonlat.x < u_data_bounds.x) {
        discard;
    }

    // LOD1 (lodIdx=0) is always preloaded — use as the base sample.
    vec4 finalSample = texture(u_atlas, worldToAtlasUV(lonlat, 0));

    // Land / null-data mask is stored in the A channel.
    if (finalSample.a < 0.01) discard;

    // Blend in finer LODs coarse→fine.
    // All intermediate LODs are shown at 100% when their chunk is resident.
    // Only the finest active LOD uses u_lod_blend (animates the crossfade).
    for (int i = 1; i < u_lod_count; i++) {
        int physSlot = physicalSlot(lonlat, i);
        if (physSlot >= 0) {
            vec4 finerSample = texture(u_atlas, worldToAtlasUV(lonlat, i));
            if (finerSample.a >= 0.01) {
                float t = (i == u_lod_count - 1) ? u_lod_blend : 1.0;
                finalSample = mix(finalSample, finerSample, t);
            }
        }
    }

    float scalar = decodeScalar(finalSample.rgb);
    vec4 color = texture(u_color_ramp, vec2(scalar, 0.5));
    fragColor = vec4(color.rgb, finalSample.a);
}
`;
}

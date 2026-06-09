/**
 * Shared GLSL for the atlas-aware fragment shaders.
 *
 * GLSL has no #include, so this source is concatenated into each fragment
 * shader via template strings. `totalSlots` / `totalVirtualChunks` (and, for the
 * bilinear sampler, `atlasW` / `atlasH`) are injected at compile time so the
 * uniform array sizes and texel size match the actual atlas layout produced by
 * AtlasManager — there are no hardcoded atlas dimensions.
 *
 * Uniform conventions (shared by the heatmap and ocean-current shaders):
 *   u_bounds        vec4                  [nwMercatorX, seMercatorY, seMercatorX, nwMercatorY]
 *   u_data_bounds   vec4                  [lonMin, latMax, lonMax, latMin]
 *   u_slots         vec4[totalSlots]      static UV layout per physical slot
 *   u_chunk_slots   int[totalVirtualChunks] virtual chunk index → physical slot (−1 = not loaded)
 *   u_lod_grids     vec2[4]               grid [cols, rows] per LOD, ordered coarse→fine
 *   u_lod_offsets   int[4]                cumulative virtual-index offset per LOD
 *   u_uv_scale      vec2                  chunkPx / storedPx — maps local [0,1] into the data region
 *   u_uv_offset     vec2                  padding / storedPx — shifts past the padding border
 */

/** Common uniforms + Mercator/atlas-lookup helpers used by every atlas shader. */
export function makeAtlasGlsl(totalSlots: number, totalVirtualChunks: number): string {
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

/**
 * Manual bilinear filter in atlas UV space (RG channels), used by the particle
 * shaders for smooth velocity sampling. atlasW / atlasH are injected as
 * compile-time constants so the texel size matches the actual atlas dimensions.
 */
export function makeBilinearSamplerGlsl(atlasW: number, atlasH: number): string {
  return /* glsl */ `
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

/**
 * Scalar Atlas shaders — atlas-aware overlay renderer for scalar fields.
 *
 * Renders a full-viewport quad; each fragment:
 *   1. Reconstructs lon/lat from its Mercator position (via u_bounds).
 *   2. Discards if outside the data region or on land (A < 0.01).
 *   3. Looks up the correct atlas chunk slot (LOD1 base, LOD2 detail blend).
 *   4. Decodes the 24-bit RGB scalar value.
 *   5. Maps the value to a color ramp via u_color_ramp.
 *
 * Uniform conventions (shared with oceanCurrentAtlasShader):
 *   u_bounds      vec4  [nwMercatorX, seMercatorY, seMercatorX, nwMercatorY]
 *   u_data_bounds vec4  [lonMin, latMax, lonMax, latMin]
 *   u_atlas       sampler2D  the 2048×2048 atlas texture
 *   u_slots       vec4[80]   [uvOffsetX, uvOffsetY, uvScaleX, uvScaleY] per slot
 *   u_loaded      int[80]    1 = slot uploaded, 0 = empty
 *   u_lod1_grid   vec2       e.g. (3.0, 3.0)
 *   u_lod2_grid   vec2       e.g. (6.0, 5.0)
 *   u_lod_blend   float      0.0 = LOD1 only, 1.0 = full LOD2
 *   u_value_range  vec2  [rawMin, rawMax] — the dataset's actual value range
 *   u_legend_range vec2  [legendMin, legendMax] — color ramp clamp range
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
const SHARED_GLSL = /* glsl */ `
uniform vec4 u_bounds;      // [nwX, seY, seX, nwY]
uniform vec4 u_data_bounds; // [lonMin, latMax, lonMax, latMin]
uniform vec4 u_slots[80];

// Mercator position [0,1]×[0,1] → geographic lon/lat (degrees)
vec2 returnLonLat(float x_domain, float y_domain, vec2 pos) {
    float mercator_x = fract(u_bounds.x + pos.x * x_domain);
    float mercator_y = u_bounds.w + pos.y * y_domain;
    float lon  = mercator_x * 360.0 - 180.0;
    float lat2 = 180.0 - mercator_y * 360.0;
    float lat  = 360.0 / 3.141592654 * atan(exp(lat2 * 3.141592654 / 180.0)) - 90.0;
    return vec2(lon, lat);
}

// World (lon, lat) → atlas UV (O(1), no loop)
// cx=0 is westernmost chunk, cy=0 is northernmost chunk.
// u_data_bounds: x=lonMin, y=latMax, z=lonMax, w=latMin
vec2 worldToAtlasUV(vec2 lonlat, vec2 grid, int slotOffset) {
    float lonRange = u_data_bounds.z - u_data_bounds.x;
    float latRange = u_data_bounds.y - u_data_bounds.w;

    float chunkLonSize = lonRange / grid.x;
    float chunkLatSize = latRange / grid.y;

    int cx = clamp(int(floor((lonlat.x - u_data_bounds.x) / chunkLonSize)), 0, int(grid.x) - 1);
    int cy = clamp(int(floor((u_data_bounds.y - lonlat.y) / chunkLatSize)), 0, int(grid.y) - 1);
    int slotIdx = slotOffset + cy * int(grid.x) + cx;

    float chunkLonOrigin    = float(cx) * chunkLonSize + u_data_bounds.x;
    float chunkLatNorthEdge = u_data_bounds.y - float(cy) * chunkLatSize;

    float localU = (lonlat.x - chunkLonOrigin)    / chunkLonSize;
    float localV = (chunkLatNorthEdge - lonlat.y) / chunkLatSize;

    // Padding correction: stored chunk is 242×194, data occupies inner 240×192.
    localU = localU * (240.0 / 242.0) + (1.0 / 242.0);
    localV = localV * (192.0 / 194.0) + (1.0 / 194.0);

    vec4 slot = u_slots[slotIdx];
    return slot.xy + vec2(localU, localV) * slot.zw;
}
`;

export const scalarAtlasFs = /* glsl */ `#version 300 es
precision highp float;

uniform sampler2D u_atlas;
uniform int       u_loaded[80];
uniform vec2      u_lod1_grid;
uniform vec2      u_lod2_grid;
uniform float     u_lod_blend;
uniform vec2      u_value_range;
uniform vec2      u_legend_range;
uniform sampler2D u_color_ramp;

in  vec2 v_screen_pos;
out vec4 fragColor;

${SHARED_GLSL}

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

    // LOD1 sample (always loaded)
    vec2 uv1     = worldToAtlasUV(lonlat, u_lod1_grid, 0);
    vec4 sample1 = texture(u_atlas, uv1);

    // Land/null mask stored in A channel
    if (sample1.a < 0.01) discard;

    // LOD2 blend when chunk is loaded
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

    vec4 finalSample = sample1;
    if (has2) {
        vec2 uv2     = worldToAtlasUV(lonlat, u_lod2_grid, 9);
        vec4 sample2 = texture(u_atlas, uv2);
        if (sample2.a >= 0.01) {
            finalSample = mix(sample1, sample2, u_lod_blend);
        }
    }

    float t = decodeScalar(finalSample.rgb);
    vec4 color = texture(u_color_ramp, vec2(t, 0.5));
    fragColor = vec4(color.rgb, finalSample.a);
}
`;

const vectorVs = `#version 300 es
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

const vectorFs = `#version 300 es
precision highp float;

// uniforms are constants, these variables are set by the CPU to GPU, from js to shader.
uniform sampler2D u_vector;
uniform vec2 u_vector_res;
uniform vec2 u_vector_min;
uniform vec2 u_vector_max;
uniform sampler2D u_color_ramp;
uniform float u_max_speed;

uniform vec4 u_bounds;
uniform vec4 u_data_bounds;

in vec2 v_particle_pos;
out vec4 fragColor;

// vector magnitude lookup; use manual bilinear filtering based on 4 adjacent pixels for smooth interpolation
vec2 lookup_vector(const vec2 uv) {
    // return texture(u_vector, uv).rg; // lower-res hardware filtering
    vec2 px = 1.0 / u_vector_res;
    vec2 vc = (floor(uv * u_vector_res)) * px;
    vec2 f = fract(uv * u_vector_res);
    vec2 tl = texture(u_vector, vc).rg;
    vec2 tr = texture(u_vector, vc + vec2(px.x, 0)).rg;
    vec2 bl = texture(u_vector, vc + vec2(0, px.y)).rg;
    vec2 br = texture(u_vector, vc + px).rg;
    return mix(mix(tl, tr, f.x), mix(bl, br, f.x), f.y);
}

vec2 returnLonLat(float x_domain, float y_domain, vec2 pos) {

    //need value between 0 and 1, which fract accomplishes
    float mercator_x = fract(u_bounds.x + pos.x * x_domain);
    float mercator_y = u_bounds.w + pos.y * y_domain;

    float lon = mercator_x * 360.0 - 180.0;
    float lat2 = 180.0 - mercator_y * 360.0;
    float lat = 360.0 / 3.141592654 * atan(exp(lat2 * 3.141592654/180.0)) - 90.0;

    return vec2(lon, lat);
}

void main() {

    //convert from 0-1 to degrees for proper texture value lookup
    float x_domain = abs(u_bounds.x - u_bounds.z);
    float y_domain = abs(u_bounds.y - u_bounds.w);

    vec2 coordinate = returnLonLat(x_domain, y_domain, v_particle_pos);
    float lon = coordinate.x;
    float lat = coordinate.y;

    //discard if out of bounds
    if (
        lat > u_data_bounds.y || lat < u_data_bounds.w ||
        lon > u_data_bounds.z || lon < u_data_bounds.x
    ) {
        discard;
    }

    float lon_domain = u_data_bounds.z - u_data_bounds.x;
    float lat_domain = u_data_bounds.w - u_data_bounds.y;

    vec2 pos_lookup = vec2(
        (lon - u_data_bounds.x) / lon_domain,
        (lat - u_data_bounds.y) / lat_domain
    );
    // if b is < 0.99, it is null data point, which means the land from gsla dataset.
    if (texture(u_vector, pos_lookup).b < 0.99) {
        discard;
    }

    vec2 velocity = mix(u_vector_min, u_vector_max, lookup_vector(pos_lookup));

    float max_speed = (u_max_speed > 0.0) ? u_max_speed : length(u_vector_max);

    // length(velocity) = √(u² + v²).
    float speed_t = length(velocity) / max_speed;

    // color ramp is encoded in a 16x16 texture
    vec2 ramp_pos = vec2(
        fract(16.0 * speed_t),
        floor(16.0 * speed_t) / 16.0);

    // set correct color from gradient to particle
    fragColor = texture(u_color_ramp, ramp_pos);
}
`;

const vectorVsQuad = `#version 300 es
precision highp float;

in vec2 a_pos;

out vec2 v_tex_pos;

void main() {
    v_tex_pos = a_pos;
    gl_Position = vec4(1.0 - 2.0 * a_pos, 0, 1);
}
`;

const vectorFsScreen = `#version 300 es
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

const vectorFsUpdate = `#version 300 es
precision highp float;

uniform sampler2D u_particles;
uniform sampler2D u_vector;
uniform vec2 u_vector_res;
uniform vec2 u_vector_min;
uniform vec2 u_vector_max;
uniform float u_rand_seed;
uniform float u_speed_factor;
uniform float u_drop_rate;
uniform float u_drop_rate_bump;
uniform vec4 u_bounds;
uniform vec4 u_data_bounds;

in vec2 v_tex_pos;
out vec4 fragColor;

// pseudo-random generator
const vec3 rand_constants = vec3(12.9898, 78.233, 4375.85453);
float rand(const vec2 co) {
    float t = dot(rand_constants.xy, co);
    return fract(sin(t) * (rand_constants.z + t));
}

// vector magnitude lookup; use manual bilinear filtering based on 4 adjacent pixels for smooth interpolation
vec2 lookup_vector(const vec2 uv) {
    // return texture(u_vector, uv).rg; // lower-res hardware filtering
    vec2 px = 1.0 / u_vector_res;
    vec2 vc = (floor(uv * u_vector_res)) * px;
    vec2 f = fract(uv * u_vector_res);
    vec2 tl = texture(u_vector, vc).rg;
    vec2 tr = texture(u_vector, vc + vec2(px.x, 0)).rg;
    vec2 bl = texture(u_vector, vc + vec2(0, px.y)).rg;
    vec2 br = texture(u_vector, vc + px).rg;
    return mix(mix(tl, tr, f.x), mix(bl, br, f.x), f.y);
}

vec2 returnLonLat(float x_domain, float y_domain, vec2 pos) {

    //need value between 0 and 1, which fract accomplishes
    float mercator_x = fract(u_bounds.x + pos.x * x_domain);
    float mercator_y = u_bounds.w + pos.y * y_domain;

    float lon = mercator_x * 360.0 - 180.0;
    float lat2 = 180.0 - mercator_y * 360.0;
    float lat = 360.0 / 3.141592654 * atan(exp(lat2 * 3.141592654/180.0)) - 90.0;

    return vec2(lon, lat);
}

void main() {
    // particle position stored directly as float (x, y) in RG channels
    vec2 pos = texture(u_particles, v_tex_pos).rg;

    //convert from 0-1 to degrees for proper texture value lookup
    float x_domain = abs(u_bounds.x - u_bounds.z);
    float y_domain = abs(u_bounds.y - u_bounds.w);

    vec2 coordinate = returnLonLat(x_domain, y_domain, pos);
    float lon = coordinate.x;
    float lat = coordinate.y;

    float lon_domain = u_data_bounds.z - u_data_bounds.x;
    float lat_domain = u_data_bounds.w - u_data_bounds.y;

    vec2 pos_lookup = vec2(
        (lon - u_data_bounds.x) / lon_domain,
        (lat - u_data_bounds.y) / lat_domain
    );

    vec2 velocity = mix(u_vector_min, u_vector_max, lookup_vector(pos_lookup));
    float speed_t = length(velocity) / length(u_vector_max);

    // take EPSG:4326 distortion into account for calculating where the particle moved
    //float distortion = cos(radians(lat));
    vec2 offset = vec2(velocity.x , -velocity.y) * 0.0001 * u_speed_factor;

    // update particle position, wrapping around the date line, if a particle moves past the right, left, top, bottom edge (pos > 1.0), it appears on the other edge
    pos = fract(1.0 + pos + offset);

    // a random seed to use for the particle drop
    vec2 seed = (pos + v_tex_pos) * u_rand_seed;

    // drop rate is a chance a particle will restart at random position, to avoid degeneration
    float drop_rate = u_drop_rate + speed_t * u_drop_rate_bump;
    float drop = step(1.0 - drop_rate, rand(seed));

    vec2 random_pos = vec2(
        rand(seed + 1.3),
        rand(seed + 2.1));
    pos = mix(pos, random_pos, drop);

    // store new position directly as float in RG channels
    fragColor = vec4(pos, 0.0, 1.0);
}
`;

const webglOverlayVs = `#version 300 es
precision highp float;
in vec2 a_position;
in vec2 a_texCoord;
uniform vec2 u_topLeft;
uniform vec2 u_topRight;
uniform vec2 u_bottomLeft;
uniform vec2 u_bottomRight;
uniform vec2 u_viewport;
uniform float u_merc_y_north;
uniform float u_merc_y_south;
out vec2 v_texCoord;
out float v_merc_y;

void main() {
    // Bilinear interpolation between the four corners, as gsla data points are grid data, evenly regularly populated across the bounds.
    vec2 top = mix(u_topLeft, u_topRight, a_position.x);
    vec2 bottom = mix(u_bottomLeft, u_bottomRight, a_position.x);
    vec2 pos = mix(bottom, top, a_position.y);

    // Convert to clip space, normalized to [-1, 1], which is expected by webgl.
    vec2 clipSpace = ((pos / u_viewport) * 2.0) - 1.0;

    gl_Position = vec4(clipSpace.x, -clipSpace.y, 0.0, 1.0);
    v_texCoord = a_texCoord;

    // Pass interpolated Mercator Y so the fragment shader can apply
    // the inverse-Mercator reprojection to correct for the equirectangular
    // image being rendered on a Web-Mercator map.
    // a_position.y=0 → geographic south (larger Mercator Y); =1 → north (smaller).
    v_merc_y = mix(u_merc_y_south, u_merc_y_north, a_position.y);
}
`;

const webglOverlayFs = `#version 300 es
precision highp float;
uniform sampler2D u_dataTexture;
uniform sampler2D u_paletteTexture;
uniform vec2 u_range;
uniform vec2 u_legend_range;
uniform vec2 u_lat_range; // [south, north] geographic degrees
in vec2 v_texCoord;
in float v_merc_y;
out vec4 fragColor;

const float PI = 3.14159265358979323846;

// r,g,b 3 8 bits are used to save one data point, a is to determine if it is null.
float decodeRGBToNormalized(vec3 rgb) {
    float u_range_min = u_range.x;
    float u_range_max = u_range.y;
    float u_legend_min = u_legend_range.x;
    float u_legend_max = u_legend_range.y;

    vec3 rgbBytes = rgb * 255.0;
    float decoded24bit = rgbBytes.r * 65536.0 + rgbBytes.g * 256.0 + rgbBytes.b;

    float normalized = decoded24bit / 16777215.0;
    float rawValue = normalized * (u_range_max - u_range_min) + u_range_min;

    return (rawValue - u_legend_min) / (u_legend_max - u_legend_min);
}

void main() {
    // Inverse Mapbox Web-Mercator: convert Mercator Y [0,1] → geographic latitude.
    // This corrects the alignment between the equirectangular source image and the
    // Mercator map — without it the overlay drifts south at Australia's latitudes.
    float lat = 2.0 * atan(exp(PI * (1.0 - 2.0 * v_merc_y))) * (180.0 / PI) - 90.0;

    // Map geographic latitude to equirectangular texture V (0 = north, 1 = south).
    float south = u_lat_range.x;
    float north = u_lat_range.y;
    float tex_v = (north - lat) / (north - south);

    vec4 encodedData = texture(u_dataTexture, vec2(v_texCoord.x, tex_v));

    if (encodedData.a < 0.01) {
        discard;
    }

    float normalizedValue = decodeRGBToNormalized(encodedData.rgb);
    vec4 color = texture(u_paletteTexture, vec2(normalizedValue, 0.5));

    fragColor = vec4(color.rgb, encodedData.a);
}
`;

export {
  vectorVs,
  vectorFs,
  vectorFsUpdate,
  vectorVsQuad,
  vectorFsScreen,
  webglOverlayVs,
  webglOverlayFs,
};

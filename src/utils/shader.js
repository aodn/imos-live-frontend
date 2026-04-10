const vs = `#version 300 es
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

const fs = `#version 300 es
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

const vsQuad = `#version 300 es
precision highp float;

in vec2 a_pos;

out vec2 v_tex_pos;

void main() {
    v_tex_pos = a_pos;
    gl_Position = vec4(1.0 - 2.0 * a_pos, 0, 1);
}
`;

const fsScreen = `#version 300 es
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

const fsUpdate = `#version 300 es
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

    // update particle position, wrapping around the date line
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

export { vs, fs, vsQuad, fsScreen, fsUpdate };

/**
 * Ocean Current Atlas shaders — atlas-aware particle draw + position-update.
 *
 * Shared atlas uniforms (u_bounds, u_data_bounds, u_slots, u_chunk_slots,
 * u_lod_grids, u_lod_offsets, u_uv_scale, u_uv_offset) and the Mercator/atlas
 * lookup helpers live in atlasGlsl.ts. Particle-specific uniforms:
 *   u_vector_min    vec2      [uMin_m/s, vMin_m/s]
 *   u_vector_max    vec2      [uMax_m/s, vMax_m/s]
 *   u_atlas         sampler2D the auto-sized atlas texture
 *   u_lod_count     int       number of active LODs (1–4)
 */

import { makeAtlasGlsl, makeBilinearSamplerGlsl } from './atlasGlsl';

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

/**
 * Atlas helpers (uniforms + Mercator/lookup) come from makeAtlasGlsl; the
 * particle shaders additionally need the bilinear RG sampler from
 * makeBilinearSamplerGlsl. Both are concatenated into each fragment shader below.
 */
function makeSharedGlsl(
  totalSlots: number,
  totalVirtualChunks: number,
  atlasW: number,
  atlasH: number,
): string {
  return `${makeAtlasGlsl(totalSlots, totalVirtualChunks)}\n${makeBilinearSamplerGlsl(atlasW, atlasH)}`;
}

// ── Draw shader ───────────────────────────────────────────────────────────────
// Samples velocity from the atlas with LOD crossfade.

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

    // Walk finer LODs coarse→fine. Each resident finer chunk fully replaces the
    // coarser velocity the moment it loads — finer detail pops in per-chunk as
    // tiles arrive (progressive rendering), no animated crossfade.
    for (int i = 1; i < u_lod_count; i++) {
        if (physicalSlot(lonlat, i) >= 0) {
            velocity = mix(u_vector_min, u_vector_max, sampleAtlasRG(worldToAtlasUV(lonlat, i)));
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

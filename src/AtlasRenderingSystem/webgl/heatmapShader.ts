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
 * Atlas uniform conventions are documented in atlasGlsl.ts (shared with the
 * ocean-current shader). Scalar-specific uniforms:
 *   u_atlas         sampler2D the auto-sized atlas texture
 *   u_lod_count     int       number of active LODs (1–4)
 *   u_lod_blend     float     0.0→1.0, controls the final LOD transition
 *   u_value_range   vec2      [rawMin, rawMax] — the dataset's actual value range
 *   u_legend_range  vec2      [legendMin, legendMax] — color ramp clamp range
 */

import { makeAtlasGlsl } from './atlasGlsl';

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

${makeAtlasGlsl(totalSlots, totalVirtualChunks)}

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

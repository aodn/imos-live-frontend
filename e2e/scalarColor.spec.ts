/**
 * Scalar shader value→colour pixel-readback.
 *
 * Isolates the one piece of the scalar render path that the string-based
 * `heatmapShader.spec.ts` and the contract-level e2e specs don't cover: that the
 * GLSL actually *computes* the right colour for a given packed scalar. We render
 * a single fragment through the real `scalarDecodeGlsl` (decodeRaw +
 * rawToRampCoord) and read the pixel back.
 *
 * Deliberately out of scope (covered elsewhere or genuinely visual): atlas slot
 * resolution, LOD replacement, lon/lat projection, the land/alpha discard, and
 * the particle animation. The scalar value is fed via a uniform instead of an
 * atlas sample so none of that machinery is exercised here.
 *
 * Runs in Playwright (not Vitest) because the shaders are WebGL2 (`#version 300
 * es`) and the Vitest env is jsdom. `about:blank` keeps it app- and
 * network-free — just a bare GL context.
 */
import { scalarDecodeGlsl } from '@/AtlasRenderingSystem/webgl/heatmapShader';
import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

// Pack a raw value into the 24-bit RGB the atlas tiles use, given [min,max].
// The inverse of decodeRaw, kept in the test on purpose: a regression in the
// GLSL decode then surfaces as a colour mismatch rather than being masked.
function packRaw(raw: number, min: number, max: number): [number, number, number] {
  const v = Math.round(((raw - min) / (max - min)) * 16777215);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

type RenderArgs = {
  decodeGlsl: string;
  rgb: [number, number, number];
  valueRange: [number, number];
  legendRange: [number, number];
  numCategories: number;
  ramp: number[]; // RGBA bytes, length rampWidth * 4
  rampWidth: number; // 256 for continuous; N for categorical (one texel per flag)
  rampFilter: 'LINEAR' | 'NEAREST';
};

// Renders one fragment through the real decode+map GLSL and reads its pixel.
async function renderScalarColor(
  page: Page,
  args: RenderArgs,
): Promise<[number, number, number, number]> {
  return page.evaluate((a: RenderArgs) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const gl = canvas.getContext('webgl2');
    if (!gl) throw new Error('WebGL2 not available');

    const vs = `#version 300 es
      in vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;
    // The scalar comes in via u_rgb instead of an atlas sample, so only the
    // value→colour path is under test.
    const fs = `#version 300 es
      precision highp float;
      uniform vec2 u_value_range;
      uniform vec2 u_legend_range;
      uniform int  u_num_categories;
      uniform vec3 u_rgb;
      uniform sampler2D u_color_ramp;
      out vec4 fragColor;
      ${a.decodeGlsl}
      void main(){
        float coord = rawToRampCoord(decodeRaw(u_rgb));
        fragColor = vec4(texture(u_color_ramp, vec2(coord, 0.5)).rgb, 1.0);
      }`;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type);
      if (!s) throw new Error('createShader failed');
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(s) ?? 'shader compile failed');
      }
      return s;
    };

    const prog = gl.createProgram();
    if (!prog) throw new Error('createProgram failed');
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(prog) ?? 'program link failed');
    }
    gl.useProgram(prog);

    // Full-screen triangle.
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    // rampWidth×1 ramp texture.
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      a.rampWidth,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array(a.ramp),
    );
    const filter = a.rampFilter === 'NEAREST' ? gl.NEAREST : gl.LINEAR;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.uniform2fv(gl.getUniformLocation(prog, 'u_value_range'), a.valueRange);
    gl.uniform2fv(gl.getUniformLocation(prog, 'u_legend_range'), a.legendRange);
    gl.uniform1i(gl.getUniformLocation(prog, 'u_num_categories'), a.numCategories);
    gl.uniform3f(
      gl.getUniformLocation(prog, 'u_rgb'),
      a.rgb[0] / 255,
      a.rgb[1] / 255,
      a.rgb[2] / 255,
    );
    gl.uniform1i(gl.getUniformLocation(prog, 'u_color_ramp'), 0);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
    const out = new Uint8Array(4);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, out);
    return [out[0], out[1], out[2], out[3]] as [number, number, number, number];
  }, args);
}

test.describe('scalar shader value→colour', () => {
  // A continuous ramp where R == coord*255, so the read-back R channel ≈ rampCoord
  // even under LINEAR interpolation — robust against SwiftShader rounding.
  const linearRamp: number[] = [];
  for (let i = 0; i < 256; i++) linearRamp.push(i, 0, 255 - i, 255);

  test('continuous: legend midpoint lands mid-ramp', async ({ page }) => {
    await page.goto('about:blank');
    const [r] = await renderScalarColor(page, {
      decodeGlsl: scalarDecodeGlsl,
      rgb: packRaw(0.5, 0, 1),
      valueRange: [0, 1],
      legendRange: [0, 1], // raw 0.5 → rampCoord 0.5
      numCategories: 0,
      ramp: linearRamp,
      rampWidth: 256,
      rampFilter: 'LINEAR',
    });
    expect(r).toBeGreaterThanOrEqual(125);
    expect(r).toBeLessThanOrEqual(130); // ≈127, ±tolerance for sampling
  });

  test('continuous: value below legend min clamps to ramp start', async ({ page }) => {
    await page.goto('about:blank');
    const [r] = await renderScalarColor(page, {
      decodeGlsl: scalarDecodeGlsl,
      rgb: packRaw(-5, -10, 10),
      valueRange: [-10, 10],
      legendRange: [0, 10], // raw -5 < 0 → clamp to ramp start
      numCategories: 0,
      ramp: linearRamp,
      rampWidth: 256,
      rampFilter: 'LINEAR',
    });
    expect(r).toBeLessThanOrEqual(2);
  });

  test('categorical: value snaps to its flag texel', async ({ page }) => {
    await page.goto('about:blank');
    // 4 categories, one texel each, NEAREST. Index 2 is pure green.
    const catRamp = [
      255,
      0,
      0,
      255, // 0 red
      0,
      0,
      255,
      255, // 1 blue
      0,
      255,
      0,
      255, // 2 green
      255,
      255,
      0,
      255, // 3 yellow
    ];
    const [r, g, b] = await renderScalarColor(page, {
      decodeGlsl: scalarDecodeGlsl,
      rgb: packRaw(2, 0, 3), // category index 2
      valueRange: [0, 3],
      legendRange: [0, 3],
      numCategories: 4,
      ramp: catRamp,
      rampWidth: 4,
      rampFilter: 'NEAREST',
    });
    expect([r, g, b]).toEqual([0, 255, 0]);
  });
});

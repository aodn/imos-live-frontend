import { describe, expect, it } from 'vitest';
import { makeScalarAtlasFs, scalarAtlasVs } from './heatmapShader';

describe('scalarAtlasVs', () => {
  it('declares webgl2 (#version 300 es) and the expected attributes/varyings', () => {
    expect(scalarAtlasVs).toContain('#version 300 es');
    expect(scalarAtlasVs).toContain('in vec2 a_pos');
    expect(scalarAtlasVs).toContain('out vec2 v_screen_pos');
  });
});

describe('makeScalarAtlasFs', () => {
  it('injects totalSlots and totalVirtualChunks into the uniform array sizes', () => {
    const src = makeScalarAtlasFs(160, 159);
    expect(src).toContain('u_slots[160]');
    expect(src).toContain('u_chunk_slots[159]');
  });

  it('declares every scalar-specific uniform', () => {
    const src = makeScalarAtlasFs(160, 159);
    for (const uniform of [
      'u_atlas',
      'u_lod_count',
      'u_lod_blend',
      'u_value_range',
      'u_legend_range',
      'u_color_ramp',
      'u_num_categories',
    ]) {
      expect(src).toContain(uniform);
    }
  });

  it('embeds the shared atlasGlsl helpers (returnLonLat / worldToAtlasUV / physicalSlot)', () => {
    const src = makeScalarAtlasFs(160, 159);
    expect(src).toContain('returnLonLat');
    expect(src).toContain('worldToAtlasUV');
    expect(src).toContain('physicalSlot');
    expect(src).toContain('u_bounds');
    expect(src).toContain('u_data_bounds');
  });

  it('contains the RGB24 decode and ramp lookup helpers', () => {
    const src = makeScalarAtlasFs(160, 159);
    expect(src).toContain('decodeRaw');
    expect(src).toContain('rawToRampCoord');
    expect(src).toContain('65536.0');
    expect(src).toContain('16777215.0');
  });
});

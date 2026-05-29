import { describe, expect, it } from 'vitest';
import {
  makeOceanCurrentAtlasFsParticle,
  makeOceanCurrentAtlasFsUpdate,
  oceanCurrentAtlasFsScreen,
  oceanCurrentAtlasVs,
  oceanCurrentAtlasVsQuad,
} from './particlesShader';

describe('static particle shaders', () => {
  it('all declare WebGL2 #version', () => {
    expect(oceanCurrentAtlasVs).toContain('#version 300 es');
    expect(oceanCurrentAtlasVsQuad).toContain('#version 300 es');
    expect(oceanCurrentAtlasFsScreen).toContain('#version 300 es');
  });

  it('oceanCurrentAtlasVs samples the particle texture and sets gl_PointSize', () => {
    expect(oceanCurrentAtlasVs).toContain('u_particles');
    expect(oceanCurrentAtlasVs).toContain('u_point_size');
    expect(oceanCurrentAtlasVs).toContain('gl_PointSize = u_point_size');
  });
});

describe('makeOceanCurrentAtlasFsParticle', () => {
  it('injects totalSlots / totalVirtualChunks / atlasW / atlasH', () => {
    const src = makeOceanCurrentAtlasFsParticle(40, 39, 2048, 1024);
    expect(src).toContain('u_slots[40]');
    expect(src).toContain('u_chunk_slots[39]');
    // Bilinear sampler embeds the atlas dims as compile-time constants
    expect(src).toContain('2048.0');
    expect(src).toContain('1024.0');
  });

  it('declares particle-draw-specific uniforms', () => {
    const src = makeOceanCurrentAtlasFsParticle(40, 39, 2048, 1024);
    for (const uniform of [
      'u_atlas',
      'u_vector_min',
      'u_vector_max',
      'u_color_ramp',
      'u_max_speed',
      'u_lod_count',
      'u_lod_blend',
    ]) {
      expect(src).toContain(uniform);
    }
  });

  it('embeds atlas + bilinear-sampler helpers', () => {
    const src = makeOceanCurrentAtlasFsParticle(40, 39, 2048, 1024);
    expect(src).toContain('sampleAtlasRG');
    expect(src).toContain('worldToAtlasUV');
    expect(src).toContain('physicalSlot');
  });
});

describe('makeOceanCurrentAtlasFsUpdate', () => {
  it('injects totalSlots / totalVirtualChunks / atlasW / atlasH', () => {
    const src = makeOceanCurrentAtlasFsUpdate(40, 39, 2048, 1024);
    expect(src).toContain('u_slots[40]');
    expect(src).toContain('u_chunk_slots[39]');
    expect(src).toContain('2048.0');
    expect(src).toContain('1024.0');
  });

  it('declares position-update specific uniforms', () => {
    const src = makeOceanCurrentAtlasFsUpdate(40, 39, 2048, 1024);
    for (const uniform of [
      'u_particles',
      'u_atlas',
      'u_vector_min',
      'u_vector_max',
      'u_rand_seed',
      'u_speed_factor',
      'u_drop_rate',
      'u_drop_rate_bump',
    ]) {
      expect(src).toContain(uniform);
    }
  });

  it('embeds the rand() helper used for drop-rate respawn', () => {
    const src = makeOceanCurrentAtlasFsUpdate(40, 39, 2048, 1024);
    expect(src).toContain('float rand');
    expect(src).toContain('rand_constants');
  });
});

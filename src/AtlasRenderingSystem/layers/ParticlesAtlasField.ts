/**
 * ParticlesAtlasField
 *
 * GPU particle engine for the ocean-current Atlas renderer. Runs a ping-pong
 * particle simulation, sampling velocity from the Atlas texture (LOD1 + finer
 * LODs blended in) rather than a single flat PNG.
 *
 * Caller contract:
 *   1. Call setSource(manifest, tileBaseUrl, legendRange) when date changes — resolves after
 *      the first LOD1 tile is uploaded; remaining tiles continue in the background.
 *   2. Call onMapMove(bounds, zoom) on every moveend / zoom event.
 *   3. Call startAnimation() / stopAnimation() to control rendering.
 *   4. Call draw() from the Mapbox custom layer render() callback.
 */

import * as twgl from 'twgl.js';

import type {
  CustomizableParticleConfig,
  ProductManifest,
  ColorPalette,
  PalettePatch,
} from '../types';
import { INITIAL_PARTICLE_CONFIG } from '../types';
import { getColorRamp } from '../utils';
import type { AtlasManagerAPI, ChunkSchedulerAPI, LODControllerAPI } from '../webgl';
import {
  createLODController,
  oceanCurrentAtlasVs,
  makeOceanCurrentAtlasFsParticle,
  oceanCurrentAtlasVsQuad,
  oceanCurrentAtlasFsScreen,
  makeOceanCurrentAtlasFsUpdate,
  createAtlasManager,
} from '../webgl';
import {
  computeRamp,
  mercatorBoundsArray,
  sortManifestLods,
  dataBoundsFromManifest,
  computeUvTransform,
  buildLodGridsFlat,
  lod1ChunkIds,
  createLodSchedulers,
  preloadLod1,
  syncSchedulersOnMove,
} from './atlasFieldShared';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ParticlesAtlasFieldAPI = {
  setSource: (
    manifest: ProductManifest,
    tileBaseUrl: string,
    legendRange: [number, number],
  ) => Promise<void>;
  startAnimation: () => void;
  stopAnimation: () => void;
  draw: () => void;
  resize: () => void;
  updateConfig: (config: Partial<CustomizableParticleConfig>) => void;
  updatePalette: (patch: PalettePatch) => void;
  onMapMove: (bounds: mapboxgl.LngLatBounds, zoom: number) => void;
  /** Stop the animation loop and release all GPU resources. Call from the layer's onRemove. */
  destroy: () => void;
};

// ── Factory ───────────────────────────────────────────────────────────────────

export function createParticlesAtlasField(
  map: mapboxgl.Map,
  gl: WebGL2RenderingContext,
  palette: ColorPalette,
): ParticlesAtlasFieldAPI {
  // Required for RG32F ping-pong framebuffer (same as VectorField.js)
  gl.getExtension('EXT_color_buffer_float');

  // Mutable config — updated in place by updateConfig so the draw loop
  // always reads current values without a closure update.
  const config: CustomizableParticleConfig = {
    ...INITIAL_PARTICLE_CONFIG,
  };
  let currentPalette: ColorPalette = palette;

  // ── Shader programs ──────────────────────────────────────────────────────
  let programInfo: twgl.ProgramInfo | null = null; // draw particles
  let screenProgramInfo: twgl.ProgramInfo | null = null; // composite to screen
  let updateProgramInfo: twgl.ProgramInfo | null = null; // update positions

  // ── Particle ping-pong state ─────────────────────────────────────────────
  let particleTextures: Record<string, WebGLTexture> | null = null;
  let numParticles = 0;
  let particleRes = 0;
  /** a_index attribute buffer — rebuilt only when the particle count changes. */
  let particleBufferInfo: twgl.BufferInfo | null = null;
  /** Constant full-viewport quad, shared by the screen-composite and update passes. */
  let quadBufferInfo: twgl.BufferInfo | null = null;

  // ── Screen textures & framebuffer ────────────────────────────────────────
  let textures: Record<string, WebGLTexture> | null = null;
  let framebuffer: WebGLFramebuffer | null = null;

  // ── Color ramp ───────────────────────────────────────────────────────────
  let colorRampTexture: Record<string, WebGLTexture> | null = null;

  // ── Atlas + chunk management ─────────────────────────────────────────────
  let atlas: AtlasManagerAPI | null = null;
  /** One scheduler per on-demand LOD (LODs 2..N). Index 0 = LOD2, index 1 = LOD3, etc. */
  let schedulers: ChunkSchedulerAPI[] = [];

  // ── Fetch lifecycle ───────────────────────────────────────────────────────
  // Incremented on every setSource call; stale tile callbacks check against
  // this value and discard their result if a newer call has superseded them.
  let fetchGeneration = 0;

  // ── Data state ───────────────────────────────────────────────────────────
  // u_data_bounds format: [lonMin, latMax, lonMax, latMin]
  let dataBounds: [number, number, number, number] | null = null;
  let vectorMin: [number, number] | null = null; // [uMin, vMin]
  let vectorMax: [number, number] | null = null; // [uMax, vMax]
  let mapBounds: [number, number, number, number] | null = null;
  /** Flat [cols0, rows0, cols1, rows1, ...] for u_lod_grids uniform, padded to 8 floats (4 LODs). */
  let lodGridsFlat: Float32Array | null = null;
  /** chunkPx / storedPx — maps local [0,1] UV into the data region (excluding padding). */
  let uvScale: [number, number] | null = null;
  /** padding / storedPx — shifts UV past the padding border. */
  let uvOffset: [number, number] | null = null;

  // ── LOD blend ────────────────────────────────────────────────────────────
  let lodController: LODControllerAPI = createLODController();

  // ── Animation ────────────────────────────────────────────────────────────
  let animState: 'ANIMATING' | 'PAUSED' = 'PAUSED';
  let animationId: number | null = null;

  // ── Private helpers ───────────────────────────────────────────────────────

  function deleteBufferInfo(info: twgl.BufferInfo | null) {
    if (!info?.attribs) return;
    for (const name in info.attribs) gl.deleteBuffer(info.attribs[name].buffer);
  }

  function setParticles(num: number) {
    // Free the previous ping-pong pair before reallocating — setParticles is
    // called repeatedly (clear / updateConfig), so skipping this leaks two
    // RG32F textures per call.
    if (particleTextures) {
      gl.deleteTexture(particleTextures.particleTexture0);
      gl.deleteTexture(particleTextures.particleTexture1);
    }

    particleRes = Math.ceil(Math.sqrt(num));
    numParticles = particleRes * particleRes;

    const particleState = new Float32Array(numParticles * 2);
    for (let i = 0; i < numParticles; i++) {
      particleState[i * 2] = Math.random();
      particleState[i * 2 + 1] = Math.random();
    }

    particleTextures = twgl.createTextures(gl, {
      particleTexture0: {
        mag: gl.NEAREST,
        min: gl.NEAREST,
        width: particleRes,
        height: particleRes,
        internalFormat: gl.RG32F,
        format: gl.RG,
        type: gl.FLOAT,
        src: particleState,
        wrap: gl.CLAMP_TO_EDGE,
      },
      particleTexture1: {
        mag: gl.NEAREST,
        min: gl.NEAREST,
        width: particleRes,
        height: particleRes,
        internalFormat: gl.RG32F,
        format: gl.RG,
        type: gl.FLOAT,
        src: particleState,
        wrap: gl.CLAMP_TO_EDGE,
      },
    });

    const particleIndices = new Float32Array(numParticles);
    for (let i = 0; i < numParticles; i++) particleIndices[i] = i;

    // Rebuild the a_index buffer for the new count; free the old one first.
    deleteBufferInfo(particleBufferInfo);
    particleBufferInfo = twgl.createBufferInfoFromArrays(gl, {
      a_index: { numComponents: 1, data: particleIndices },
    });
  }

  function setColorRamp(colors: Record<string, string>) {
    colorRampTexture = twgl.createTextures(gl, {
      colorRampTexture: {
        mag: gl.LINEAR,
        min: gl.LINEAR,
        width: 256,
        height: 1,
        format: gl.RGBA,
        src: getColorRamp(colors),
        wrap: gl.CLAMP_TO_EDGE,
      },
    });
  }

  function initScreenTextures() {
    const emptyPixels = new Uint8Array(gl.canvas.width * gl.canvas.height * 4);
    textures = twgl.createTextures(gl, {
      backgroundTexture: {
        mag: gl.NEAREST,
        min: gl.NEAREST,
        width: gl.canvas.width,
        height: gl.canvas.height,
        format: gl.RGBA,
        src: emptyPixels,
        wrap: gl.CLAMP_TO_EDGE,
      },
      screenTexture: {
        mag: gl.NEAREST,
        min: gl.NEAREST,
        width: gl.canvas.width,
        height: gl.canvas.height,
        format: gl.RGBA,
        src: emptyPixels,
        wrap: gl.CLAMP_TO_EDGE,
      },
    });
  }

  function initializeShaders(
    totalSlots: number,
    totalVirtualChunks: number,
    atlasW: number,
    atlasH: number,
  ) {
    programInfo = twgl.createProgramInfo(gl, [
      oceanCurrentAtlasVs,
      makeOceanCurrentAtlasFsParticle(totalSlots, totalVirtualChunks, atlasW, atlasH),
    ]);
    screenProgramInfo = twgl.createProgramInfo(gl, [
      oceanCurrentAtlasVsQuad,
      oceanCurrentAtlasFsScreen,
    ]);
    updateProgramInfo = twgl.createProgramInfo(gl, [
      oceanCurrentAtlasVsQuad,
      makeOceanCurrentAtlasFsUpdate(totalSlots, totalVirtualChunks, atlasW, atlasH),
    ]);

    // Constant full-viewport quad: (0,0)=bottom-left, (1,1)=top-right.
    quadBufferInfo = twgl.createBufferInfoFromArrays(gl, {
      a_pos: { numComponents: 2, data: new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]) },
    });

    setParticles(config.nParticles);
    setColorRamp(computeRamp(currentPalette));
    initScreenTextures();
    framebuffer = gl.createFramebuffer();
  }

  function updateMapBounds(bounds: mapboxgl.LngLatBounds) {
    mapBounds = mercatorBoundsArray(bounds);
  }

  // ── Draw helpers ──────────────────────────────────────────────────────────

  function drawParticles() {
    if (
      !programInfo ||
      !atlas ||
      !particleTextures ||
      !colorRampTexture ||
      !dataBounds ||
      !vectorMin ||
      !vectorMax ||
      !mapBounds ||
      !particleBufferInfo ||
      !lodGridsFlat ||
      !uvScale ||
      !uvOffset
    )
      return;

    gl.useProgram(programInfo.program);

    twgl.setBuffersAndAttributes(gl, programInfo, particleBufferInfo);
    twgl.setUniforms(programInfo, {
      u_atlas: atlas.getTexture(),
      u_slots: atlas.getSlotsData(),
      u_chunk_slots: atlas.getChunkSlots(),
      u_lod_grids: lodGridsFlat,
      u_lod_offsets: atlas.getLodOffsets(),
      u_lod_count: atlas.getLodCount(),
      u_lod_blend: lodController.getValue(),
      u_uv_scale: uvScale,
      u_uv_offset: uvOffset,
      u_particles: particleTextures.particleTexture0,
      u_color_ramp: colorRampTexture.colorRampTexture,
      u_particles_res: particleRes,
      u_vector_min: vectorMin,
      u_vector_max: vectorMax,
      u_bounds: mapBounds,
      u_data_bounds: dataBounds,
      u_point_size: config.pointSize,
      u_max_speed: currentPalette.legendRange[1],
    });

    twgl.drawBufferInfo(gl, particleBufferInfo, gl.POINTS);
  }

  function drawTexture(texture: WebGLTexture, opacity: number) {
    if (!screenProgramInfo || !quadBufferInfo) return;
    gl.useProgram(screenProgramInfo.program);

    twgl.setBuffersAndAttributes(gl, screenProgramInfo, quadBufferInfo);
    twgl.setUniforms(screenProgramInfo, { u_screen: texture, u_opacity: opacity });
    twgl.drawBufferInfo(gl, quadBufferInfo);
  }

  function drawScreen() {
    if (!textures?.screenTexture || !framebuffer) return;

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      textures.screenTexture,
      0,
    );
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.disable(gl.BLEND);

    drawTexture(textures.backgroundTexture, config.fadeOpacity);
    drawParticles();

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    drawTexture(textures.screenTexture, 1.0);
    gl.disable(gl.BLEND);

    // Ping-pong: swap background ↔ screen
    const tmp = textures.backgroundTexture;
    textures.backgroundTexture = textures.screenTexture;
    textures.screenTexture = tmp;
  }

  function updateParticles() {
    if (
      !updateProgramInfo ||
      !framebuffer ||
      !particleTextures ||
      !atlas ||
      !dataBounds ||
      !vectorMin ||
      !vectorMax ||
      !mapBounds ||
      !uvScale ||
      !uvOffset ||
      !quadBufferInfo
    )
      return;

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      particleTextures.particleTexture1,
      0,
    );
    gl.viewport(0, 0, particleRes, particleRes);
    gl.useProgram(updateProgramInfo.program);

    twgl.setBuffersAndAttributes(gl, updateProgramInfo, quadBufferInfo);
    twgl.setUniforms(updateProgramInfo, {
      u_atlas: atlas.getTexture(),
      u_slots: atlas.getSlotsData(),
      u_chunk_slots: atlas.getChunkSlots(),
      u_lod_grids: lodGridsFlat,
      u_lod_offsets: atlas.getLodOffsets(),
      u_particles: particleTextures.particleTexture0,
      u_vector_min: vectorMin,
      u_vector_max: vectorMax,
      u_rand_seed: Math.random(),
      u_uv_scale: uvScale,
      u_uv_offset: uvOffset,
      u_bounds: mapBounds,
      u_data_bounds: dataBounds,
      u_speed_factor: config.speedFactor,
      u_drop_rate: config.dropRate,
      u_drop_rate_bump: config.dropRateBump,
    });

    twgl.drawBufferInfo(gl, quadBufferInfo);

    // Ping-pong: swap particle textures
    const tmp = particleTextures.particleTexture0;
    particleTextures.particleTexture0 = particleTextures.particleTexture1;
    particleTextures.particleTexture1 = tmp;
  }

  // ── ChunkScheduler callback ───────────────────────────────────────────────

  function onChunkLoaded(_id: string) {
    if (schedulers.every(s => s.allVisibleLoaded())) {
      lodController.startBlendIn();
    }
  }

  // ── Animation loop ────────────────────────────────────────────────────────

  function tick() {
    map.triggerRepaint();
    animationId = requestAnimationFrame(tick);
  }

  function clear() {
    if (!textures || !framebuffer) return;
    gl.clearColor(0, 0, 0, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      textures.screenTexture,
      0,
    );
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      textures.backgroundTexture,
      0,
    );
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clear(gl.COLOR_BUFFER_BIT);
    setParticles(config.nParticles);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  async function setSource(
    manifest: ProductManifest,
    tileBaseUrl: string,
    legendRange: [number, number],
  ): Promise<void> {
    const gen = ++fetchGeneration;
    currentPalette = { ...currentPalette, legendRange };

    const lodsSorted = sortManifestLods(manifest);
    const lod1 = lodsSorted[0]!;

    const { uRange, vRange } = manifest;
    if (!uRange || !vRange) throw new Error('Particle manifest missing uRange/vRange');
    dataBounds = dataBoundsFromManifest(manifest.bounds);
    vectorMin = [uRange[0], vRange[0]];
    vectorMax = [uRange[1], vRange[1]];
    ({ uvScale, uvOffset } = computeUvTransform(lod1));
    lodGridsFlat = buildLodGridsFlat(lodsSorted);

    // Reset atlas and LOD state for new date
    atlas?.destroy();
    schedulers.forEach(s => s.destroy());
    lodController.destroy();
    lodController = createLODController();

    atlas = createAtlasManager(gl, {
      slotPx: lod1.storedPx,
      lods: lodsSorted.map(({ grid }) => ({ grid })),
    });

    // Compile shaders and set up GPU resources on first call. Atlas dimensions
    // are known immediately, so this needn't wait for the LOD1 fetch.
    if (!programInfo)
      initializeShaders(
        atlas.getTotalSlots(),
        atlas.getTotalVirtualChunks(),
        atlas.getAtlasW(),
        atlas.getAtlasH(),
      );

    schedulers = createLodSchedulers({
      atlas,
      tileBaseUrl,
      onChunkLoaded,
      bounds: manifest.bounds,
      lodsSorted,
    });

    // Fetch LOD1 progressively — resolves on the first uploaded tile; the
    // animation loop (started by the caller) repaints as the rest stream in.
    await preloadLod1({
      tileBaseUrl,
      lod1Ids: lod1ChunkIds(lod1),
      atlas,
      isStale: () => gen !== fetchGeneration,
    });
  }

  function startAnimation() {
    animState = 'ANIMATING';
    const bounds = map.getBounds();
    if (bounds) updateMapBounds(bounds);
    tick();
  }

  function stopAnimation() {
    animState = 'PAUSED';
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    clear();
  }

  function draw() {
    if (animState !== 'ANIMATING' || !atlas) return;
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.STENCIL_TEST);
    drawScreen();
    updateParticles();
  }

  function resize() {
    if (!textures) return;
    gl.deleteTexture(textures.backgroundTexture);
    gl.deleteTexture(textures.screenTexture);
    initScreenTextures();
  }

  function updateConfig(newConfig: Partial<CustomizableParticleConfig>) {
    const countChanged =
      newConfig.nParticles !== undefined && newConfig.nParticles !== config.nParticles;
    Object.assign(config, newConfig);
    if (countChanged) setParticles(config.nParticles);
  }

  function onMapMove(bounds: mapboxgl.LngLatBounds, zoom: number) {
    updateMapBounds(bounds);
    syncSchedulersOnMove({ bounds, zoom, schedulers, lodController });
  }

  function updatePalette(patch: PalettePatch) {
    currentPalette = { ...currentPalette, ...patch };
    setColorRamp(computeRamp(currentPalette));
  }

  function destroy() {
    // Stop the rAF loop directly — avoid stopAnimation(), whose clear() would
    // recreate the particle textures we're about to delete.
    animState = 'PAUSED';
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    // Invalidate any in-flight setSource callbacks.
    fetchGeneration++;

    schedulers.forEach(s => s.destroy());
    schedulers = [];
    lodController.destroy();
    atlas?.destroy();
    atlas = null;

    if (programInfo) gl.deleteProgram(programInfo.program);
    if (screenProgramInfo) gl.deleteProgram(screenProgramInfo.program);
    if (updateProgramInfo) gl.deleteProgram(updateProgramInfo.program);
    programInfo = screenProgramInfo = updateProgramInfo = null;

    if (framebuffer) {
      gl.deleteFramebuffer(framebuffer);
      framebuffer = null;
    }
    if (particleTextures) {
      gl.deleteTexture(particleTextures.particleTexture0);
      gl.deleteTexture(particleTextures.particleTexture1);
      particleTextures = null;
    }
    if (textures) {
      gl.deleteTexture(textures.backgroundTexture);
      gl.deleteTexture(textures.screenTexture);
      textures = null;
    }
    if (colorRampTexture) {
      gl.deleteTexture(colorRampTexture.colorRampTexture);
      colorRampTexture = null;
    }

    deleteBufferInfo(particleBufferInfo);
    deleteBufferInfo(quadBufferInfo);
    particleBufferInfo = null;
    quadBufferInfo = null;
  }

  return {
    setSource,
    startAnimation,
    stopAnimation,
    draw,
    resize,
    updateConfig,
    updatePalette,
    onMapMove,
    destroy,
  };
}

/**
 * OceanCurrentAtlasField
 *
 * GPU particle engine for the ocean-current-field Atlas renderer.
 * Replaces VectorField.js — same ping-pong simulation loop, same Mapbox
 * coordinate conventions, but samples velocity from the Atlas texture
 * instead of a single flat PNG.
 *
 * Caller contract:
 *   1. Call setSource(manifest, tileBaseUrl, legendRange) when date changes — awaits LOD1 preload.
 *   2. Call onMapMove(bounds, zoom) on every moveend / zoom event.
 *   3. Call startAnimation() / stopAnimation() to control rendering.
 *   4. Call draw() from the Mapbox custom layer render() callback.
 *   5. Call setLodBlend(v) from LODController (Phase 6).
 */

import mapboxgl from 'mapbox-gl';
import * as twgl from 'twgl.js';

import type {
  CustomizableParticleConfig,
  ProductManifest,
  ColorPalette,
  PalettePatch,
} from '../types';
import { INITIAL_PARTICLE_CONFIG } from '../types';
import { getColorRamp, convertLogColorScaleToRamp, convertLinearColorScaleToRamp } from '../utils';
import type { AtlasManagerAPI, ChunkSchedulerAPI, LODControllerAPI } from '../webgl';
import {
  createLODController,
  oceanCurrentAtlasVs,
  makeOceanCurrentAtlasFsParticle,
  oceanCurrentAtlasVsQuad,
  oceanCurrentAtlasFsScreen,
  makeOceanCurrentAtlasFsUpdate,
  createAtlasManager,
  createChunkScheduler,
} from '../webgl';

function computeRamp(palette: ColorPalette): Record<string, string> {
  const { scale, legendRange, rawColors } = palette;
  return scale === 'log'
    ? convertLogColorScaleToRamp({
        minMaxRatio: legendRange[0] / legendRange[1],
        colors: rawColors,
      })
    : convertLinearColorScaleToRamp({ colors: rawColors });
}

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
  /** Set the LOD crossfade blend value (0 = LOD1, 1 = LOD2). Called by LODController. */
  setLodBlend: (value: number) => void;
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
  let particleIndices: Float32Array | null = null;
  let nParticles = config.nParticles;

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

  function setParticles(num: number) {
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

    particleIndices = new Float32Array(numParticles);
    for (let i = 0; i < numParticles; i++) particleIndices[i] = i;
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

    setParticles(nParticles);
    setColorRamp(computeRamp(currentPalette));
    initScreenTextures();
    framebuffer = gl.createFramebuffer();
  }

  function updateMapBounds(bounds: mapboxgl.LngLatBounds) {
    const nw = bounds.getNorthWest();
    const se = bounds.getSouthEast();
    const nwM = mapboxgl.MercatorCoordinate.fromLngLat(nw);
    const seM = mapboxgl.MercatorCoordinate.fromLngLat(se);
    // [nwX, seY, seX, nwY] — same layout as VectorField.js setBounds()
    mapBounds = [nwM.x, seM.y, seM.x, nwM.y];
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
      !particleIndices ||
      !lodGridsFlat ||
      !uvScale ||
      !uvOffset
    )
      return;

    gl.useProgram(programInfo.program);

    const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
      a_index: { numComponents: 1, data: particleIndices },
    });

    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
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

    twgl.drawBufferInfo(gl, bufferInfo, gl.POINTS);
  }

  function drawTexture(texture: WebGLTexture, opacity: number) {
    if (!screenProgramInfo) return;
    gl.useProgram(screenProgramInfo.program);

    const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
      a_pos: { numComponents: 2, data: new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]) },
    });

    twgl.setBuffersAndAttributes(gl, screenProgramInfo, bufferInfo);
    twgl.setUniforms(screenProgramInfo, { u_screen: texture, u_opacity: opacity });
    twgl.drawBufferInfo(gl, bufferInfo);
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
      !uvOffset
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

    const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
      a_pos: { numComponents: 2, data: new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]) },
    });

    twgl.setBuffersAndAttributes(gl, updateProgramInfo, bufferInfo);
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

    twgl.drawBufferInfo(gl, bufferInfo);

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
    setParticles(nParticles);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  async function setSource(
    manifest: ProductManifest,
    tileBaseUrl: string,
    legendRange: [number, number],
  ): Promise<void> {
    const gen = ++fetchGeneration;
    currentPalette = { ...currentPalette, legendRange };
    const lodsSorted = Object.entries(manifest.lods)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([, entry]) => entry);

    const lod1 = lodsSorted[0]!;

    const { lonMin, lonMax, latMin, latMax } = manifest.bounds;
    const { uRange, vRange } = manifest;
    if (!uRange || !vRange) throw new Error('Particle manifest missing uRange/vRange');
    dataBounds = [lonMin, latMax, lonMax, latMin];
    vectorMin = [uRange[0], vRange[0]];
    vectorMax = [uRange[1], vRange[1]];
    uvScale = [lod1.chunkPx[0] / lod1.storedPx[0], lod1.chunkPx[1] / lod1.storedPx[1]];
    uvOffset = [lod1.padding / lod1.storedPx[0], lod1.padding / lod1.storedPx[1]];

    // Build flat LOD grids array for the shader uniform (padded to MAX_LODS=4 × 2 floats)
    lodGridsFlat = new Float32Array(4 * 2);
    lodsSorted.forEach(({ grid }, i) => {
      lodGridsFlat![i * 2] = grid[0];
      lodGridsFlat![i * 2 + 1] = grid[1];
    });

    // Reset atlas and LOD state for new date
    atlas?.destroy();
    schedulers.forEach(s => s.destroy());
    schedulers = [];
    lodController.destroy();
    lodController = createLODController();

    atlas = createAtlasManager(gl, {
      slotPx: lod1.storedPx,
      lods: lodsSorted.map(({ grid }) => ({ grid })),
    });

    // Preload all LOD1 chunks in parallel
    const [lod1Cols, lod1Rows] = lod1.grid;
    const lod1Ids: string[] = [];
    for (let cy = 0; cy < lod1Rows; cy++)
      for (let cx = 0; cx < lod1Cols; cx++) lod1Ids.push(`1/${cx}/${cy}`);

    await Promise.all(
      lod1Ids.map(async id => {
        const blob = await fetch(`${tileBaseUrl}/${id}.png`).then(r => r.blob());
        const img = await createImageBitmap(blob, { premultiplyAlpha: 'none' });
        if (gen !== fetchGeneration) return;
        atlas!.upload(id, img);
      }),
    );

    if (gen !== fetchGeneration) return;

    // Compile shaders and set up GPU resources on first call
    if (!programInfo)
      initializeShaders(
        atlas.getTotalSlots(),
        atlas.getTotalVirtualChunks(),
        atlas.getAtlasW(),
        atlas.getAtlasH(),
      );

    // Create one scheduler per on-demand LOD (LODs 2..N)
    for (let lodNum = 2; lodNum <= lodsSorted.length; lodNum++) {
      const lodEntry = lodsSorted[lodNum - 1];
      schedulers.push(
        createChunkScheduler(
          atlas,
          tileBaseUrl,
          onChunkLoaded,
          { lonMin, lonMax, latMin, latMax, cols: lodEntry.grid[0], rows: lodEntry.grid[1] },
          lodNum,
          lodEntry.zoomThreshold,
        ),
      );
    }
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
    if (newConfig.nParticles !== undefined && newConfig.nParticles !== nParticles) {
      nParticles = newConfig.nParticles as typeof nParticles;
      setParticles(nParticles);
    }
    Object.assign(config, newConfig);
  }

  function onMapMove(bounds: mapboxgl.LngLatBounds, zoom: number) {
    updateMapBounds(bounds);

    // Reset blend if any scheduler has unloaded visible chunks (new area entered)
    if (schedulers.some(s => !s.allVisibleLoaded())) {
      lodController.reset();
    }

    const mapBoundsObj = {
      west: bounds.getWest(),
      east: bounds.getEast(),
      south: bounds.getSouth(),
      north: bounds.getNorth(),
    };

    for (const scheduler of schedulers) {
      scheduler.update(mapBoundsObj, zoom);
    }
  }

  function setLodBlend(value: number) {
    lodController.reset();
    if (value > 0) lodController.startBlendIn();
  }

  function updatePalette(patch: PalettePatch) {
    currentPalette = { ...currentPalette, ...patch };
    setColorRamp(computeRamp(currentPalette));
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
    setLodBlend,
  };
}

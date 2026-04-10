/**
 * WindAtlasField
 *
 * GPU particle engine for the wind-field Atlas renderer.
 * Replaces VectorField.js — same ping-pong simulation loop, same Mapbox
 * coordinate conventions, but samples velocity from the 2048² Atlas texture
 * instead of a single flat PNG.
 *
 * Caller contract:
 *   1. Call setSource(baseUrl) when date changes — awaits LOD1 preload.
 *   2. Call onMapMove(bounds, zoom) on every moveend / zoom event.
 *   3. Call startAnimation() / stopAnimation() to control rendering.
 *   4. Call draw() from the Mapbox custom layer render() callback.
 *   5. Call setLodBlend(v) from LODController (Phase 6).
 */

import mapboxgl from 'mapbox-gl';
import * as twgl from 'twgl.js';
import {} from '../utils/shader';
import {
  windAtlasFsParticle,
  windAtlasFsUpdate,
  windAtlasVs,
  windAtlasVsQuad,
  windAtlasFsScreen,
} from '../utils/windShader';
import { createAtlasManager } from '../utils/AtlasManager';
import { createChunkScheduler } from '../utils/ChunkScheduler';
import { createLODController } from '../utils/LODController';
import type { AtlasManagerAPI } from '../utils/AtlasManager';
import type { ChunkSchedulerAPI } from '../utils/ChunkScheduler';
import type { LODControllerAPI } from '../utils/LODController';
import type { CustomizableParticleConfig } from '@/config';
import { INITIAL_PARTICLE_CONFIG } from '@/config';
import { getColorRamp } from '@/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

type WindManifest = {
  bounds: { lonMin: number; lonMax: number; latMin: number; latMax: number };
  uRange: [number, number];
  vRange: [number, number];
};

export type WindAtlasFieldAPI = {
  setSource: (baseUrl: string) => Promise<void>;
  startAnimation: () => void;
  stopAnimation: () => void;
  draw: () => void;
  resize: () => void;
  updateConfig: (config: Partial<CustomizableParticleConfig>) => void;
  onMapMove: (bounds: mapboxgl.LngLatBounds, zoom: number) => void;
  /** Set the LOD crossfade blend value (0 = LOD1, 1 = LOD2). Called by LODController. */
  setLodBlend: (value: number) => void;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const LOD1_COLS = 3;
const LOD1_ROWS = 3;

// ── Factory ───────────────────────────────────────────────────────────────────

export function createWindAtlasField(
  map: mapboxgl.Map,
  gl: WebGL2RenderingContext,
): WindAtlasFieldAPI {
  // Required for RG32F ping-pong framebuffer (same as VectorField.js)
  gl.getExtension('EXT_color_buffer_float');

  // Mutable config — updated in place by updateConfig so the draw loop
  // always reads current values without a closure update.
  const config = { ...INITIAL_PARTICLE_CONFIG };

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
  let scheduler: ChunkSchedulerAPI | null = null;

  // ── Data state ───────────────────────────────────────────────────────────
  // u_data_bounds format: [lonMin, latMax, lonMax, latMin]
  let dataBounds: [number, number, number, number] | null = null;
  let vectorMin: [number, number] | null = null; // [uMin, vMin]
  let vectorMax: [number, number] | null = null; // [uMax, vMax]
  let mapBounds: [number, number, number, number] | null = null;

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

  function initializeShaders() {
    programInfo = twgl.createProgramInfo(gl, [windAtlasVs, windAtlasFsParticle]);
    screenProgramInfo = twgl.createProgramInfo(gl, [windAtlasVsQuad, windAtlasFsScreen]);
    updateProgramInfo = twgl.createProgramInfo(gl, [windAtlasVsQuad, windAtlasFsUpdate]);

    setParticles(nParticles);
    setColorRamp(config.colours);
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
      !particleIndices
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
      u_loaded: atlas.getLoadedData(),
      u_lod1_grid: [LOD1_COLS, LOD1_ROWS],
      u_lod2_grid: [6, 5],
      u_lod_blend: lodController.getValue(),
      u_particles: particleTextures.particleTexture0,
      u_color_ramp: colorRampTexture.colorRampTexture,
      u_particles_res: particleRes,
      u_vector_min: vectorMin,
      u_vector_max: vectorMax,
      u_bounds: mapBounds,
      u_data_bounds: dataBounds,
      u_point_size: config.pointSize,
      u_max_speed: config.maxSpeed,
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
      !mapBounds
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
      u_lod1_grid: [LOD1_COLS, LOD1_ROWS],
      u_particles: particleTextures.particleTexture0,
      u_vector_min: vectorMin,
      u_vector_max: vectorMax,
      u_rand_seed: Math.random(),
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
    if (scheduler?.allVisibleLoaded()) {
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

  async function setSource(baseUrl: string): Promise<void> {
    const manifest: WindManifest = await fetch(`${baseUrl}/manifest.json`).then(r => r.json());

    const { lonMin, lonMax, latMin, latMax } = manifest.bounds;
    dataBounds = [lonMin, latMax, lonMax, latMin];
    vectorMin = [manifest.uRange[0], manifest.vRange[0]];
    vectorMax = [manifest.uRange[1], manifest.vRange[1]];

    // Reset atlas and LOD state for new date
    atlas?.destroy();
    scheduler?.destroy();
    scheduler = null;
    lodController.destroy();
    lodController = createLODController();

    atlas = createAtlasManager(gl);

    // Preload all LOD1 chunks in parallel
    const lod1Ids: string[] = [];
    for (let cy = 0; cy < LOD1_ROWS; cy++)
      for (let cx = 0; cx < LOD1_COLS; cx++) lod1Ids.push(`1_${cx}_${cy}`);

    await Promise.all(
      lod1Ids.map(async id => {
        const blob = await fetch(`${baseUrl}/ocean_current_${id}.png`).then(r => r.blob());
        const img = await createImageBitmap(blob, { premultiplyAlpha: 'none' });
        atlas!.upload(id, img);
      }),
    );

    // Compile shaders and set up GPU resources on first call
    if (!programInfo) initializeShaders();

    scheduler = createChunkScheduler(atlas, baseUrl, onChunkLoaded);
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

    // Reset blend to 0 when entering LOD2 range — new chunks will be fetched
    if (zoom > 6 && scheduler && !scheduler.allVisibleLoaded()) {
      lodController.reset();
    }

    scheduler?.update(
      {
        west: bounds.getWest(),
        east: bounds.getEast(),
        south: bounds.getSouth(),
        north: bounds.getNorth(),
      },
      zoom,
    );
  }

  function setLodBlend(value: number) {
    lodController.reset();
    if (value > 0) lodController.startBlendIn();
  }

  return {
    setSource,
    startAnimation,
    stopAnimation,
    draw,
    resize,
    updateConfig,
    onMapMove,
    setLodBlend,
  };
}

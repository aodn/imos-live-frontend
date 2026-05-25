/**
 * HeatmapAtlasField (formerly ScalarAtlasField)
 *
 * GPU scalar overlay for atlas-based products (sea level anomaly, SST anomaly mosaic, etc.).
 * Renders a full-viewport quad each frame, sampling scalar values from the Atlas texture
 * and mapping them to a color ramp.
 *
 * Supports 1, 2, or 3 LODs — determined by the manifest at runtime.
 *   - LOD1 is always preloaded eagerly.
 *   - LOD2..N are loaded on demand, one ChunkScheduler per LOD.
 *   - The LODController animates the crossfade for the finest active LOD.
 *
 * Caller contract:
 *   1. Call setSource(manifest, tileBaseUrl, legendRange) when date changes — resolves after the
 *      first LOD1 tile is uploaded; remaining tiles continue in the background.
 *   2. Call onMapMove(bounds, zoom) on every moveend / zoom event.
 *   3. Call setVisible(true/false) to control rendering.
 *   4. Call draw() from the Mapbox custom layer render() callback.
 */

import * as twgl from 'twgl.js';
import type { AtlasManagerAPI, ChunkSchedulerAPI, LODControllerAPI } from '../webgl';
import {
  createAtlasManager,
  createLODController,
  makeScalarAtlasFs,
  scalarAtlasVs,
} from '../webgl';

import { getColorRamp } from '../utils';
import type { ProductManifest, ColorPalette, PalettePatch } from '../types';
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

export type { ColorPalette, PalettePatch };

// ── Types ─────────────────────────────────────────────────────────────────────

export type HeatmapAtlasFieldAPI = {
  setSource: (
    manifest: ProductManifest,
    tileBaseUrl: string,
    legendRange: [number, number],
  ) => Promise<void>;
  updatePalette: (patch: PalettePatch) => void;
  setVisible: (visible: boolean) => void;
  draw: () => void;
  onMapMove: (bounds: mapboxgl.LngLatBounds, zoom: number) => void;
  /** Release all GPU resources, schedulers and timers. Call from the layer's onRemove. */
  destroy: () => void;
};

// ── Factory ───────────────────────────────────────────────────────────────────

export function createHeatmapAtlasField(
  map: mapboxgl.Map,
  gl: WebGL2RenderingContext,
  palette: ColorPalette,
): HeatmapAtlasFieldAPI {
  // ── Shader program ───────────────────────────────────────────────────────
  let programInfo: twgl.ProgramInfo | null = null;
  let bufferInfo: twgl.BufferInfo | null = null;
  let colorRampTexture: WebGLTexture | null = null;
  let currentPalette: ColorPalette = palette;

  // ── Atlas + chunk management ─────────────────────────────────────────────
  let atlas: AtlasManagerAPI | null = null;
  /** One scheduler per on-demand LOD (LODs 2..N). Index 0 = LOD2, index 1 = LOD3, etc. */
  let schedulers: ChunkSchedulerAPI[] = [];
  let lodController: LODControllerAPI = createLODController();

  // ── Data state ───────────────────────────────────────────────────────────
  // u_data_bounds: [lonMin, latMax, lonMax, latMin]
  let dataBounds: [number, number, number, number] | null = null;
  let valueRange: [number, number] | null = null;
  let mapBounds: [number, number, number, number] | null = null; // [nwX, seY, seX, nwY]
  /** Flat [cols0, rows0, cols1, rows1, ...] for u_lod_grids uniform, padded to 8 floats (4 LODs). */
  let lodGridsFlat: Float32Array | null = null;
  /** chunkPx / storedPx — maps local [0,1] UV into the data region (excluding padding). */
  let uvScale: [number, number] | null = null;
  /** padding / storedPx — shifts UV past the padding border. */
  let uvOffset: [number, number] | null = null;

  // ── Visibility ───────────────────────────────────────────────────────────
  let visible = false;

  // ── Fetch lifecycle ───────────────────────────────────────────────────────
  // Incremented on every setSource call; stale tile callbacks check against
  // this value and discard their result if a newer call has superseded them.
  let fetchGeneration = 0;

  // ── Private helpers ───────────────────────────────────────────────────────

  function initializeShaders(totalSlots: number, totalVirtualChunks: number) {
    programInfo = twgl.createProgramInfo(gl, [
      scalarAtlasVs,
      makeScalarAtlasFs(totalSlots, totalVirtualChunks),
    ]);

    // Full-viewport quad: (0,0)=bottom-left, (1,1)=top-right
    bufferInfo = twgl.createBufferInfoFromArrays(gl, {
      a_pos: {
        numComponents: 2,
        data: new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]),
      },
    });

    colorRampTexture = twgl.createTexture(gl, {
      src: getColorRamp(computeRamp(currentPalette)),
      width: 256,
      height: 1,
      min: gl.LINEAR,
      mag: gl.LINEAR,
      wrap: gl.CLAMP_TO_EDGE,
    });
  }

  function updateMapBounds(bounds: mapboxgl.LngLatBounds) {
    mapBounds = mercatorBoundsArray(bounds);
  }

  function onChunkLoaded(_id: string) {
    // Start blending in when all on-demand schedulers have their visible chunks loaded
    if (schedulers.every(s => s.allVisibleLoaded())) {
      lodController.startBlendIn();
      map.triggerRepaint();
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────

  function updatePalette(patch: PalettePatch) {
    currentPalette = { ...currentPalette, ...patch };
    if (!colorRampTexture) return;
    twgl.setTextureFromArray(gl, colorRampTexture, getColorRamp(computeRamp(currentPalette)), {
      width: 256,
      height: 1,
      format: gl.RGBA,
    });
  }

  async function setSource(
    manifest: ProductManifest,
    tileBaseUrl: string,
    newLegendRange: [number, number],
  ): Promise<void> {
    const gen = ++fetchGeneration;

    const lodsSorted = sortManifestLods(manifest);
    const lod1 = lodsSorted[0]!;

    dataBounds = dataBoundsFromManifest(manifest.bounds);
    valueRange = manifest.valueRange ?? null;
    currentPalette = { ...currentPalette, legendRange: newLegendRange };
    ({ uvScale, uvOffset } = computeUvTransform(lod1));
    lodGridsFlat = buildLodGridsFlat(lodsSorted);

    // Teardown previous state
    atlas?.destroy();
    schedulers.forEach(s => s.destroy());
    lodController.destroy();
    lodController = createLODController();

    atlas = createAtlasManager(gl, {
      slotPx: lod1.storedPx,
      lods: lodsSorted.map(({ grid }) => ({ grid })),
    });

    if (!programInfo) initializeShaders(atlas.getTotalSlots(), atlas.getTotalVirtualChunks());

    schedulers = createLodSchedulers({
      atlas,
      tileBaseUrl,
      onChunkLoaded,
      bounds: manifest.bounds,
      lodsSorted,
    });

    // Fetch LOD1 progressively — resolves on the first uploaded tile so the
    // caller can reveal the layer immediately; each tile triggers a repaint.
    await preloadLod1({
      tileBaseUrl,
      lod1Ids: lod1ChunkIds(lod1),
      atlas,
      isStale: () => gen !== fetchGeneration,
      onTileUploaded: () => map.triggerRepaint(),
    });
  }

  function setVisible(isVisible: boolean) {
    visible = isVisible;
    if (isVisible) {
      const bounds = map.getBounds();
      if (bounds) updateMapBounds(bounds);
    }
  }

  function draw() {
    const currentBounds = map.getBounds();
    if (currentBounds) updateMapBounds(currentBounds);

    if (
      !visible ||
      !programInfo ||
      !bufferInfo ||
      !atlas ||
      !colorRampTexture ||
      !dataBounds ||
      !valueRange ||
      !mapBounds ||
      !lodGridsFlat ||
      !uvScale ||
      !uvOffset
    )
      return;

    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.useProgram(programInfo.program);

    const lodBlend = lodController.getValue();
    if (lodController.isAnimating()) map.triggerRepaint();

    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
    twgl.setUniforms(programInfo, {
      u_atlas: atlas.getTexture(),
      u_slots: atlas.getSlotsData(),
      u_chunk_slots: atlas.getChunkSlots(),
      u_lod_grids: lodGridsFlat,
      u_lod_offsets: atlas.getLodOffsets(),
      u_lod_count: atlas.getLodCount(),
      u_lod_blend: lodBlend,
      u_bounds: mapBounds,
      u_data_bounds: dataBounds,
      u_uv_scale: uvScale,
      u_uv_offset: uvOffset,
      u_value_range: valueRange,
      u_legend_range: currentPalette.legendRange,
      u_color_ramp: colorRampTexture,
    });

    twgl.drawBufferInfo(gl, bufferInfo);

    gl.disable(gl.BLEND);
    gl.depthMask(true);
  }

  function onMapMove(bounds: mapboxgl.LngLatBounds, zoom: number) {
    updateMapBounds(bounds);
    syncSchedulersOnMove({ bounds, zoom, schedulers, lodController });
  }

  function destroy() {
    visible = false;
    // Invalidate any in-flight setSource callbacks.
    fetchGeneration++;

    schedulers.forEach(s => s.destroy());
    schedulers = [];
    lodController.destroy();
    atlas?.destroy();
    atlas = null;

    if (programInfo) {
      gl.deleteProgram(programInfo.program);
      programInfo = null;
    }
    if (bufferInfo?.attribs) {
      for (const name in bufferInfo.attribs) {
        gl.deleteBuffer(bufferInfo.attribs[name].buffer);
      }
      bufferInfo = null;
    }
    if (colorRampTexture) {
      gl.deleteTexture(colorRampTexture);
      colorRampTexture = null;
    }
  }

  return {
    setSource,
    updatePalette,
    setVisible,
    draw,
    onMapMove,
    destroy,
  };
}

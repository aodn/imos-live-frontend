/**
 * HeatmapAtlasField
 *
 * GPU scalar overlay for atlas-based products (sea level anomaly, SST anomaly mosaic, etc.).
 * Renders a full-viewport quad each frame, sampling scalar values from the Atlas texture
 * and mapping them to a color ramp.
 *
 * Supports 1, 2, or 3 LODs — determined by the manifest at runtime.
 *   - LOD1 is always preloaded eagerly.
 *   - LOD2..N are loaded on demand, one ChunkScheduler per LOD.
 *   - Each chunk is sampled the moment it's resident — finer detail pops in
 *     per-chunk as tiles arrive (progressive rendering, no animated crossfade).
 *
 * Caller contract:
 *   1. Call setSource(manifest, tileBaseUrl, legendRange) when date changes — resolves after the
 *      first LOD1 tile is uploaded; remaining tiles continue in the background.
 *   2. Call onMapMove(bounds, zoom) on every moveend / zoom event.
 *   3. Call setVisible(true/false) to control rendering.
 *   4. Call draw() from the Mapbox custom layer render() callback.
 */

import * as twgl from 'twgl.js';
import type { AtlasManagerAPI, ChunkSchedulerAPI } from '../webgl';
import { createAtlasManager, makeScalarAtlasFs, scalarAtlasVs } from '../webgl';

import { getColorRamp } from '../utils';
import type { ProductManifest, ColorPalette, PalettePatch } from '../types';
import {
  computeRamp,
  buildDiscreteRampPixels,
  mercatorBoundsArray,
  sortManifestLods,
  dataBoundsFromManifest,
  computeUvTransform,
  buildLodGridsFlat,
  buildLodZoomThresholds,
  computeActiveLodCount,
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
  /**
   * 0 = continuous data (256-stop interpolated ramp, LINEAR filtering).
   * N>0 = categorical with N flag values (discrete N-pixel ramp, NEAREST
   * filtering on both the ramp and the atlas; see setSource).
   */
  let numCategories = 0;

  // ── Atlas + chunk management ─────────────────────────────────────────────
  let atlas: AtlasManagerAPI | null = null;
  /** One scheduler per on-demand LOD (LODs 2..N). Index 0 = LOD2, index 1 = LOD3, etc. */
  let schedulers: ChunkSchedulerAPI[] = [];

  // ── Data state ───────────────────────────────────────────────────────────
  // u_data_bounds: [lonMin, latMax, lonMax, latMin]
  let dataBounds: [number, number, number, number] | null = null;
  let valueRange: [number, number] | null = null;
  let mapBounds: [number, number, number, number] | null = null; // [nwX, seY, seX, nwY]
  /** Flat [cols0, rows0, cols1, rows1, ...] for u_lod_grids uniform, padded to 8 floats (4 LODs). */
  let lodGridsFlat: Float32Array | null = null;
  /** Per-LOD zoom thresholds, aligned with the sorted LOD list. Drives the
   *  dynamic u_lod_count below so a resident LOD2+ chunk left over from a
   *  deeper zoom doesn't bleed through at a zoom where its LOD is inactive. */
  let lodZoomThresholds: number[] = [];
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

    rebuildColorRampTexture();
  }

  /**
   * (Re)create the colour-ramp texture from `currentPalette` + `numCategories`.
   *
   * Continuous: 256×1 ramp built from a canvas gradient, sampled with LINEAR.
   * Categorical: N×1 ramp where each texel is one flag's colour, sampled with
   * NEAREST so the shader's texel-centre lookup returns the exact palette entry
   * without bleeding from its neighbours.
   *
   * Recreates the texture (rather than texSubImage2D) because the width changes
   * between modes — even when only the colour count changes.
   */
  function rebuildColorRampTexture() {
    if (colorRampTexture) gl.deleteTexture(colorRampTexture);
    const categorical = numCategories > 0;
    const { data, width } = categorical
      ? buildDiscreteRampPixels(currentPalette.rawColors)
      : { data: getColorRamp(computeRamp(currentPalette)), width: 256 };
    const filter = categorical ? gl.NEAREST : gl.LINEAR;
    colorRampTexture = twgl.createTexture(gl, {
      src: data,
      width,
      height: 1,
      min: filter,
      mag: filter,
      wrap: gl.CLAMP_TO_EDGE,
    });
  }

  function updateMapBounds(bounds: mapboxgl.LngLatBounds) {
    mapBounds = mercatorBoundsArray(bounds);
  }

  function onChunkLoaded(_id: string) {
    // Progressive rendering: repaint as each chunk lands so it pops in
    // immediately, instead of waiting for the whole LOD to finish loading.
    // The heatmap has no continuous rAF loop, so this is what reveals new tiles.
    map.triggerRepaint();
  }

  // ── Public API ────────────────────────────────────────────────────────────

  function updatePalette(patch: PalettePatch) {
    currentPalette = { ...currentPalette, ...patch };
    // Ramp texture width / filter depend on numCategories (categorical vs
    // continuous), so always rebuild rather than overwriting via texSubImage2D.
    if (colorRampTexture) rebuildColorRampTexture();
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
    lodZoomThresholds = buildLodZoomThresholds(lodsSorted);

    // Categorical products carry `flagValues` in the manifest; presence flips
    // the field into discrete mode (NEAREST atlas/ramp filtering, one ramp
    // texel per flag, the shader rounds raw values to a flag index).
    const prevNumCategories = numCategories;
    numCategories = manifest.flagValues?.length ?? 0;

    // Teardown previous state
    atlas?.destroy();
    schedulers.forEach(s => s.destroy());

    atlas = createAtlasManager(gl, {
      slotPx: lod1.storedPx,
      lods: lodsSorted.map(({ grid }) => ({ grid })),
      filter: numCategories > 0 ? 'nearest' : 'linear',
    });

    if (!programInfo) initializeShaders(atlas.getTotalSlots(), atlas.getTotalVirtualChunks());
    // Same field instance re-bound to a product with different categoricality
    // (or different category count): rebuild the ramp texture to match.
    else if (prevNumCategories !== numCategories) rebuildColorRampTexture();

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
  }

  function draw() {
    // Refresh bounds every frame: the quad is full-screen and its geography is
    // derived from u_bounds, but the layer only listens to moveend/zoom (not
    // continuous 'move'), so this is what keeps the overlay aligned during a pan.
    // mapBounds is read only here, so this is also its single authoritative write.
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

    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
    twgl.setUniforms(programInfo, {
      u_atlas: atlas.getTexture(),
      u_slots: atlas.getSlotsData(),
      u_chunk_slots: atlas.getChunkSlots(),
      u_lod_grids: lodGridsFlat,
      u_lod_offsets: atlas.getLodOffsets(),
      // Dynamic: zoom-gated active LOD count. Caps the shader's LOD loop so
      // stale LOD2+ chunks resident from a deeper-zoom session can't show as
      // intermediate-LOD patches once the user has zoomed back out.
      u_lod_count: computeActiveLodCount(map.getZoom(), lodZoomThresholds),
      u_bounds: mapBounds,
      u_data_bounds: dataBounds,
      u_uv_scale: uvScale,
      u_uv_offset: uvOffset,
      u_value_range: valueRange,
      u_legend_range: currentPalette.legendRange,
      u_color_ramp: colorRampTexture,
      u_num_categories: numCategories,
    });

    twgl.drawBufferInfo(gl, bufferInfo);

    gl.disable(gl.BLEND);
    gl.depthMask(true);
  }

  function onMapMove(bounds: mapboxgl.LngLatBounds, zoom: number) {
    // mapBounds is refreshed in draw(); here we only drive the chunk schedulers.
    syncSchedulersOnMove({ bounds, zoom, schedulers });
  }

  function destroy() {
    visible = false;
    // Invalidate any in-flight setSource callbacks.
    fetchGeneration++;

    schedulers.forEach(s => s.destroy());
    schedulers = [];
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

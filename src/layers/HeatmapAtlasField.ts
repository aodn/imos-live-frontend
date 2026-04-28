/**
 * HeatmapAtlasField (formerly ScalarAtlasField)
 *
 * GPU scalar overlay for atlas-based products (sea level anomaly, SST anomaly mosaic, etc.).
 * Renders a full-viewport quad each frame, sampling scalar values from the 2048² Atlas texture
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

import mapboxgl from 'mapbox-gl';
import * as twgl from 'twgl.js';
import type { AtlasManagerAPI, ChunkSchedulerAPI, LODControllerAPI } from '@/webgl';
import {
  createAtlasManager,
  createChunkScheduler,
  createLODController,
  makeScalarAtlasFs,
  scalarAtlasVs,
} from '@/webgl';

// 4096×2048 gives 16×10 = 160 slots. Pool = 151, fitting all LOD2 (30) + LOD3 (120) = 150 tiles
// with no LRU eviction. Particles keep their own 2048×2048 atlas (hardcoded in particlesShader).
const HEATMAP_ATLAS_W = 4096;
const HEATMAP_ATLAS_H = 2048;
import { getColorRamp } from '@/utils';
import {
  convertLogColorScaleToRamp,
  convertLinearColorScaleToRamp,
} from '@/components/ColorScaleBar/utils';
import type { ProductManifest } from '@/api';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ColorPalette = {
  legendRange: [number, number];
  rawColors: [number, number, number][];
  scale: 'log' | 'linear';
};

export type PalettePatch = Partial<ColorPalette>;

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
};

function computeRamp(palette: ColorPalette): Record<string, string> {
  const { scale, legendRange, rawColors } = palette;
  return scale === 'log'
    ? convertLogColorScaleToRamp({
        minMaxRatio: legendRange[0] / legendRange[1],
        colors: rawColors,
      })
    : convertLinearColorScaleToRamp({ colors: rawColors });
}

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

  function initializeShaders(totalSlots: number) {
    programInfo = twgl.createProgramInfo(gl, [scalarAtlasVs, makeScalarAtlasFs(totalSlots)]);

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
    const nw = bounds.getNorthWest();
    const se = bounds.getSouthEast();
    const nwM = mapboxgl.MercatorCoordinate.fromLngLat(nw);
    const seM = mapboxgl.MercatorCoordinate.fromLngLat(se);
    mapBounds = [nwM.x, seM.y, seM.x, nwM.y];
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

    const lodsSorted = Object.entries(manifest.lods)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([, entry]) => entry);

    const lod1 = lodsSorted[0]!;

    const { lonMin, lonMax, latMin, latMax } = manifest.bounds;
    dataBounds = [lonMin, latMax, lonMax, latMin];
    valueRange = manifest.valueRange ?? null;
    currentPalette = { ...currentPalette, legendRange: newLegendRange };
    uvScale = [lod1.chunkPx[0] / lod1.storedPx[0], lod1.chunkPx[1] / lod1.storedPx[1]];
    uvOffset = [lod1.padding / lod1.storedPx[0], lod1.padding / lod1.storedPx[1]];

    // Build flat LOD grids array for the shader uniform (padded to MAX_LODS=4 × 2 floats)
    lodGridsFlat = new Float32Array(4 * 2);
    lodsSorted.forEach(({ grid }, i) => {
      lodGridsFlat![i * 2] = grid[0];
      lodGridsFlat![i * 2 + 1] = grid[1];
    });

    // Teardown previous state
    atlas?.destroy();
    schedulers.forEach(s => s.destroy());
    schedulers = [];
    lodController.destroy();
    lodController = createLODController();

    atlas = createAtlasManager(gl, {
      slotPx: lod1.storedPx,
      lods: lodsSorted.map(({ grid }) => ({ grid })),
      atlasW: HEATMAP_ATLAS_W,
      atlasH: HEATMAP_ATLAS_H,
    });

    const totalSlots =
      Math.floor(HEATMAP_ATLAS_W / lod1.storedPx[0]) *
      Math.floor(HEATMAP_ATLAS_H / lod1.storedPx[1]);
    if (!programInfo) initializeShaders(totalSlots);

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

    // Build the list of LOD1 tile IDs to fetch
    const [lod1Cols, lod1Rows] = lod1.grid;
    const lod1Ids: string[] = [];
    for (let cy = 0; cy < lod1Rows; cy++)
      for (let cx = 0; cx < lod1Cols; cx++) lod1Ids.push(`1_${cx}_${cy}`);

    if (lod1Ids.length === 0) return;

    // Fetch LOD1 tiles progressively. Resolve as soon as the first tile is
    // uploaded so the caller can make the layer visible immediately. Remaining
    // tiles continue in the background; each upload triggers a repaint so they
    // appear incrementally. Reject only when every tile has failed.
    await new Promise<void>((resolve, reject) => {
      let firstResolved = false;
      let failCount = 0;

      for (const id of lod1Ids) {
        (async () => {
          try {
            const blob = await fetch(`${tileBaseUrl}/${id}.png`).then(r => r.blob());
            const img = await createImageBitmap(blob, { premultiplyAlpha: 'none' });
            if (gen !== fetchGeneration) return; // superseded by a newer setSource call
            atlas!.upload(id, img);
            map.triggerRepaint();
            if (!firstResolved) {
              firstResolved = true;
              resolve();
            }
          } catch {
            if (gen !== fetchGeneration) return;
            failCount++;
            if (failCount === lod1Ids.length && !firstResolved)
              reject(new Error('All LOD1 tile fetches failed'));
          }
        })();
      }
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

  return {
    setSource,
    updatePalette,
    setVisible,
    draw,
    onMapMove,
  };
}

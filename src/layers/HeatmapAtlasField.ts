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
 *   1. Call setSource(manifest, baseUrl, filePrefix, legendRange) when date changes — awaits LOD1 preload.
 *   2. Call onMapMove(bounds, zoom) on every moveend / zoom event.
 *   3. Call setVisible(true/false) to control rendering.
 *   4. Call draw() from the Mapbox custom layer render() callback.
 */

import mapboxgl from 'mapbox-gl';
import * as twgl from 'twgl.js';
import type { AtlasManagerAPI, ChunkSchedulerAPI, LODControllerAPI } from '@/webgl';
import {
  ATLAS_SIZE,
  createAtlasManager,
  createChunkScheduler,
  createLODController,
  makeScalarAtlasFs,
  scalarAtlasVs,
} from '@/webgl';
import { getColorRamp } from '@/utils';
import type { HeatmapAtlasProductManifest } from '@/api';

// ── Types ─────────────────────────────────────────────────────────────────────

export type HeatmapAtlasFieldAPI = {
  setSource: (
    manifest: HeatmapAtlasProductManifest,
    baseUrl: string,
    filePrefix: string,
    date: string,
    legendRange: [number, number],
  ) => Promise<void>;
  updateLegendRange: (range: [number, number]) => void;
  setVisible: (visible: boolean) => void;
  draw: () => void;
  onMapMove: (bounds: mapboxgl.LngLatBounds, zoom: number) => void;
};

// ── Factory ───────────────────────────────────────────────────────────────────

export function createHeatmapAtlasField(
  map: mapboxgl.Map,
  gl: WebGL2RenderingContext,
  colorRampColors: Record<string, string>,
): HeatmapAtlasFieldAPI {
  // ── Shader program ───────────────────────────────────────────────────────
  let programInfo: twgl.ProgramInfo | null = null;
  let bufferInfo: twgl.BufferInfo | null = null;
  let colorRampTexture: WebGLTexture | null = null;

  // ── Atlas + chunk management ─────────────────────────────────────────────
  let atlas: AtlasManagerAPI | null = null;
  /** One scheduler per on-demand LOD (LODs 2..N). Index 0 = LOD2, index 1 = LOD3, etc. */
  let schedulers: ChunkSchedulerAPI[] = [];
  let lodController: LODControllerAPI = createLODController();

  // ── Data state ───────────────────────────────────────────────────────────
  // u_data_bounds: [lonMin, latMax, lonMax, latMin]
  let dataBounds: [number, number, number, number] | null = null;
  let valueRange: [number, number] | null = null;
  let legendRange: [number, number] | null = null;
  let mapBounds: [number, number, number, number] | null = null; // [nwX, seY, seX, nwY]
  /** Flat [cols0, rows0, cols1, rows1, ...] for u_lod_grids uniform, padded to 8 floats (4 LODs). */
  let lodGridsFlat: Float32Array | null = null;
  /** chunkPx / storedPx — maps local [0,1] UV into the data region (excluding padding). */
  let uvScale: [number, number] | null = null;
  /** padding / storedPx — shifts UV past the padding border. */
  let uvOffset: [number, number] | null = null;

  // ── Visibility ───────────────────────────────────────────────────────────
  let visible = false;

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
      src: getColorRamp(colorRampColors),
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
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────

  function updateLegendRange(range: [number, number]) {
    legendRange = range;
  }

  async function setSource(
    manifest: HeatmapAtlasProductManifest,
    baseUrl: string,
    filePrefix: string,
    date: string,
    newLegendRange: [number, number],
  ): Promise<void> {
    // The renderer uses exactly LODs '1' (preloaded) and '2' (on-demand).
    const lodsSorted = Object.entries(manifest.lods)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([, entry]) => entry);

    const lod1 = lodsSorted[0]!;

    const { lonMin, lonMax, latMin, latMax } = manifest.bounds;
    dataBounds = [lonMin, latMax, lonMax, latMin];
    valueRange = manifest.valueRange;
    legendRange = newLegendRange;
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
    });
    // Preload all LOD1 chunks in parallel
    const [lod1Cols, lod1Rows] = lod1.grid;
    const lod1Ids: string[] = [];
    for (let cy = 0; cy < lod1Rows; cy++)
      for (let cx = 0; cx < lod1Cols; cx++) lod1Ids.push(`1_${cx}_${cy}`);

    await Promise.all(
      lod1Ids.map(async id => {
        const blob = await fetch(`${baseUrl}/${filePrefix}/${date}/${id}.png`).then(r => r.blob());
        const img = await createImageBitmap(blob, { premultiplyAlpha: 'none' });
        atlas!.upload(id, img);
      }),
    );

    const totalSlots =
      Math.floor(ATLAS_SIZE / lod1.storedPx[0]) * Math.floor(ATLAS_SIZE / lod1.storedPx[1]);
    if (!programInfo) initializeShaders(totalSlots);

    // Create one scheduler per on-demand LOD (LODs 2..N)
    for (let lodNum = 2; lodNum <= lodsSorted.length; lodNum++) {
      const lodEntry = lodsSorted[lodNum - 1];
      schedulers.push(
        createChunkScheduler(
          atlas,
          baseUrl,
          onChunkLoaded,
          { lonMin, lonMax, latMin, latMax, cols: lodEntry.grid[0], rows: lodEntry.grid[1] },
          filePrefix,
          date,
          lodNum,
          lodEntry.zoomThreshold,
        ),
      );
    }
  }

  function setVisible(isVisible: boolean) {
    visible = isVisible;
    if (isVisible) {
      const bounds = map.getBounds();
      if (bounds) updateMapBounds(bounds);
    }
  }

  function draw() {
    if (
      !visible ||
      !programInfo ||
      !bufferInfo ||
      !atlas ||
      !colorRampTexture ||
      !dataBounds ||
      !valueRange ||
      !legendRange ||
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
      u_lod_count: atlas.getLodCount(),
      u_lod_blend: lodController.getValue(),
      u_bounds: mapBounds,
      u_data_bounds: dataBounds,
      u_uv_scale: uvScale,
      u_uv_offset: uvOffset,
      u_value_range: valueRange,
      u_legend_range: legendRange,
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

  return { setSource, updateLegendRange, setVisible, draw, onMapMove };
}

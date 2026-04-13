/**
 * ScalarAtlasField
 *
 * GPU scalar overlay for atlas-based products (sea level anomaly, SST anomaly mosaic, etc.).
 * Renders a full-viewport quad each frame, sampling scalar values from the 2048² Atlas texture
 * and mapping them to a color ramp.
 *
 * Caller contract:
 *   1. Call setSource(manifest, baseUrl, filePrefix) when date changes — awaits LOD1 preload.
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
  scalarAtlasFs,
  scalarAtlasVs,
} from '@/webgl';
import { getColorRamp } from '@/utils';
import type { HeatmapAtlasManifest } from '@/api';

// ── Types ─────────────────────────────────────────────────────────────────────

export type HeatmapAtlasFieldAPI = {
  setSource: (
    manifest: HeatmapAtlasManifest,
    baseUrl: string,
    filePrefix: string,
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
  let scheduler: ChunkSchedulerAPI | null = null;
  let lodController: LODControllerAPI = createLODController();

  // ── Data state ───────────────────────────────────────────────────────────
  // u_data_bounds: [lonMin, latMax, lonMax, latMin]
  let dataBounds: [number, number, number, number] | null = null;
  let valueRange: [number, number] | null = null;
  let legendRange: [number, number] | null = null;
  let mapBounds: [number, number, number, number] | null = null; // [nwX, seY, seX, nwY]
  let lod1Grid: [number, number] | null = null;
  let lod2Grid: [number, number] | null = null;

  // ── Visibility ───────────────────────────────────────────────────────────
  let visible = false;

  // ── Private helpers ───────────────────────────────────────────────────────

  function initializeShaders() {
    programInfo = twgl.createProgramInfo(gl, [scalarAtlasVs, scalarAtlasFs]);

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
    if (scheduler?.allVisibleLoaded()) {
      lodController.startBlendIn();
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────

  function updateLegendRange(range: [number, number]) {
    legendRange = range;
  }

  async function setSource(
    manifest: HeatmapAtlasManifest,
    baseUrl: string,
    filePrefix: string,
    newLegendRange: [number, number],
  ): Promise<void> {
    const { lonMin, lonMax, latMin, latMax } = manifest.bounds;
    dataBounds = [lonMin, latMax, lonMax, latMin];
    valueRange = manifest.valueRange;
    lod1Grid = manifest.lods['1'].grid;
    lod2Grid = manifest.lods['2'].grid;
    legendRange = newLegendRange;

    atlas?.destroy();
    scheduler?.destroy();
    scheduler = null;
    lodController.destroy();
    lodController = createLODController();

    atlas = createAtlasManager(gl);

    const [lod1Cols, lod1Rows] = lod1Grid;
    const lod1Ids: string[] = [];
    for (let cy = 0; cy < lod1Rows; cy++)
      for (let cx = 0; cx < lod1Cols; cx++) lod1Ids.push(`1_${cx}_${cy}`);

    await Promise.all(
      lod1Ids.map(async id => {
        const blob = await fetch(`${baseUrl}/${filePrefix}_${id}.png`).then(r => r.blob());
        const img = await createImageBitmap(blob, { premultiplyAlpha: 'none' });
        atlas!.upload(id, img);
      }),
    );

    if (!programInfo) initializeShaders();

    scheduler = createChunkScheduler(
      atlas,
      baseUrl,
      onChunkLoaded,
      { lonMin, lonMax, latMin, latMax, cols: lod2Grid[0], rows: lod2Grid[1] },
      filePrefix,
    );
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
      !lod1Grid ||
      !lod2Grid
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
      u_loaded: atlas.getLoadedData(),
      u_lod1_grid: lod1Grid,
      u_lod2_grid: lod2Grid,
      u_lod_blend: lodController.getValue(),
      u_bounds: mapBounds,
      u_data_bounds: dataBounds,
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

  return { setSource, updateLegendRange, setVisible, draw, onMapMove };
}

/**
 * Shared helpers for the atlas Field engines (HeatmapAtlasField,
 * ParticlesAtlasField). These two engines drive different shaders but share all
 * of their manifest parsing, atlas/scheduler wiring, LOD1 preloading and
 * map-move handling — this module is the single home for that common logic.
 */

import mapboxgl from 'mapbox-gl';
import type { ProductManifest, LodEntry, ColorPalette } from '../types';
import { convertLogColorScaleToRamp, convertLinearColorScaleToRamp } from '../utils';
import type { AtlasManagerAPI, ChunkSchedulerAPI } from '../webgl';
import { createChunkScheduler, DEFAULT_ZOOM_THRESHOLD, MAX_LODS } from '../webgl';

/** Palette → 256-stop color-ramp stop map (log or linear scale). */
export function computeRamp(palette: ColorPalette): Record<string, string> {
  const { scale, legendRange, rawColors } = palette;
  return scale === 'log'
    ? convertLogColorScaleToRamp({
        minMaxRatio: legendRange[0] / legendRange[1],
        colors: rawColors,
      })
    : // 'linear' and (the never-categorical-here) 'category' both fall through to
      // a linear ramp; HeatmapAtlasField bypasses computeRamp entirely when it
      // detects a categorical product and calls buildDiscreteRampPixels instead.
      convertLinearColorScaleToRamp({ colors: rawColors });
}

/**
 * Build a discrete N-pixel × 1 RGBA ramp from `rawColors` — one texel per flag
 * value, no interpolation. Combined with NEAREST sampling and texel-centre
 * lookup in the shader this gives exact category → colour mapping.
 */
export function buildDiscreteRampPixels(rawColors: ColorPalette['rawColors']): {
  data: Uint8Array;
  width: number;
} {
  const width = rawColors.length;
  const data = new Uint8Array(width * 4);
  for (let i = 0; i < width; i++) {
    const [r, g, b] = rawColors[i];
    data[i * 4 + 0] = Math.round(r * 255);
    data[i * 4 + 1] = Math.round(g * 255);
    data[i * 4 + 2] = Math.round(b * 255);
    data[i * 4 + 3] = 255;
  }
  return { data, width };
}

/** LngLatBounds → [nwMercatorX, seMercatorY, seMercatorX, nwMercatorY] for the u_bounds uniform. */
export function mercatorBoundsArray(
  bounds: mapboxgl.LngLatBounds,
): [number, number, number, number] {
  const nwM = mapboxgl.MercatorCoordinate.fromLngLat(bounds.getNorthWest());
  const seM = mapboxgl.MercatorCoordinate.fromLngLat(bounds.getSouthEast());
  return [nwM.x, seM.y, seM.x, nwM.y];
}

/** Manifest LODs sorted coarsest→finest by numeric key. */
export function sortManifestLods(manifest: ProductManifest): LodEntry[] {
  return Object.entries(manifest.lods)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([, entry]) => entry);
}

/** [lonMin, latMax, lonMax, latMin] for the u_data_bounds uniform. */
export function dataBoundsFromManifest(
  bounds: ProductManifest['bounds'],
): [number, number, number, number] {
  return [bounds.lonMin, bounds.latMax, bounds.lonMax, bounds.latMin];
}

/**
 * UV scale/offset that map a chunk's local [0,1] UV into its data region,
 * skipping the padding border baked into the stored tile.
 */
export function computeUvTransform(lod1: LodEntry): {
  uvScale: [number, number];
  uvOffset: [number, number];
} {
  return {
    uvScale: [lod1.chunkPx[0] / lod1.storedPx[0], lod1.chunkPx[1] / lod1.storedPx[1]],
    uvOffset: [lod1.padding / lod1.storedPx[0], lod1.padding / lod1.storedPx[1]],
  };
}

/**
 * Per-LOD zoom thresholds aligned with `lodsSorted`. LOD1 is always active
 * (-Infinity); LOD2+ default to `DEFAULT_ZOOM_THRESHOLD` when the manifest
 * omits one. Matches `ChunkScheduler.update`'s `zoom > threshold` activation.
 */
export function buildLodZoomThresholds(lodsSorted: LodEntry[]): number[] {
  return lodsSorted.map((lod, i) =>
    i === 0 ? -Infinity : (lod.zoomThreshold ?? DEFAULT_ZOOM_THRESHOLD),
  );
}

/**
 * How many LODs (counting LOD1) should be sampled by the shader at this zoom.
 * Walks lowest→highest and stops at the first inactive LOD so a resident chunk
 * left over from a deeper zoom can't bleed through as an intermediate LOD.
 */
export function computeActiveLodCount(zoom: number, lodZoomThresholds: number[]): number {
  let count = 1;
  for (let i = 1; i < lodZoomThresholds.length; i++) {
    if (zoom > lodZoomThresholds[i]) count = i + 1;
    else break;
  }
  return count;
}

/** Flat [cols0, rows0, cols1, rows1, ...] padded to MAX_LODS×2 for the u_lod_grids uniform. */
export function buildLodGridsFlat(lodsSorted: LodEntry[]): Float32Array {
  const flat = new Float32Array(MAX_LODS * 2);
  lodsSorted.forEach(({ grid }, i) => {
    flat[i * 2] = grid[0];
    flat[i * 2 + 1] = grid[1];
  });
  return flat;
}

/** LOD1 chunk ids ("1/cx/cy"), row-major (cy outer, cx inner). */
export function lod1ChunkIds(lod1: LodEntry): string[] {
  const [cols, rows] = lod1.grid;
  const ids: string[] = [];
  for (let cy = 0; cy < rows; cy++) for (let cx = 0; cx < cols; cx++) ids.push(`1/${cx}/${cy}`);
  return ids;
}

/** Create one ChunkScheduler per on-demand LOD (LODs 2..N). */
export function createLodSchedulers(params: {
  atlas: AtlasManagerAPI;
  buildTileUrl: (id: string) => string;
  onChunkLoaded: (id: string) => void;
  bounds: { lonMin: number; lonMax: number; latMin: number; latMax: number };
  lodsSorted: LodEntry[];
}): ChunkSchedulerAPI[] {
  const { atlas, buildTileUrl, onChunkLoaded, bounds, lodsSorted } = params;
  const schedulers: ChunkSchedulerAPI[] = [];
  for (let lodNum = 2; lodNum <= lodsSorted.length; lodNum++) {
    const lodEntry = lodsSorted[lodNum - 1];
    schedulers.push(
      createChunkScheduler(
        atlas,
        buildTileUrl,
        onChunkLoaded,
        { ...bounds, cols: lodEntry.grid[0], rows: lodEntry.grid[1] },
        lodNum,
        lodEntry.zoomThreshold,
      ),
    );
  }
  return schedulers;
}

/**
 * Progressively fetch + upload the LOD1 tiles. Resolves as soon as the first
 * tile is uploaded so the caller can reveal the layer immediately; the rest
 * continue in the background. Rejects only if every tile fails. If a newer
 * setSource supersedes this one, isStale() returns true and the promise
 * resolves without uploading (the caller's own staleness guards then no-op).
 */
export function preloadLod1(params: {
  buildTileUrl: (id: string) => string;
  lod1Ids: string[];
  atlas: AtlasManagerAPI;
  isStale: () => boolean;
  onTileUploaded?: (id: string) => void;
}): Promise<void> {
  const { buildTileUrl, lod1Ids, atlas, isStale, onTileUploaded } = params;
  if (lod1Ids.length === 0) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    let settled = false;
    let failCount = 0;

    const resolveOnce = () => {
      if (!settled) {
        settled = true;
        resolve();
      }
    };

    for (const id of lod1Ids) {
      void (async () => {
        try {
          const blob = await fetch(buildTileUrl(id)).then(r => r.blob());
          const img = await createImageBitmap(blob, {
            premultiplyAlpha: 'none',
            colorSpaceConversion: 'none',
          });
          // Superseded — unwind without uploading rather than leaving a pending promise.
          if (isStale()) return resolveOnce();
          atlas.upload(id, img);
          onTileUploaded?.(id);
          resolveOnce();
        } catch {
          if (isStale()) return resolveOnce();
          failCount++;
          if (failCount === lod1Ids.length && !settled) {
            settled = true;
            reject(new Error('All LOD1 tile fetches failed'));
          }
        }
      })();
    }
  });
}

/**
 * Blocking LOD1 preload: fetch + upload every LOD1 tile and resolve only once
 * all are resident (rejects if any fails).
 *
 * Required by the particle engine, whose update/draw shaders sample LOD1
 * unconditionally via worldToAtlasUV(lonlat, 0). A not-yet-resident chunk maps
 * to u_chunk_slots[idx] === -1, so the shader would index u_slots[-1] — an
 * out-of-bounds (undefined) read — rather than discarding the way the heatmap's
 * alpha mask does. So every LOD1 tile must be present before the animation runs.
 */
export async function preloadAllLod1(params: {
  buildTileUrl: (id: string) => string;
  lod1Ids: string[];
  atlas: AtlasManagerAPI;
  isStale: () => boolean;
}): Promise<void> {
  const { buildTileUrl, lod1Ids, atlas, isStale } = params;
  await Promise.all(
    lod1Ids.map(async id => {
      const blob = await fetch(buildTileUrl(id)).then(r => r.blob());
      const img = await createImageBitmap(blob, {
        premultiplyAlpha: 'none',
        colorSpaceConversion: 'none',
      });
      if (isStale()) return; // superseded — don't upload to a torn-down atlas
      atlas.upload(id, img);
    }),
  );
}

/**
 * Shared onMapMove scheduler logic: update every scheduler with the new
 * viewport so it fetches the chunks now in view. Rendering is progressive —
 * each chunk pops in via its own load callback as it arrives — so there is no
 * crossfade state to reset here.
 */
export function syncSchedulersOnMove(params: {
  bounds: mapboxgl.LngLatBounds;
  zoom: number;
  schedulers: ChunkSchedulerAPI[];
}): void {
  const { bounds, zoom, schedulers } = params;
  const mapBoundsObj = {
    west: bounds.getWest(),
    east: bounds.getEast(),
    south: bounds.getSouth(),
    north: bounds.getNorth(),
  };
  for (const scheduler of schedulers) scheduler.update(mapBoundsObj, zoom);
}

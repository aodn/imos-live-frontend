/**
 * ChunkScheduler
 *
 * Manages dynamic on-demand chunk fetching for a single LOD level.
 * LOD1 is preloaded at startup by the caller — one scheduler instance
 * is created per on-demand LOD (LOD2, LOD3, etc.).
 *
 * Responsibilities:
 *  - On each map move/zoom, compute which chunks for this LOD are needed
 *    (visible viewport + 1-chunk buffer ring)
 *  - Skip scheduling if zoom is below this LOD's threshold
 *  - Abort in-flight requests for chunks that scrolled out of scope
 *  - Fetch + decode remaining chunks in priority order (viewport first)
 *  - Upload each decoded ImageBitmap to the AtlasManager
 *  - Fire onChunkLoaded so the LODController can trigger crossfade
 *
 * ChunkId convention: "{lod}/{cx}/{cy}"  e.g. "2/3/2", "3/5/4"
 * File URL:           "{tileBaseUrl}/{lod}/{cx}/{cy}.png"
 */

import type { AtlasManagerAPI } from './AtlasManager';

export const DEFAULT_ZOOM_THRESHOLD = 6;
const CONCURRENCY = 6;

// ── Types ─────────────────────────────────────────────────────────────────────

export type MapBounds = {
  west: number;
  east: number;
  south: number;
  north: number;
};

export type ChunkRegion = {
  lonMin: number;
  lonMax: number;
  latMin: number;
  latMax: number;
  cols: number;
  rows: number;
};

type QueueEntry = {
  chunkId: string;
  priority: number; // 0 = viewport (high), 1 = buffer ring (low)
};

export type ChunkSchedulerAPI = {
  /** Call on every map move or zoom change. No-ops if zoom ≤ threshold. */
  update: (bounds: MapBounds, zoom: number) => void;
  /** True when every chunk in the current viewport is present in the atlas. */
  allVisibleLoaded: () => boolean;
  destroy: () => void;
};

// Helpers

/** Convert a map bounds + expansion to the set of chunk grid positions that intersect it. */
function chunksInBounds(
  bounds: MapBounds,
  region: ChunkRegion,
  expandChunks = 0,
): { cx: number; cy: number }[] {
  const chunkLon = (region.lonMax - region.lonMin) / region.cols;
  const chunkLat = (region.latMax - region.latMin) / region.rows;

  const west = bounds.west - expandChunks * chunkLon;
  const east = bounds.east + expandChunks * chunkLon;
  const south = bounds.south - expandChunks * chunkLat;
  const north = bounds.north + expandChunks * chunkLat;

  // cx: west→east, cy: north→south (cy=0 is northernmost, matching chunk generation)
  const cxMin = Math.max(0, Math.floor((west - region.lonMin) / chunkLon));
  const cxMax = Math.min(region.cols - 1, Math.floor((east - region.lonMin) / chunkLon));
  const cyMin = Math.max(0, Math.floor((region.latMax - north) / chunkLat));
  const cyMax = Math.min(region.rows - 1, Math.floor((region.latMax - south) / chunkLat));

  // Clamp: if viewport is entirely outside the region return empty
  if (cxMin > cxMax || cyMin > cyMax) return [];

  const positions: { cx: number; cy: number }[] = [];
  for (let cy = cyMin; cy <= cyMax; cy++) {
    for (let cx = cxMin; cx <= cxMax; cx++) {
      positions.push({ cx, cy });
    }
  }
  return positions;
}

async function fetchChunk(url: string, signal: AbortSignal): Promise<ImageBitmap> {
  const resp = await fetch(url, { signal });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} fetching ${url}`);
  const blob = await resp.blob();
  // premultiplyAlpha:'none' — A channel is always 255 in our PNGs so this is
  // a no-op, but it's defensive: prevents the browser from corrupting R/G/B
  // values if A were ever less than 255.
  return createImageBitmap(blob, { premultiplyAlpha: 'none' });
}

// Factory

export function createChunkScheduler(
  atlas: AtlasManagerAPI,
  tileBaseUrl: string,
  onChunkLoaded: (chunkId: string) => void,
  region: ChunkRegion,
  /** 1-based LOD number this scheduler handles (2 = LOD2, 3 = LOD3, ...). */
  lod = 2,
  /** Zoom level below which this LOD is not activated. */
  zoomThreshold = DEFAULT_ZOOM_THRESHOLD,
): ChunkSchedulerAPI {
  let inflight = 0;
  let queue: QueueEntry[] = [];
  const loading = new Set<string>();
  const aborts = new Map<string, AbortController>();
  let visibleIds: string[] = [];

  // chunkId format: "${lod}/${cx}/${cy}"
  function makeChunkId(cx: number, cy: number): string {
    return `${lod}/${cx}/${cy}`;
  }

  function chunkUrl(id: string): string {
    return `${tileBaseUrl}/${id}.png`;
  }

  function cancelChunk(id: string) {
    aborts.get(id)?.abort();
    aborts.delete(id);
    loading.delete(id);
    inflight = Math.max(0, inflight - 1);
  }

  async function drain() {
    while (inflight < CONCURRENCY && queue.length > 0) {
      // Always process highest priority (lowest number) first
      queue.sort((a, b) => a.priority - b.priority);
      const entry = queue.shift()!;
      const { chunkId: id } = entry;

      if (loading.has(id) || atlas.has(id)) continue;

      const ctrl = new AbortController();
      aborts.set(id, ctrl);
      loading.add(id);
      inflight++;

      fetchChunk(chunkUrl(id), ctrl.signal)
        .then(img => {
          atlas.upload(id, img);
          onChunkLoaded(id);
        })
        .catch(err => {
          if (err?.name !== 'AbortError') {
            console.warn('[ChunkScheduler] fetch failed:', id, err);
          }
        })
        .finally(() => {
          loading.delete(id);
          aborts.delete(id);
          inflight = Math.max(0, inflight - 1);
          drain();
        });
    }
  }

  function update(bounds: MapBounds, zoom: number) {
    if (zoom <= zoomThreshold) {
      // This LOD not active — abort everything and reset
      aborts.forEach((_, id) => cancelChunk(id));
      queue = [];
      visibleIds = [];
      return;
    }

    const toIds = (positions: { cx: number; cy: number }[]) =>
      positions.map(({ cx, cy }) => makeChunkId(cx, cy));

    visibleIds = toIds(chunksInBounds(bounds, region, 0));

    // Refresh LRU timestamp for every visible chunk already in the atlas.
    for (const id of visibleIds) {
      if (atlas.has(id)) atlas.touch(id);
    }

    const buffered = toIds(chunksInBounds(bounds, region, 1)).filter(
      id => !visibleIds.includes(id),
    );

    // Cancel requests that are no longer in scope
    const needed = new Set([...visibleIds, ...buffered]);
    aborts.forEach((_, id) => {
      if (!needed.has(id)) cancelChunk(id);
    });

    // Build fresh priority queue (skip already-loaded and already-loading)
    queue = [
      ...visibleIds
        .filter(id => !atlas.has(id) && !loading.has(id))
        .map(id => ({ chunkId: id, priority: 0 })),
      ...buffered
        .filter(id => !atlas.has(id) && !loading.has(id))
        .map(id => ({ chunkId: id, priority: 1 })),
    ];

    drain();
  }

  function allVisibleLoaded(): boolean {
    return visibleIds.length > 0 && visibleIds.every(id => atlas.has(id));
  }

  function destroy() {
    aborts.forEach((_, id) => cancelChunk(id));
    queue = [];
    visibleIds = [];
  }

  return { update, allVisibleLoaded, destroy };
}

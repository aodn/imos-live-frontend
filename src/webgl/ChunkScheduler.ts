/**
 * ChunkScheduler
 *
 * Manages dynamic LOD2 chunk fetching for the ocean-curent-field Atlas renderer.
 * LOD1 (9 chunks) is preloaded at startup by the caller — this scheduler
 * only handles LOD2 (30 chunks, 6×5 grid).
 *
 * Responsibilities:
 *  - On each map move/zoom, compute which LOD2 chunks are needed
 *    (visible viewport + 1-chunk buffer ring)
 *  - Abort in-flight requests for chunks that scrolled out of scope
 *  - Fetch + decode remaining chunks in priority order (viewport first)
 *  - Upload each decoded ImageBitmap to the AtlasManager
 *  - Fire onChunkLoaded so the LODController can trigger crossfade
 *
 * ChunkId convention: "{lod}_{cx}_{cy}"  e.g. "2_3_2"
 * File URL:           "{baseUrl}/ocean_current_{lod}_{cx}_{cy}.png"
 */

import type { AtlasManagerAPI } from './AtlasManager';

const LOD2_ZOOM_THRESHOLD = 6;
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

/** Convert a map bounds + expansion to the set of LOD2 chunkIds that intersect it. */
function chunksInBounds(bounds: MapBounds, region: ChunkRegion, expandChunks = 0): string[] {
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

  const ids: string[] = [];
  for (let cy = cyMin; cy <= cyMax; cy++) {
    for (let cx = cxMin; cx <= cxMax; cx++) {
      ids.push(`2_${cx}_${cy}`);
    }
  }
  return ids;
}

async function fetchChunk(url: string): Promise<ImageBitmap> {
  const resp = await fetch(url);
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
  baseUrl: string,
  onChunkLoaded: (chunkId: string) => void,
  region: ChunkRegion,
  filePrefix = 'ocean_current',
): ChunkSchedulerAPI {
  let inflight = 0;
  let queue: QueueEntry[] = [];
  const loading = new Set<string>();
  const aborts = new Map<string, AbortController>();
  let visibleIds: string[] = [];

  function chunkUrl(chunkId: string): string {
    return `${baseUrl}/${filePrefix}_${chunkId}.png`;
  }

  function cancelChunk(chunkId: string) {
    aborts.get(chunkId)?.abort();
    aborts.delete(chunkId);
    loading.delete(chunkId);
    inflight = Math.max(0, inflight - 1);
  }

  async function drain() {
    while (inflight < CONCURRENCY && queue.length > 0) {
      // Always process highest priority (lowest number) first
      queue.sort((a, b) => a.priority - b.priority);
      const entry = queue.shift()!;
      const { chunkId } = entry;

      if (loading.has(chunkId) || atlas.has(chunkId)) continue;

      const ctrl = new AbortController();
      aborts.set(chunkId, ctrl);
      loading.add(chunkId);
      inflight++;

      // Capture inflight reference so the finally block can decrement correctly
      // even if cancelChunk already ran.
      fetchChunk(chunkUrl(chunkId))
        .then(img => {
          // Only upload if not cancelled while in flight
          if (loading.has(chunkId)) {
            atlas.upload(chunkId, img);
            onChunkLoaded(chunkId);
          }
        })
        .catch(err => {
          if (err?.name !== 'AbortError') {
            console.warn('[ChunkScheduler] fetch failed:', chunkId, err);
          }
        })
        .finally(() => {
          loading.delete(chunkId);
          aborts.delete(chunkId);
          inflight = Math.max(0, inflight - 1);
          drain();
        });
    }
  }

  function update(bounds: MapBounds, zoom: number) {
    if (zoom <= LOD2_ZOOM_THRESHOLD) {
      // LOD2 not active — abort everything and reset
      aborts.forEach((_, id) => cancelChunk(id));
      queue = [];
      visibleIds = [];
      return;
    }

    visibleIds = chunksInBounds(bounds, region, 0);
    const buffered = chunksInBounds(bounds, region, 1).filter(id => !visibleIds.includes(id));

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

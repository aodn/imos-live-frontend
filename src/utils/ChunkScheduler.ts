/**
 * ChunkScheduler
 *
 * Manages dynamic LOD2 chunk fetching for the wind-field Atlas renderer.
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

// ── Region constants (must match gsla_chunking.py) ───────────────────────────
const LON_MIN = 89.9;
const LON_MAX = 180.1;
const LAT_MIN = -61.0;
const LAT_MAX = 10.1;

const LOD2_COLS = 6;
const LOD2_ROWS = 5;

const CHUNK_LON = (LON_MAX - LON_MIN) / LOD2_COLS; // ≈ 15.03° per chunk
const CHUNK_LAT = (LAT_MAX - LAT_MIN) / LOD2_ROWS; // ≈ 14.22° per chunk

const LOD2_ZOOM_THRESHOLD = 6;
const CONCURRENCY = 6;

// ── Types ─────────────────────────────────────────────────────────────────────

export type MapBounds = {
  west: number;
  east: number;
  south: number;
  north: number;
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

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Convert a map bounds + expansion to the set of LOD2 chunkIds that intersect it. */
function chunksInBounds(bounds: MapBounds, expandChunks = 0): string[] {
  const expandLon = expandChunks * CHUNK_LON;
  const expandLat = expandChunks * CHUNK_LAT;

  const west = bounds.west - expandLon;
  const east = bounds.east + expandLon;
  const south = bounds.south - expandLat;
  const north = bounds.north + expandLat;

  // cx: west→east, cy: north→south (cy=0 is northernmost, matching chunk generation)
  const cxMin = Math.max(0, Math.floor((west - LON_MIN) / CHUNK_LON));
  const cxMax = Math.min(LOD2_COLS - 1, Math.floor((east - LON_MIN) / CHUNK_LON));
  const cyMin = Math.max(0, Math.floor((LAT_MAX - north) / CHUNK_LAT));
  const cyMax = Math.min(LOD2_ROWS - 1, Math.floor((LAT_MAX - south) / CHUNK_LAT));

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

// ── Factory ───────────────────────────────────────────────────────────────────

export function createChunkScheduler(
  atlas: AtlasManagerAPI,
  baseUrl: string,
  onChunkLoaded: (chunkId: string) => void,
): ChunkSchedulerAPI {
  let inflight = 0;
  let queue: QueueEntry[] = [];
  const loading = new Set<string>();
  const aborts = new Map<string, AbortController>();
  let visibleIds: string[] = [];

  function chunkUrl(chunkId: string): string {
    // chunkId = "2_cx_cy"  →  ocean_current_2_cx_cy.png
    return `${baseUrl}/ocean_current_${chunkId}.png`;
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

    visibleIds = chunksInBounds(bounds, 0);
    const buffered = chunksInBounds(bounds, 1).filter(id => !visibleIds.includes(id));

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

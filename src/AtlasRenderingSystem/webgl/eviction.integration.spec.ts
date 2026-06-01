/**
 * Eviction integration test — real AtlasManager + real ChunkScheduler.
 *
 * Everything else in the suite mocks one side of the pair. This drives the two
 * together the way a tile-heavy future product would: a pool far smaller than
 * the LOD grid, panned around until chunks are evicted and then revisited. It
 * locks in the behaviour the progressive renderer relies on:
 *
 *   evict → re-fetch on revisit → re-render correct (slot map stays a bijection)
 *
 * Fetches auto-resolve; Date.now is a monotonic counter so LRU order is
 * deterministic (oldest = least-recently uploaded/touched).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAtlasManager } from './AtlasManager';
import { createChunkScheduler, type ChunkRegion } from './ChunkScheduler';

// The opt-in upload diagnostic (gated by VITE_ATLAS_DIAG) does a GPU readback and
// is dev-only tooling. Keep this integration test independent of the developer's
// local `.env` by forcing it off — otherwise the readback runs against the
// minimal GL mock below (which has no framebuffer methods) and throws.
vi.mock('./atlasUploadDiagnostics', () => ({
  isAtlasDiagEnabled: () => false,
  verifyUpload: () => {},
}));

// Region tiled by the LOD2 grid: 12 cols × 10 rows over 60°×40°, so each chunk
// is 5° lon × 4° lat. cy=0 is northernmost (lat 36..40).
const REGION: ChunkRegion = {
  lonMin: 0,
  lonMax: 60,
  latMin: 0,
  latMax: 40,
  cols: 12,
  rows: 10,
};

// ── Minimal WebGL2 mock — AtlasManager only touches a handful of methods ──────
function makeGl(maxTextureSize: number): WebGL2RenderingContext {
  return {
    TEXTURE_2D: 0x0de1,
    RGBA: 0x1908,
    UNSIGNED_BYTE: 0x1401,
    NEAREST: 0x2600,
    LINEAR: 0x2601,
    TEXTURE_MIN_FILTER: 0x2801,
    TEXTURE_MAG_FILTER: 0x2800,
    TEXTURE_WRAP_S: 0x2802,
    TEXTURE_WRAP_T: 0x2803,
    CLAMP_TO_EDGE: 0x812f,
    MAX_TEXTURE_SIZE: 0x0d33,
    MAX_FRAGMENT_UNIFORM_COMPONENTS: 0x8b49,
    getParameter: (p: number) => {
      if (p === 0x0d33) return maxTextureSize;
      if (p === 0x8b49) return 4096;
      return 0;
    },
    createTexture: () => ({}) as WebGLTexture,
    bindTexture: () => {},
    texImage2D: () => {},
    texSubImage2D: () => {},
    texParameteri: () => {},
    deleteTexture: () => {},
  } as unknown as WebGL2RenderingContext;
}

/** fetch that resolves immediately and records how many times each URL was hit. */
function autoFetch() {
  const calls: string[] = [];
  const fetchMock = vi.fn(async (url: string) => {
    calls.push(url);
    return { ok: true, blob: async () => new Blob() } as Response;
  });
  return { fetchMock, countFor: (url: string) => calls.filter(u => u === url).length };
}

/** Let the scheduler's fetch→decode→upload→drain promise chains settle. */
async function flush() {
  for (let i = 0; i < 30; i++) await new Promise(r => setTimeout(r, 0));
}

/** Assert no physical slot backs two resident virtual chunks (render-correctness). */
function assertBijection(chunkSlots: Int32Array) {
  const owner = new Map<number, number>();
  for (let v = 0; v < chunkSlots.length; v++) {
    const slot = chunkSlots[v];
    if (slot < 0) continue;
    expect(owner.has(slot)).toBe(false);
    owner.set(slot, v);
  }
}

const NW_CHUNK_URL = 'http://x/2/0/0.png'; // chunk (cx=0, cy=0): lon 0..5, lat 36..40

describe('eviction integration (AtlasManager + ChunkScheduler)', () => {
  let clock = 0;

  beforeEach(() => {
    clock = 1000;
    vi.spyOn(Date, 'now').mockImplementation(() => ++clock);
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({}) as ImageBitmap),
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('evicts, re-fetches on revisit, and keeps the slot map consistent', async () => {
    // 1024² atlas with 242×194 slots → 4×5 = 20 slots; LOD1 (3×3) dedicates 9,
    // leaving a pool of 11 — far smaller than LOD2's 12×10 = 120 chunks.
    const atlas = createAtlasManager(makeGl(1024), {
      slotPx: [242, 194],
      lods: [{ grid: [3, 3] }, { grid: [12, 10] }],
    });
    const poolSize = atlas.getTotalSlots() - 9;
    expect(poolSize).toBe(11);

    const { fetchMock, countFor } = autoFetch();
    vi.stubGlobal('fetch', fetchMock);

    const onChunk = vi.fn();
    const scheduler = createChunkScheduler(atlas, 'http://x', onChunk, REGION, 2, 0);

    // ── Visit the NW corner — chunk (0,0) loads ────────────────────────────────
    scheduler.update({ west: 1, east: 4, south: 37, north: 39 }, 8);
    await flush();
    expect(atlas.has('2/0/0')).toBe(true);
    expect(countFor(NW_CHUNK_URL)).toBe(1);
    assertBijection(atlas.getChunkSlots());

    // ── Pan far to the SE, loading many more chunks than the pool holds ────────
    // Viewport spans cx 5..11 × cy 4..9 (42 chunks) — nowhere near (0,0) or its
    // buffer ring, so (0,0) is never re-touched and must be evicted.
    scheduler.update({ west: 26, east: 59, south: 1, north: 23 }, 8);
    await flush();
    expect(atlas.has('2/0/0')).toBe(false); // evicted under pool pressure
    assertBijection(atlas.getChunkSlots());

    // ── Revisit the NW corner — the evicted chunk must be re-fetched ───────────
    scheduler.update({ west: 1, east: 4, south: 37, north: 39 }, 8);
    await flush();
    expect(countFor(NW_CHUNK_URL)).toBe(2); // fetched a second time
    expect(atlas.has('2/0/0')).toBe(true); // resident again
    assertBijection(atlas.getChunkSlots());

    scheduler.destroy();
    atlas.destroy();
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AtlasManagerAPI } from './AtlasManager';
import { createChunkScheduler, type ChunkRegion } from './ChunkScheduler';

const REGION: ChunkRegion = {
  lonMin: 0,
  lonMax: 60,
  latMin: 0,
  latMax: 40,
  cols: 6,
  rows: 4,
};

// Each chunk is 10° lon × 10° lat. cy=0 is northernmost (lat 30..40), cy=3 southernmost.

type FakeAtlas = AtlasManagerAPI & {
  uploaded: Set<string>;
  touched: string[];
};

function makeAtlas(): FakeAtlas {
  const uploaded = new Set<string>();
  const touched: string[] = [];
  const atlas = {
    upload: (id: string) => uploaded.add(id),
    has: (id: string) => uploaded.has(id),
    touch: (id: string) => {
      touched.push(id);
    },
    getTexture: vi.fn(),
    getSlotsData: vi.fn(() => new Float32Array()),
    getChunkSlots: vi.fn(() => new Int32Array()),
    getLodOffsets: vi.fn(() => new Int32Array()),
    getLodCount: vi.fn(() => 2),
    getTotalSlots: vi.fn(() => 0),
    getTotalVirtualChunks: vi.fn(() => 0),
    getAtlasW: vi.fn(() => 0),
    getAtlasH: vi.fn(() => 0),
    destroy: vi.fn(),
    uploaded,
    touched,
  } as unknown as FakeAtlas;
  return atlas;
}

/** A controllable fetch implementation: caller resolves each URL on demand. */
function controllableFetch() {
  const pending: Map<
    string,
    { resolve: (b: Blob) => void; reject: (e: Error) => void; signal: AbortSignal }
  > = new Map();
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    return new Promise<Response>((resolve, reject) => {
      const signal = init?.signal as AbortSignal;
      pending.set(url, {
        resolve: blob => resolve({ ok: true, blob: async () => blob } as Response),
        reject,
        signal,
      });
      signal?.addEventListener('abort', () => {
        const err = new Error('Aborted');
        err.name = 'AbortError';
        pending.delete(url);
        reject(err);
      });
    });
  });
  return {
    fetchMock,
    resolveUrl(url: string) {
      const entry = pending.get(url);
      if (!entry) throw new Error(`No pending fetch for ${url}`);
      entry.resolve(new Blob());
      pending.delete(url);
    },
    pendingCount() {
      return pending.size;
    },
    pendingUrls() {
      return [...pending.keys()];
    },
  };
}

describe('ChunkScheduler', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({}) as ImageBitmap),
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('no-ops below the zoom threshold and aborts in-flight fetches', async () => {
    const { fetchMock, pendingCount } = controllableFetch();
    vi.stubGlobal('fetch', fetchMock);

    const atlas = makeAtlas();
    const onChunk = vi.fn();
    const scheduler = createChunkScheduler(
      atlas,
      'http://x',
      onChunk,
      REGION,
      2,
      6, // zoomThreshold
    );

    // Above threshold — fetches start
    scheduler.update({ west: 10, east: 30, south: 10, north: 30 }, 8);
    expect(pendingCount()).toBeGreaterThan(0);

    // Below threshold — must abort everything
    scheduler.update({ west: 10, east: 30, south: 10, north: 30 }, 5);
    // The mock's abort handler removes them from pending and rejects.
    await Promise.resolve();
    expect(pendingCount()).toBe(0);
    // Vacuously loaded: no visible chunks → no work outstanding for this LOD.
    expect(scheduler.allVisibleLoaded()).toBe(true);
  });

  it('prioritises the viewport chunk over its buffer-ring neighbours', async () => {
    const { fetchMock, pendingUrls } = controllableFetch();
    vi.stubGlobal('fetch', fetchMock);
    const atlas = makeAtlas();
    const scheduler = createChunkScheduler(atlas, 'http://x', vi.fn(), REGION, 2, 0);

    // Viewport covers a single chunk at (cx=1, cy=2), lon 10..20, lat 10..20.
    // The 1-chunk buffer ring adds 8 more; total queued = 9, but CONCURRENCY=6 caps
    // in-flight fetches. The viewport chunk has priority 0 so it must be one of them.
    scheduler.update({ west: 11, east: 19, south: 11, north: 19 }, 8);

    const urls = pendingUrls();
    expect(urls.length).toBe(6); // concurrency cap
    expect(urls).toContain('http://x/2/1/2.png'); // viewport priority 0 — always dispatched
  });

  it('caps in-flight fetches at the concurrency limit (6)', async () => {
    const { fetchMock, pendingCount } = controllableFetch();
    vi.stubGlobal('fetch', fetchMock);
    const atlas = makeAtlas();
    const scheduler = createChunkScheduler(atlas, 'http://x', vi.fn(), REGION, 2, 0);

    // Large viewport — many chunks needed, but only 6 should be in flight at any moment
    scheduler.update({ west: 0, east: 60, south: 0, north: 40 }, 8);
    expect(pendingCount()).toBe(6);
  });

  it('drains additional queue entries as in-flight requests settle', async () => {
    const { fetchMock, pendingCount, resolveUrl, pendingUrls } = controllableFetch();
    vi.stubGlobal('fetch', fetchMock);
    const atlas = makeAtlas();
    const scheduler = createChunkScheduler(atlas, 'http://x', vi.fn(), REGION, 2, 0);

    scheduler.update({ west: 0, east: 60, south: 0, north: 40 }, 8);
    expect(pendingCount()).toBe(6);

    const firstUrl = pendingUrls()[0];
    resolveUrl(firstUrl);
    // After microtasks flush, the next queue entry should be dispatched.
    await new Promise(r => setTimeout(r, 0));
    expect(pendingCount()).toBe(6);
  });

  it('cancels in-flight fetches whose chunks scroll outside the buffer zone', async () => {
    const { fetchMock, pendingUrls, pendingCount } = controllableFetch();
    vi.stubGlobal('fetch', fetchMock);
    const atlas = makeAtlas();
    const scheduler = createChunkScheduler(atlas, 'http://x', vi.fn(), REGION, 2, 0);

    // Initial viewport in the NW (cx=0, cy=0)
    scheduler.update({ west: 1, east: 9, south: 31, north: 39 }, 8);
    const before = new Set(pendingUrls());
    expect(before.size).toBeGreaterThan(0);

    // Pan far away to the SE corner — old chunks should be aborted (out of buffer ring)
    scheduler.update({ west: 51, east: 59, south: 1, north: 9 }, 8);

    await new Promise(r => setTimeout(r, 0));
    // Old NW chunks should no longer be pending
    expect(pendingUrls().some(u => u.endsWith('/0/0.png'))).toBe(false);
    expect(pendingCount()).toBeGreaterThan(0);
  });

  it('touches the atlas for already-loaded visible chunks (LRU refresh)', () => {
    const { fetchMock } = controllableFetch();
    vi.stubGlobal('fetch', fetchMock);
    const atlas = makeAtlas();
    const scheduler = createChunkScheduler(atlas, 'http://x', vi.fn(), REGION, 2, 0);

    // Pre-load some viewport chunks
    atlas.uploaded.add('2/1/2');
    atlas.uploaded.add('2/2/2');

    scheduler.update({ west: 11, east: 21, south: 11, north: 19 }, 8);

    // Touched both visible (in-viewport) chunks already in the atlas
    expect(atlas.touched).toContain('2/1/2');
    expect(atlas.touched).toContain('2/2/2');
  });

  it('skips fetches for chunks already in the atlas', async () => {
    const { fetchMock, pendingUrls } = controllableFetch();
    vi.stubGlobal('fetch', fetchMock);
    const atlas = makeAtlas();
    atlas.uploaded.add('2/1/2');

    const scheduler = createChunkScheduler(atlas, 'http://x', vi.fn(), REGION, 2, 0);
    scheduler.update({ west: 11, east: 19, south: 11, north: 19 }, 8);

    // 2/1/2 (the centre visible chunk) is already resident — no fetch.
    expect(pendingUrls()).not.toContain('http://x/2/1/2.png');
  });

  it('allVisibleLoaded returns true only once every viewport chunk is in the atlas', () => {
    const { fetchMock } = controllableFetch();
    vi.stubGlobal('fetch', fetchMock);
    const atlas = makeAtlas();
    const scheduler = createChunkScheduler(atlas, 'http://x', vi.fn(), REGION, 2, 0);

    // Viewport covers a single chunk (cx=1, cy=2)
    scheduler.update({ west: 11, east: 19, south: 11, north: 19 }, 8);
    expect(scheduler.allVisibleLoaded()).toBe(false);

    atlas.uploaded.add('2/1/2');
    expect(scheduler.allVisibleLoaded()).toBe(true);
  });

  it('uploads to the atlas and invokes onChunkLoaded after a successful fetch', async () => {
    const { fetchMock, resolveUrl, pendingUrls } = controllableFetch();
    vi.stubGlobal('fetch', fetchMock);

    const atlas = makeAtlas();
    const onChunkLoaded = vi.fn();
    const scheduler = createChunkScheduler(atlas, 'http://x', onChunkLoaded, REGION, 2, 0);

    scheduler.update({ west: 11, east: 19, south: 11, north: 19 }, 8);

    // Resolve the centre tile fetch
    const centreUrl = pendingUrls().find(u => u.endsWith('/2/1/2.png'))!;
    resolveUrl(centreUrl);
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));

    expect(atlas.uploaded.has('2/1/2')).toBe(true);
    expect(onChunkLoaded).toHaveBeenCalledWith('2/1/2');
  });

  it('returns empty when the viewport is entirely outside the region', () => {
    const { fetchMock, pendingCount } = controllableFetch();
    vi.stubGlobal('fetch', fetchMock);
    const atlas = makeAtlas();
    const scheduler = createChunkScheduler(atlas, 'http://x', vi.fn(), REGION, 2, 0);

    scheduler.update({ west: 100, east: 110, south: 100, north: 110 }, 8);
    expect(pendingCount()).toBe(0);
    // Off-region viewport produces no visible chunks → vacuously loaded.
    expect(scheduler.allVisibleLoaded()).toBe(true);
  });

  it('destroy aborts everything', async () => {
    const { fetchMock, pendingCount } = controllableFetch();
    vi.stubGlobal('fetch', fetchMock);
    const atlas = makeAtlas();
    const scheduler = createChunkScheduler(atlas, 'http://x', vi.fn(), REGION, 2, 0);

    scheduler.update({ west: 0, east: 60, south: 0, north: 40 }, 8);
    expect(pendingCount()).toBeGreaterThan(0);

    scheduler.destroy();
    await Promise.resolve();
    expect(pendingCount()).toBe(0);
    // After destroy, visibleIds is cleared → vacuously loaded (no work outstanding).
    expect(scheduler.allVisibleLoaded()).toBe(true);
  });
});

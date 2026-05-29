import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import mapboxgl from 'mapbox-gl';
import type { ColorPalette, LodEntry, ProductManifest } from '../types';
import type { AtlasManagerAPI, ChunkSchedulerAPI, LODControllerAPI } from '../webgl';
import {
  buildDiscreteRampPixels,
  buildLodGridsFlat,
  buildLodZoomThresholds,
  computeActiveLodCount,
  computeRamp,
  computeUvTransform,
  dataBoundsFromManifest,
  lod1ChunkIds,
  mercatorBoundsArray,
  preloadAllLod1,
  preloadLod1,
  sortManifestLods,
  syncSchedulersOnMove,
} from './atlasFieldShared';

const PALETTE_LINEAR: ColorPalette = {
  legendRange: [0, 10],
  rawColors: [
    [1, 0, 0],
    [0, 0, 1],
  ],
  scale: 'linear',
};

const PALETTE_LOG: ColorPalette = {
  legendRange: [0.01, 1],
  rawColors: [
    [1, 0, 0],
    [0, 0, 1],
  ],
  scale: 'log',
};

const LOD_ENTRY: LodEntry = {
  grid: [3, 2],
  storedPx: [242, 194],
  chunkPx: [240, 192],
  padding: 1,
};

const MANIFEST: ProductManifest = {
  bounds: { lonMin: 110, lonMax: 160, latMin: -45, latMax: -10 },
  valueRange: [-1, 1],
  lods: {
    '3': { ...LOD_ENTRY, grid: [12, 10] },
    '1': { ...LOD_ENTRY, grid: [3, 2] },
    '2': { ...LOD_ENTRY, grid: [6, 4] },
  },
};

describe('computeRamp', () => {
  it('builds a linear ramp for linear palettes', () => {
    const ramp = computeRamp(PALETTE_LINEAR);
    // 1.00 is written exactly once (by the i=N-1 stop), so it stays pure blue.
    expect(ramp['1.00']).toBe('#0000ff');
    // 0.00 is overwritten by the i=1 stop and ends up near-red (not exactly pure).
    expect(parseInt(ramp['0.00'].slice(1, 3), 16)).toBeGreaterThanOrEqual(0xee);
  });

  it('builds a log ramp for log palettes', () => {
    const ramp = computeRamp(PALETTE_LOG);
    // log ramp tags the final stop at 1.00 and the first at the min/max ratio
    expect(ramp['1.00']).toBe('#0000ff');
  });

  it('falls through to linear for category scale (callers bypass this path explicitly)', () => {
    const palette: ColorPalette = { ...PALETTE_LINEAR, scale: 'category' };
    const ramp = computeRamp(palette);
    expect(ramp['1.00']).toBe('#0000ff');
  });
});

describe('buildDiscreteRampPixels', () => {
  it('emits one RGBA texel per raw colour with full alpha', () => {
    const result = buildDiscreteRampPixels([
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ]);
    expect(result.width).toBe(3);
    expect(Array.from(result.data)).toEqual([
      255,
      0,
      0,
      255, //
      0,
      255,
      0,
      255, //
      0,
      0,
      255,
      255,
    ]);
  });

  it('rounds fractional channels', () => {
    const result = buildDiscreteRampPixels([[0.5, 0.5, 0.5]]);
    expect(Array.from(result.data)).toEqual([128, 128, 128, 255]);
  });
});

describe('sortManifestLods', () => {
  it('sorts LOD entries by numeric key regardless of insertion order', () => {
    const sorted = sortManifestLods(MANIFEST);
    expect(sorted.map(l => l.grid)).toEqual([
      [3, 2],
      [6, 4],
      [12, 10],
    ]);
  });
});

describe('dataBoundsFromManifest', () => {
  it('encodes bounds as [lonMin, latMax, lonMax, latMin] for u_data_bounds', () => {
    expect(dataBoundsFromManifest(MANIFEST.bounds)).toEqual([110, -10, 160, -45]);
  });
});

describe('computeUvTransform', () => {
  it('derives scale = chunkPx/storedPx and offset = padding/storedPx', () => {
    const { uvScale, uvOffset } = computeUvTransform(LOD_ENTRY);
    expect(uvScale[0]).toBeCloseTo(240 / 242, 10);
    expect(uvScale[1]).toBeCloseTo(192 / 194, 10);
    expect(uvOffset[0]).toBeCloseTo(1 / 242, 10);
    expect(uvOffset[1]).toBeCloseTo(1 / 194, 10);
  });
});

describe('buildLodGridsFlat', () => {
  it('packs [cols, rows] per LOD into a Float32Array padded to MAX_LODS*2', () => {
    const sorted = sortManifestLods(MANIFEST);
    const flat = buildLodGridsFlat(sorted);
    expect(flat.length).toBe(8); // MAX_LODS=4 × 2
    expect(Array.from(flat)).toEqual([3, 2, 6, 4, 12, 10, 0, 0]);
  });
});

describe('buildLodZoomThresholds', () => {
  it('returns -Infinity for LOD1 and the per-LOD threshold for LOD2+', () => {
    const lods: LodEntry[] = [
      { ...LOD_ENTRY, grid: [3, 2] },
      { ...LOD_ENTRY, grid: [6, 4], zoomThreshold: 5 },
      { ...LOD_ENTRY, grid: [12, 10], zoomThreshold: 7 },
    ];
    expect(buildLodZoomThresholds(lods)).toEqual([-Infinity, 5, 7]);
  });

  it('defaults missing LOD2+ thresholds to DEFAULT_ZOOM_THRESHOLD (6)', () => {
    const lods: LodEntry[] = [
      { ...LOD_ENTRY, grid: [3, 2] },
      { ...LOD_ENTRY, grid: [6, 4] },
    ];
    expect(buildLodZoomThresholds(lods)).toEqual([-Infinity, 6]);
  });
});

describe('computeActiveLodCount', () => {
  it('returns 1 at zooms below the LOD2 threshold (LOD1 only)', () => {
    expect(computeActiveLodCount(4, [-Infinity, 5, 7])).toBe(1);
    expect(computeActiveLodCount(5, [-Infinity, 5, 7])).toBe(1); // strict >, matching the scheduler
  });

  it('returns 2 between the LOD2 and LOD3 thresholds', () => {
    expect(computeActiveLodCount(6, [-Infinity, 5, 7])).toBe(2);
  });

  it('returns 3 once the LOD3 threshold is exceeded', () => {
    expect(computeActiveLodCount(8, [-Infinity, 5, 7])).toBe(3);
  });

  it('stops at the first inactive LOD so resident-but-stale finer LODs cannot leak through', () => {
    // LOD2 inactive (zoom ≤ 5) but LOD3's threshold is technically exceeded —
    // we still clamp to 1 so a leftover LOD2 chunk can't show as intermediate.
    expect(computeActiveLodCount(5, [-Infinity, 5, 4])).toBe(1);
  });
});

describe('lod1ChunkIds', () => {
  it('emits cols×rows ids in row-major (cy outer, cx inner) order', () => {
    const ids = lod1ChunkIds({ ...LOD_ENTRY, grid: [3, 2] });
    expect(ids).toEqual(['1/0/0', '1/1/0', '1/2/0', '1/0/1', '1/1/1', '1/2/1']);
  });

  it('returns an empty list for a 0×0 grid', () => {
    const ids = lod1ChunkIds({ ...LOD_ENTRY, grid: [0, 0] });
    expect(ids).toEqual([]);
  });
});

describe('mercatorBoundsArray', () => {
  it('encodes bounds as [nwX, seY, seX, nwY] in Mercator space', () => {
    const bounds = new mapboxgl.LngLatBounds([110, -45], [160, -10]);
    const result = mercatorBoundsArray(bounds);
    expect(result).toHaveLength(4);
    // Mercator projection of bounds — nwX should be west, seX east, etc.
    const nwM = mapboxgl.MercatorCoordinate.fromLngLat(bounds.getNorthWest());
    const seM = mapboxgl.MercatorCoordinate.fromLngLat(bounds.getSouthEast());
    expect(result).toEqual([nwM.x, seM.y, seM.x, nwM.y]);
  });
});

describe('preloadLod1 (progressive)', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({ close: () => {} }) as unknown as ImageBitmap),
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function makeAtlas(): { atlas: AtlasManagerAPI; uploads: string[] } {
    const uploads: string[] = [];
    const atlas: AtlasManagerAPI = {
      upload: vi.fn((id: string) => uploads.push(id)),
      has: vi.fn(() => false),
      touch: vi.fn(),
      getTexture: vi.fn(),
      getSlotsData: vi.fn(() => new Float32Array()),
      getChunkSlots: vi.fn(() => new Int32Array()),
      getLodOffsets: vi.fn(() => new Int32Array()),
      getLodCount: vi.fn(() => 1),
      getTotalSlots: vi.fn(() => 0),
      getTotalVirtualChunks: vi.fn(() => 0),
      getAtlasW: vi.fn(() => 0),
      getAtlasH: vi.fn(() => 0),
      destroy: vi.fn(),
    } as unknown as AtlasManagerAPI;
    return { atlas, uploads };
  }

  it('resolves immediately once the first tile uploads, rest continue in background', async () => {
    let resolveFirst!: () => void;
    const firstReady = new Promise<void>(r => (resolveFirst = r));

    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.endsWith('1/0/0.png')) {
          await firstReady;
        }
        return { ok: true, blob: async () => new Blob() } as Response;
      }),
    );

    const { atlas, uploads } = makeAtlas();
    const ids = ['1/0/0', '1/1/0', '1/2/0'];
    const promise = preloadLod1({
      tileBaseUrl: 'http://x',
      lod1Ids: ids,
      atlas,
      isStale: () => false,
    });

    // Wait a tick — the two non-first tiles should resolve and upload, settling the promise.
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    // First not yet resolved; the other two complete and one of them resolves the promise.
    await promise;
    expect(uploads.length).toBeGreaterThanOrEqual(1);

    // Let the first one finish too
    resolveFirst();
    await new Promise(r => setTimeout(r, 0));
    expect(uploads).toContain('1/0/0');
  });

  it('rejects only if every tile fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network');
      }),
    );

    const { atlas } = makeAtlas();
    await expect(
      preloadLod1({
        tileBaseUrl: 'http://x',
        lod1Ids: ['1/0/0', '1/1/0'],
        atlas,
        isStale: () => false,
      }),
    ).rejects.toThrow('All LOD1 tile fetches failed');
  });

  it('does not upload when isStale() flips true before upload', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, blob: async () => new Blob() }) as Response),
    );

    const { atlas, uploads } = makeAtlas();
    await preloadLod1({
      tileBaseUrl: 'http://x',
      lod1Ids: ['1/0/0'],
      atlas,
      isStale: () => true,
    });
    expect(uploads).toEqual([]);
  });

  it('resolves immediately with no ids', async () => {
    const { atlas, uploads } = makeAtlas();
    await preloadLod1({
      tileBaseUrl: 'http://x',
      lod1Ids: [],
      atlas,
      isStale: () => false,
    });
    expect(uploads).toEqual([]);
  });
});

describe('preloadAllLod1 (blocking)', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({ close: () => {} }) as unknown as ImageBitmap),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, blob: async () => new Blob() }) as Response),
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('only resolves after every tile is uploaded', async () => {
    const uploads: string[] = [];
    const atlas = {
      upload: vi.fn((id: string) => uploads.push(id)),
    } as unknown as AtlasManagerAPI;

    await preloadAllLod1({
      tileBaseUrl: 'http://x',
      lod1Ids: ['1/0/0', '1/1/0', '1/2/0'],
      atlas,
      isStale: () => false,
    });
    expect(uploads.sort()).toEqual(['1/0/0', '1/1/0', '1/2/0']);
  });

  it('skips upload when isStale() returns true', async () => {
    const uploads: string[] = [];
    const atlas = {
      upload: vi.fn((id: string) => uploads.push(id)),
    } as unknown as AtlasManagerAPI;

    await preloadAllLod1({
      tileBaseUrl: 'http://x',
      lod1Ids: ['1/0/0', '1/1/0'],
      atlas,
      isStale: () => true,
    });
    expect(uploads).toEqual([]);
  });
});

describe('syncSchedulersOnMove', () => {
  function makeScheduler(
    loaded: boolean,
  ): ChunkSchedulerAPI & { update: ReturnType<typeof vi.fn> } {
    return {
      update: vi.fn(),
      allVisibleLoaded: () => loaded,
      destroy: vi.fn(),
    } as ChunkSchedulerAPI & { update: ReturnType<typeof vi.fn> };
  }

  function makeLodController(): LODControllerAPI & { reset: ReturnType<typeof vi.fn> } {
    return {
      startBlendIn: vi.fn(),
      reset: vi.fn(),
      getValue: vi.fn(() => 0),
      isAnimating: vi.fn(() => false),
      destroy: vi.fn(),
    };
  }

  it('resets the LOD controller if any scheduler has unloaded visible chunks', () => {
    const bounds = new mapboxgl.LngLatBounds([110, -45], [160, -10]);
    const schedulers = [makeScheduler(true), makeScheduler(false)];
    const lodController = makeLodController();

    syncSchedulersOnMove({ bounds, zoom: 8, schedulers, lodController });

    expect(lodController.reset).toHaveBeenCalledTimes(1);
    for (const s of schedulers) {
      expect(s.update).toHaveBeenCalledWith({ west: 110, east: 160, south: -45, north: -10 }, 8);
    }
  });

  it('does not reset when every scheduler reports allVisibleLoaded', () => {
    const bounds = new mapboxgl.LngLatBounds([110, -45], [160, -10]);
    const schedulers = [makeScheduler(true), makeScheduler(true)];
    const lodController = makeLodController();

    syncSchedulersOnMove({ bounds, zoom: 8, schedulers, lodController });
    expect(lodController.reset).not.toHaveBeenCalled();
  });
});

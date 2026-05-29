import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MAX_LODS, createAtlasManager, parseChunkId } from './AtlasManager';

// ── Minimal WebGL2RenderingContext mock ─────────────────────────────────────
// AtlasManager only consumes a handful of WebGL methods: createTexture,
// bindTexture, texImage2D, texSubImage2D, texParameteri, deleteTexture, and
// getParameter for the two device limits. Everything else can be a no-op stub.

type GLMock = {
  gl: WebGL2RenderingContext;
  /** Records the (col, row) of every texSubImage2D upload converted back to slot coords. */
  uploads: Array<{ xOffset: number; yOffset: number }>;
  /** Records the filter mode passed to texParameteri for TEXTURE_MIN_FILTER. */
  filterMode: number | null;
  textureDeleted: boolean;
};

function makeGl(opts?: { maxTextureSize?: number; maxFragmentUniformComponents?: number }): GLMock {
  const uploads: GLMock['uploads'] = [];
  let filterMode: number | null = null;
  let textureDeleted = false;
  // Pick distinct sentinel constants so we can verify the right pair was used.
  const TEXTURE_MIN_FILTER = 0x2801;
  const TEXTURE_MAG_FILTER = 0x2800;
  const gl = {
    TEXTURE_2D: 0x0de1,
    RGBA: 0x1908,
    UNSIGNED_BYTE: 0x1401,
    NEAREST: 0x2600,
    LINEAR: 0x2601,
    TEXTURE_MIN_FILTER,
    TEXTURE_MAG_FILTER,
    TEXTURE_WRAP_S: 0x2802,
    TEXTURE_WRAP_T: 0x2803,
    CLAMP_TO_EDGE: 0x812f,
    MAX_TEXTURE_SIZE: 0x0d33,
    MAX_FRAGMENT_UNIFORM_COMPONENTS: 0x8b49,
    getParameter: vi.fn((p: number) => {
      if (p === 0x0d33) return opts?.maxTextureSize ?? 4096;
      if (p === 0x8b49) return opts?.maxFragmentUniformComponents ?? 4096;
      return 0;
    }),
    createTexture: vi.fn(() => ({}) as WebGLTexture),
    bindTexture: vi.fn(),
    texImage2D: vi.fn(),
    texSubImage2D: vi.fn((_target: number, _level: number, xOffset: number, yOffset: number) => {
      uploads.push({ xOffset, yOffset });
    }),
    texParameteri: vi.fn((_target: number, pname: number, value: number) => {
      if (pname === TEXTURE_MIN_FILTER) filterMode = value;
    }),
    deleteTexture: vi.fn(() => {
      textureDeleted = true;
    }),
  } as unknown as WebGL2RenderingContext;
  return {
    gl,
    uploads,
    get filterMode() {
      return filterMode;
    },
    get textureDeleted() {
      return textureDeleted;
    },
  };
}

const FAKE_IMG = {} as ImageBitmap;

describe('parseChunkId', () => {
  it('parses "{lod}/{cx}/{cy}" into numeric fields', () => {
    expect(parseChunkId('1/0/0')).toEqual({ lod: 1, cx: 0, cy: 0 });
    expect(parseChunkId('3/5/4')).toEqual({ lod: 3, cx: 5, cy: 4 });
  });
});

describe('createAtlasManager — sizing & uniforms', () => {
  it('auto-sizes the atlas to fit LOD1 + the largest on-demand LOD', () => {
    const { gl } = makeGl();
    const atlas = createAtlasManager(gl, {
      slotPx: [242, 194],
      lods: [{ grid: [3, 3] }, { grid: [6, 5] }, { grid: [12, 10] }],
    });
    // totalRequired = 9 + 120 = 129. README documents the expected atlas size 4096×2048,
    // 16 cols × 10 rows = 160 slots.
    expect(atlas.getAtlasW()).toBe(4096);
    expect(atlas.getAtlasH()).toBe(2048);
    expect(atlas.getTotalSlots()).toBe(160);
  });

  it('clamps to MAX_ATLAS_SIZE when the device limit is large', () => {
    const { gl } = makeGl({ maxTextureSize: 16384 });
    const atlas = createAtlasManager(gl, {
      slotPx: [242, 194],
      lods: [{ grid: [3, 3] }, { grid: [6, 5] }],
    });
    expect(atlas.getAtlasW()).toBeLessThanOrEqual(4096);
    expect(atlas.getAtlasH()).toBeLessThanOrEqual(4096);
  });

  it('totalVirtualChunks sums every LOD grid', () => {
    const { gl } = makeGl();
    const atlas = createAtlasManager(gl, {
      slotPx: [242, 194],
      lods: [{ grid: [3, 3] }, { grid: [6, 5] }, { grid: [12, 10] }],
    });
    expect(atlas.getTotalVirtualChunks()).toBe(9 + 30 + 120);
  });

  it('throws when the uniform component budget would be exceeded', () => {
    const { gl } = makeGl({ maxFragmentUniformComponents: 100 });
    expect(() =>
      createAtlasManager(gl, {
        slotPx: [242, 194],
        lods: [{ grid: [3, 3] }, { grid: [6, 5] }, { grid: [12, 10] }],
      }),
    ).toThrow(/Atlas too large/);
  });

  it('uploads use NEAREST filtering when configured', () => {
    const m = makeGl();
    createAtlasManager(m.gl, {
      slotPx: [242, 194],
      lods: [{ grid: [3, 3] }],
      filter: 'nearest',
    });
    expect(m.filterMode).toBe((m.gl as unknown as { NEAREST: number }).NEAREST);
  });

  it('uploads use LINEAR filtering by default', () => {
    const m = makeGl();
    createAtlasManager(m.gl, {
      slotPx: [242, 194],
      lods: [{ grid: [3, 3] }],
    });
    expect(m.filterMode).toBe((m.gl as unknown as { LINEAR: number }).LINEAR);
  });

  it('lodOffsets is padded to MAX_LODS and accumulates chunk counts', () => {
    const { gl } = makeGl();
    const atlas = createAtlasManager(gl, {
      slotPx: [242, 194],
      lods: [{ grid: [3, 3] }, { grid: [6, 5] }, { grid: [12, 10] }],
    });
    const offsets = Array.from(atlas.getLodOffsets());
    expect(offsets.length).toBe(MAX_LODS);
    expect(offsets.slice(0, 3)).toEqual([0, 9, 39]);
    expect(offsets[3]).toBe(0); // padding
  });

  it('getLodCount reflects the number of LODs supplied', () => {
    const { gl } = makeGl();
    const atlas = createAtlasManager(gl, {
      slotPx: [242, 194],
      lods: [{ grid: [3, 3] }, { grid: [6, 5] }],
    });
    expect(atlas.getLodCount()).toBe(2);
  });
});

describe('createAtlasManager — slots data', () => {
  it('emits one [uvOffsetX, uvOffsetY, uvScaleX, uvScaleY] tuple per physical slot', () => {
    const { gl } = makeGl();
    const atlas = createAtlasManager(gl, {
      slotPx: [242, 194],
      lods: [{ grid: [3, 3] }, { grid: [6, 5] }, { grid: [12, 10] }],
    });
    const data = atlas.getSlotsData();
    expect(data.length).toBe(atlas.getTotalSlots() * 4);

    // First slot starts at (0,0); scale is constant for every slot.
    const slotW = 242 / atlas.getAtlasW();
    const slotH = 194 / atlas.getAtlasH();
    expect(data[0]).toBe(0);
    expect(data[1]).toBe(0);
    expect(data[2]).toBeCloseTo(slotW, 10);
    expect(data[3]).toBeCloseTo(slotH, 10);
  });
});

describe('createAtlasManager — LOD1 dedicated slots', () => {
  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(1000);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('LOD1 uploads map virtual index directly to physical slot (no pool)', () => {
    const { gl } = makeGl();
    const atlas = createAtlasManager(gl, {
      slotPx: [242, 194],
      lods: [{ grid: [3, 3] }, { grid: [6, 5] }],
    });

    atlas.upload('1/0/0', FAKE_IMG);
    atlas.upload('1/1/0', FAKE_IMG);
    atlas.upload('1/2/2', FAKE_IMG);

    const cs = atlas.getChunkSlots();
    // virtual index = lodOffset[0] (=0) + cy * cols + cx
    expect(cs[0 + 0 * 3 + 0]).toBe(0); // (cx=0, cy=0)
    expect(cs[0 + 0 * 3 + 1]).toBe(1); // (cx=1, cy=0)
    expect(cs[0 + 2 * 3 + 2]).toBe(8); // (cx=2, cy=2)
  });

  it('LOD1 has() returns true after upload', () => {
    const { gl } = makeGl();
    const atlas = createAtlasManager(gl, {
      slotPx: [242, 194],
      lods: [{ grid: [3, 3] }, { grid: [6, 5] }],
    });
    atlas.upload('1/1/1', FAKE_IMG);
    expect(atlas.has('1/1/1')).toBe(true);
    expect(atlas.has('1/0/0')).toBe(false);
  });

  it('re-uploading an already-resident chunk is a no-op', () => {
    const m = makeGl();
    const atlas = createAtlasManager(m.gl, {
      slotPx: [242, 194],
      lods: [{ grid: [3, 3] }, { grid: [6, 5] }],
    });
    atlas.upload('1/0/0', FAKE_IMG);
    const beforeCount = m.uploads.length;
    atlas.upload('1/0/0', FAKE_IMG);
    expect(m.uploads.length).toBe(beforeCount);
  });
});

describe('createAtlasManager — LOD2+ pool & LRU', () => {
  let nowValue = 0;
  beforeEach(() => {
    nowValue = 1000;
    vi.spyOn(Date, 'now').mockImplementation(() => nowValue);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('LOD2 uploads consume the free pool, not LOD1 slots', () => {
    const { gl } = makeGl();
    const atlas = createAtlasManager(gl, {
      slotPx: [242, 194],
      lods: [{ grid: [3, 3] }, { grid: [6, 5] }],
    });

    const lod1Count = 9;
    atlas.upload('2/0/0', FAKE_IMG);
    const cs = atlas.getChunkSlots();
    // virtual index for LOD2 (0,0) = lodOffsets[1] (=9) + 0*6 + 0 = 9
    const physSlot = cs[9];
    expect(physSlot).toBeGreaterThanOrEqual(lod1Count);
  });

  it('LRU evicts the chunk whose last touch is oldest when pool fills up', () => {
    // Pool size = totalSlots - lod1Count. Force a tiny pool by constraining
    // device limits: a 1024×1024 atlas with 242×194 slots = 4×5 = 20 slots,
    // LOD1 (3×3 = 9) dedicates 9, leaving 11 in the pool.
    const { gl } = makeGl({ maxTextureSize: 1024 });
    const atlas = createAtlasManager(gl, {
      slotPx: [242, 194],
      lods: [{ grid: [3, 3] }, { grid: [12, 10] }],
    });

    const totalSlots = atlas.getTotalSlots();
    const poolSize = totalSlots - 9;
    expect(poolSize).toBeGreaterThan(0);

    // Fill pool fully, each upload at a distinct timestamp.
    for (let i = 0; i < poolSize; i++) {
      nowValue = 2000 + i;
      atlas.upload(`2/${i}/0`, FAKE_IMG);
    }
    expect(atlas.has('2/0/0')).toBe(true);

    // One more upload — LRU should evict the oldest (2/0/0).
    nowValue = 9000;
    atlas.upload(`2/${poolSize}/0`, FAKE_IMG);
    expect(atlas.has('2/0/0')).toBe(false);
    expect(atlas.has(`2/${poolSize}/0`)).toBe(true);

    // The virtual-index slot for the evicted chunk should now be -1
    const cs = atlas.getChunkSlots();
    const lodOffset = atlas.getLodOffsets()[1];
    expect(cs[lodOffset + 0]).toBe(-1);
  });

  it('touch() refreshes the LRU timestamp so a touched chunk survives the next eviction', () => {
    const { gl } = makeGl({ maxTextureSize: 1024 });
    const atlas = createAtlasManager(gl, {
      slotPx: [242, 194],
      lods: [{ grid: [3, 3] }, { grid: [12, 10] }],
    });

    const totalSlots = atlas.getTotalSlots();
    const poolSize = totalSlots - 9;

    for (let i = 0; i < poolSize; i++) {
      nowValue = 2000 + i;
      atlas.upload(`2/${i}/0`, FAKE_IMG);
    }

    // Touch the oldest, refreshing its timestamp past every other chunk.
    nowValue = 9000;
    atlas.touch('2/0/0');

    // Now upload one more — the new LRU victim is 2/1/0 (next-oldest), not 2/0/0.
    nowValue = 9500;
    atlas.upload(`2/${poolSize}/0`, FAKE_IMG);
    expect(atlas.has('2/0/0')).toBe(true);
    expect(atlas.has('2/1/0')).toBe(false);
  });

  it('touch() on a non-resident chunk is a no-op', () => {
    const { gl } = makeGl();
    const atlas = createAtlasManager(gl, {
      slotPx: [242, 194],
      lods: [{ grid: [3, 3] }, { grid: [6, 5] }],
    });
    expect(() => atlas.touch('2/0/0')).not.toThrow();
  });
});

describe('createAtlasManager — destroy', () => {
  it('clears chunkSlots and deletes the GPU texture', () => {
    const m = makeGl();
    const atlas = createAtlasManager(m.gl, {
      slotPx: [242, 194],
      lods: [{ grid: [3, 3] }, { grid: [6, 5] }],
    });
    atlas.upload('1/0/0', FAKE_IMG);
    atlas.upload('2/0/0', FAKE_IMG);

    atlas.destroy();
    expect(m.textureDeleted).toBe(true);

    const cs = atlas.getChunkSlots();
    for (let i = 0; i < cs.length; i++) expect(cs[i]).toBe(-1);
  });
});

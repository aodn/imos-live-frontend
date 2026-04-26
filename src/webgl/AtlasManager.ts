/**
 * AtlasManager
 *
 * Manages a WebGL texture that packs chunk PNGs into physical "slots".
 * Atlas dimensions are configurable per product via AtlasConfig (atlasW / atlasH).
 * Both current products pass explicit dimensions — heatmap (4096×2048) and particles
 * (2048×2048) — so FALLBACK_ATLAS_SIZE is a safety-net fallback for future products only.
 *
 * TWO GRIDS to keep straight:
 *   1. Chunk grid (cx, cy) — geographic subdivision from the manifest.
 *      Each chunk has a stable "virtual index": u_lod_offsets[lod] + cy*cols + cx.
 *   2. Atlas texture layout — physical slots packed in the configured texture:
 *      atlasCols = floor(atlasW / slotW),  atlasRows = floor(atlasH / slotH).
 *
 * SLOT STRATEGY:
 *   - LOD1 slots (0 … lod1Count−1): dedicated, always resident, never evicted.
 *     Physical slot == virtual index (formula-based, no indirection).
 *   - LOD2+ pool (lod1Count … totalSlots−1): dynamically assigned.
 *     Physical slot is chosen from a free pool at upload time.
 *     When the pool is full, LRU eviction reclaims the least-recently-visible slot.
 *
 * SHADER INTERFACE:
 *   u_slots[totalSlots]       — static UV layout per physical slot (never changes)
 *   u_chunk_slots[MAX_VIRTUAL] — virtual chunk index → physical slot index (−1 = not loaded)
 *
 * The shader computes: virtualIdx = u_lod_offsets[lodIdx] + cy*cols + cx
 *   then: physSlot = u_chunk_slots[virtualIdx]
 *   then: physSlot >= 0 → loaded; use u_slots[physSlot] for atlas UV.
 *
 * ChunkId convention: "{lod}_{cx}_{cy}"  e.g. "1_0_0", "2_3_2", "3_5_4"
 */

/** Fallback atlas dimension when a product omits atlasW/atlasH. Current products pass explicit values. */
export const FALLBACK_ATLAS_SIZE = 2048;

/** Maximum number of LODs the shader supports. Drives the GLSL array sizes. */
export const MAX_LODS = 4;

/**
 * Maximum number of virtual chunk indices across all LODs.
 * Covers up to: LOD1 (9) + LOD2 (30) + LOD3 (120) + LOD4 (480) = 639.
 * Set conservatively high; unused entries stay −1.
 */
export const MAX_VIRTUAL_CHUNKS = 256;

export type AtlasConfig = {
  /** Physical pixel size of each slot [width, height] — from manifest lods['1'].storedPx */
  slotPx: [number, number];
  /**
   * LOD configs ordered coarsest (LOD1) to finest.
   * Index 0 = LOD '1', index 1 = LOD '2', etc. Up to MAX_LODS entries.
   */
  lods: Array<{ grid: [number, number] }>;
  /** Atlas texture width in pixels. Defaults to FALLBACK_ATLAS_SIZE — prefer passing explicitly. */
  atlasW?: number;
  /** Atlas texture height in pixels. Defaults to FALLBACK_ATLAS_SIZE — prefer passing explicitly. */
  atlasH?: number;
};

export type AtlasManagerAPI = {
  upload: (chunkId: string, img: ImageBitmap) => void;
  /** Returns true if the chunk is currently resident in the atlas (not evicted). */
  has: (chunkId: string) => boolean;
  /** Update the LRU timestamp for a visible chunk. Call for every chunk in the viewport. */
  touch: (chunkId: string) => void;
  getTexture: () => WebGLTexture;
  getSlotsData: () => Float32Array;
  /** virtual chunk index → physical slot (−1 = not loaded). Pass to u_chunk_slots. */
  getChunkSlots: () => Int32Array;
  /** Per-LOD virtual offsets, padded to MAX_LODS, for u_lod_offsets shader uniform. */
  getLodOffsets: () => Int32Array;
  /** Number of active LODs, for u_lod_count shader uniform. */
  getLodCount: () => number;
  destroy: () => void;
};

export function parseChunkId(chunkId: string): { lod: number; cx: number; cy: number } {
  const [lod, cx, cy] = chunkId.split('_').map(Number);
  return { lod, cx, cy };
}

export function createAtlasManager(
  gl: WebGL2RenderingContext,
  config: AtlasConfig,
): AtlasManagerAPI {
  const [slotW, slotH] = config.slotPx;
  const atlasW = config.atlasW ?? FALLBACK_ATLAS_SIZE;
  const atlasH = config.atlasH ?? FALLBACK_ATLAS_SIZE;
  const maxTexSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
  if (atlasW > maxTexSize || atlasH > maxTexSize)
    throw new Error(
      `Atlas dimensions ${atlasW}×${atlasH} exceed device MAX_TEXTURE_SIZE of ${maxTexSize}`,
    );

  const atlasCols = Math.floor(atlasW / slotW);
  const atlasRows = Math.floor(atlasH / slotH);
  const totalSlots = atlasCols * atlasRows;

  const maxUniforms = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_COMPONENTS) as number;
  const uniformsUsed = totalSlots * 4 + MAX_VIRTUAL_CHUNKS + 30;
  if (uniformsUsed > maxUniforms)
    throw new Error(
      `Atlas too large: ${uniformsUsed} uniform components needed, device limit is ${maxUniforms}`,
    );

  // ── Virtual index offsets ──────────────────────────────────────────────────
  // rawOffsets[i] = cumulative chunk count before lods[i].
  // This is what the shader uses as u_lod_offsets.
  const rawOffsets: number[] = [];
  let cumulative = 0;
  for (const lod of config.lods) {
    rawOffsets.push(cumulative);
    cumulative += lod.grid[0] * lod.grid[1];
  }

  const lodOffsets = new Int32Array(MAX_LODS);
  rawOffsets.forEach((o, i) => (lodOffsets[i] = o));

  function virtualIndex(lod: number, cx: number, cy: number): number {
    const i = lod - 1; // lod is 1-based
    return rawOffsets[i] + cy * config.lods[i].grid[0] + cx;
  }

  // ── Physical slot layout ───────────────────────────────────────────────────
  // LOD1: slots 0 … lod1Count−1 (dedicated, formula-based).
  // Pool: slots lod1Count … totalSlots−1 (shared by LOD2+, LRU-managed).
  const lod1Count = config.lods[0].grid[0] * config.lods[0].grid[1];

  // ── Static UV data (never changes) ────────────────────────────────────────
  // Every four floats: [uvOffsetX, uvOffsetY, uvScaleX, uvScaleY] for one slot.
  const slotsData = new Float32Array(totalSlots * 4);
  for (let i = 0; i < totalSlots; i++) {
    const col = i % atlasCols;
    const row = Math.floor(i / atlasCols);
    const base = i * 4;
    slotsData[base] = (col * slotW) / atlasW;
    slotsData[base + 1] = (row * slotH) / atlasH;
    slotsData[base + 2] = slotW / atlasW;
    slotsData[base + 3] = slotH / atlasH;
  }

  // ── Dynamic chunk→slot mapping (the LRU data structure) ───────────────────
  // chunkSlots: virtualIdx → physicalSlot (−1 = not resident)
  const chunkSlots = new Int32Array(MAX_VIRTUAL_CHUNKS).fill(-1);

  // chunkToSlot / slotToChunk: bidirectional map for O(1) eviction lookup
  const chunkToSlot = new Map<string, number>(); // chunkId → physicalSlot
  const slotToChunk = new Map<number, string>(); // physicalSlot → chunkId

  // lastUsed: chunkId → timestamp (Date.now()). Only tracked for pool slots.
  const lastUsed = new Map<string, number>();

  // Free pool: physical slots available for new LOD2+ uploads.
  const freePool = new Set<number>();
  for (let i = lod1Count; i < totalSlots; i++) freePool.add(i);

  // ── WebGL texture ──────────────────────────────────────────────────────────
  const texture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, atlasW, atlasH, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.bindTexture(gl.TEXTURE_2D, null);

  // ── Private helpers ────────────────────────────────────────────────────────

  function writeToSlot(physSlot: number, img: ImageBitmap): void {
    const col = physSlot % atlasCols;
    const row = Math.floor(physSlot / atlasCols);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, col * slotW, row * slotH, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  /** Evict the least-recently-used pool slot and return its physical index. */
  function evictLRU(): number {
    let minTime = Infinity;
    let victim = '';
    for (const [id, t] of lastUsed) {
      if (t < minTime) {
        minTime = t;
        victim = id;
      }
    }
    const physSlot = chunkToSlot.get(victim)!;
    const virtIdx = virtualIndex(
      ...(Object.values(parseChunkId(victim)) as [number, number, number]),
    );
    chunkSlots[virtIdx] = -1;
    chunkToSlot.delete(victim);
    slotToChunk.delete(physSlot);
    lastUsed.delete(victim);
    return physSlot;
  }

  // ── Public API ────────────────────────────────────────────────────────────

  function upload(chunkId: string, img: ImageBitmap): void {
    if (chunkToSlot.has(chunkId)) return; // already resident

    const { lod, cx, cy } = parseChunkId(chunkId);
    const virtIdx = virtualIndex(lod, cx, cy);
    let physSlot: number;

    if (lod === 1) {
      // LOD1: dedicated slot, formula-based, always maps virtualIdx → physicalSlot directly.
      physSlot = virtIdx;
    } else {
      // LOD2+: dynamic pool with LRU eviction.
      if (freePool.size > 0) {
        physSlot = freePool.values().next().value!;
        freePool.delete(physSlot);
      } else {
        physSlot = evictLRU();
      }
      lastUsed.set(chunkId, Date.now());
      slotToChunk.set(physSlot, chunkId);
    }

    writeToSlot(physSlot, img);
    chunkSlots[virtIdx] = physSlot;
    chunkToSlot.set(chunkId, physSlot);
  }

  function has(chunkId: string): boolean {
    return chunkToSlot.has(chunkId);
  }

  function touch(chunkId: string): void {
    if (lastUsed.has(chunkId)) {
      lastUsed.set(chunkId, Date.now());
    }
  }

  function getTexture(): WebGLTexture {
    return texture;
  }

  /** Static — UV layout never changes. Pass to u_slots each frame. */
  function getSlotsData(): Float32Array {
    return slotsData;
  }

  /** Dynamic — updated on every upload/eviction. Pass to u_chunk_slots each frame. */
  function getChunkSlots(): Int32Array {
    return chunkSlots;
  }

  function getLodOffsets(): Int32Array {
    return lodOffsets;
  }

  function getLodCount(): number {
    return config.lods.length;
  }

  function destroy(): void {
    gl.deleteTexture(texture);
    chunkSlots.fill(-1);
    chunkToSlot.clear();
    slotToChunk.clear();
    lastUsed.clear();
    freePool.clear();
  }

  return {
    upload,
    has,
    touch,
    getTexture,
    getSlotsData,
    getChunkSlots,
    getLodOffsets,
    getLodCount,
    destroy,
  };
}

/**
 * AtlasManager
 *
 * Manages a WebGL texture that packs chunk PNGs into physical "slots".
 * Atlas dimensions are computed automatically from the manifest (slotPx × LOD grids):
 * the smallest power-of-2 W×H that fits all tiles, clamped to gl.MAX_TEXTURE_SIZE.
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
 *   u_slots[totalSlots]        — static UV layout per physical slot (never changes)
 *   u_chunk_slots[MAX_VIRTUAL] — virtual chunk index → physical slot index (−1 = not loaded)
 *
 * The shader computes: virtualIdx = u_lod_offsets[lodIdx] + cy*cols + cx
 *   then: physSlot = u_chunk_slots[virtualIdx]
 *   then: physSlot >= 0 → loaded; use u_slots[physSlot] for atlas UV.
 *
 * ChunkId convention: "{lod}_{cx}_{cy}"  e.g. "1_0_0", "2_3_2", "3_5_4"
 */

/** Maximum number of LODs the shader supports. Drives the GLSL array sizes. */
export const MAX_LODS = 4;

/**
 * Hard cap on atlas dimensions regardless of gl.MAX_TEXTURE_SIZE.
 * Keeps VRAM bounded at 4096×4096 × 4 bytes = 64 MB per atlas.
 * If totalRequired exceeds what this cap allows, the atlas is sized to the cap
 * and LRU eviction absorbs the overflow — rendering remains correct.
 */
export const MAX_ATLAS_SIZE = 4096;

export type AtlasConfig = {
  /** Physical pixel size of each slot [width, height] — from manifest lods['1'].storedPx */
  slotPx: [number, number];
  /**
   * LOD configs ordered coarsest (LOD1) to finest.
   * Index 0 = LOD '1', index 1 = LOD '2', etc. Up to MAX_LODS entries.
   */
  lods: Array<{ grid: [number, number] }>;
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
  /** Total physical slots in the atlas (atlasCols × atlasRows). Pass to shader factories. */
  getTotalSlots: () => number;
  /** Total virtual chunk indices across all LODs. Pass to shader factories. */
  getTotalVirtualChunks: () => number;
  /** Actual atlas width in pixels after auto-sizing and MAX_TEXTURE_SIZE clamping. */
  getAtlasW: () => number;
  /** Actual atlas height in pixels after auto-sizing and MAX_TEXTURE_SIZE clamping. */
  getAtlasH: () => number;
  destroy: () => void;
};

export function parseChunkId(chunkId: string): { lod: number; cx: number; cy: number } {
  const [lod, cx, cy] = chunkId.split('_').map(Number);
  return { lod, cx, cy };
}

/**
 * Find the smallest power-of-2 W×H atlas that fits `totalRequired` slots of size `slotPx`.
 * Prefers landscape (W ≥ H) when multiple options have equal total pixels.
 * Both dimensions are clamped to `maxTexSize`.
 */
function computeAtlasDimensions(
  slotPx: [number, number],
  totalRequired: number,
  maxTexSize: number,
): [number, number] {
  const [slotW, slotH] = slotPx;
  let best: [number, number] | null = null;

  for (let w = 512; w <= maxTexSize; w *= 2) {
    const cols = Math.floor(w / slotW);
    if (cols === 0) continue;
    const rowsNeeded = Math.ceil(totalRequired / cols);
    let h = 512;
    while (Math.floor(h / slotH) < rowsNeeded) {
      h *= 2;
      if (h > maxTexSize) break;
    }
    if (h > maxTexSize) continue;
    if (cols * Math.floor(h / slotH) < totalRequired) continue;

    if (
      best === null ||
      w * h < best[0] * best[1] ||
      (w * h === best[0] * best[1] && w >= h && best[0] < best[1])
    ) {
      best = [w, h];
    }
  }

  return best ?? [maxTexSize, maxTexSize];
}

export function createAtlasManager(
  gl: WebGL2RenderingContext,
  config: AtlasConfig,
): AtlasManagerAPI {
  const [slotW, slotH] = config.slotPx;
  const maxTexSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;

  // Target: LOD1 (dedicated, never evicted) + largest single on-demand LOD (eviction-free at
  // any one zoom level). If this doesn't fit within the cap, LRU handles the overflow.
  const lod1Count = config.lods[0].grid[0] * config.lods[0].grid[1];
  const maxOnDemandCount = config.lods
    .slice(1)
    .reduce((max, lod) => Math.max(max, lod.grid[0] * lod.grid[1]), 0);
  const totalRequired = lod1Count + maxOnDemandCount;

  const cap = Math.min(maxTexSize, MAX_ATLAS_SIZE);
  const [clampedAtlasW, clampedAtlasH] = computeAtlasDimensions(config.slotPx, totalRequired, cap);

  const atlasCols = Math.floor(clampedAtlasW / slotW);
  const atlasRows = Math.floor(clampedAtlasH / slotH);
  const totalSlots = atlasCols * atlasRows;

  const totalVirtualChunks = config.lods.reduce((sum, lod) => sum + lod.grid[0] * lod.grid[1], 0);

  const maxUniforms = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_COMPONENTS) as number;
  const uniformsUsed = totalSlots * 4 + totalVirtualChunks + 30;
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

  // ── Static UV data (never changes) ────────────────────────────────────────
  // Every four floats: [uvOffsetX, uvOffsetY, uvScaleX, uvScaleY] for one slot.
  const slotsData = new Float32Array(totalSlots * 4);
  for (let i = 0; i < totalSlots; i++) {
    const col = i % atlasCols;
    const row = Math.floor(i / atlasCols);
    const base = i * 4;
    slotsData[base] = (col * slotW) / clampedAtlasW;
    slotsData[base + 1] = (row * slotH) / clampedAtlasH;
    slotsData[base + 2] = slotW / clampedAtlasW;
    slotsData[base + 3] = slotH / clampedAtlasH;
  }

  // ── Dynamic chunk→slot mapping (the LRU data structure) ───────────────────
  // chunkSlots: virtualIdx → physicalSlot (−1 = not resident)
  const chunkSlots = new Int32Array(totalVirtualChunks).fill(-1);

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
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    clampedAtlasW,
    clampedAtlasH,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null,
  );
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

  function getTotalSlots(): number {
    return totalSlots;
  }

  function getTotalVirtualChunks(): number {
    return totalVirtualChunks;
  }

  function getAtlasW(): number {
    return clampedAtlasW;
  }

  function getAtlasH(): number {
    return clampedAtlasH;
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
    getTotalSlots,
    getTotalVirtualChunks,
    getAtlasW,
    getAtlasH,
    destroy,
  };
}

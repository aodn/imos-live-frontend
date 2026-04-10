/**
 * AtlasManager
 *
 * Manages a single 2048×2048 WebGL texture that stores all wind-field chunks
 * (LOD1 + LOD2) in a fixed grid of slots. Each slot holds one 242×194 chunk PNG
 * (240×192 data pixels + 1-px padding on each side).
 *
 * Slot assignment is formula-based so it matches the shader's O(1) lookup:
 *   LOD1 slot index = cy * 3 + cx          (range 0–8,  offset 0)
 *   LOD2 slot index = 9 + cy * 6 + cx      (range 9–38, offset 9)
 *
 * Atlas layout:
 *   2048 / 242 = 8 columns
 *   2048 / 194 = 10 rows
 *   Total 80 slots — slots 0–8 are LOD1 (resident), 9–38 are LOD2.
 *
 * ChunkId convention: "{lod}_{cx}_{cy}"  e.g. "1_0_0", "2_3_2"
 */

const ATLAS_W = 2048;
const ATLAS_H = 2048;
const SLOT_W = 242; // 240 data + 2 padding
const SLOT_H = 194; // 192 data + 2 padding
const ATLAS_COLS = Math.floor(ATLAS_W / SLOT_W); // 8
const TOTAL_SLOTS = 80;

const LOD1_GRID = { cols: 3, rows: 3, offset: 0 } as const;
const LOD2_GRID = { cols: 6, rows: 5, offset: 9 } as const;

// Pre-compute the UV offset/scale for every slot — these never change.
// u_slots[i] = [uvOffsetX, uvOffsetY, uvScaleX, uvScaleY]
function buildStaticSlotsData(): Float32Array {
  const data = new Float32Array(TOTAL_SLOTS * 4);
  for (let i = 0; i < TOTAL_SLOTS; i++) {
    const col = i % ATLAS_COLS;
    const row = Math.floor(i / ATLAS_COLS);
    const texX = col * SLOT_W;
    const texY = row * SLOT_H;
    const base = i * 4;
    data[base] = texX / ATLAS_W; // uvOffsetX
    data[base + 1] = texY / ATLAS_H; // uvOffsetY
    data[base + 2] = SLOT_W / ATLAS_W; // uvScaleX
    data[base + 3] = SLOT_H / ATLAS_H; // uvScaleY
  }
  return data;
}

export function chunkIdToSlotIndex(lod: 1 | 2, cx: number, cy: number): number {
  const grid = lod === 1 ? LOD1_GRID : LOD2_GRID;
  return grid.offset + cy * grid.cols + cx;
}

export function parseChunkId(chunkId: string): { lod: 1 | 2; cx: number; cy: number } {
  const parts = chunkId.split('_');
  const [lod, cx, cy] = parts.map(Number);
  return { lod: lod as 1 | 2, cx, cy };
}

export type AtlasManagerAPI = {
  upload: (chunkId: string, img: ImageBitmap) => void;
  has: (chunkId: string) => boolean;
  getTexture: () => WebGLTexture;
  getSlotsData: () => Float32Array;
  getLoadedData: () => Int32Array;
  destroy: () => void;
};

export function createAtlasManager(gl: WebGL2RenderingContext): AtlasManagerAPI {
  const uploaded = new Set<string>();

  // u_loaded: 1 = chunk has been uploaded to this slot, 0 = empty / not yet loaded
  const loadedData = new Int32Array(TOTAL_SLOTS);

  // u_slots: static UV layout — pre-computed once and reused every frame
  const slotsData = buildStaticSlotsData();

  // Allocate the atlas texture
  const texture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, ATLAS_W, ATLAS_H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.bindTexture(gl.TEXTURE_2D, null);

  function upload(chunkId: string, img: ImageBitmap): void {
    if (uploaded.has(chunkId)) return;

    const { lod, cx, cy } = parseChunkId(chunkId);
    const slotIdx = chunkIdToSlotIndex(lod, cx, cy);

    const col = slotIdx % ATLAS_COLS;
    const row = Math.floor(slotIdx / ATLAS_COLS);
    const texX = col * SLOT_W;
    const texY = row * SLOT_H;

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, texX, texY, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.bindTexture(gl.TEXTURE_2D, null);

    loadedData[slotIdx] = 1;
    uploaded.add(chunkId);
  }

  function has(chunkId: string): boolean {
    return uploaded.has(chunkId);
  }

  function getTexture(): WebGLTexture {
    return texture;
  }

  /** Static — UV layout never changes. Safe to pass directly to gl.uniform4fv each frame. */
  function getSlotsData(): Float32Array {
    return slotsData;
  }

  /** Dynamic — changes as chunks are uploaded. Pass to gl.uniform1iv each frame. */
  function getLoadedData(): Int32Array {
    return loadedData;
  }

  function destroy(): void {
    gl.deleteTexture(texture);
    uploaded.clear();
    loadedData.fill(0);
  }

  return { upload, has, getTexture, getSlotsData, getLoadedData, destroy };
}

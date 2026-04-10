# Ocean Current Field Atlas Rendering System — Implementation Plan

**Scope:** Australia region ocean current (GSLA) particle renderer  
**Goal:** Replace the single flat-texture approach with a chunked Atlas system to support LOD1/LOD2 zoom-level detail switching  
**PNG format:** Keep existing 8-bit encoding (R=U, G=V, B=ocean mask, A=255)

---

## Background

### Current Architecture

`VectorField.js` renders particles by:

1. Taking a single PNG (`gsla_input.png`) as `u_image` — full-region, single resolution
2. Converting particle positions (Mercator [0,1]) → lon/lat → texture UV via `u_data_bounds`
3. Sampling R/G channels from that texture for velocity in both `vectorFs` (draw) and `vectorFsUpdate` (position update)

The shaders in `src/utils/shader.js` hard-code this single-texture model via `u_vector` + `lookup_vector()`.

### What Changes

The Atlas system replaces `u_vector` (one texture) with `u_atlas` (one 2048×2048 texture containing up to 80 chunk slots). The shaders learn to:

- Compute which chunk slot a world coordinate falls in (O(1), no loops)
- Map world coordinates to the correct sub-region of the atlas UV space

The Python script gains chunking logic to slice the full grid into per-LOD PNG files.

---

## Region & LOD Parameters

| Parameter       | Value                                                            |
| --------------- | ---------------------------------------------------------------- |
| Longitude range | 89.9°E → 180.1°E (90°)                                           |
| Latitude range  | 61°S → 10.1°N (71°)                                              |
| Zoom range      | 3–8 (min zoom = 3, already matches `INITIAL_ZOOM` in `map.ts`)   |
| LOD1 trigger    | zoom 3–6                                                         |
| LOD2 trigger    | zoom > 6 (matches `MAX_ZOOM = CLUSTER_MAX_ZOOM = 7` in `map.ts`) |

| LOD  | Grid | Chunks | Chunk size                                | Strategy                            |
| ---- | ---- | ------ | ----------------------------------------- | ----------------------------------- |
| LOD1 | 3×3  | 9      | 240×192 px + 1px padding → 242×194 stored | Preloaded at startup, never evicted |
| LOD2 | 6×5  | 30     | 240×192 px + 1px padding → 242×194 stored | Dynamic LRU, loaded on demand       |

**Atlas:** 2048×2048, slot size 242×194, layout 8 cols × 10 rows = 80 slots

- Slots 0–8: LOD1 (resident)
- Slots 9–79: LOD2 (LRU-managed, 71 available)

---

## Files to Touch

### New files to create

```
src/layers/OceanCurrentAtlasField.ts          # replaces VectorField.js for wind atlas rendering
src/utils/AtlasManager.ts             # 2048² texture + slot allocation + LRU
src/utils/ChunkScheduler.ts           # LOD2 priority queue + fetch orchestration
src/utils/LODController.ts            # zoom-driven LOD blend animation
src/utils/oceanCurrentShader.ts               # new shaders (atlas-aware vectorFs + vectorFsUpdate)
```

### Files to modify

```
script/gsla.py                        # add chunk generation (to_chunk_png)
src/utils/shader.js                   # no change — existing shaders stay for non-atlas use
src/hooks/layers/useParticleLayer.ts  # wire up OceanCurrentAtlasField instead of image source
src/constants/product.ts              # update sourceId/layerId if needed
```

---

## Phase 1 — Python Chunking

**Goal:** Backend generates per-LOD chunk PNGs with correct encoding.

### Changes to `script/gsla.py`

Add `to_chunk_png()` alongside the existing `to_png_input()`. Keep `to_png_input()` unchanged so non-atlas products are unaffected.

```python
REGION = {
    'lon_min': 89.9, 'lon_max': 180.1,
    'lat_min': -61.0, 'lat_max': 10.1,
}

LOD_GRIDS = {
    1: (3, 3),   # 9 chunks
    2: (6, 5),   # 30 chunks
}

CHUNK_PX = (240, 192)   # data pixels per chunk (before padding)
PADDING  = 1             # 1-pixel border on each side → stored as 242×194


def to_chunk_png(dataset_in, base_dir, lod):
    """
    Slice the full-region U/V grid into chunk PNGs for the given LOD level.
    Output path: {base_dir}/wind/{lod}/{cx}/{cy}.png
    Encoding: R=U (8-bit norm), G=V (8-bit norm), B=ocean_mask, A=255
    Matches the existing to_png_input() channel layout.
    """
    grid_cols, grid_rows = LOD_GRIDS[lod]

    # Resample the dataset to the target LOD resolution
    total_w = grid_cols * CHUNK_PX[0]   # e.g. LOD1: 720, LOD2: 1440
    total_h = grid_rows * CHUNK_PX[1]   # e.g. LOD1: 576, LOD2: 1152

    ds = dataset_in.interp(
        LONGITUDE=np.linspace(REGION['lon_min'], REGION['lon_max'], total_w),
        LATITUDE=np.linspace(REGION['lat_max'], REGION['lat_min'], total_h),  # north→south
    )

    u_raw = ds.UCUR.fillna(0.).values
    v_raw = ds.VCUR.fillna(0.).values
    mask  = (~ds.UCUR.isnull()).values.astype(np.uint8)  # 1 = ocean, 0 = land/NaN

    u_min, u_max = dataset_in.UCUR.min().item(), dataset_in.UCUR.max().item()
    v_min, v_max = dataset_in.VCUR.min().item(), dataset_in.VCUR.max().item()

    u_norm = np.clip((u_raw - u_min) / (u_max - u_min) * 255, 0, 255).astype(np.uint8)
    v_norm = np.clip((v_raw - v_min) / (v_max - v_min) * 255, 0, 255).astype(np.uint8)

    for cy in range(grid_rows):
        for cx in range(grid_cols):
            # Pixel slice for this chunk (with 1-px padding, clamped to edges)
            row_s = max(cy * CHUNK_PX[1] - PADDING, 0)
            row_e = min((cy + 1) * CHUNK_PX[1] + PADDING, total_h)
            col_s = max(cx * CHUNK_PX[0] - PADDING, 0)
            col_e = min((cx + 1) * CHUNK_PX[0] + PADDING, total_w)

            chunk_u = u_norm[row_s:row_e, col_s:col_e]
            chunk_v = v_norm[row_s:row_e, col_s:col_e]
            chunk_m = mask[row_s:row_e, col_s:col_e]

            h, w = chunk_u.shape
            img_array = np.zeros((h, w, 4), dtype=np.uint8)
            img_array[:, :, 0] = chunk_u        # R = U
            img_array[:, :, 1] = chunk_v        # G = V
            img_array[:, :, 2] = chunk_m * 255  # B = ocean mask
            img_array[:, :, 3] = 255            # A = always opaque

            out_path = base_dir / "wind" / str(lod) / str(cx) / f"{cy}.png"
            out_path.parent.mkdir(parents=True, exist_ok=True)
            Image.fromarray(img_array, 'RGBA').save(out_path, optimize=False)


def to_manifest(dataset_in, base_dir):
    """Write manifest.json consumed by the frontend at startup."""
    u_min = dataset_in.UCUR.min().item()
    u_max = dataset_in.UCUR.max().item()
    v_min = dataset_in.VCUR.min().item()
    v_max = dataset_in.VCUR.max().item()

    manifest = {
        "bounds": REGION,
        "uRange": [u_min, u_max],
        "vRange": [v_min, v_max],
        "lods": {
            "1": {"grid": list(LOD_GRIDS[1]), "chunkPx": list(CHUNK_PX), "padding": PADDING},
            "2": {"grid": list(LOD_GRIDS[2]), "chunkPx": list(CHUNK_PX), "padding": PADDING},
        },
    }
    with open(base_dir / "wind" / "manifest.json", "w") as f:
        json.dump(manifest, f, indent=2)
```

Update `create_gsla_data_for_date` to call both new functions:

```python
def create_gsla_data_for_date(date, base_dir):
    dataset = get_dataset(date)
    save_dir = base_dir / date.strftime("%y-%m-%d")
    save_dir.mkdir(parents=True, exist_ok=True)

    # Existing outputs (unchanged)
    to_overlay_input(dataset, save_dir / "gsla_overlay_input.png")
    to_png_input(dataset, save_dir / "gsla_input.png")
    to_json_meta(dataset, save_dir / "gsla_meta.json")

    # New atlas outputs
    to_chunk_png(dataset, save_dir, lod=1)
    to_chunk_png(dataset, save_dir, lod=2)
    to_manifest(dataset, save_dir)
```

**URL structure:**

```
/wind/{lod}/{cx}/{cy}.png     → e.g. /wind/1/0/0.png, /wind/2/3/2.png
/wind/manifest.json
```

**Verify:** After running, LOD1 should produce exactly 9 PNGs (cx 0–2, cy 0–2), each 242×194 px.

---

## Phase 2 — AtlasManager

**File:** `src/utils/AtlasManager.ts`

Manages a single `TEXTURE_2D` of size 2048×2048. LOD1 slots (0–8) are fixed; LOD2 slots (9–79) are LRU-managed.

```typescript
type Slot = {
  index: number;
  texX: number;
  texY: number;
  uvOffset: [number, number];
  uvScale: [number, number];
};

const ATLAS_W = 2048;
const ATLAS_H = 2048;
const SLOT_W = 242; // 240 data + 2 padding
const SLOT_H = 194; // 192 data + 2 padding
const ATLAS_COLS = Math.floor(ATLAS_W / SLOT_W); // 8
const ATLAS_ROWS = Math.floor(ATLAS_H / SLOT_H); // 10
const TOTAL_SLOTS = ATLAS_COLS * ATLAS_ROWS; // 80
const LOD1_COUNT = 9;

export class AtlasManager {
  private texture: WebGLTexture;
  private allocated = new Map<string, Slot>(); // chunkId → slot
  private lruOrder: string[] = []; // LOD2 LRU chain (front = most recent)
  private freePool: number[] = []; // available LOD2 slot indices

  constructor(private gl: WebGL2RenderingContext) {
    // Allocate the atlas texture once
    this.texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, ATLAS_W, ATLAS_H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // LOD2 slots go into the free pool (indices 9–79)
    for (let i = LOD1_COUNT; i < TOTAL_SLOTS; i++) this.freePool.push(i);
  }

  upload(chunkId: string, img: ImageBitmap, isLOD1 = false): Slot {
    const existing = this.allocated.get(chunkId);
    if (existing) {
      if (!isLOD1) this.touch(chunkId);
      return existing;
    }

    const slotIdx = isLOD1 ? this.nextLOD1Slot() : this.acquireLOD2Slot();
    const slot = this.indexToSlot(slotIdx);

    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.texSubImage2D(
      this.gl.TEXTURE_2D,
      0,
      slot.texX,
      slot.texY,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      img,
    );

    this.allocated.set(chunkId, slot);
    if (!isLOD1) this.lruOrder.unshift(chunkId);
    return slot;
  }

  has(chunkId: string): boolean {
    return this.allocated.has(chunkId);
  }

  get(chunkId: string): Slot | undefined {
    return this.allocated.get(chunkId);
  }

  touch(chunkId: string) {
    const idx = this.lruOrder.indexOf(chunkId);
    if (idx > 0) {
      this.lruOrder.splice(idx, 1);
      this.lruOrder.unshift(chunkId);
    }
  }

  getTexture(): WebGLTexture {
    return this.texture;
  }

  /** Returns a flat Float32Array of [uvOffsetX, uvOffsetY, uvScaleX, uvScaleY] × 80 slots. */
  buildSlotsUniform(): Float32Array {
    const data = new Float32Array(TOTAL_SLOTS * 4);
    this.allocated.forEach(slot => {
      const base = slot.index * 4;
      data[base] = slot.uvOffset[0];
      data[base + 1] = slot.uvOffset[1];
      data[base + 2] = slot.uvScale[0];
      data[base + 3] = slot.uvScale[1];
    });
    return data;
  }

  /** Returns a flat Int32Array of 0/1 per slot (for u_loaded uniform). */
  buildLoadedUniform(): Int32Array {
    const data = new Int32Array(TOTAL_SLOTS);
    this.allocated.forEach(slot => {
      data[slot.index] = 1;
    });
    return data;
  }

  private lod1Counter = 0;
  private nextLOD1Slot(): number {
    if (this.lod1Counter >= LOD1_COUNT) throw new Error('LOD1 slots exhausted');
    return this.lod1Counter++;
  }

  private acquireLOD2Slot(): number {
    if (this.freePool.length > 0) return this.freePool.pop()!;
    // LRU eviction
    const evictId = this.lruOrder.pop()!;
    const evicted = this.allocated.get(evictId)!;
    this.allocated.delete(evictId);
    return evicted.index;
  }

  private indexToSlot(i: number): Slot {
    const col = i % ATLAS_COLS;
    const row = Math.floor(i / ATLAS_COLS);
    const texX = col * SLOT_W;
    const texY = row * SLOT_H;
    return {
      index: i,
      texX,
      texY,
      uvOffset: [texX / ATLAS_W, texY / ATLAS_H],
      uvScale: [SLOT_W / ATLAS_W, SLOT_H / ATLAS_H],
    };
  }
}
```

**Note on premultiplied alpha:** Since A=255 always in the current PNG format, premultiplication is a no-op (RGB × 1 = RGB). Still pass `{ premultiplyAlpha: 'none' }` to `createImageBitmap` as defensive practice.

---

## Phase 3 — ChunkScheduler

**File:** `src/utils/ChunkScheduler.ts`

Manages LOD2 fetch queue. LOD1 is preloaded at startup by `OceanCurrentAtlasField` directly — the scheduler only handles LOD2.

```typescript
type Bounds = { west: number; east: number; south: number; north: number };

type ChunkId = string; // "{lod}/{cx}/{cy}"

type QueueEntry = { id: ChunkId; priority: number };

export class ChunkScheduler {
  private CONCURRENCY = 6;
  private inflight = 0;
  private queue: QueueEntry[] = [];
  private loading = new Set<ChunkId>();
  private abortControllers = new Map<ChunkId, AbortController>();

  constructor(
    private atlas: AtlasManager,
    private baseUrl: string, // e.g. "/wind/2026-04-10"
    private onChunkLoaded: (id: ChunkId) => void,
  ) {}

  update(viewport: Bounds, zoom: number) {
    if (zoom <= 6) {
      this.cancelAll();
      return;
    }

    const visible = this.chunksInBounds(viewport, false);
    const buffered = this.chunksInBounds(this.expandBounds(viewport, 1), false);

    // Cancel inflight requests no longer needed
    const needed = new Set([...visible, ...buffered]);
    this.abortControllers.forEach((ctrl, id) => {
      if (!needed.has(id)) {
        ctrl.abort();
        this.abortControllers.delete(id);
        this.loading.delete(id);
        this.inflight--;
      }
    });

    // Rebuild priority queue (viewport = 0, buffer ring = 1)
    this.queue = [
      ...visible
        .filter(id => !this.atlas.has(id) && !this.loading.has(id))
        .map(id => ({ id, priority: 0 })),
      ...buffered
        .filter(id => !visible.includes(id) && !this.atlas.has(id) && !this.loading.has(id))
        .map(id => ({ id, priority: 1 })),
    ];

    // Update LRU for visible chunks that are already loaded
    visible.filter(id => this.atlas.has(id)).forEach(id => this.atlas.touch(id));

    this.drain();
  }

  private async drain() {
    while (this.inflight < this.CONCURRENCY && this.queue.length > 0) {
      this.queue.sort((a, b) => a.priority - b.priority);
      const { id } = this.queue.shift()!;
      if (this.loading.has(id) || this.atlas.has(id)) continue;

      const ctrl = new AbortController();
      this.abortControllers.set(id, ctrl);
      this.loading.add(id);
      this.inflight++;

      try {
        const resp = await fetch(`${this.baseUrl}/${id}.png`, { signal: ctrl.signal });
        const blob = await resp.blob();
        const img = await createImageBitmap(blob, { premultiplyAlpha: 'none' });
        this.atlas.upload(id, img, false);
        this.onChunkLoaded(id);
      } catch (e) {
        if ((e as Error).name !== 'AbortError') console.warn('Chunk load failed:', id, e);
      } finally {
        this.loading.delete(id);
        this.abortControllers.delete(id);
        this.inflight--;
        this.drain();
      }
    }
  }

  private cancelAll() {
    this.abortControllers.forEach(ctrl => ctrl.abort());
    this.abortControllers.clear();
    this.loading.clear();
    this.inflight = 0;
    this.queue = [];
  }

  /** Returns LOD2 chunk IDs that intersect the given bounds. */
  private chunksInBounds(bounds: Bounds, _lod1: boolean): ChunkId[] {
    const COLS = 6,
      ROWS = 5;
    const LON_MIN = 89.9,
      LON_MAX = 180.1;
    const LAT_MIN = -61.0,
      LAT_MAX = 10.1;
    const chunkLon = (LON_MAX - LON_MIN) / COLS;
    const chunkLat = (LAT_MAX - LAT_MIN) / ROWS;

    const cxMin = Math.max(0, Math.floor((bounds.west - LON_MIN) / chunkLon));
    const cxMax = Math.min(COLS - 1, Math.floor((bounds.east - LON_MIN) / chunkLon));
    const cyMin = Math.max(0, Math.floor((LAT_MAX - bounds.north) / chunkLat));
    const cyMax = Math.min(ROWS - 1, Math.floor((LAT_MAX - bounds.south) / chunkLat));

    const ids: ChunkId[] = [];
    for (let cy = cyMin; cy <= cyMax; cy++)
      for (let cx = cxMin; cx <= cxMax; cx++) ids.push(`2/${cx}/${cy}`);
    return ids;
  }

  private expandBounds(b: Bounds, degLon: number): Bounds {
    const degLat = degLon * (71 / 90); // maintain aspect ratio
    return {
      west: b.west - degLon,
      east: b.east + degLon,
      south: b.south - degLat,
      north: b.north + degLat,
    };
  }
}
```

---

## Phase 4 — New Shaders

**File:** `src/utils/oceanCurrentShader.ts`

The key change: replace `u_vector` + `u_data_bounds`-based UV lookup with `u_atlas` + atlas slot lookup. The `lookup_vector()` bilinear filter is preserved but re-expressed in atlas UV space.

The existing `vectorVs`, `vectorVsQuad`, `vectorFsScreen` are **unchanged** — copy them directly.

### `windFsAtlas` (replaces `vectorFs`)

```glsl
#version 300 es
precision highp float;

uniform sampler2D u_vector;         // now bound to atlas texture
uniform vec2 u_vector_res;          // LOD resolution for bilinear filter (e.g. 720×576 for LOD1)
uniform vec2 u_vector_min;
uniform vec2 u_vector_max;
uniform sampler2D u_color_ramp;
uniform float u_max_speed;

uniform vec4 u_bounds;              // map viewport (Mercator)
uniform vec4 u_data_bounds;         // region bounds [lonMin, latMax, lonMax, latMin]

// Atlas uniforms
uniform vec4 u_slots[80];           // [uvOffsetX, uvOffsetY, uvScaleX, uvScaleY]
uniform int  u_loaded[80];          // 1 = slot has data
uniform vec2 u_lod1_grid;           // (3.0, 3.0)
uniform vec2 u_lod2_grid;           // (6.0, 5.0)
uniform float u_lod_blend;          // 0 = LOD1, 1 = LOD2

in vec2 v_particle_pos;
out vec4 fragColor;

// Convert world lon/lat → atlas UV for a given LOD's chunk grid
// slotOffset: 0 for LOD1, 9 for LOD2
vec2 worldToAtlasUV(vec2 lonlat, vec2 grid, int slotOffset) {
  vec2 regionMin = vec2(u_data_bounds.x, u_data_bounds.w);  // [lonMin, latMin]
  vec2 regionMax = vec2(u_data_bounds.z, u_data_bounds.y);  // [lonMax, latMax]
  vec2 regionSize = regionMax - regionMin;
  vec2 chunkSize  = regionSize / grid;

  // Which chunk does this point fall in?
  vec2 gc = floor((lonlat - regionMin) / chunkSize);
  gc = clamp(gc, vec2(0.0), grid - 1.0);
  int slotIdx = slotOffset + int(gc.y) * int(grid.x) + int(gc.x);

  // Local UV within the chunk [0,1]
  vec2 chunkOrigin = gc * chunkSize + regionMin;
  vec2 localUV = (lonlat - chunkOrigin) / chunkSize;

  // Padding correction: valid data occupies [1/242, 241/242] × [1/194, 193/194]
  localUV.x = localUV.x * (240.0 / 242.0) + (1.0 / 242.0);
  localUV.y = localUV.y * (192.0 / 194.0) + (1.0 / 194.0);

  vec4 slot = u_slots[slotIdx];
  return slot.xy + localUV * slot.zw;
}

vec2 lookup_vector_atlas(vec2 lonlat, vec2 grid, int slotOffset) {
  vec2 uv = worldToAtlasUV(lonlat, grid, slotOffset);
  // Manual bilinear filter in atlas UV space
  // pixel size in atlas UV = 1/2048
  vec2 px = vec2(1.0 / 2048.0);
  vec2 vc = (floor(uv * 2048.0)) * px;
  vec2 f  = fract(uv * 2048.0);
  vec2 tl = texture(u_vector, vc).rg;
  vec2 tr = texture(u_vector, vc + vec2(px.x, 0.0)).rg;
  vec2 bl = texture(u_vector, vc + vec2(0.0, px.y)).rg;
  vec2 br = texture(u_vector, vc + px).rg;
  return mix(mix(tl, tr, f.x), mix(bl, br, f.x), f.y);
}

// Keep existing Mercator → lon/lat function unchanged
vec2 returnLonLat(float x_domain, float y_domain, vec2 pos) {
  float mercator_x = fract(u_bounds.x + pos.x * x_domain);
  float mercator_y = u_bounds.w + pos.y * y_domain;
  float lon = mercator_x * 360.0 - 180.0;
  float lat2 = 180.0 - mercator_y * 360.0;
  float lat = 360.0 / 3.141592654 * atan(exp(lat2 * 3.141592654 / 180.0)) - 90.0;
  return vec2(lon, lat);
}

void main() {
  float x_domain = abs(u_bounds.x - u_bounds.z);
  float y_domain = abs(u_bounds.y - u_bounds.w);
  vec2 lonlat = returnLonLat(x_domain, y_domain, v_particle_pos);
  float lon = lonlat.x, lat = lonlat.y;

  // Discard if outside data region
  if (lat > u_data_bounds.y || lat < u_data_bounds.w ||
      lon > u_data_bounds.z || lon < u_data_bounds.x) {
    discard;
  }

  // Ocean mask: check LOD1 B channel (always loaded)
  vec2 uv1 = worldToAtlasUV(lonlat, u_lod1_grid, 0);
  if (texture(u_vector, uv1).b < 0.99) discard;

  // Sample velocity from LOD1 (always available)
  vec2 raw1   = lookup_vector_atlas(lonlat, u_lod1_grid, 0);
  vec2 wind1  = mix(u_vector_min, u_vector_max, raw1);

  // Sample LOD2 if loaded, else fall back to LOD1
  int lod2Cx  = clamp(int((lon - u_data_bounds.x) / ((u_data_bounds.z - u_data_bounds.x) / u_lod2_grid.x)), 0, int(u_lod2_grid.x) - 1);
  int lod2Cy  = clamp(int((lat - u_data_bounds.w) / ((u_data_bounds.y - u_data_bounds.w) / u_lod2_grid.y)), 0, int(u_lod2_grid.y) - 1);
  int lod2Idx = 9 + lod2Cy * int(u_lod2_grid.x) + lod2Cx;
  bool has2   = u_loaded[lod2Idx] == 1;

  vec2 wind2 = has2
    ? mix(u_vector_min, u_vector_max, lookup_vector_atlas(lonlat, u_lod2_grid, 9))
    : wind1;

  vec2 velocity = mix(wind1, wind2, has2 ? u_lod_blend : 0.0);

  float max_speed = (u_max_speed > 0.0) ? u_max_speed : length(u_vector_max);
  float speed_t = length(velocity) / max_speed;

  vec2 ramp_pos = vec2(fract(16.0 * speed_t), floor(16.0 * speed_t) / 16.0);
  fragColor = texture(u_color_ramp, ramp_pos);
}
```

### `oceanCurrentFsUpdateAtlas` (replaces `vectorFsUpdate`)

Same atlas UV approach for the position-update shader. Replace the `lookup_vector()` + `pos_lookup` block with:

```glsl
// ...same uniforms as windFsAtlas plus u_rand_seed, u_speed_factor, u_drop_rate, u_drop_rate_bump...

void main() {
  vec2 pos = texture(u_particles, v_tex_pos).rg;

  float x_domain = abs(u_bounds.x - u_bounds.z);
  float y_domain = abs(u_bounds.y - u_bounds.w);
  vec2 lonlat = returnLonLat(x_domain, y_domain, pos);
  float lon = lonlat.x, lat = lonlat.y;

  float lon_domain = u_data_bounds.z - u_data_bounds.x;
  float lat_domain = u_data_bounds.w - u_data_bounds.y; // note: y=latMax, w=latMin

  // Out-of-bounds particles get random reset below via drop logic
  vec2 raw1  = lookup_vector_atlas(lonlat, u_lod1_grid, 0);
  vec2 wind1 = mix(u_vector_min, u_vector_max, raw1);

  // (LOD2 blend omitted in update shader for simplicity — position update uses LOD1,
  //  only the visual draw shader uses LOD2 blend. Acceptable because position update
  //  runs at pixel-texture resolution, not per-rendered-particle.)

  vec2 velocity = wind1;
  float speed_t = length(velocity) / length(u_vector_max);

  vec2 offset = vec2(velocity.x, -velocity.y) * 0.0001 * u_speed_factor;
  pos = fract(1.0 + pos + offset);

  vec2 seed = (pos + v_tex_pos) * u_rand_seed;
  float drop_rate = u_drop_rate + speed_t * u_drop_rate_bump;
  float drop = step(1.0 - drop_rate, rand(seed));
  vec2 random_pos = vec2(rand(seed + 1.3), rand(seed + 2.1));
  pos = mix(pos, random_pos, drop);

  fragColor = vec4(pos, 0.0, 1.0);
}
```

---

## Phase 5 — OceanCurrentAtlasField

**File:** `src/layers/OceanCurrentAtlasField.ts`

This is the orchestrator — mirrors `VectorField.js` structure but wires in `AtlasManager`, `ChunkScheduler`, and the new shaders.

Key responsibilities:

- On `setData()`: fetch manifest, preload LOD1 (9 chunks), initialize atlas
- On each `draw()` / `updateParticles()`: upload `u_slots` and `u_loaded` uniform arrays
- On map move/zoom: call `scheduler.update(viewport, zoom)`
- Expose `updateConfig()` compatible with existing `particleConfig`

```typescript
export function OceanCurrentAtlasField(map: mapboxgl.Map, gl: WebGL2RenderingContext) {
  const atlas = new AtlasManager(gl);
  let scheduler: ChunkScheduler | null = null;
  let lodController: LODController | null = null;

  // Particle ping-pong, screen textures, framebuffer — same as VectorField.js
  // ...

  async function setData(baseUrl: string) {
    const manifest = await fetch(`${baseUrl}/manifest.json`).then(r => r.json());
    // store uRange, vRange, bounds from manifest

    // Preload LOD1: 9 chunks in parallel
    const lod1Ids = Array.from({ length: 3 }, (_, cy) =>
      Array.from({ length: 3 }, (_, cx) => `1/${cx}/${cy}`),
    ).flat();

    await Promise.all(
      lod1Ids.map(async id => {
        const img = await createImageBitmap(
          await fetch(`${baseUrl}/${id}.png`).then(r => r.blob()),
          { premultiplyAlpha: 'none' },
        );
        atlas.upload(id, img, true);
      }),
    );

    scheduler = new ChunkScheduler(atlas, baseUrl, id => {
      lodController?.onChunkLoaded(id);
    });

    lodController = new LODController(gl, scheduler);
    initialize();
  }

  function draw() {
    // Pass atlas texture + u_slots + u_loaded to both shaders each frame
    const slotsData = atlas.buildSlotsUniform();
    const loadedData = atlas.buildLoadedUniform();
    // gl.uniform4fv(u_slots_loc, slotsData);
    // gl.uniform1iv(u_loaded_loc, loadedData);
    // ...existing drawScreen / updateParticles flow...

    // Update scheduler when map moves
    const bounds = map.getBounds();
    scheduler?.update(
      {
        west: bounds.getWest(),
        east: bounds.getEast(),
        south: bounds.getSouth(),
        north: bounds.getNorth(),
      },
      map.getZoom(),
    );
  }

  // ... rest mirrors VectorField.js (startAnimation, stopAnimation, resize, clear)
}
```

---

## Phase 6 — LODController

**File:** `src/utils/LODController.ts`

Manages the `u_lod_blend` uniform. Waits for all viewport LOD2 chunks to be loaded before starting crossfade.

```typescript
export class LODController {
  private blendValue = 0;

  constructor(
    private gl: WebGL2RenderingContext,
    private scheduler: ChunkScheduler,
  ) {}

  onZoomChange(zoom: number) {
    if (zoom <= 6) {
      this.blendTo(0.0);
    }
    // If zoom > 6, blend is triggered by onChunkLoaded when viewport is fully covered
  }

  onChunkLoaded(_id: string) {
    if (this.scheduler.allVisibleLoaded()) {
      this.blendTo(1.0);
    }
  }

  private blendTo(target: number, duration = 300) {
    const start = this.blendValue;
    const t0 = performance.now();
    const tick = () => {
      const t = Math.min((performance.now() - t0) / duration, 1);
      this.blendValue = start + (target - start) * t;
      // gl.uniform1f(u_lod_blend_loc, this.blendValue) is called in OceanCurrentAtlasField.draw()
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  getBlend(): number {
    return this.blendValue;
  }
}
```

`ChunkScheduler` needs one additional method: `allVisibleLoaded(): boolean` — returns true if every chunk in the current visible set is in the atlas.

---

## Phase 7 — Hook Update

**File:** `src/hooks/layers/useParticleLayer.ts`

Replace the Mapbox image source approach with direct `OceanCurrentAtlasField` management:

```typescript
// Remove: addOrUpdateImageSource, vectorLayer (Mapbox source/layer)
// Add: OceanCurrentAtlasField instance driven by date + map ref

const oceanCurrentAtlasRef = useRef<OceanCurrentAtlasFieldAPI | null>(null);

const setDataByDataset = useCallback(async () => {
  const data = await currentParticleQuery.promise.catch(...);
  if (!data) return;
  const baseUrl = buildGSLADatasetPath(date, '');  // base dir for wind chunks
  await oceanCurrentAtlasRef.current?.setData(baseUrl);
}, [...]);
```

The layer registration with Mapbox stays as a custom layer (same pattern as `webglOverlayLayer.ts`).

---

## Uniform Array Size Check

Before shipping, verify at runtime that the device supports 80 vec4 uniforms per fragment shader:

```typescript
const maxVec4 = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS);
if (maxVec4 < 80 * 4) console.warn('Atlas uniform limit may be exceeded:', maxVec4);
```

WebGL2 minimum guarantee is 256 vec4 = 1024 float components. 80 slots × 4 floats = 320, well within spec. The `u_loaded[80]` int array adds another 80 components (also within spec).

---

## Risk Summary

| Risk                                                               | Severity       | Mitigation                                                                                |
| ------------------------------------------------------------------ | -------------- | ----------------------------------------------------------------------------------------- |
| `createImageBitmap` + Safari partial support for options           | Medium         | Detect Safari UA; fallback to `fetch ArrayBuffer` + manual RGBA extraction via canvas     |
| `u_slots[80]` + `u_loaded[80]` uniform arrays hitting device limit | Low            | Runtime check at init; on failure, reduce to LOD1-only mode                               |
| LOD crossfade causing particle velocity discontinuity              | Low            | Position update shader uses LOD1 only; only the draw shader blends — particles never jump |
| Chunk boundary bilinear interpolation artifacts                    | Low            | 1-px padding sourced from real adjacent data; increase to 2-px if visible                 |
| Premultiplied alpha corruption                                     | Not applicable | Current PNG always has A=255, so premultiplication is identity                            |

---

## Implementation Order

```
Phase 1  →  Python chunking                          (gsla.py)
Phase 2  →  AtlasManager                             (src/utils/AtlasManager.ts)
Phase 3  →  ChunkScheduler                           (src/utils/ChunkScheduler.ts)
Phase 4  →  New shaders                              (src/utils/oceanCurrentShader.ts)
Phase 5  →  OceanCurrentAtlasField (LOD1 only first)         (src/layers/OceanCurrentAtlasField.ts)
           Verify: particles animate correctly with atlas
Phase 5b →  Add LOD2 to OceanCurrentAtlasField + LODController
Phase 6  →  LODController                            (src/utils/LODController.ts)
Phase 7  →  useParticleLayer hook update             (src/hooks/layers/useParticleLayer.ts)
```

Test checkpoint after Phase 5 (before LOD2): particles should animate identically to the current single-texture approach, confirming the atlas UV math is correct.

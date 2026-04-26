# Atlas Rendering System

The Atlas Rendering System is the shared GPU infrastructure that backs all chunked, LOD-aware map overlays in IMOS Live. It powers two product types:

- **Scalar overlays** — full-viewport quad coloured by a decoded 24-bit scalar value (sea level anomaly, SST anomaly)
- **Particle animations** — GPU ping-pong particles that sample velocity from the atlas (ocean current)

Both share the same `AtlasManager`, `ChunkScheduler`, and `LODController` primitives.

### Tech stack

| Component     | Technology            |
| ------------- | --------------------- |
| Map           | Mapbox GL JS          |
| Rendering     | WebGL 2 (hand-rolled) |
| Shaders       | GLSL ES 3.00          |
| UI            | React + Zustand       |
| Data fetching | React Query           |

---

## The Atlas Texture

The atlas is a **single WebGL texture** (a pre-allocated block of VRAM) that holds all loaded tile images at once. The GPU can only sample from one bound texture per draw call, so packing all tiles into one atlas means one bind per draw call — all of the GPU's parallel fragment cores sample from the same texture simultaneously without rebinding.

### Slot layout

The atlas is partitioned into a fixed grid of **slots**, each exactly one stored chunk PNG in size (`storedPx`, e.g. 242×194 px). Slots are numbered left-to-right, top-to-bottom:

```
atlasCols  = floor(atlasW / slotW)
atlasRows  = floor(atlasH / slotH)
totalSlots = atlasCols × atlasRows

Atlas texture (e.g. 4096×2048, slotW=242, slotH=194 → 16×10 = 160 slots)

col:  0        1        2              15
     ┌────────┬────────┬────────┬─────┬────────┐
  0  │ slot 0 │ slot 1 │ slot 2 │ ... │slot 15 │
     ├────────┼────────┼────────┤     ├────────┤
  1  │slot 16 │slot 17 │slot 18 │ ... │slot 31 │
     ├────────┼────────┼────────┤     ├────────┤
 ...
     ├────────┼────────┼────────┤     ├────────┤
  9  │slot144 │slot145 │slot146 │ ... │slot159 │
     └────────┴────────┴────────┴─────┴────────┘
```

Each slot's UV origin and scale are precomputed once at initialisation and stored in `u_slots[physSlot]`:

```
u_slots[i] = vec4(
  (col * slotW) / atlasW,   // UV x origin
  (row * slotH) / atlasH,   // UV y origin
   slotW / atlasW,           // UV x scale
   slotH / atlasH            // UV y scale
)
```

### PNG → atlas upload

```
Network         CPU                            GPU (VRAM)
────────────────────────────────────────────────────────────────
tile.png  →  fetch()  →  createImageBitmap()  →  texSubImage2D()  →  atlas slot
             download     decode PNG to            write pixels         persists for
             bytes        raw RGBA pixels          at (col*slotW,       layer lifetime
                          (off main thread)         row*slotH)
```

`createImageBitmap()` decompresses the PNG on the CPU (off main thread). `texSubImage2D()` copies the raw pixels into the slot's pixel region in VRAM. The `ImageBitmap` is then discarded — it was only needed as a staging buffer for the transfer.

### Atlas dimensions per product

One atlas slot = one stored chunk PNG. `slotPx` is set to `lod1.storedPx` (e.g. 242×194 px):

| Product        | Atlas size  | Slots (slotPx = 242×194) | LOD1 | Pool | LOD2+3 tiles   |
| -------------- | ----------- | ------------------------ | ---- | ---- | -------------- |
| Scalar heatmap | 4096 × 2048 | 16 × 10 = **160**        | 9    | 151  | 30 + 120 = 150 |
| Particle       | 2048 × 2048 | 8 × 10 = **80**          | 9    | 71   | 30 (LOD2 only) |

The heatmap atlas is wider (4096) so its pool of 151 comfortably holds all LOD2 (30) + LOD3 (120) = 150 tiles without LRU eviction. Both products pass their dimensions explicitly to `createAtlasManager` — `HEATMAP_ATLAS_W/H` in `HeatmapAtlasField.ts` and `PARTICLES_ATLAS_W/H` in `ParticlesAtlasField.ts`. The shader factories receive the same values at compile time.

---

## Geographic Chunks → Atlas Slots

### Two grids

| Grid                    | What it represents                      | Defined by                                  |
| ----------------------- | --------------------------------------- | ------------------------------------------- |
| **Chunk grid** (cx, cy) | How the geographic data region is tiled | Manifest: `lods['N'].grid`                  |
| **Atlas slot grid**     | How physical slots are packed in VRAM   | `floor(atlasW/slotW) × floor(atlasH/slotH)` |

These are deliberately decoupled — the geographic tiling can be any shape without affecting how slots are packed in the texture.

### Virtual index

Every chunk has a **virtual index** — a stable integer that identifies its position across all LODs regardless of whether it is currently resident in the atlas:

```
virtualIdx = u_lod_offsets[lodIdx] + cy × cols + cx
```

`u_lod_offsets` accumulates the total chunk count of all coarser LODs. With LOD1 (3×3=9 chunks) and LOD2 (6×5=30 chunks):

```
u_lod_offsets = [ 0,  9, 39, ... ]
                  ↑   ↑   ↑
                LOD1 LOD2 LOD3
```

### Slot assignment

LOD1 chunks occupy dedicated slots — their physical slot equals their virtual index directly (no indirection, never evicted). LOD2+ chunks compete for the shared pool, assigned dynamically at upload time with LRU eviction when the pool is full.

```
LOD1 3×3 chunk grid              Atlas slot assignment for LOD1
(geographic space —              (dedicated slots 0–8, formula-based)
 cx: west→east
 cy: north→south)                 slot = virtualIdx = cy×cols + cx

 ┌────────┬────────┬────────┐     cy=0: cx=0→slot 0  cx=1→slot 1  cx=2→slot 2
 │(cx0,0) │(cx1,0) │(cx2,0) │     cy=1: cx=0→slot 3  cx=1→slot 4  cx=2→slot 5
 ├────────┼────────┼────────┤     cy=2: cx=0→slot 6  cx=1→slot 7  cx=2→slot 8
 │(cx0,1) │(cx1,1) │(cx2,1) │
 ├────────┼────────┼────────┤     LOD2+ chunks → dynamically assigned
 │(cx0,2) │(cx1,2) │(cx2,2) │     from pool (slots 9–159 for heatmap)
 └────────┴────────┴────────┘
```

The `u_chunk_slots[virtualIdx]` array bridges virtual index to physical slot:

- `≥ 0` — chunk is resident; value is the physical slot index
- `= −1` — chunk is not loaded (not yet fetched, or evicted)

### Dynamic updates and eviction

`u_chunk_slots` is a CPU-side `Int32Array` that is uploaded as a uniform at the start of every draw call. The GPU always sees a fresh snapshot — there is no partial update; the entire array is sent each frame.

Three operations mutate it:

| Event                                    | CPU action                               |
| ---------------------------------------- | ---------------------------------------- |
| New LOD2+ chunk uploaded, pool has space | `chunkSlots[newVirtIdx] = physSlot`      |
| New LOD2+ chunk uploaded, pool is full   | Evict LRU first (see below), then assign |
| Chunk evicted                            | `chunkSlots[evictedVirtIdx] = -1`        |

**Eviction sequence** — when the pool is full and a new chunk arrives:

```
Before eviction                           After eviction
───────────────────────────────────────────────────────────────────
chunkSlots[victimVirtIdx] = 42   →   chunkSlots[victimVirtIdx] = -1
chunkSlots[newVirtIdx]    = -1   →   chunkSlots[newVirtIdx]    = 42

Atlas texture: slot 42 pixels   →   slot 42 pixels overwritten
               = victim's data       = new chunk's data
```

The physical slot number (42) stays the same — only its contents and the two `chunkSlots` entries change. On the next draw call, the shader looks up `u_chunk_slots[victimVirtIdx]` → `-1` (skip), and `u_chunk_slots[newVirtIdx]` → `42` (sample).

**LOD1 is immune** — its slots are dedicated and never enter the pool, so eviction never touches `chunkSlots[0 … lod1Count−1]`.

### ChunkId convention

```
"{lod}_{cx}_{cy}"    e.g.  "1_0_0",  "2_3_2",  "3_5_4"
```

File URL: `{baseUrl}/{lod}_{cx}_{cy}.png`

---

## Shader Coordinate Lookup

For every fragment (screen pixel), the shader determines which geographic location it represents, finds the correct atlas chunk for that location, and samples the data. The full lookup has five steps.

### Step 1 — Screen position → lon/lat

The vertex shader passes `v_screen_pos` as a Mercator [0,1]×[0,1] position. The fragment shader reconstructs lon/lat using the viewport bounds (`u_bounds = [nwX, seY, seX, nwY]` in Mercator):

```glsl
float mercX = fract(u_bounds.x + pos.x * abs(u_bounds.x - u_bounds.z));
float mercY = u_bounds.w     + pos.y * abs(u_bounds.y - u_bounds.w);
float lon   = mercX * 360.0 - 180.0;
float lat   = 360.0/PI * atan(exp((180.0 - mercY*360.0) * PI/180.0)) - 90.0;
```

Fragments outside `u_data_bounds` are discarded immediately.

### Step 2 — lon/lat → chunk (cx, cy)

The data region is divided into a `cols×rows` grid for each LOD. The chunk index for a given point:

```glsl
cx = clamp(floor((lon  − lonMin) / (lonRange / cols)), 0, cols−1)
cy = clamp(floor((latMax − lat)  / (latRange / rows)), 0, rows−1)
// cy=0 is the northernmost row, matching chunk generation convention
```

### Step 3 — (cx, cy) → virtual index → physical slot

```glsl
int virtualIdx = u_lod_offsets[lodIdx] + cy * int(grid.x) + cx;
int physSlot   = u_chunk_slots[virtualIdx];   // −1 = not resident
```

If `physSlot < 0`, the chunk is absent — skip this LOD (or discard for LOD1).

### Step 4 — Physical slot → atlas UV origin and scale

`u_slots[physSlot]` encodes where the slot lives inside the atlas texture:

```glsl
vec4 slot = u_slots[physSlot];
// slot.xy  = UV origin (top-left corner of the slot in the atlas)
// slot.zw  = UV scale  (slot width/height in normalised UV space)
```

### Step 5 — Local UV within the chunk, with padding correction

Each PNG has 1px of padding on each side to prevent bilinear bleed at tile edges. `u_uv_scale` and `u_uv_offset` crop the local [0,1] UV into the inner data region only:

```glsl
// Local [0,1] position of the point within its chunk
float localU = (lon  − chunkLonOrigin)  / chunkLonSize;
float localV = (chunkLatNorth − lat)    / chunkLatSize;

// Shift into inner data region, skipping the 1px padding border
// u_uv_scale  = chunkPx / storedPx   (e.g. [240/242, 192/194])
// u_uv_offset = padding / storedPx   (e.g. [1/242,   1/194])
localU = localU * u_uv_scale.x + u_uv_offset.x;
localV = localV * u_uv_scale.y + u_uv_offset.y;

// Final atlas UV: slot origin + scaled local position
vec2 atlasUV = slot.xy + vec2(localU, localV) * slot.zw;
vec4 sample  = texture(u_atlas, atlasUV);
```

### LOD blending

Without blending, finer tiles would appear the moment they finish loading — switching an entire chunk from coarse to fine in a single frame. At zoom, this creates a visible "pop" as patches of the overlay jump to higher resolution all at once.

`u_lod_blend` solves this: it crossfades the **finest active LOD** from 0 → 1 over 300 ms (ease-out, driven by `LODController`). Crucially, the blend does not start until every visible chunk for the finest active LOD is resident in the atlas. This prevents a patchwork where some regions are already crisp while adjacent ones are still coarse.

**Pan/zoom cycle:**

1. User pans or zooms → `LODController.reset()` snaps `u_lod_blend` to 0 immediately (LOD1 remains visible).
2. `ChunkScheduler` fetches the required LOD2+ tiles for the new viewport.
3. Once every visible chunk is loaded → `LODController.startBlendIn()` begins the 300 ms fade.
4. `u_lod_blend` reaches 1.0 → full LOD2+ resolution locked in.

**Intermediate LODs (3-LOD case):** LOD2 shows at full opacity once resident (`t = 1.0` in the loop below). Only the finest active LOD (LOD3) uses the animated crossfade. In practice the coarse→medium transition is instant because LOD2 tiles were already loaded before the user zoomed far enough to trigger LOD3 — only the final medium→fine step is smoothed.

The fragment shader implements this as:

```glsl
// LOD1 (lodIdx=0) is always resident — use as the base
vec4 result = texture(u_atlas, worldToAtlasUV(lonlat, 0));
if (result.a < 0.01) discard;   // land / no-data mask (alpha=0 in unloaded slots too)

for (int i = 1; i < u_lod_count; i++) {
    if (physicalSlot(lonlat, i) >= 0) {
        vec4 finer = texture(u_atlas, worldToAtlasUV(lonlat, i));
        float t = (i == u_lod_count - 1) ? u_lod_blend : 1.0;
        result  = mix(result, finer, t);
    }
}
```

With 1 LOD active the loop is dead code. The **particle position-update shader** samples LOD1 only (`worldToAtlasUV(lonlat, 0)`) and skips this loop entirely. See [ParticlesAtlasField — setSource](#particlesatlasfield) for why LOD1 must be fully resident before the particle layer starts.

---

## Manifest Format

```json
{
  "bounds": { "lonMin": 110.0, "lonMax": 163.7, "latMin": -46.0, "latMax": -8.2 },
  "valueRange": [-4.98, 4.46],
  "lods": {
    "1": { "grid": [3, 3], "chunkPx": [240, 192], "storedPx": [242, 194], "padding": 1 },
    "2": {
      "grid": [6, 5],
      "chunkPx": [240, 192],
      "storedPx": [242, 194],
      "padding": 1,
      "zoomThreshold": 5
    },
    "3": {
      "grid": [12, 10],
      "chunkPx": [240, 192],
      "storedPx": [242, 194],
      "padding": 1,
      "zoomThreshold": 6
    }
  }
}
```

| Field                     | Meaning                                                                                                     |
| ------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `bounds`                  | Geographic extent of the dataset                                                                            |
| `valueRange`              | `[rawMin, rawMax]` of the encoded scalar — used for RGB24 decoding                                          |
| `lods['N'].grid`          | `[cols, rows]` — chunk count for this LOD                                                                   |
| `lods['N'].storedPx`      | `[w, h]` — pixel dimensions of the stored chunk PNG (includes padding)                                      |
| `lods['N'].chunkPx`       | Inner data pixels (excludes padding)                                                                        |
| `lods['N'].padding`       | Padding pixels on each side (1 → 2px total per axis)                                                        |
| `lods['N'].zoomThreshold` | _(LOD2+)_ Minimum map zoom to activate this LOD. Defaults to `DEFAULT_ZOOM_THRESHOLD = 6`. LOD1 ignores it. |

LOD keys are sorted numerically at runtime — insertion order in the JSON does not matter. Up to `MAX_LODS = 4` LODs are supported.

---

## Module Map

```
src/
  webgl/
    AtlasManager.ts         — GPU texture + slot pool + LRU eviction
    ChunkScheduler.ts       — on-demand fetch queue per LOD
    LODController.ts        — crossfade blend animation
    heatmapShader.ts        — scalarAtlasVs + makeScalarAtlasFs() factory
    particlesShader.ts      — makeOceanCurrentAtlasFsParticle/Update() factories

  layers/
    HeatmapAtlasField.ts    — orchestrates atlas for scalar products
    HeatmapAtlasLayer.ts    — Mapbox CustomLayerInterface wrapper (scalar)
    ParticlesAtlasField.ts  — orchestrates atlas for particle products
    particlesAtlasLayer.ts  — Mapbox CustomLayerInterface wrapper (particles)

  hooks/layers/
    useWebGLHeatmapLayer.ts — React hook: fetches manifest, wires setSource
    useParticleLayer.ts     — React hook: fetches manifest, wires setSource

  api/
    scalarAtlas.ts          — getProductManifest + ProductManifest type
```

---

## Data Flow

```
manifest.json
    │
    ▼
useWebGLHeatmapLayer / useParticleLayer
    │  fetches manifest via React Query
    │  calls layer.setSource(manifest, baseUrl, legendRange)
    ▼
HeatmapAtlasField / ParticlesAtlasField  (setSource)
    │  1. sort manifest.lods numerically
    │  2. compute uvScale = chunkPx/storedPx, uvOffset = padding/storedPx
    │  3. create AtlasManager(gl, { slotPx: lod1.storedPx, lods, atlasW?, atlasH? })
    │  4. compile shaders with totalSlots injected as compile-time constant (first call only)
    │
    │  Heatmap:
    │  5. create ChunkSchedulers for LOD2..N
    │  6. start progressive LOD1 preload — resolves on first tile uploaded,
    │     remaining tiles continue in the background
    │
    │  Particles:
    │  5. await full LOD1 preload (Promise.all) — all tiles must be resident
    │     before resolving (update shader samples LOD1 without a residency guard)
    │  6. create ChunkSchedulers for LOD2..N
    ▼
Map interactions (pan / zoom)  →  onMapMove(bounds, zoom)
    │  ChunkScheduler.update(bounds, zoom)
    │      - no-ops if zoom ≤ zoomThreshold
    │      - calls atlas.touch() for every visible loaded chunk (LRU refresh)
    │      - aborts in-flight requests for chunks outside the buffer zone
    │      - fetches missing chunks (viewport = priority 0, buffer ring = priority 1)
    │      - uploads each decoded ImageBitmap → atlas.upload()
    │      - fires onChunkLoaded callback
    ▼
onChunkLoaded  →  if all schedulers' visible chunks are loaded
    │                  LODController.startBlendIn()
    │                  map.triggerRepaint()          ← heatmap only; starts blend animation
    │                  (particles: rAF loop in tick() drives repaints continuously)
    ▼
draw()  — called every frame by Mapbox render()
    │  uploads uniforms: u_atlas, u_slots, u_chunk_slots,
    │                    u_lod_grids, u_lod_offsets, u_lod_count,
    │                    u_lod_blend, u_uv_scale, u_uv_offset, …
    │  if lodController.isAnimating() → map.triggerRepaint()  ← sustains blend loop
    ▼
GPU fragment shader  (see Shader Coordinate Lookup)
    ▼
Screen
```

---

## API Reference

### AtlasManager

**File:** `src/webgl/AtlasManager.ts`

Manages the GPU texture and the virtual→physical slot mapping.

```ts
createAtlasManager(gl, config: AtlasConfig): AtlasManagerAPI
```

**`AtlasConfig`**

| Field     | Type                                | Description                                                               |
| --------- | ----------------------------------- | ------------------------------------------------------------------------- |
| `slotPx`  | `[number, number]`                  | Slot pixel size `[w, h]` — set to `lod1.storedPx`                         |
| `lods`    | `Array<{ grid: [number, number] }>` | LOD configs, coarsest first                                               |
| `atlasW?` | `number`                            | Atlas width. Defaults to `ATLAS_SIZE` (2048) — prefer passing explicitly  |
| `atlasH?` | `number`                            | Atlas height. Defaults to `ATLAS_SIZE` (2048) — prefer passing explicitly |

**Constants**

| Constant              | Value | Notes                                                                  |
| --------------------- | ----- | ---------------------------------------------------------------------- |
| `FALLBACK_ATLAS_SIZE` | 2048  | Safety-net fallback — both current products pass explicit dimensions   |
| `MAX_LODS`            | 4     | GLSL array size for LOD uniforms                                       |
| `MAX_VIRTUAL_CHUNKS`  | 256   | Size of `u_chunk_slots`; covers current LOD1(9)+LOD2(30)+LOD3(120)=159 |

**Methods**

| Method                 | Description                                                                |
| ---------------------- | -------------------------------------------------------------------------- |
| `upload(chunkId, img)` | Upload ImageBitmap into the atlas. LOD2+ triggers LRU if the pool is full. |
| `has(chunkId)`         | True if the chunk is currently resident.                                   |
| `touch(chunkId)`       | Refresh LRU timestamp. Call for every visible chunk each frame.            |
| `getSlotsData()`       | `Float32Array` — static UV layout per slot → `u_slots`                     |
| `getChunkSlots()`      | `Int32Array` — virtual→physical mapping → `u_chunk_slots`                  |
| `getLodOffsets()`      | `Int32Array` — cumulative LOD offsets → `u_lod_offsets`                    |
| `getLodCount()`        | Number of active LODs → `u_lod_count`                                      |
| `destroy()`            | Delete GPU texture and reset all state.                                    |

**LRU eviction**

When a LOD2+ chunk is uploaded and the pool is full, the chunk with the oldest `lastUsed` timestamp is evicted: its `u_chunk_slots` entry is set to `-1` and its physical slot is reused. `ChunkScheduler` re-queues evicted chunks when they re-enter the viewport.

> With current atlas sizing, LRU eviction is dormant: the heatmap pool (151) exceeds the maximum simultaneous LOD2+LOD3 tiles (150) by one. The logic activates if a new LOD level pushes the tile count past the pool size.

---

### HeatmapAtlasField

**File:** `src/layers/HeatmapAtlasField.ts`

Orchestrates the atlas, schedulers, and LOD controller for scalar overlay products.

```ts
setSource(manifest, tileBaseUrl, legendRange): Promise<void>
updateLegendRange(range: [number, number]): void
onMapMove(bounds: LngLatBounds, zoom: number): void
setVisible(visible: boolean): void
draw(): void
```

**Progressive LOD1 preload** — `setSource` resolves as soon as the first LOD1 tile is uploaded so the layer becomes visible immediately. Remaining tiles continue in the background; each upload triggers `map.triggerRepaint()` so coverage fills in progressively. Rejects only if every tile fails.

A `fetchGeneration` counter discards stale upload callbacks if `setSource` is called again (e.g. date change) before the previous fetch completes. Unloaded LOD1 tile regions safely discard in the fragment shader via the alpha mask (`a < 0.01`).

---

### ParticlesAtlasField

**File:** `src/layers/ParticlesAtlasField.ts`

Orchestrates the atlas, schedulers, and LOD controller for the ocean current particle product.

```ts
setSource(manifest, tileBaseUrl, legendRange): Promise<void>
setLodBlend(value: number): void
startAnimation(): void
stopAnimation(): void
resize(): void
updateConfig(config: Partial<CustomizableParticleConfig>): void
onMapMove(bounds: LngLatBounds, zoom: number): void
draw(): void
```

**Blocking LOD1 preload** — `setSource` uses `Promise.all` and blocks until every LOD1 tile is resident before resolving. This is required because the particle position-update shader calls `worldToAtlasUV(lonlat, 0)` unconditionally — a missing LOD1 chunk produces an out-of-bounds `u_slots[-1]` access (undefined behaviour) rather than the graceful discard the heatmap alpha mask provides.

A `fetchGeneration` counter discards stale upload callbacks and aborts scheduler setup if superseded by a newer `setSource` call.

**`setLodBlend(value)`** — called by the layer wrapper after an external LOD transition event. Snaps the `LODController` to 0 and starts a new blend-in if `value > 0`.

### Particle engine

The particle layer runs a second rendering loop on top of the atlas lookup. Six steps execute every animation frame:

1. **Initialise** — a configurable number of particles start at random Mercator [0,1]×[0,1] positions, stored as float pairs in a `RG32F` GPU texture.
2. **Sample velocity** — the position-update shader looks up the atlas chunk for each particle's (lon, lat), decodes UCUR/VCUR from the R/G channels using `u_vector_min`/`u_vector_max`, and applies a Mercator offset scaled by `speedFactor`.
3. **Ping-pong** — updated positions are written to an off-screen texture; the previous frame's texture is read. Roles swap each frame so the GPU never reads and writes the same texture simultaneously.
4. **Random drop** — particles whose `rand(seed) > 1 − dropRate − speed_t × dropRateBump` are respawned at a new random position, keeping the field dynamic.
5. **Draw** — a point sprite is rendered at each particle position, coloured by speed via `u_color_ramp`.
6. **Fade trail** — the screen framebuffer is composited at reduced opacity (`fadeOpacity`) each frame, leaving a decaying trail behind moving particles.

Particle behaviour is configurable via `src/config/particleConfig.ts`:

| Parameter      | Default | Effect                                         |
| -------------- | ------- | ---------------------------------------------- |
| `nParticles`   | 10 000  | Total particle count                           |
| `fadeOpacity`  | 0.985   | Trail persistence (higher = longer trails)     |
| `speedFactor`  | 5.0     | Velocity multiplier                            |
| `dropRate`     | 0.003   | Base probability of respawning per frame       |
| `dropRateBump` | 0.05    | Extra respawn chance for fast-moving particles |
| `pointSize`    | 1.2     | Particle size in pixels                        |

---

### ChunkScheduler

**File:** `src/webgl/ChunkScheduler.ts`

One instance per on-demand LOD. Manages the fetch queue for that LOD.

```ts
createChunkScheduler(
  atlas, tileBaseUrl, onChunkLoaded, region,
  lod, zoomThreshold?
): ChunkSchedulerAPI
```

`zoomThreshold` defaults to `DEFAULT_ZOOM_THRESHOLD = 6`. Pass `lodEntry.zoomThreshold` from the manifest to make it per-LOD.

| Behaviour             | Detail                                                                    |
| --------------------- | ------------------------------------------------------------------------- |
| **Viewport priority** | Viewport chunks at priority 0; 1-chunk buffer ring at priority 1          |
| **Concurrency**       | Max 6 in-flight fetches                                                   |
| **Zoom gate**         | Aborts all in-flight and no-ops if `zoom ≤ zoomThreshold`                 |
| **Cancellation**      | Chunks scrolled outside the buffer zone are aborted via `AbortController` |
| **LRU refresh**       | `atlas.touch(id)` for every visible loaded chunk per `update()` call      |

---

### LODController

**File:** `src/webgl/LODController.ts`

Animates `u_lod_blend` (0 → 1) over 300 ms with an ease-out quadratic curve. Driven by the draw loop — no separate `requestAnimationFrame`.

| Method           | Effect                                              |
| ---------------- | --------------------------------------------------- |
| `startBlendIn()` | Begin animating toward 1.0                          |
| `reset()`        | Snap to 0 and cancel animation                      |
| `getValue()`     | Read current value and advance animation if running |
| `isAnimating()`  | True while animation is in progress                 |
| `destroy()`      | Snap to 0 and release resources                     |

When the user pans into a new area, `reset()` snaps `u_lod_blend` back to 0 so LOD1 shows through again, then `startBlendIn()` is called once all visible LOD2+ chunks have loaded, fading them in over 300 ms. Intermediate LODs (loaded but not the finest) always show at 100%.

**Animation loop (heatmap):** `onChunkLoaded` calls `map.triggerRepaint()` to start the first blend frame. Each `draw()` sustains the loop with another `triggerRepaint()` while `isAnimating()` is true. Particles drive repaints via their own rAF loop instead.

---

## Shader Uniforms

Shader source is generated by factory functions (`makeScalarAtlasFs(totalSlots)`, `makeOceanCurrentAtlasFsParticle/Update(totalSlots)`) that inject `totalSlots` as a GLSL compile-time constant, sizing `u_slots` to match the atlas layout exactly.

### Shared (both shader families, via `makeSharedGlsl`)

| Uniform         | Type        | Description                                                                     |
| --------------- | ----------- | ------------------------------------------------------------------------------- |
| `u_atlas`       | `sampler2D` | The atlas texture                                                               |
| `u_bounds`      | `vec4`      | Viewport in Mercator: `[nwX, seY, seX, nwY]`                                    |
| `u_data_bounds` | `vec4`      | Data region: `[lonMin, latMax, lonMax, latMin]`                                 |
| `u_slots`       | `vec4[N]`   | Static UV layout per physical slot. N = totalSlots (160 heatmap / 80 particles) |
| `u_chunk_slots` | `int[256]`  | Virtual index → physical slot (−1 = not resident)                               |
| `u_lod_grids`   | `vec2[4]`   | `[cols, rows]` per LOD, coarse→fine                                             |
| `u_lod_offsets` | `int[4]`    | Cumulative virtual chunk offset per LOD                                         |
| `u_lod_count`   | `int`       | Number of active LODs                                                           |
| `u_lod_blend`   | `float`     | 0→1 crossfade for the finest active LOD                                         |
| `u_uv_scale`    | `vec2`      | `chunkPx / storedPx` — crops local [0,1] UV to the inner data region            |
| `u_uv_offset`   | `vec2`      | `padding / storedPx` — shifts past the padding border                           |

### Scalar-specific (heatmapShader)

| Uniform          | Type        | Description                                                              |
| ---------------- | ----------- | ------------------------------------------------------------------------ |
| `u_value_range`  | `vec2`      | `[rawMin, rawMax]` from manifest — decodes RGB24 to physical units       |
| `u_legend_range` | `vec2`      | `[legendMin, legendMax]` from `PRODUCTLEGENDS` — colour ramp clamp range |
| `u_color_ramp`   | `sampler2D` | 256×1 colour ramp texture                                                |

**RGB24 scalar decoding** — each chunk PNG stores a scalar as a 24-bit integer spread across R, G, B channels:

```glsl
float decoded  = (R*65536.0 + G*256.0 + B) / 16777215.0;          // 24-bit → [0, 1]
float rawValue = decoded * (u_value_range.y - u_value_range.x) + u_value_range.x;
float t        = clamp(
    (rawValue - u_legend_range.x) / (u_legend_range.y - u_legend_range.x),
    0.0, 1.0
);
// t → texture lookup into u_color_ramp
```

`u_value_range` and `u_legend_range` are intentionally separate — the colour ramp can be narrowed for visual emphasis without changing the stored data encoding.

### Uniform component budget

WebGL2 guarantees `MAX_FRAGMENT_UNIFORM_COMPONENTS ≥ 1024`. The heatmap shader consumes ~926 components (`u_slots[160]`=640 + `u_chunk_slots[256]`=256 + ~30 others). Verify this count before increasing atlas dimensions beyond 4096×2048.

---

## Adding a New Product

1. **Generate tiles** — produce `manifest.json` + PNG files named `{lod}_{cx}_{cy}.png`.

2. **`src/constants/product.ts`** — add entries to `PRODUCT`, `PRODUCTS`, `PRODUCTLEGENDS`, and `PRODUCTCOLORPALETTES`.

3. **`MapComponent.tsx`** — wire the hook:

   ```tsx
   useWebGLHeatmapLayer({ map, layerId, product: PRODUCT.MY_PRODUCT });
   ```

4. **`src/config/layerConfig.ts`** — add the layer ID to `LAYERS_ORDER`.

5. **`src/components/MainSidebar/products.tsx`** — add the sidebar entry.

No changes to atlas, shader, or scheduler code are needed unless the new product exceeds 4 LODs, a total virtual chunk count > 256, or pushes the tile count past the pool (heatmap pool = 151).

---

## Known Limitations

| Issue                                                                                 | Status                                                |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `MAX_VIRTUAL_CHUNKS = 256` — LOD4 alone needs 480 virtual chunks, exceeding the limit | Increase the constant and recompile shaders if needed |
| Heatmap pool (151) fits current LOD2+LOD3 (150) with exactly one slot to spare        | Adding LOD4 requires revisiting atlas dimensions      |

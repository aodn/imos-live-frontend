# Atlas Rendering System

The Atlas Rendering System is the shared GPU infrastructure that backs all chunked, LOD-aware map overlays in IMOS Live. It powers two distinct product types:

- **Scalar overlays** — full-viewport quad coloured by a decoded 24-bit scalar value (sea level anomaly, SST anomaly)
- **Particle animations** — GPU ping-pong particles that sample velocity from the atlas (ocean current)

Both share the same `AtlasManager`, `ChunkScheduler`, and `LODController` primitives.

---

## Concepts

### Two grids to keep straight

| Grid                     | What it is                                                 | Who defines it                                                        |
| ------------------------ | ---------------------------------------------------------- | --------------------------------------------------------------------- |
| **Chunk grid** (cx, cy)  | Geographic subdivision — how the data region is tiled      | The manifest (`lods['1'].grid`, `lods['2'].grid`, …)                  |
| **Atlas texture layout** | How physical slots are packed in the 2048×2048 GPU texture | Derived from slot pixel size: `floor(2048/slotW) × floor(2048/slotH)` |

The **virtual chunk index** bridges them:

```
virtualIdx = u_lod_offsets[lodIdx] + cy × cols + cx
```

The shader computes this, then reads `u_chunk_slots[virtualIdx]` to get the physical slot in the atlas, then reads `u_slots[physicalSlot]` for the UV coordinates.

### Physical slot strategy

| Slots                      | Owner                           | Evictable |
| -------------------------- | ------------------------------- | --------- |
| `0 … lod1Count−1`          | LOD1 — dedicated, formula-based | Never     |
| `lod1Count … totalSlots−1` | LOD2+ shared pool               | Yes — LRU |

LOD1 is always resident (preloaded eagerly at `setSource`). LOD2 and finer are loaded on demand by `ChunkScheduler`; when the pool is full, the least-recently-visible chunk is evicted to make room.

### ChunkId convention

```
"{lod}_{cx}_{cy}"    e.g.  "1_0_0",  "2_3_2",  "3_5_4"
```

File URL pattern:

```
{baseUrl}/{filePrefix}_{lod}_{cx}_{cy}.png
```

---

## Manifest format

Each product has a `manifest.json` that describes its chunking layout:

```json
{
  "bounds": { "lonMin": 90.0, "lonMax": 180.0, "latMin": -60.0, "latMax": 10.0 },
  "valueRange": [-0.43, 0.67],
  "lods": {
    "1": { "grid": [3, 3], "chunkPx": [240, 192], "storedPx": [242, 194], "padding": 1 },
    "2": { "grid": [6, 5], "chunkPx": [240, 192], "storedPx": [242, 194], "padding": 1 }
  }
}
```

| Field                | Meaning                                                       |
| -------------------- | ------------------------------------------------------------- |
| `bounds`             | Geographic extent of the dataset                              |
| `valueRange`         | Raw min/max of the encoded scalar (used for RGB24 decoding)   |
| `lods['N'].grid`     | `[cols, rows]` — how many chunks tile this LOD level          |
| `lods['N'].storedPx` | `[width, height]` — pixel dimensions of each stored chunk PNG |
| `lods['N'].chunkPx`  | Inner data pixels (excludes padding)                          |
| `lods['N'].padding`  | 1-pixel padding on each side (total 2px per axis)             |

The system supports any number of LODs. The renderer currently uses two (LOD1 coarse, LOD2 fine).

---

## Module map

```
src/
  webgl/
    AtlasManager.ts       — GPU texture + LRU slot pool
    ChunkScheduler.ts     — on-demand fetch queue per LOD
    LODController.ts      — crossfade blend animation
    heatmapShader.ts      — vertex + fragment shaders for scalar overlays
    particlesShader.ts    — vertex + fragment shaders for particle field

  layers/
    HeatmapAtlasField.ts  — orchestrates atlas for scalar products
    HeatmapAtlasLayer.ts  — Mapbox CustomLayerInterface wrapper (scalar)
    ParticlesAtlasField.ts — orchestrates atlas for particle products
    ParticlesAtlasLayer.ts — Mapbox CustomLayerInterface wrapper (particles)

  hooks/layers/
    useWebGLHeatmapLayer.ts — React hook: fetches manifest, wires setSource
    useParticleLayer.ts     — React hook: fetches manifest, wires setSource

  api/
    scalarAtlas.ts        — getHeatmapAtlasManifest + HeatmapAtlasManifest type
    oceanCurrent.ts       — getOceanCurrentManifest + OceanCurrentManifest type
```

---

## Data flow

```
manifest.json
    │
    ▼
useWebGLHeatmapLayer / useParticleLayer
    │  fetches manifest via React Query
    │  calls layer.setSource(manifest, baseUrl, filePrefix, legendRange)
    ▼
HeatmapAtlasField / ParticlesAtlasField  (setSource)
    │  1. sorts manifest.lods by LOD number
    │  2. creates AtlasManager(gl, { slotPx, lods })
    │  3. preloads all LOD1 PNGs → atlas.upload()
    │  4. creates one ChunkScheduler per on-demand LOD (2..N)
    ▼
Map interactions (pan / zoom)  →  onMapMove(bounds, zoom)
    │  ChunkScheduler.update(bounds, zoom)
    │      - touches visible loaded chunks (LRU refresh)
    │      - fetches missing chunks in priority order
    │      - uploads each ImageBitmap → atlas.upload()
    │      - fires onChunkLoaded callback
    ▼
onChunkLoaded  →  if all schedulers' visible chunks loaded
    │                  LODController.startBlendIn()
    ▼
draw()  (called every frame from Mapbox render())
    │  setUniforms(u_atlas, u_slots, u_chunk_slots, u_lod_grids,
    │              u_lod_offsets, u_lod_count, u_lod_blend, …)
    ▼
GPU fragment shader
    │  virtualIdx = u_lod_offsets[lod] + cy*cols + cx
    │  physSlot   = u_chunk_slots[virtualIdx]   // −1 = not resident
    │  UV         = u_slots[physSlot]
    │  sample atlas texture → decode → colorise
    ▼
Screen
```

---

## AtlasManager

**File:** `src/webgl/AtlasManager.ts`

Manages the 2048×2048 GPU texture and the virtual→physical slot mapping.

### Key constants

| Constant             | Value | Meaning                                                           |
| -------------------- | ----- | ----------------------------------------------------------------- |
| `MAX_LODS`           | 4     | Maximum LOD levels the GLSL arrays are sized for                  |
| `MAX_VIRTUAL_CHUNKS` | 256   | Size of `u_chunk_slots` — covers up to LOD3 with reasonable grids |

### API

```ts
createAtlasManager(gl, config: AtlasConfig): AtlasManagerAPI
```

| Method                 | Description                                                                   |
| ---------------------- | ----------------------------------------------------------------------------- |
| `upload(chunkId, img)` | Upload an ImageBitmap into the atlas. LOD2+ triggers LRU if the pool is full. |
| `has(chunkId)`         | True if the chunk is currently resident (not evicted).                        |
| `touch(chunkId)`       | Refresh LRU timestamp. Call for every visible chunk each frame.               |
| `getSlotsData()`       | `Float32Array` — static UV layout, passed to `u_slots`.                       |
| `getChunkSlots()`      | `Int32Array` — virtual→physical mapping, passed to `u_chunk_slots`.           |
| `getLodOffsets()`      | `Int32Array` — cumulative offsets per LOD, passed to `u_lod_offsets`.         |
| `getLodCount()`        | Number of active LODs, passed to `u_lod_count`.                               |
| `destroy()`            | Release GPU texture and reset all state.                                      |

### LRU eviction

When a LOD2+ chunk is uploaded and no pool slot is free:

1. Scan `lastUsed` for the chunk with the oldest timestamp.
2. Set `chunkSlots[victimVirtualIdx] = −1`.
3. Return the freed physical slot for the new upload.

Evicted chunks are removed from `has()` — `ChunkScheduler` will re-queue them if they re-enter the viewport.

---

## ChunkScheduler

**File:** `src/webgl/ChunkScheduler.ts`

One instance per on-demand LOD. Manages the fetch queue for that LOD.

```ts
createChunkScheduler(
  atlas, baseUrl, onChunkLoaded, region,
  filePrefix, lod, zoomThreshold
): ChunkSchedulerAPI
```

| Behaviour             | Detail                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------ |
| **Viewport priority** | Chunks inside the viewport are queued at priority 0; the 1-chunk buffer ring at priority 1 |
| **Concurrency**       | At most 6 in-flight fetches at once                                                        |
| **Zoom gate**         | Returns immediately if `zoom ≤ zoomThreshold` (default 6)                                  |
| **Cancellation**      | Chunks that scroll out of the buffer ring are aborted                                      |
| **LRU refresh**       | Calls `atlas.touch(id)` for every visible loaded chunk on each `update()`                  |

---

## LODController

**File:** `src/webgl/LODController.ts`

Animates `u_lod_blend` (0 → 1) over 300 ms using an ease-out quadratic curve. Driven by the existing draw loop — no separate `requestAnimationFrame`.

| Method           | Effect                                                |
| ---------------- | ----------------------------------------------------- |
| `startBlendIn()` | Begin animating toward 1.0                            |
| `reset()`        | Snap to 0 and cancel animation                        |
| `getValue()`     | Read current value; advances animation if in progress |

**Blend semantics (N LODs):** Intermediate LODs (loaded but not the finest) are shown at 100%. Only the finest active LOD transition uses `u_lod_blend`. When panning into a new area at LOD2, the blend resets to 0, LOD1 shows through, and LOD2 fades in as chunks load.

---

## Shader uniforms

Both `heatmapShader` and `particlesShader` share the same atlas uniform set via `SHARED_GLSL`:

| Uniform         | Type       | Description                                                                        |
| --------------- | ---------- | ---------------------------------------------------------------------------------- |
| `u_bounds`      | `vec4`     | Viewport in Mercator: `[nwX, seY, seX, nwY]`                                       |
| `u_data_bounds` | `vec4`     | Data region in lon/lat: `[lonMin, latMax, lonMax, latMin]`                         |
| `u_slots`       | `vec4[80]` | Static UV layout per physical slot                                                 |
| `u_chunk_slots` | `int[256]` | Virtual chunk index → physical slot (−1 = not resident)                            |
| `u_lod_grids`   | `vec2[4]`  | `[cols, rows]` per LOD, ordered coarse→fine                                        |
| `u_lod_offsets` | `int[4]`   | Cumulative virtual offset per LOD                                                  |
| `u_lod_count`   | `int`      | Number of active LODs                                                              |
| `u_lod_blend`   | `float`    | 0→1 crossfade for the finest active LOD                                            |
| `u_uv_scale`    | `vec2`     | `chunkPx / storedPx` — maps local [0,1] UV into the data region, excluding padding |
| `u_uv_offset`   | `vec2`     | `padding / storedPx` — shifts UV past the padding border                           |

### Scalar-specific (heatmapShader)

| Uniform          | Type        | Description                                                               |
| ---------------- | ----------- | ------------------------------------------------------------------------- |
| `u_value_range`  | `vec2`      | `[rawMin, rawMax]` from manifest — for RGB24 decoding                     |
| `u_legend_range` | `vec2`      | `[legendMin, legendMax]` from `PRODUCTLEGENDS` — for colour ramp clamping |
| `u_color_ramp`   | `sampler2D` | 256×1 colour ramp texture                                                 |

### RGB24 scalar decoding

Each chunk PNG stores a scalar value as a 24-bit integer spread across R, G, B:

```glsl
float decoded = (R * 65536.0 + G * 256.0 + B) / 16777215.0;  // [0, 1]
float rawValue = decoded * (valueRange.y - valueRange.x) + valueRange.x;
float t = clamp((rawValue - legendRange.x) / (legendRange.y - legendRange.x), 0.0, 1.0);
// t → colour ramp lookup
```

`u_value_range` decodes the stored integer back to physical units. `u_legend_range` then clamps and normalises to the colour ramp — these two ranges are intentionally separate so the legend can be narrower than the full data range.

### Fragment shader LOD loop

```glsl
// LOD1 is always resident — use as base
vec4 result = texture(u_atlas, worldToAtlasUV(lonlat, 0));
if (result.a < 0.01) discard;  // land / null mask

for (int i = 1; i < u_lod_count; i++) {
    int physSlot = physicalSlot(lonlat, i);
    if (physSlot >= 0) {
        vec4 finer = texture(u_atlas, worldToAtlasUV(lonlat, i));
        float t = (i == u_lod_count - 1) ? u_lod_blend : 1.0;
        result = mix(result, finer, t);
    }
}
```

With 1 LOD the loop is dead code. With 2 LODs it runs once using `u_lod_blend`. With 3 LODs, LOD2 blends fully when loaded and LOD3 blends using `u_lod_blend`.

---

## Adding a new atlas product

1. **Generate chunks** — produce `manifest.json` + PNG files following the chunk naming convention (`{prefix}_{lod}_{cx}_{cy}.png`).

2. **Add to `src/constants/product.ts`** — entry in `PRODUCT`, `PRODUCTS`, `PRODUCTLEGENDS`, and `PRODUCTCOLORPALETTES`.

3. **Wire the hook in `MapComponent.tsx`**:

   ```tsx
   useWebGLHeatmapLayer({
     map,
     layerId,
     product: PRODUCT.MY_PRODUCT,
     baseUrl: 'path/to/chunks',
     filePrefix: 'my_prefix',
     queryKey: 'myProductManifest',
   });
   ```

4. **Add the layer ID to `LAYERS_ORDER`** in `src/config/layerConfig.ts`.

5. **Add sidebar entry** in `src/components/MainSidebar/products.tsx`.

No changes to the atlas, shader, or scheduler code are needed unless the new product introduces a different slot pixel size (`storedPx`) or more than 4 LODs.

---

## Known limitations & TODOs

| Issue                                                            | Status                                                                                                            |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| LOD zoom thresholds are hardcoded (`DEFAULT_ZOOM_THRESHOLD = 6`) | TODO — should be per-product or per-LOD from the manifest                                                         |
| Chunk PNGs served from `public/` folder                          | TODO — move to S3                                                                                                 |
| Padding correction                                               | Fixed — driven by `chunkPx`/`storedPx`/`padding` from manifest via `u_uv_scale`/`u_uv_offset` uniforms            |
| `MAX_VIRTUAL_CHUNKS = 256` limits LOD4 with large grids          | Increase constant if needed                                                                                       |
| `u_slots` array size                                             | Fixed — `totalSlots` injected at shader compile time from `floor(ATLAS_SIZE/storedW) × floor(ATLAS_SIZE/storedH)` |

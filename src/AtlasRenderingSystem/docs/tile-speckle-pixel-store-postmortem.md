# Postmortem: intermittent tile "speckle" corruption (pixel-store unpack state)

**Date:** 2026-06-02
**Component:** `webgl/AtlasManager.ts` (`writeToSlot`)
**Affects:** every atlas-backed product — scalar heatmaps **and** particles (both share `AtlasManager`)
**Status:** fixed

---

## Symptom

Scalar overlays (e.g. SST mosaic) rendered as **high-frequency rainbow/magenta
speckle**, often in **horizontal bands** — some chunk rows smooth and correct,
adjacent rows scrambled. Reported as "the whole visualisation is broken."

It looked data- and zoom-dependent at first (one report said only zoom 4–5,
another date looked fine), but that was a red herring — see below.

## The one clue that cracked it

The corruption disappeared when the user did **either** of:

- **switch to another date and back** (same zoom, same data), or
- **reload with "Disable cache" enabled** in DevTools.

Both actions change only **when tile uploads happen** relative to Mapbox's own
rendering. They do **not** change the tile bytes, the decode, or the GPU uniform
budget. So the bug had to be **timing-dependent**, which rules out every
data/cache/GPU-limit explanation.

## What was ruled out (with evidence)

| Hypothesis                                                                          | How it was tested                                                                                      | Result                                                                                                                           |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Corrupt source tiles                                                                | Downloaded LOD1/2/3 PNGs, measured horizontal `mean\|ΔR\|` of the high byte                            | Clean (≈1.1–2.8, well within the healthy 1.8–8.2 band); sensible SST values                                                      |
| Bilinear interpolation corrupts the packed RGB24 value                              | Simulated GPU LINEAR sampling (interpolate bytes → decode) vs (decode → interpolate)                   | **Error literally `0.000`** — the decode is a _linear_ combination of R,G,B, so the two orders are identical. Bilinear is exact. |
| PNG gamma/ICC profile applied despite `colorSpaceConversion:'none'`                 | Inspected PNG ancillary chunks                                                                         | Only `IHDR`/`IDAT`/`IEND` — no `gAMA`/`iCCP`/`sRGB`                                                                              |
| Nodata-edge blend (the documented cyan coastline fringe)                            | Examined nodata sentinel + interior holes                                                              | Nodata is `(0,0,0)`/α0 → decodes to the _cold_ end; ~143 edge px — far too few for whole-field speckle                           |
| Uniform budget exceeded (4-LOD product: `totalSlots=336`, `totalVirtualChunks=262`) | Computed footprint; budget overflow throws in `createAtlasManager` → layer would error out, not render | Deterministic — can't explain the timing-dependence                                                                              |

All of these are **deterministic** per date, so none of them could be "fixed"
by a date-reswitch or a cache toggle.

## Root cause

`AtlasManager.writeToSlot` uploaded each tile via `texSubImage2D(... img)`
**without resetting the WebGL pixel-store unpack state**:

- `UNPACK_FLIP_Y_WEBGL`
- `UNPACK_PREMULTIPLY_ALPHA_WEBGL`
- `UNPACK_COLORSPACE_CONVERSION_WEBGL`

These flags are **global to the GL context**, and **we share the context with
Mapbox GL**. Our tile uploads run inside async `fetch().then()` /
`createImageBitmap().then()` callbacks that fire at arbitrary microtask times —
**interleaved with Mapbox's own texture uploads**, which set these flags for
their own needs and don't reset them to a canonical state afterward.

So each tile inherited whatever Mapbox last left set. Because these PNGs pack a
**24-bit scalar value in RGB** (not a colour), any inherited flip / premultiply /
colorspace remap **scrambles the decoded value**, and the shader paints garbage
ramp colours. Per-tile timing → per-tile/banded corruption. Anything that
shifts upload timing (slower network from disable-cache, a fresh atlas from a
date-reswitch) changes which tiles land in the "bad flags" window → "fixes" it.

> The author had already _suspected_ this: `atlasUploadDiagnostics.ts`
> (`VITE_ATLAS_DIAG`) logs `flipY` / `premultiply` / `colorspace` at upload time
> precisely to catch it. The reset itself was just never added.

## The fix

Reset all three unpack flags **on every upload** (not once — Mapbox can change
them between our async callbacks), immediately before `texSubImage2D`:

```ts
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
```

These match the `createImageBitmap(blob, { premultiplyAlpha: 'none',
colorSpaceConversion: 'none' })` options used at fetch time, and the requirement
that the tile is uploaded top-down (no flip). One fix in `AtlasManager` covers
both the heatmap and particle layers.

Locked in by a regression test in `AtlasManager.spec.ts`
("resets inherited pixel-store unpack state on every upload").

## How to verify

1. Reproduce on a known-broken URL (hard-reload so the changed module loads).
2. The speckle should be gone **deterministically** — including on a normal
   cached reload, which previously triggered it.
3. Optionally set `VITE_ATLAS_DIAG=true` and restart the dev server: the slot
   readback should report `slot OK` (smooth R) instead of `CORRUPT SLOT`.

## Lesson for future GL work in this package

Any code that uploads textures into the Mapbox-shared GL context from async
callbacks **must set its own pixel-store state first** — never assume the
inherited unpack flags are in a default state. The same applies to any other
global GL state we depend on at upload time (bound framebuffer, active texture
unit, etc.).

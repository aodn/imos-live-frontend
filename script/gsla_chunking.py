# python:3.11  source visualization-venv/bin/activate
"""
Ocean current field Atlas chunk generator for GSLA ocean current data.

Produces per-LOD PNG chunks consumed by the WebGL Atlas renderer.

Output layout:
  {base_dir}/ocean_current/manifest.json
  {base_dir}/sea_level_anomaly/manifest.json
  {base_dir}/ocean_current/ocean_current_{lod}_{cx}_{cy}.png
  {base_dir}/sea_level_anomaly/sea_level_anomaly_{lod}_{cx}_{cy}.png

PNG channel encoding (matches existing gsla.py to_png_input format):
  R = U current component (8-bit, normalised across full region)
  G = V current component (8-bit, normalised across full region)
  B = ocean mask (255 = valid ocean, 0 = land / no-data)
  A = 255 (always — keeps premultiplied-alpha a no-op)

Chunk coordinate system:
  cx = 0 is the westernmost column  (lon ~ 89.9°E)
  cy = 0 is the northernmost row    (lat ~ 10.1°N)
  This matches image-space convention (origin top-left).
"""

import datetime
import json
from pathlib import Path

import numpy as np
import s3fs
import xarray as xr
from PIL import Image

# ── LOD grid definitions ─────────────────────────────────────────────────────
# Each LOD is described as (grid_cols, grid_rows).
# CHUNK_PX is the data-pixel count per chunk before padding.
# PADDING adds 1 real-data pixel on each edge for seamless bilinear filtering.
LOD_GRIDS: dict[int, tuple[int, int]] = {
    1: (3, 3),   # 9 chunks   total resolution 720 × 576
    2: (6, 5),   # 30 chunks  total resolution 1440 × 1152
}
CHUNK_PX = (240, 192)   # (width, height) in data pixels, divisible into every LOD
PADDING  = 1            # pixels of overlap on each side → stored chunk is 242 × 194


# ── Data loading (mirrors gsla.py) ───────────────────────────────────────────

def get_dataset(date: datetime.datetime) -> xr.Dataset:
    s3 = s3fs.S3FileSystem(anon=True)
    file_list = s3.ls(f"imos-data/IMOS/OceanCurrent/GSLA/NRT/{date.year}/")
    ds = xr.open_dataset(
        s3.open(next((f for f in file_list if date.strftime("%Y%m%d") in f), None))
    )
    return ds.sel(
        TIME=date.strftime("%Y-%m-%d"),
        LATITUDE=slice(-60, 10),
        LONGITUDE=slice(90, 180),
    )


# ── Core helpers ─────────────────────────────────────────────────────────────

def _get_bounds(ds: xr.Dataset) -> tuple[float, float, float, float]:
    """Return (lon_min, lon_max, lat_min, lat_max) from the dataset's actual coordinates."""
    return (
        float(ds.LONGITUDE.min().values),
        float(ds.LONGITUDE.max().values),
        float(ds.LATITUDE.min().values),
        float(ds.LATITUDE.max().values),
    )


def _resample_to_grid(ds: xr.Dataset, total_w: int, total_h: int) -> xr.Dataset:
    """
    Resample dataset to (total_w × total_h) on a regular lat/lon grid.
    Latitudes run north→south (row 0 = lat_max) to match image-space cy=0 being northernmost.
    """
    lon_min, lon_max, lat_min, lat_max = _get_bounds(ds)
    target_lons = np.linspace(lon_min, lon_max, total_w)
    target_lats = np.linspace(lat_max, lat_min, total_h)  # north → south
    return ds.interp(LONGITUDE=target_lons, LATITUDE=target_lats, method='linear')


def _extract_chunk(
    arr: np.ndarray,
    cx: int,
    cy: int,
    total_w: int,
    total_h: int,
) -> np.ndarray:
    """
    Slice a (total_h, total_w) array into a chunk with PADDING-pixel overlap.

    Interior chunks borrow 1 real pixel from each neighbouring chunk.
    Edge chunks replicate the boundary pixel (np.pad 'edge' mode).
    Always returns an array of shape (CHUNK_PX[1] + 2*PADDING, CHUNK_PX[0] + 2*PADDING).
    """
    cw, ch = CHUNK_PX

    # Core pixel range for this chunk (no padding)
    row_s = cy * ch
    col_s = cx * cw

    # Padded range clamped to array bounds
    p_row_s = max(row_s - PADDING, 0)
    p_row_e = min(row_s + ch + PADDING, total_h)
    p_col_s = max(col_s - PADDING, 0)
    p_col_e = min(col_s + cw + PADDING, total_w)

    chunk = arr[p_row_s:p_row_e, p_col_s:p_col_e]

    # Pad with edge replication where we hit the region boundary
    pad_top    = PADDING if row_s == 0            else 0
    pad_bottom = PADDING if row_s + ch == total_h else 0
    pad_left   = PADDING if col_s == 0            else 0
    pad_right  = PADDING if col_s + cw == total_w else 0

    if pad_top or pad_bottom or pad_left or pad_right:
        chunk = np.pad(chunk, ((pad_top, pad_bottom), (pad_left, pad_right)), mode='edge')

    return chunk  # shape: (ch + 2*PADDING, cw + 2*PADDING)


# ── Main generators ───────────────────────────────────────────────────────────

def to_ocean_current_chunk_png(ds: xr.Dataset, base_dir: Path, lod: int) -> None:
    """
    Slice the full-region UCUR/VCUR grid into per-chunk PNGs for the given LOD.

    Normalisation ranges are derived from the full pre-resampled dataset so that
    every chunk shares the same scale — the frontend uses a single manifest uRange/vRange
    to decode all chunks consistently.
    """
    grid_cols, grid_rows = LOD_GRIDS[lod]
    total_w = grid_cols * CHUNK_PX[0]
    total_h = grid_rows * CHUNK_PX[1]

    # Compute normalisation ranges from raw (pre-resample) data, ignoring NaNs
    u_min = float(ds.UCUR.min(skipna=True).values)
    u_max = float(ds.UCUR.max(skipna=True).values)
    v_min = float(ds.VCUR.min(skipna=True).values)
    v_max = float(ds.VCUR.max(skipna=True).values)

    # Guard against degenerate ranges (all-NaN or flat field)
    if u_max == u_min:
        u_max = u_min + 1.0
    if v_max == v_min:
        v_max = v_min + 1.0

    # Resample to LOD resolution; latitude runs north→south
    ds_r = _resample_to_grid(ds, total_w, total_h)

    u_raw = ds_r.UCUR.values.squeeze()  # shape: (total_h, total_w)
    v_raw = ds_r.VCUR.values.squeeze()

    # Ocean mask: True where original (pre-resample) data exists.
    # Use the resampled mask — NaN after interpolation means no coverage.
    ocean = (~np.isnan(u_raw)).astype(np.uint8)

    # Fill NaN before normalising so land pixels encode as 0 in R/G
    u_filled = np.nan_to_num(u_raw, nan=0.0)
    v_filled = np.nan_to_num(v_raw, nan=0.0)

    u_norm = np.clip((u_filled - u_min) / (u_max - u_min) * 255, 0, 255).astype(np.uint8)
    v_norm = np.clip((v_filled - v_min) / (v_max - v_min) * 255, 0, 255).astype(np.uint8)

    saved = 0
    for cy in range(grid_rows):
        for cx in range(grid_cols):
            chunk_u = _extract_chunk(u_norm,  cx, cy, total_w, total_h)
            chunk_v = _extract_chunk(v_norm,  cx, cy, total_w, total_h)
            chunk_m = _extract_chunk(ocean,   cx, cy, total_w, total_h)

            h, w = chunk_u.shape  # (CHUNK_PX[1]+2, CHUNK_PX[0]+2) = (194, 242)
            img_array = np.zeros((h, w, 4), dtype=np.uint8)
            img_array[:, :, 0] = chunk_u        # R = U
            img_array[:, :, 1] = chunk_v        # G = V
            img_array[:, :, 2] = chunk_m * 255  # B = ocean mask
            img_array[:, :, 3] = 255            # A = always opaque

            out_path = base_dir / "ocean_current" / f"ocean_current_{lod}_{cx}_{cy}.png"
            out_path.parent.mkdir(parents=True, exist_ok=True)
            # optimize=False: do not reorder channels or apply colour-space transforms;
            # the RGBA bytes must be written exactly as-is so the shader can decode them.
            Image.fromarray(img_array, 'RGBA').save(out_path, optimize=False)
            saved += 1

    print(f"  LOD{lod}: saved {saved} chunks ({grid_cols}×{grid_rows}) to {base_dir / 'ocean_current'}")


def to_sea_level_anomaly_chunk_png(ds: xr.Dataset, base_dir: Path, lod: int) -> None:
    """
    Slice the full-region GSLA (sea-level anomaly) grid into per-chunk PNGs for the given LOD.

    Encoding matches gsla.py to_overlay_input:
      R/G/B = 24-bit normalised GSLA value
      A     = 255 for valid ocean, 0 for land/no-data (premultiplied)
    """
    grid_cols, grid_rows = LOD_GRIDS[lod]
    total_w = grid_cols * CHUNK_PX[0]
    total_h = grid_rows * CHUNK_PX[1]

    val_min = float(ds.GSLA.min(skipna=True).values)
    val_max = float(ds.GSLA.max(skipna=True).values)
    if val_max == val_min:
        val_max = val_min + 1.0
    val_range = val_max - val_min

    ds_r = _resample_to_grid(ds, total_w, total_h)
    raw = ds_r.GSLA.values.squeeze()  # shape: (total_h, total_w)

    ocean = (~np.isnan(raw)).astype(np.uint8)

    filled = np.nan_to_num(raw, nan=0.0)
    val_24 = np.clip((filled - val_min) / val_range * 16777215, 0, 16777215).astype(np.uint32)

    saved = 0
    for cy in range(grid_rows):
        for cx in range(grid_cols):
            chunk_24 = _extract_chunk(val_24, cx, cy, total_w, total_h)
            chunk_m  = _extract_chunk(ocean,  cx, cy, total_w, total_h)

            h, w = chunk_24.shape
            img_array = np.zeros((h, w, 4), dtype=np.uint8)
            img_array[:, :, 0] = (chunk_24 >> 16) & 0xFF  # R = high byte
            img_array[:, :, 1] = (chunk_24 >> 8)  & 0xFF  # G = mid byte
            img_array[:, :, 2] =  chunk_24         & 0xFF  # B = low byte
            img_array[:, :, 3] = chunk_m * 255             # A = ocean mask

            # Premultiplied alpha: zero RGB where land/no-data
            img_array[chunk_m == 0, :3] = 0

            out_path = base_dir / "sea_level_anomaly" / f"sea_level_anomaly_{lod}_{cx}_{cy}.png"
            out_path.parent.mkdir(parents=True, exist_ok=True)
            Image.fromarray(img_array, 'RGBA').save(out_path, optimize=False)
            saved += 1

    print(f"  LOD{lod}: saved {saved} overlay chunks ({grid_cols}×{grid_rows}) to {base_dir / 'sea_level_anomaly'}")


def to_manifest(ds: xr.Dataset, base_dir: Path) -> None:
    """
    Write one manifest.json per layer, consumed by the frontend at startup.

    ocean_current/manifest.json      — uRange/vRange for UCUR/VCUR chunk decoding.
    sea_level_anomaly/manifest.json  — valueRange for GSLA chunk decoding.
    """
    lon_min, lon_max, lat_min, lat_max = _get_bounds(ds)
    bounds = {
        "lonMin": lon_min,
        "lonMax": lon_max,
        "latMin": lat_min,
        "latMax": lat_max,
    }
    lod_meta = {
        str(lod): {
            "grid": list(LOD_GRIDS[lod]),
            "chunkPx": list(CHUNK_PX),
            "storedPx": [CHUNK_PX[0] + 2 * PADDING, CHUNK_PX[1] + 2 * PADDING],
            "padding": PADDING,
        }
        for lod in LOD_GRIDS
    }

    ocean_current_manifest = {
        "bounds": bounds,
        "uRange": [float(ds.UCUR.min(skipna=True).values), float(ds.UCUR.max(skipna=True).values)],
        "vRange": [float(ds.VCUR.min(skipna=True).values), float(ds.VCUR.max(skipna=True).values)],
        "lods": lod_meta,
    }

    sea_level_anomaly_manifest = {
        "bounds": bounds,
        "valueRange": [float(ds.GSLA.min(skipna=True).values), float(ds.GSLA.max(skipna=True).values)],
        "lods": lod_meta,
    }

    for folder, manifest in [
        ("ocean_current", ocean_current_manifest),
        ("sea_level_anomaly", sea_level_anomaly_manifest),
    ]:
        out_path = base_dir / folder / "manifest.json"
        out_path.parent.mkdir(parents=True, exist_ok=True)
        with open(out_path, "w") as f:
            json.dump(manifest, f, indent=2)
        print(f"  manifest: {out_path}")


# ── Entry point ───────────────────────────────────────────────────────────────

def create_chunks_for_date(date: datetime.datetime, base_dir: Path) -> None:
    """
    Generate all LOD chunk PNGs and manifest for a single date.

    Existing non-atlas outputs (gsla_input.png, gsla_meta.json, etc.) are
    produced by gsla.py and are not touched here.
    """
    print(f"Loading GSLA dataset for {date.strftime('%Y-%m-%d')} ...")
    ds = get_dataset(date)

    save_dir = base_dir / date.strftime("%y-%m-%d")
    save_dir.mkdir(parents=True, exist_ok=True)

    print("Generating chunks ...")
    to_ocean_current_chunk_png(ds, save_dir, lod=1)
    to_ocean_current_chunk_png(ds, save_dir, lod=2)
    to_sea_level_anomaly_chunk_png(ds, save_dir, lod=1)
    to_sea_level_anomaly_chunk_png(ds, save_dir, lod=2)
    to_manifest(ds, save_dir)

    print("Done.")


if __name__ == "__main__":
    create_chunks_for_date(
        date=datetime.datetime.strptime("26-01-01", "%y-%m-%d"),
        base_dir=Path("./generated-images"),
    )

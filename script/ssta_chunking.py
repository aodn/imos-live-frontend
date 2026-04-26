# python:3.11  source visualization-venv/bin/activate
"""
SSTA Atlas chunk generator for IMOS sea-surface temperature anomaly data.

Produces per-LOD PNG chunks and a data JSON file consumed by the WebGL Atlas renderer.

Output layout:
  {base_dir}/{SSTA}/manifest.json
  {base_dir}/{SSTA}/{lod}_{cx}_{cy}.png
  {base_dir}/{SSTA}/data.json

PNG channel encoding:
  R = bits 23-16 of 24-bit normalised value
  G = bits 15-8  of 24-bit normalised value
  B = bits  7-0  of 24-bit normalised value
  A = ocean mask (255 = valid ocean, 0 = land / no-data); RGB zeroed where A=0

data.json encoding:
  ssta — [[sst_anom], ...]  (°C anomaly values)

Chunk coordinate system:
  cx = 0 is the westernmost column
  cy = 0 is the northernmost row
  This matches image-space convention (origin top-left).
"""

import datetime
import json
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

import numpy as np
import s3fs
import xarray as xr
from PIL import Image

# ── LOD grid definitions ─────────────────────────────────────────────────────
SSTA = "austemp_sst_anomaly_sst_anom_mosaic"

LOD_GRIDS: dict[int, tuple[int, int]] = {
    1: (3, 3),    #   9 chunks  — 720  × 576   ~3.7× downsample
    2: (6, 5),    #  30 chunks  — 1440 × 960   ~1.9× downsample
    3: (12, 10),  # 120 chunks  — 2880 × 1920  ≈ native resolution (~0.02°/px)
}
# Minimum map zoom level at which each LOD should be loaded.
# LOD1 is the default (no threshold); higher LODs activate when the user zooms in.
LOD_ZOOM_THRESHOLDS: dict[int, int] = {
    2: 5,
    3: 6,
}
CHUNK_PX = (240, 192)   # (width, height) in data pixels
PADDING  = 1            # pixels of overlap on each side → stored chunk is 242 × 194


# ── Data loading ──────────────────────────────────────────────────────────────

def get_dataset(date: datetime.datetime) -> xr.Dataset:
    s3 = s3fs.S3FileSystem(anon=True)
    file_list = s3.ls(f"imos-data/IMOS/SRS/AusTemp/ssta/{date.year}/")
    ds = xr.open_dataset(
        s3.open(next((f for f in file_list if date.strftime("%Y%m%d") in f), None))
    )
    return ds.sel(
        time=date.strftime("%Y-%m-%d"),
        lat=slice(10, -60),
        lon=slice(90, 180),
    )


# ── Core helpers ──────────────────────────────────────────────────────────────

def _get_bounds(ds: xr.Dataset) -> tuple[float, float, float, float]:
    """Return (lon_min, lon_max, lat_min, lat_max) from the dataset's actual coordinates."""
    return (
        float(ds.lon.min().values),
        float(ds.lon.max().values),
        float(ds.lat.min().values),
        float(ds.lat.max().values),
    )


def _resample_to_grid(ds: xr.Dataset, total_w: int, total_h: int) -> xr.Dataset:
    """
    Resample dataset to (total_w × total_h) on a regular lat/lon grid.
    Latitudes run north→south (row 0 = lat_max) to match image-space cy=0 being northernmost.
    """
    lon_min, lon_max, lat_min, lat_max = _get_bounds(ds)
    target_lons = np.linspace(lon_min, lon_max, total_w)
    target_lats = np.linspace(lat_max, lat_min, total_h)  # north → south
    return ds.interp(lon=target_lons, lat=target_lats, method='linear')


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

    row_s = cy * ch
    col_s = cx * cw

    p_row_s = max(row_s - PADDING, 0)
    p_row_e = min(row_s + ch + PADDING, total_h)
    p_col_s = max(col_s - PADDING, 0)
    p_col_e = min(col_s + cw + PADDING, total_w)

    chunk = arr[p_row_s:p_row_e, p_col_s:p_col_e]

    pad_top    = PADDING if row_s == 0            else 0
    pad_bottom = PADDING if row_s + ch == total_h else 0
    pad_left   = PADDING if col_s == 0            else 0
    pad_right  = PADDING if col_s + cw == total_w else 0

    if pad_top or pad_bottom or pad_left or pad_right:
        chunk = np.pad(chunk, ((pad_top, pad_bottom), (pad_left, pad_right)), mode='edge')

    return chunk  # shape: (ch + 2*PADDING, cw + 2*PADDING)


# ── JSON value export ─────────────────────────────────────────────────────────

def to_ssta_data(dataset_in: xr.Dataset, base_dir: Path, date_str: str) -> None:
    """
    Write ssta/data.json consumed by the frontend.
    """
    out_path = base_dir / SSTA / date_str / "data.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        lat_min, lat_max = float(dataset_in.lat.min().values), float(dataset_in.lat.max().values)
        lat_offset = 0.5 * (lat_max - lat_min) / len(dataset_in.lat)
        lon_min, lon_max = float(dataset_in.lon.min().values), float(dataset_in.lon.max().values)
        lon_offset = 0.5 * (lon_max - lon_min) / len(dataset_in.lon)

        ds = dataset_in.squeeze()
        # Sort north→south so data[0] = northernmost row, matching PNG chunk orientation.
        # sortby is used instead of reversed() because it produces a guaranteed order
        # regardless of whether the source file's lat is ascending or descending.
        ds = ds.sortby("lat", ascending=False)

        values = ds.sst_anom_mosaic.fillna(0.).values
        rounded = [[round(float(v), 2) for v in row] for row in values]

        output = {
            "width": ds.sizes["lon"],
            "height": ds.sizes["lat"],
            "latRange": [lat_min - lat_offset, lat_max + lat_offset],
            "lonRange": [lon_min - lon_offset, lon_max + lon_offset],
            "data": rounded,
        }

        with open(out_path, "w") as f:
            json.dump(output, f, separators=(',', ':'))

        logger.info("  json value: %s", out_path)

    except Exception as e:
        logger.error("Error creating data JSON %s: %s", out_path, e)
        raise


# ── Main generators ───────────────────────────────────────────────────────────

def to_chunk_png(ds: xr.Dataset, base_dir: Path, date_str: str, lod: int) -> None:
    """
    Slice the full-region sst_anom_mosaic grid into per-chunk PNGs for the given LOD.

    The value is encoded as a 24-bit integer across R/G/B (matching ssta.py).
    Alpha = 255 for valid ocean pixels, 0 for land/no-data (premultiplied).
    Normalisation range is derived from the full pre-resampled dataset so every
    chunk shares the same scale — the frontend reads valueRange from the manifest.
    """
    grid_cols, grid_rows = LOD_GRIDS[lod]
    total_w = grid_cols * CHUNK_PX[0]
    total_h = grid_rows * CHUNK_PX[1]

    # Normalisation range from raw data, ignoring NaNs
    val_min = float(ds.sst_anom_mosaic.min(skipna=True).values)
    val_max = float(ds.sst_anom_mosaic.max(skipna=True).values)
    if val_max == val_min:
        val_max = val_min + 1.0
    val_range = val_max - val_min

    # Resample to LOD resolution; latitude runs north→south
    ds_r = _resample_to_grid(ds, total_w, total_h)
    raw = ds_r.sst_anom_mosaic.values.squeeze()  # shape: (total_h, total_w)

    # Ocean mask: valid where data exists after interpolation
    ocean = (~np.isnan(raw)).astype(np.uint8)

    # Normalise to 24-bit; fill NaN with 0 so land encodes as black
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

            out_path = base_dir / SSTA / date_str / f"{lod}_{cx}_{cy}.png"
            out_path.parent.mkdir(parents=True, exist_ok=True)
            # optimize=False: RGBA bytes must be written exactly as-is for shader decoding
            Image.fromarray(img_array, 'RGBA').save(out_path, optimize=False)
            saved += 1

    logger.info("  LOD%d: saved %d chunks (%d×%d) to %s", lod, saved, grid_cols, grid_rows, base_dir / SSTA / date_str)


def to_manifest(ds: xr.Dataset, base_dir: Path, date_str: str) -> None:
    """
    Write manifest.json consumed by the frontend at startup.

    valueRange holds the physical °C bounds used by the shader to decode
    the 24-bit R/G/B value back into the actual anomaly.
    """
    val_min = float(ds.sst_anom_mosaic.min(skipna=True).values)
    val_max = float(ds.sst_anom_mosaic.max(skipna=True).values)

    lon_min, lon_max, lat_min, lat_max = _get_bounds(ds)
    manifest = {
        "bounds": {
            "lonMin": lon_min,
            "lonMax": lon_max,
            "latMin": lat_min,
            "latMax": lat_max,
        },
        "valueRange": [val_min, val_max],
        "lods": {
            str(lod): {
                "grid": list(LOD_GRIDS[lod]),
                "chunkPx": list(CHUNK_PX),
                "storedPx": [CHUNK_PX[0] + 2 * PADDING, CHUNK_PX[1] + 2 * PADDING],
                "padding": PADDING,
                **( {"zoomThreshold": LOD_ZOOM_THRESHOLDS[lod]} if lod in LOD_ZOOM_THRESHOLDS else {} ),
            }
            for lod in LOD_GRIDS
        },
    }

    out_path = base_dir / SSTA / date_str / "manifest.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w") as f:
        json.dump(manifest, f, indent=2)

    logger.info("  manifest: %s", out_path)


# ── Entry point ───────────────────────────────────────────────────────────────

def create_ssta_chunks_for_date(date: datetime.datetime, base_dir: Path) -> None:
    """Generate all LOD chunk PNGs and manifest for a single date."""
    logger.info("Loading SSTA dataset for %s ...", date.strftime("%Y-%m-%d"))
    ds = get_dataset(date)

    date_str = date.strftime("%Y-%m-%d")

    logger.info("Generating chunks ...")
    to_chunk_png(ds, base_dir, date_str, lod=1)
    to_chunk_png(ds, base_dir, date_str, lod=2)
    to_chunk_png(ds, base_dir, date_str, lod=3)
    to_manifest(ds, base_dir, date_str)
    to_ssta_data(ds, base_dir, date_str)

    logger.info("Done.")


if __name__ == "__main__":
    # this basicConfig is to enable logging when directly running this script; 
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)-8s %(name)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    create_ssta_chunks_for_date(
        date=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=3),
        base_dir=Path("./generated-images"),
    )

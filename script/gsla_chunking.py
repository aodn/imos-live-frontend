# python:3.11  source visualization-venv/bin/activate
"""
Wind field Atlas chunk generator for GSLA ocean current data.

Produces per-LOD PNG chunks and data JSON files consumed by the WebGL Atlas renderer.

Output layout:
  {base_dir}/{OCEAN_CURRENT}/manifest.json
  {base_dir}/{OCEAN_CURRENT}/{lod}_{cx}_{cy}.png
  {base_dir}/{OCEAN_CURRENT}/data.json

  {base_dir}/{SEA_LEVEL_ANOMALY}/manifest.json
  {base_dir}/{SEA_LEVEL_ANOMALY}/{lod}_{cx}_{cy}.png
  {base_dir}/{SEA_LEVEL_ANOMALY}/data.json

PNG channel encoding — ocean_current chunks:
  R = U current component (8-bit, normalised across full region)
  G = V current component (8-bit, normalised across full region)
  B = ocean mask (255 = valid ocean, 0 = land / no-data)
  A = 255 (always — keeps premultiplied-alpha a no-op)

PNG channel encoding — sea_level_anomaly chunks:
  R/G/B = 24-bit normalised GSLA value (high→mid→low byte)
  A     = ocean mask (255 = valid ocean, 0 = land / no-data, premultiplied)

data.json encoding:
  ocean_current  — [[speed, direction], ...]  (speed m/s, direction degrees 0–360)
  sea_level_anomaly — [[gsla], ...]           (metres)

Chunk coordinate system:
  cx = 0 is the westernmost column  (lon ~ 89.9°E)
  cy = 0 is the northernmost row    (lat ~ 10.1°N)
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
# Each LOD is described as (grid_cols, grid_rows).
# CHUNK_PX is the data-pixel count per chunk before padding.
# PADDING adds 1 real-data pixel on each edge for seamless bilinear filtering.
OCEAN_CURRENT = "ocean_current_gsla_ucur_vcur"
SEA_LEVEL_ANOMALY = "ocean_current_gsla_gsla"

LOD_GRIDS: dict[int, tuple[int, int]] = {
    1: (2, 2),   # 4 chunks  — 480×384  ≈ original resolution (slight upsample)
}
# Minimum map zoom level at which each LOD should be loaded.
# LOD1 is the default (no threshold).
LOD_ZOOM_THRESHOLDS: dict[int, int] = {}
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


# ── JSON value export ─────────────────────────────────────────────────────────

def to_gsla_data(dataset_in: xr.Dataset, base_dir: Path, date_str: str) -> None:
    """
    Write per-layer data JSON files consumed by the frontend.

    ocean_current/gsla_data.json      — speed/direction per grid cell.
    sea_level_anomaly/gsla_data.json  — gsla value per grid cell.
    """
    try:
        lat_min, lat_max = dataset_in.LATITUDE.min().values.item(), dataset_in.LATITUDE.max().values.item()
        lat_offset = 0.5 * (lat_max - lat_min) / len(dataset_in.LATITUDE)
        lon_min, lon_max = dataset_in.LONGITUDE.min().values.item(), dataset_in.LONGITUDE.max().values.item()
        lon_offset = 0.5 * (lon_max - lon_min) / len(dataset_in.LONGITUDE)

        dataset_in["UCUR_NEW"] = dataset_in.UCUR.fillna(0.)
        dataset_in["VCUR_NEW"] = dataset_in.VCUR.fillna(0.)
        dataset_in["GSLA_NEW"] = dataset_in.GSLA.fillna(0.)
        dataset_in = dataset_in.squeeze()

        # Sort north→south so data[0] = northernmost row, matching PNG chunk orientation.
        # sortby is used instead of reversed() because it produces a guaranteed order
        # regardless of whether the source file's LATITUDE is ascending or descending.
        dataset_in = dataset_in.sortby("LATITUDE", ascending=False)

        u = dataset_in["UCUR_NEW"].values
        v = dataset_in["VCUR_NEW"].values
        gsla = dataset_in["GSLA_NEW"].values

        speed = np.sqrt(u * u + v * v)
        direction = np.arctan2(v, u) * 180 / np.pi
        direction = np.where(direction < 0, direction + 360, direction)

        meta = {
            "width": dataset_in.sizes["LONGITUDE"],
            "height": dataset_in.sizes["LATITUDE"],
            "latRange": [lat_min - lat_offset, lat_max + lat_offset],
            "lonRange": [lon_min - lon_offset, lon_max + lon_offset],
        }

        ocean_current_data = [
            [[round(s, 2), round(d, 2)] for s, d in row]
            for row in np.stack((speed, direction), axis=-1).tolist()
        ]
        sea_level_anomaly_data = [
            [round(g, 2) for g in row]
            for row in gsla.tolist()
        ]

        for folder, data in [
            (OCEAN_CURRENT, ocean_current_data),
            (SEA_LEVEL_ANOMALY, sea_level_anomaly_data),
        ]:
            out_path = base_dir / folder / date_str / "data.json"
            out_path.parent.mkdir(parents=True, exist_ok=True)
            with open(out_path, "w") as f:
                json.dump({**meta, "data": data}, f, separators=(',', ':'))
            logger.info("  json value: %s", out_path)

    except Exception as e:
        logger.error("Error creating data JSON in %s: %s", base_dir, e)
        raise


# ── Main generators ───────────────────────────────────────────────────────────

def to_ocean_current_chunk_png(ds: xr.Dataset, base_dir: Path, date_str: str, lod: int) -> None:
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

            out_path = base_dir / OCEAN_CURRENT / date_str / f"{lod}_{cx}_{cy}.png"
            out_path.parent.mkdir(parents=True, exist_ok=True)
            # optimize=False: do not reorder channels or apply colour-space transforms;
            # the RGBA bytes must be written exactly as-is so the shader can decode them.
            Image.fromarray(img_array, 'RGBA').save(out_path, optimize=False)
            saved += 1

    logger.info("  LOD%d: saved %d chunks (%d×%d) to %s", lod, saved, grid_cols, grid_rows, base_dir / OCEAN_CURRENT / date_str)


def to_sea_level_anomaly_chunk_png(ds: xr.Dataset, base_dir: Path, date_str: str, lod: int) -> None:
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

            out_path = base_dir / SEA_LEVEL_ANOMALY / date_str / f"{lod}_{cx}_{cy}.png"
            out_path.parent.mkdir(parents=True, exist_ok=True)
            Image.fromarray(img_array, 'RGBA').save(out_path, optimize=False)
            saved += 1

    logger.info("  LOD%d: saved %d overlay chunks (%d×%d) to %s", lod, saved, grid_cols, grid_rows, base_dir / SEA_LEVEL_ANOMALY / date_str)


def to_manifest(ds: xr.Dataset, base_dir: Path, date_str: str) -> None:
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
            **( {"zoomThreshold": LOD_ZOOM_THRESHOLDS[lod]} if lod in LOD_ZOOM_THRESHOLDS else {} ),
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
        (OCEAN_CURRENT, ocean_current_manifest),
        (SEA_LEVEL_ANOMALY, sea_level_anomaly_manifest),
    ]:
        out_path = base_dir / folder / date_str / "manifest.json"
        out_path.parent.mkdir(parents=True, exist_ok=True)
        with open(out_path, "w") as f:
            json.dump(manifest, f, indent=2)
        logger.info("  manifest: %s", out_path)


# ── Entry point ───────────────────────────────────────────────────────────────

def create_chunks_for_date(date: datetime.datetime, base_dir: Path) -> None:
    """
    Generate all LOD chunk PNGs and manifest for a single date.
    """
    logger.info("Loading GSLA dataset for %s ...", date.strftime("%Y-%m-%d"))
    ds = get_dataset(date)

    date_str = date.strftime("%Y-%m-%d")

    logger.info("Generating chunks ...")
    to_ocean_current_chunk_png(ds, base_dir, date_str, lod=1)
    to_sea_level_anomaly_chunk_png(ds, base_dir, date_str, lod=1)
    to_manifest(ds, base_dir, date_str)
    to_gsla_data(ds, base_dir, date_str)

    logger.info("Done.")


if __name__ == "__main__":
    # this basicConfig is to enable logging when directly running this script; 
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)-8s %(name)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    create_chunks_for_date(
        date=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=3),
        base_dir=Path("./generated-images"),
    )

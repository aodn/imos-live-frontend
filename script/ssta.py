# python:3.11 source visualization-venv/bin/activate
import hvplot
import s3fs
import xarray as xr
import holoviews as hv
import cartopy.crs as ccrs
import cartopy.io.shapereader as shpreader
from shapely.geometry import shape
from shapely.ops import unary_union
from shapely.vectorized import contains
import numpy as np
from scipy import ndimage
from PIL import Image
import json
from pathlib import Path
import datetime

hv.extension('matplotlib')


def get_dataset(date):
    s3 = s3fs.S3FileSystem(anon=True)
    file_list = s3.ls(f"imos-data/IMOS/SRS/AusTemp/ssta/{date.year}/")
    ds = xr.open_dataset(
        s3.open(
            next((f for f in file_list if date.strftime("%Y%m%d") in f), None)
        )
    )

    # add coordinate reference system info so that xarray can interpret it
    ds.attrs['crs'] = ccrs.PlateCarree()  # "WGS84"
    
    # return slightly smaller subset to speed up and avoid issues around LON=180...
    return ds.sel(time=date.strftime("%Y-%m-%d"), lat=slice(10, -60), lon=slice(90, 180))



def to_overlay_input(dataset_in, filename):
    sst_anom_mosaic_raw = dataset_in.sst_anom_mosaic.values.squeeze().copy()
    lats = dataset_in.lat.values
    lons = dataset_in.lon.values

    # ==== STEP 1: Fill NaNs with nearest neighbor ====
    original_nan_mask = np.isnan(sst_anom_mosaic_raw)
    mask = np.isnan(sst_anom_mosaic_raw)
    if np.any(mask):
        nearest_indices = ndimage.distance_transform_edt(
            mask, return_distances=False, return_indices=True
        )
        sst_anom_mosaic_raw[mask] = sst_anom_mosaic_raw[tuple(nearest_indices[:, mask])]

    # ==== STEP 2: Normalize to 0-1 ====
    sst_anom_mosaic_MIN, sst_anom_mosaic_MAX = np.nanmin(sst_anom_mosaic_raw), np.nanmax(sst_anom_mosaic_raw)
    sst_anom_mosaic_range = sst_anom_mosaic_MAX - sst_anom_mosaic_MIN
    sst_anom_mosaic_normalized = (sst_anom_mosaic_raw - sst_anom_mosaic_MIN) / sst_anom_mosaic_range if sst_anom_mosaic_range > 0 else np.zeros_like(sst_anom_mosaic_raw)

    # ==== STEP 3: Land mask on original equirectangular grid ====
    print("Loading Natural Earth land data...")
    land_shp = shpreader.natural_earth(resolution='50m', category='physical', name='land')
    reader = shpreader.Reader(land_shp)
    land_polygons = [shape(record.geometry) for record in reader.records()]
    land_union = unary_union(land_polygons)

    lon_mesh, lat_mesh = np.meshgrid(lons, lats)
    land_mask = contains(land_union, lon_mesh, lat_mesh)

    alpha = (~original_nan_mask).astype(np.uint8)
    alpha[land_mask] = 0

    # ==== STEP 4: Encode into RGBA ====
    sst_anom_mosaic_24bit = (np.clip(sst_anom_mosaic_normalized, 0, 1) * 16777215).astype(np.uint32)
    height, width = sst_anom_mosaic_raw.shape
    img_array = np.zeros((height, width, 4), dtype=np.uint8)
    img_array[:, :, 0] = (sst_anom_mosaic_24bit >> 16) & 0xFF
    img_array[:, :, 1] = (sst_anom_mosaic_24bit >> 8) & 0xFF
    img_array[:, :, 2] = sst_anom_mosaic_24bit & 0xFF
    img_array[:, :, 3] = alpha * 255

    # Zero out RGB where alpha=0 (premultiplied alpha) so gl.LINEAR interpolation
    # at coastlines blends toward transparent black instead of the filled NaN color,
    # eliminating the bright halo artifact around land.
    img_array[alpha == 0, :3] = 0

    img = Image.fromarray(img_array, 'RGBA')
    img.save(filename)
    print(f"Saved equirectangular sst_anom_mosaic data texture to {filename}")


def to_json_meta(dataset_in, filename):
    with open(filename, 'w') as f:
        lat_min, lat_max = dataset_in.lat.min().values.item(), dataset_in.lat.max().values.item()
        lat_offset = 0.5 * (lat_max - lat_min) / len(dataset_in.lat)
        lon_min, lon_max = dataset_in.lon.min().values.item(), dataset_in.lon.max().values.item()
        lon_offset = 0.5 * (lon_max - lon_min) / len(dataset_in.lon)
        json.dump({
            "latRange": [lat_min - lat_offset, lat_max + lat_offset],
            "lonRange": [lon_min - lon_offset, lon_max + lon_offset],
            "rawLonRange": [lon_min, lon_max],
            "rawLatRange": [lat_min, lat_max],
            'valueRange': [dataset_in.sst_anom_mosaic.min().values.item(), dataset_in.sst_anom_mosaic.max().values.item()]
        }, f, indent=4)


def create_sst_anom_mosaic_data_for_date(date, base_dir):
    dataset = get_dataset(date)
    save_dir = base_dir / date.strftime("%y-%m-%d")
    save_dir.mkdir(parents=True, exist_ok=True)
    to_overlay_input(dataset, save_dir / "sst_anom_mosaic_overlay_input.png")
    to_json_meta(dataset, save_dir / "sst_anom_mosaic_meta.json")

if __name__ == "__main__":
    create_sst_anom_mosaic_data_for_date(
        datetime.datetime.strptime('2026-01-01', "%Y-%m-%d"),
        Path("./generated-images")
    )
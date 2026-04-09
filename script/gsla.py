# python:3.11 source visualization-venv/bin/activate
import s3fs
import xarray as xr
import holoviews as hv
from hvplot import xarray
import cartopy.crs as ccrs
import cartopy.io.shapereader as shpreader
from shapely.geometry import shape
from shapely.ops import unary_union
from shapely.vectorized import contains
import numpy as np
from scipy import ndimage
from scipy.interpolate import RegularGridInterpolator
import matplotlib.pyplot as plt
from PIL import Image
import json
from pathlib import Path

import datetime

hv.extension('matplotlib')

# IMOS/SRS/AusTemp/ssta/2026/20260309_IMOS_AusTemp-sst-anomaly_AUS_fv02.nc




def get_dataset(date):
    s3 = s3fs.S3FileSystem(anon=True)
    file_list = s3.ls(f"imos-data/IMOS/OceanCurrent/GSLA/NRT/{date.year}/")
    ds = xr.open_dataset(
        s3.open(
            next((f for f in file_list if date.strftime("%Y%m%d") in f), None)
        )
    )

    # add coordinate reference system info so that xarray can interpret it
    ds.attrs['crs'] = ccrs.PlateCarree()  # "WGS84"
    
    # return slightly smaller subset to speed up and avoid issues around LON=180...
    return ds.sel(TIME=date.strftime("%Y-%m-%d"), LATITUDE=slice(-60, 10), LONGITUDE=slice(90, 180))
    # return ds.sel(LATITUDE=slice(-50, 0), LONGITUDE=slice(110, 170))



def to_overlay_input(dataset_in, filename):
    gsla_raw = dataset_in.GSLA.values.squeeze().copy()
    lats = dataset_in.LATITUDE.values
    lons = dataset_in.LONGITUDE.values

    # ==== STEP 1: Fill NaNs with nearest neighbor ====
    original_nan_mask = np.isnan(gsla_raw)
    mask = np.isnan(gsla_raw)
    if np.any(mask):
        nearest_indices = ndimage.distance_transform_edt(
            mask, return_distances=False, return_indices=True
        )
        gsla_raw[mask] = gsla_raw[tuple(nearest_indices[:, mask])]

    # ==== STEP 2: Normalize to 0-1 ====
    GSLA_MIN, GSLA_MAX = np.nanmin(gsla_raw), np.nanmax(gsla_raw)
    gsla_range = GSLA_MAX - GSLA_MIN
    gsla_normalized = (gsla_raw - GSLA_MIN) / gsla_range if gsla_range > 0 else np.zeros_like(gsla_raw)

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
    gsla_24bit = (np.clip(gsla_normalized, 0, 1) * 16777215).astype(np.uint32)
    height, width = gsla_raw.shape
    img_array = np.zeros((height, width, 4), dtype=np.uint8)
    img_array[:, :, 0] = (gsla_24bit >> 16) & 0xFF
    img_array[:, :, 1] = (gsla_24bit >> 8) & 0xFF
    img_array[:, :, 2] = gsla_24bit & 0xFF
    img_array[:, :, 3] = alpha * 255

    # Zero out RGB where alpha=0 (premultiplied alpha) so gl.LINEAR interpolation
    # at coastlines blends toward transparent black instead of the filled NaN color,
    # eliminating the bright halo artifact around land.
    img_array[alpha == 0, :3] = 0

    # Flip vertically so row 0 = northernmost lat (lats are ascending south→north)
    img_array = np.flipud(img_array)

    img = Image.fromarray(img_array, 'RGBA')
    img.save(filename)
    print(f"Saved equirectangular GSLA data texture to {filename}")


# convert netcdf file to png image, including information of an area's occean current per a period of time.
def to_png_input(dataset_in, filename):
    dataset_in["ALPHA"] = np.logical_not(np.logical_and(dataset_in.UCUR.isnull(), dataset_in.VCUR.isnull()))
    
    # create new dataset with NaNs removed and rescaled to 0-255
    dataset_in["UCUR_NEW"] = dataset_in.UCUR.fillna(0.)
    dataset_in["VCUR_NEW"] = dataset_in.VCUR.fillna(0.)
    
    UCUR_MIN, UCUR_MAX = dataset_in.UCUR_NEW.min(), dataset_in.UCUR_NEW.max()
    VCUR_MIN, VCUR_MAX = dataset_in.VCUR_NEW.min(), dataset_in.VCUR_NEW.max()
    
    # rescale the data to 0-255 for display
    dataset_in["UCUR_NEW"] = 255 * (dataset_in.UCUR_NEW - UCUR_MIN) / (UCUR_MAX - UCUR_MIN)
    dataset_in["VCUR_NEW"] = 255 * (dataset_in.VCUR_NEW - VCUR_MIN) / (VCUR_MAX - VCUR_MIN)

    dataset_in = dataset_in.squeeze()

    stacked = dataset_in.reindex(LATITUDE=list(reversed(dataset_in.LATITUDE)))

    stacked = stacked.stack(z=["LATITUDE", "LONGITUDE"])
    
    # get the U, V and ALPHA values from the stacked dataset, U, V and ALPHA are the new names for UCUR, VCUR and ALPHA respectively, and they are all 1D arrays now.
    Us, Vs, ALPHAs = stacked.UCUR_NEW.values, stacked.VCUR_NEW.values, stacked.ALPHA.values
   
    # convert data to a png, with U and V in the R and G channels and the show particle flag in B channel
    img_data = []

    for i, (U, V, ALPHA) in enumerate(zip(Us, Vs, ALPHAs)):
         img_data.extend([int(U), int(V), 255*ALPHA, 255])

    img = Image.frombytes('RGBA', (dataset_in.sizes['LONGITUDE'], dataset_in.sizes['LATITUDE']), bytes(img_data))
    img.save(filename)

# convert to a 2-d array incuding original uvur, vcur, alpha and gsla value.
def to_json_value(dataset_in, filename):
    """
    Convert to a 2-d array including original ucur, vcur and gsla value.

    Args:
        dataset_in: xarray Dataset containing the data
        filename: Output filename for the JSON
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

        dataset_in = dataset_in.reindex(LATITUDE=list(reversed(dataset_in.LATITUDE)))

        u = dataset_in["UCUR_NEW"].values
        v = dataset_in["VCUR_NEW"].values
        gsla = dataset_in["GSLA_NEW"].values

        speed = np.sqrt(u * u + v * v)
        direction = np.arctan2(v, u) * 180 / np.pi
        direction = np.where(direction < 0, direction + 360, direction)

        combined = np.stack((speed, direction, gsla), axis=-1).tolist()
        rounded = [[[round(speed, 2), round(direction, 2), round(gsla, 2)]
                    for speed, direction, gsla in row] for row in combined]

        output = {
            "width": dataset_in.sizes["LONGITUDE"],
            "height": dataset_in.sizes["LATITUDE"],
            "latRange": [lat_min - lat_offset, lat_max + lat_offset],
            "lonRange": [lon_min - lon_offset, lon_max + lon_offset],
            "data": rounded
        }

        with open(filename, "w") as f:
            json.dump(output, f, separators=(',', ':'))


    except Exception as e:
        print(f"Error creating data JSON {filename}: {e}")
        raise


# get the bound and uRange and vRange
def to_json_meta(dataset_in, filename):
    with open(filename, 'w') as f:
        lat_min, lat_max = dataset_in.LATITUDE.min().values.item(), dataset_in.LATITUDE.max().values.item()
        lat_offset = 0.5 * (lat_max - lat_min) / len(dataset_in.LATITUDE)
        lon_min, lon_max = dataset_in.LONGITUDE.min().values.item(), dataset_in.LONGITUDE.max().values.item()
        lon_offset = 0.5 * (lon_max - lon_min) / len(dataset_in.LONGITUDE)
        json.dump({
            "latRange": [lat_min - lat_offset, lat_max + lat_offset],
            "lonRange": [lon_min - lon_offset, lon_max + lon_offset],
            "rawLonRange": [lon_min, lon_max],    
            "rawLatRange": [lat_min, lat_max],
            "uRange": [dataset_in.UCUR.min().values.item(), dataset_in.UCUR.max().values.item()],
            "vRange": [dataset_in.VCUR.min().values.item(), dataset_in.VCUR.max().values.item()],
            'valueRange': [dataset_in.GSLA.min().values.item(), dataset_in.GSLA.max().values.item()]
        }, f, indent=4)




def create_gsla_data_for_date(date, base_dir):
    dataset = get_dataset(date)
    save_dir = base_dir / date.strftime("%y-%m-%d")
    save_dir.mkdir(parents=True, exist_ok=True)
    to_overlay_input(dataset, save_dir / "gsla_overlay_input.png")
    to_png_input(dataset, save_dir / "gsla_input.png")
    to_json_meta(dataset, save_dir / "gsla_meta.json")
    to_json_value(dataset,save_dir / "gsla_data.json")

if __name__ == "__main__":
    create_gsla_data_for_date(
        datetime.datetime.strptime('26-01-01', "%y-%m-%d"),
        Path("./generated-images")
            # saved to generated-images folder
    )
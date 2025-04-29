import sys
import s3fs
import xarray as xr
import holoviews as hv
from hvplot import xarray
import hvplot
import cartopy.crs as ccrs
import numpy as np
import matplotlib.pyplot as plt
from PIL import Image
import json
import datetime
from pathlib import Path

hv.extension('matplotlib')



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
    return ds.sel(TIME=date.strftime("%Y-%m-%d"), LATITUDE=slice(-50, 0), LONGITUDE=slice(110, 170))
    # return ds.sel(LATITUDE=slice(-50, 0), LONGITUDE=slice(110, 170))


def to_png_overlay(dataset_in, filename):
    # Plot data in web mercator projection
    # quadmesh is a latitude-longitude grid, where each point has a value.
    mplt = dataset_in.GSLA.hvplot.quadmesh(
        title='',
        grid=False,
        cmap='viridis',
        geo=True,
        coastline="10m",
        hover=True,
        colorbar=False,
        height=700,
        projection='Mercator',
        xaxis=None,
        yaxis=None
    )

    # Save plot without a frame or padding, with NaN as transparent
    # and with a higher than normal resolution
    fig = hvplot.render(mplt, backend="matplotlib")
    fig.axes[0].set_frame_on(False)
    fig.savefig(filename, bbox_inches='tight', pad_inches=0, transparent=True, dpi=600)

# convert netcdf file to png image, including information of an area's occean current per a period of time.
def to_png_input(dataset_in, filename):
    dataset_in["ALPHA"] = np.logical_not(np.logical_and(dataset_in.UCUR.isnull(), dataset_in.VCUR.isnull()))
    
    
    # create new dataset with NaNs removed and rescaled to 0-255
    dataset_in["UCUR_NEW"] = dataset_in.UCUR.fillna(0.)
    dataset_in["VCUR_NEW"] = dataset_in.VCUR.fillna(0.)
    dataset_in = dataset_in.squeeze()
    
    UCUR_MIN, UCUR_MAX = dataset_in.UCUR_NEW.min(), dataset_in.UCUR_NEW.max()
    VCUR_MIN, VCUR_MAX = dataset_in.VCUR_NEW.min(), dataset_in.VCUR_NEW.max()

    
    # rescale the data to 0-255 for display
    dataset_in["UCUR_NEW"] = 255 * (dataset_in.UCUR_NEW - UCUR_MIN) / (UCUR_MAX - UCUR_MIN)
    dataset_in["VCUR_NEW"] = 255 * (dataset_in.VCUR_NEW - VCUR_MIN) / (VCUR_MAX - VCUR_MIN)

    stacked = dataset_in.reindex(LATITUDE=list(reversed(dataset_in.LATITUDE)))
    stacked = stacked.stack(z=["LATITUDE", "LONGITUDE"])
    
    Us, Vs, ALPHAs = stacked.UCUR_NEW.values, stacked.VCUR_NEW.values, stacked.ALPHA.values
   
    img_data = []

    for i, (U, V, ALPHA) in enumerate(zip(Us, Vs, ALPHAs)):
         img_data.extend([int(U), int(V), 255*ALPHA, 255])
    
   
    # Image.frombytes(mode, size, data)
    # size = (width, height)
    img = Image.frombytes('RGBA', (dataset_in.sizes['LONGITUDE'], dataset_in.sizes['LATITUDE']), bytes(img_data))
    img.save(filename)

# convert to a 2-d array incuding original uvur, vcur, alpha and gsla value.
def to_json_value(dataset_in,filename):
    lat_min, lat_max = dataset_in.LATITUDE.min().values.item(), dataset_in.LATITUDE.max().values.item()
    lat_offset = 0.5 * (lat_max - lat_min) / len(dataset_in.LATITUDE)
    lon_min, lon_max = dataset_in.LONGITUDE.min().values.item(), dataset_in.LONGITUDE.max().values.item()
    lon_offset = 0.5 * (lon_max - lon_min) / len(dataset_in.LONGITUDE)

    dataset_in["ALPHA"] = np.logical_not(np.logical_and(dataset_in.UCUR.isnull(), dataset_in.VCUR.isnull()))
    dataset_in["UCUR_NEW"] = dataset_in.UCUR.fillna(0.)
    dataset_in["VCUR_NEW"] = dataset_in.VCUR.fillna(0.)
    dataset_in["GSLA_NEW"] = dataset_in.GSLA.fillna(0.)
    dataset_in = dataset_in.squeeze()
   
    dataset_in = dataset_in.reindex(LATITUDE=list(reversed(dataset_in.LATITUDE)))

    u = dataset_in["UCUR_NEW"].values 
    v = dataset_in["VCUR_NEW"].values
    alpha = dataset_in["ALPHA"].values
    gsla = dataset_in["GSLA_NEW"].values

    combined = np.stack((u, v, alpha, gsla), axis=-1).tolist()
    rounded = [[[u,v, alpha, gsla] for u, v, alpha, gsla in row] for row in combined]
    output = {
    "width": dataset_in.sizes["LONGITUDE"],
    "height": dataset_in.sizes["LATITUDE"],
    "latRange": [lat_min - lat_offset, lat_max + lat_offset],
    "lonRange": [lon_min - lon_offset, lon_max + lon_offset],
    "data": rounded
    }   
   
    with open(filename, "w") as f:
        json.dump(output, f)



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
            "uRange": [dataset_in.UCUR.min().values.item(), dataset_in.UCUR.max().values.item()],
            "vRange": [dataset_in.VCUR.min().values.item(), dataset_in.VCUR.max().values.item()],
             "width": dataset_in.sizes["LONGITUDE"],
             "height": dataset_in.sizes["LATITUDE"]
        }, f, indent=4)

def create_gsla_data_for_date(date, base_dir):
    dataset = get_dataset(date)
    save_dir = base_dir / date.strftime("%y-%m-%d")
    save_dir.mkdir(parents=True, exist_ok=True)
    to_json_meta(dataset, save_dir / "gsla_meta.json")
    to_json_value(dataset,save_dir / "gsla_data.json")
    to_png_overlay(dataset, save_dir / "gsla_overlay.png")
    to_png_input(dataset, save_dir / "gsla_input.png")
    
# if __name__ == "__main__":
#     for date in [
#         # datetime.datetime(2024, 6, 15),
#         # datetime.datetime(2024, 6, 16),
#         # datetime.datetime(2024, 6, 17),
#         # datetime.datetime(2024, 6, 18),
#          datetime.datetime(2025, 4, 25),
#     ]:
#         create_gsla_data_for_date(
#             date,
#             Path("../imos-mapbox-app/public/")
#         )

if __name__ == "__main__":
    today = datetime.datetime.today()
    end_date = today - datetime.timedelta(days=3)
    

    for delta in range(7):
        date = end_date - datetime.timedelta(days=6 - delta)
        create_gsla_data_for_date(
            date,
            Path("../imos-mapbox-app/public/")
        )

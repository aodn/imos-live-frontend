# Ocean Current Particle Image Generator — Documentation

This module processes oceanographic NetCDF data stored in AWS S3 to generate visualizations and metadata for use in WebGL-based ocean current particle simulations. It converts raw GSLA, UCR, and VCR values into:

- A PNG overlay visualizing sea level anomalies
- A PNG vector field texture encoding ocean currents
- A JSON metadata file with relevant bounds and ranges

---

## Dependencies

- `s3fs`
- `xarray`
- `holoviews`, `hvplot`
- `matplotlib`, `PIL`
- `numpy`, `json`, `pathlib`, `datetime`

---

## Dataset

**Product**: Gridded Sea Level Anomaly - Australia Region

- Gridded (adjusted) sea level anomaly (GSLA), gridded sea level (GSL) and surface geostrophic velocity (UCUR, VCUR) for the Australasian region.
- GSLA is mapped using optimal interpolation of detided, de-meaned, inverse-barometer-adjusted altimeter and tidegauge estimates of sea level.
- GSL is GSLA plus an estimate of the departure of mean sea level from the geoid.
- The geostrophic velocities are derived from GSL.

### Dimensions

- `TIME`, `LONGITUDE`, `LATITUDE`

### Type

- NetCDF

### Variables

| Variable | Full Name                            | Description                                                                                                          | Unit                    |
| -------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| `UCUR`   | total eastward geostrophic velocity  | Eastward geostrophic velocity derived from GSLA + UCUR_MEAN                                                          | meters per second (m/s) |
| `VCUR`   | total northward geostrophic velocity | Northward geostrophic velocity derived from GSLA + VCUR_MEAN                                                         | meters per second (m/s) |
| `GSLA`   | gridded (adjusted) sea level anomaly | Altimeter and tidegauge estimates of adjusted sea level anomaly mapped onto a grid using optimal interpolation (OI). | meters (m)              |

---

## Core Functionality

### `get_dataset(date)`

Fetches and returns a subset of **Gridded Sea Level Anomaly (GSLA)** data for a given date from the IMOS S3 archive.

#### Parameters

| Name   | Type                                   | Description                                           |
| ------ | -------------------------------------- | ----------------------------------------------------- |
| `date` | `datetime.date` or `datetime.datetime` | The target date for which GSLA data is to be fetched. |

#### Returns

| Type             | Description                                                                     |
| ---------------- | ------------------------------------------------------------------------------- |
| `xarray.Dataset` | A sliced dataset containing GSLA data over a defined region for the given date. |

#### Data Source

- **Provider**: IMOS (Integrated Marine Observing System)
- **Location**: `s3://imos-data/IMOS/OceanCurrent/GSLA/NRT/{year}/...`
- **Format**: NetCDF via S3 access using `s3fs`

#### Sliced Geographic Region

| Dimension   | Range          | Meaning                                 |
| ----------- | -------------- | --------------------------------------- |
| `LATITUDE`  | `-50` to `0`   | Southern Ocean to the Equator           |
| `LONGITUDE` | `110` to `170` | Western Australia to Fiji/South Pacific |
| `TIME`      | exact match    | Only the slice for the specified date   |

- CRS is set to `PlateCarree()` (WGS84)
- Region avoids longitude wrapping issues near 180°E

#### Workflow

1. Initialize S3 filesystem with `s3fs`
2. Find the correct NetCDF file for the given date
3. Load dataset with `xarray`
4. Set CRS attribute for mapping
5. Return sliced region for lat/lon/time

---

### `to_png_overlay(dataset_in, filename)`

Generates a high-resolution, transparent PNG image visualizing **Gridded Sea Level Anomaly (GSLA)** values using a geographic projection.

#### Parameters

| Name         | Type             | Description                                                                |
| ------------ | ---------------- | -------------------------------------------------------------------------- |
| `dataset_in` | `xarray.Dataset` | Dataset containing the `GSLA` variable and latitude/longitude coordinates. |
| `filename`   | `str or Path`    | Output file path to save the resulting PNG image.                          |

#### Output

- Color-coded PNG using **Viridis** colormap
- **Dark purple → yellow** (low to high anomalies)
- Transparent background
- 600 DPI high-resolution

#### Projection: Web Mercator

- Preserves shapes and angles for tiled web maps
- Standard projection for Google Maps, Mapbox, etc.
- Distorts area near poles, accurate in mid-latitudes
- Converts geographic to flat 2D map projection

#### Workflow

1. Plot GSLA with `hvplot.quadmesh`
2. Apply Web Mercator projection
3. Render with `matplotlib`
4. Save transparent image using `bbox_inches='tight'`

---

### `to_png_input(dataset_in, filename)`

Generates a **vector field texture** PNG image encoding U/V ocean current velocity components.

#### Parameters

| Name         | Type             | Description                 |
| ------------ | ---------------- | --------------------------- |
| `dataset_in` | `xarray.Dataset` | Dataset with `UCUR`, `VCUR` |
| `filename`   | `str or Path`    | Output PNG path             |

#### RGBA Encoding

| Channel | Description                                |
| ------- | ------------------------------------------ |
| R       | `UCUR` scaled to [0–255]                   |
| G       | `VCUR` scaled to [0–255]                   |
| B       | Particle display flag (1 = valid, 0 = NaN) |
| A       | 255 (fully opaque)                         |

#### Workflow

1. Create `ALPHA` mask for displayable grid points
2. Fill NaNs and rescale `UCUR`/`VCUR`
3. Squeeze time dimension
4. Reverse latitude (top-left = NW)
5. Stack lat/lon into 1D array
6. Convert to bytes and save PNG with `PIL`

---

### `to_json_meta(dataset_in, filename)`

Outputs a JSON file describing data bounds and velocity ranges.

#### Parameters

| Name         | Type             | Description      |
| ------------ | ---------------- | ---------------- |
| `dataset_in` | `xarray.Dataset` | Input dataset    |
| `filename`   | `str or Path`    | Output JSON path |

#### Output Format

```json
{
  "latRange": [lat_min, lat_max],
  "lonRange": [lon_min, lon_max],
  "uRange": [min_UCUR, max_UCUR],
  "vRange": [min_VCUR, max_VCUR]
}
```

- Adds half-cell padding to bounds
- Used for pixel-to-coordinate mapping in WebGL shaders

---

### `create_gsla_data_for_date(date, base_dir)`

Runs all 3 generation steps for a single date.

#### Output

Saved in `yyyy-mm-dd/` format:

- `gsla_overlay.png`
- `gsla_input.png`
- `gsla_meta.json`

#### Directory Structure

```sh
imos-mapbox-app/public/
├── 2024-04-05/
│   ├── gsla_overlay.png
│   ├── gsla_input.png
│   └── gsla_meta.json
```

---

## Script Execution

Processes last 7 days ending 3 days ago:

```python
if __name__ == "__main__":
    today = datetime.datetime.today()
    end_date = today - datetime.timedelta(days=3)

    for delta in range(7):
        date = end_date - datetime.timedelta(days=6 - delta)
        create_gsla_data_for_date(
            date,
            Path("../imos-mapbox-app/public/")
        )
```

---

## Output Summary

| File               | Description                                    |
| ------------------ | ---------------------------------------------- |
| `gsla_overlay.png` | Sea level anomaly color overlay                |
| `gsla_input.png`   | U/V velocity encoded image for shader sampling |
| `gsla_meta.json`   | Metadata for lat/lon bounds and vector ranges  |

---

## Notes

- 2D lightweight outputs optimized for GPU
- Transparent background support
- Handles CRS setup, missing data, and image reversal
- Designed for integration with WebGL + Mapbox image layers

# Data Processing Pipeline

The `script/` directory contains two Python scripts that convert daily IMOS oceanographic data from AWS S3 into chunked PNG tiles and manifest files consumed by the WebGL Atlas renderer.

**Requirements:** Python 3.11, `visualization-venv`:

```sh
source visualization-venv/bin/activate
# Dependencies: numpy, xarray, s3fs, Pillow
```

---

## Common Concepts

### Chunking and LODs

Each script resamples the full data grid to a fixed resolution, then slices it into a `cols × rows` grid of **chunks** for each LOD. Every chunk is saved as a **242 × 194 px** PNG (240 × 192 data pixels + 1 px padding on each side).

The 1 px padding lets adjacent chunks share border pixels so bilinear sampling in the shader does not bleed into neighbouring tiles. Edge chunks replicate their boundary pixel (`np.pad` `'edge'` mode) where no neighbour exists.

LOD1 always loads. LOD2+ activate when the map zoom exceeds their `zoomThreshold`.

### Normalisation

Normalisation ranges are derived from the **full pre-resampled dataset** (entire region, ignoring NaNs) before the grid is sliced into chunks. Every chunk at a given LOD therefore shares the same scale. The frontend reads the range from `manifest.json` and applies it uniformly when decoding pixels.

### manifest.json and data.json

`manifest.json` format is documented in [Atlas Rendering System — Tile & LOD configuration](../src/AtlasRenderingSystem/README.md#tile--lod-configuration-manifestjson). Ocean current manifests use `uRange`/`vRange` (m/s) instead of `valueRange`.

`data.json`

Written once per product per date. Contains a flat 2D grid of decoded values used by the frontend for click-to-inspect.

```json
{
  "width": …, "height": …,
  "latRange": [min, max], "lonRange": [min, max],
  "data": [[…], …]
}
```

---

## `gsla_chunking.py` — GSLA Ocean Current & Sea Level Anomaly

Processes GSLA (Gridded Sea Level Anomaly) NRT data. Produces two separate products from one dataset.

**Source:** `s3://imos-data/IMOS/OceanCurrent/GSLA/NRT/{year}/`

**Dataset dimensions:** `TIME`, `LATITUDE`, `LONGITUDE`

**Dataset variables:**

| Variable | Description                          | Unit |
| -------- | ------------------------------------ | ---- |
| `UCUR`   | Total eastward geostrophic velocity  | m/s  |
| `VCUR`   | Total northward geostrophic velocity | m/s  |
| `GSLA`   | Gridded (adjusted) sea level anomaly | m    |

**Geographic region:** LATITUDE −60 to 10, LONGITUDE 90 to 180

**LOD config:** LOD1 only — grid `(2 × 2)` = 4 chunks. No zoom thresholds.

### Product: ocean current (`ocean_current_gsla_ucur_vcur`)

PNG encoding (RGBA):

| Channel | Content                                   |
| ------- | ----------------------------------------- |
| R       | UCUR normalised to [0, 255]               |
| G       | VCUR normalised to [0, 255]               |
| B       | Ocean mask: 255 = ocean, 0 = land/no-data |
| A       | 255 (always opaque)                       |

Manifest includes `uRange` and `vRange` so the shader can invert the normalisation back to m/s.

`data.json` stores `[[speed_m/s, direction_deg], ...]` per grid cell (north→south).

### Product: sea level anomaly (`ocean_current_gsla_gsla`)

PNG encoding (RGBA):

| Channel | Content                                                                  |
| ------- | ------------------------------------------------------------------------ |
| R       | High byte of 24-bit normalised GSLA                                      |
| G       | Mid byte                                                                 |
| B       | Low byte                                                                 |
| A       | Ocean mask: 255 = ocean, 0 = land (premultiplied — RGB zeroed where A=0) |

Manifest includes `valueRange` (physical min/max in metres).

`data.json` stores `[[gsla_m], ...]` per grid cell.

### Output layout

```
generated-images/
  ocean_current_gsla_ucur_vcur/{yyyy-mm-dd}/
    manifest.json
    data.json
    1_0_0.png  1_0_1.png  1_1_0.png  1_1_1.png   (4 LOD1 chunks)

  ocean_current_gsla_gsla/{yyyy-mm-dd}/
    manifest.json
    data.json
    1_0_0.png  1_0_1.png  1_1_0.png  1_1_1.png   (4 LOD1 chunks)
```

### Running

```sh
python script/gsla_chunking.py
# Processes today UTC minus 3 days (latest available NRT data).
```

---

## `ssta_chunking.py` — SST Anomaly Mosaic

Processes AusTemp SST anomaly mosaic data.

**Source:** `s3://imos-data/IMOS/SRS/AusTemp/ssta/{year}/`

**Dataset dimensions:** `time`, `lat`, `lon`

**Dataset variable:**

| Variable          | Description                     | Unit |
| ----------------- | ------------------------------- | ---- |
| `sst_anom_mosaic` | Sea surface temperature anomaly | °C   |

**Geographic region:** lat −60 to 10, lon 90 to 180

**LOD config:**

| LOD | Grid    | Chunks | Zoom threshold    |
| --- | ------- | ------ | ----------------- |
| 1   | 3 × 3   | 9      | — (always loaded) |
| 2   | 6 × 5   | 30     | 5                 |
| 3   | 12 × 10 | 120    | 6                 |

### Product: SSTA mosaic (`austemp_sst_anomaly_sst_anom_mosaic`)

PNG encoding (RGBA):

| Channel | Content                                                                  |
| ------- | ------------------------------------------------------------------------ |
| R       | High byte of 24-bit normalised SST anomaly                               |
| G       | Mid byte                                                                 |
| B       | Low byte                                                                 |
| A       | Ocean mask: 255 = ocean, 0 = land (premultiplied — RGB zeroed where A=0) |

Manifest includes `valueRange` (physical min/max in °C).

`data.json` stores `[[sst_anom_°C], ...]` per grid cell.

### Output layout

```
generated-images/
  austemp_sst_anomaly_sst_anom_mosaic/{yyyy-mm-dd}/
    manifest.json
    data.json
    1_0_0.png  …  1_2_2.png     (9 LOD1 chunks)
    2_0_0.png  …  2_5_4.png     (30 LOD2 chunks)
    3_0_0.png  …  3_11_9.png    (120 LOD3 chunks)
```

### Running

```sh
python script/ssta_chunking.py
# Processes today UTC minus 3 days.
```

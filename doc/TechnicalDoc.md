# Ocean Current Particle Visualization — Technical Documentation

This system enables real-time visualization of ocean current data using animated particles and overlay image rendered with WebGL and Mapbox in a React application. It transforms raw scientific datasets into interactive, GPU-accelerated visual formats for browsers.

## System Overview

The system is composed of two key parts:

1.  **Ocean Current Data Processing:** Transforms raw NetCDF scientific data into web-optimized assets: particle velocity textures and overlay.
2.  **Particle-Based Visualization:** Renders interactive animations on a map using WebGL shaders that simulate ocean currents via moving particles and a scalar heatmap image as overlay representing ocean surface anomalies.

---

## Part 1: Ocean Current Data Processing

This process transforms multi-dimensional oceanographic data into 2D images and metadata files that are easy to load and interpret in a WebGL environment.

### Input Source

- **Source:** AWS S3
- **Format:** `NetCDF (.nc)` — a common format for storing multi-dimensional scientific data.

### NetCDF Dimensions and Variables

**Dimensions:**

| Dimension   | Description        |
| :---------- | :----------------- |
| `longitude` | East–west axis     |
| `latitude`  | North–south axis   |
| `time`      | Temporal dimension |

**Variables:**

| Variable | Description                                     |
| :------- | :---------------------------------------------- |
| `UCR`    | Zonal (east–west) current velocity              |
| `VCR`    | Meridional (north–south) current velocity       |
| `GSLA`   | Gridded Sea Level Anomaly — scalar overlay data |

### Velocity Map: `gsla_input.png`

This image is used as a vector field texture for animating particles.

**Steps to generate:**

1.  **Normalize Velocity Components:**

    - `UCR` (horizontal velocity) → Red (R) channel
    - `VCR` (vertical velocity) → Green (G) channel
    - Blue (B) → unused or reserved
    - Alpha (A) → 255 (fully opaque)

2.  **Scaling Formula:**

    ```text
    R = ((UCR - min_u) / (max_u - min_u)) * 255
    G = ((VCR - min_v) / (max_v - min_v)) * 255
    ```

    - `min_u`, `max_u`, `min_v`, `max_v` are extracted dynamically from the dataset.

3.  **Image Assembly:**
    - Each pixel represents 1 grid point from the dataset.
    - Pixel layout is row-major, consistent with NetCDF lat/lon ordering.
    - Output resolution matches the dataset dimensions.
    - Output file: `gsla_input.png`

### Sea Level Overlay: `gsla_overlay.png`

- This is a scalar heatmap image representing sea level anomaly values from `GSLA`.
- Uses a color ramp (e.g., dark purple → yellow) to represent anomaly magnitudes.
- Output file: `gsla_overlay.png`
- **Purpose:** Provides visual context to the vector field by highlighting ocean surface anomalies.

### Metadata File: `gsla_meta.json`

This JSON file provides essential metadata to correctly interpret the image textures:

```json
{
  "lonRange": [144.0, 153.0],
  "latRange": [-45.0, -35.0],
  "uRange": [-1.5, 1.2],
  "vRange": [-1.0, 1.8]
}
```

**Includes:**

- Geographic bounds (`latRange`, `lonRange`)
- Value ranges for `UCR` and `VCR` (`uRange`, `vRange`) needed for shader remapping.

### Processed Data Output

```
    gsla_input.png    # Vector field data (R/G channels = U/V components)
    gsla_overlay.png  # Sea level anomalyn overlay
    gsla_meta.json    # Metadata including bounds and value ranges
```

## Part 2: Real-Time Particle Visualization (React + MapboxGL + WebGL)

This is a browser-based visualization using a custom WebGL layer within Mapbox, built in React.

### Tech Stack

| Component | Technology Used       |
| :-------- | :-------------------- |
| Map       | Mapbox GL JS          |
| Rendering | WebGL (via `TWGL.js`) |
| Animation | GLSL Shaders          |
| UI        | React                 |

### Map Integration

The MapBox GL JS library provides the base map, with custom WebGL layers added to visualize the vector field:

- **Custom layers** (`VectorLayer.js` and `ImageLayer.js`) integrate the particle system with MapBox's rendering pipeline
- **Map interaction** (zooming, panning) triggers appropriate pausing and resuming of the animation
- **Map style switching** allows for different visual presentations of the base map

### Visualization Pipeline

1.  **Initialize Particles:**
    - A set number of particles (`nParticles`) are generated (configurable).
    - Each particle starts at a random location within the map bounds.
    - These are stored in a GPU texture for fast access and parallel computation.
2.  **Sampling the Vector Field:**
    - Each particle samples the `gsla_input.png` texture at its current position.
    - The pixel's red (R) and green (G) channels give the zonal and meridional velocities.
    - These sampled 0-255 values are remapped back to their real-world range using the metadata (`uRange`, `vRange` from `gsla_meta.json`).
3.  **Animate the Particles:**
    - Using a fragment shader, each particle is moved in the direction and speed determined by its local velocity vector.
    - The movement is scaled using a configurable `speedFactor`.
    - Particles are periodically "dropped" (reset to a random location) to maintain dynamic motion using a `dropRate` and `dropRateBump` (additional chance for faster particles).
4.  **Render the Frame:**
    - The updated particle positions are rendered to an off-screen texture (using a ping-pong buffer technique for efficiency).
    - The screen is then updated with the latest frame from the texture, showing smooth particle motion.
5.  **Overlay Display:**
    - The `gsla_overlay.png` image can be toggled on/off in the UI.
    - It provides a colored overlay to visualize sea level anomaly over the vector flow.

### Data source

gsla_input.png, gsla_overlay.png and gsla_meta.json are expected to be served as static resource. Currently, a scheduled task in the Spring Boot application triggers a data processing script each day. This script generates the required assets in the expected format and saves them to a designated directory. These files are then exposed as static content through Spring's resource handler configuration.

```
    source.updateImage({ url, coordinates });
```

### Configuration Parameters

The particle system behavior can be adjusted through the `vectorConfig.js` file:

- `nParticles` - Default number of particles (10,000)
- `fadeOpacity` - Controls the persistence of particle trails (0.985)
- `speedFactor` - Multiplier for particle velocity (5.0)
- `dropRate` - Base probability of particle respawning (0.003)
- `dropRateBump` - Additional respawn probability for fast-moving particles (0.05)
- `pointSize` - Size of particles in pixels (1.2)
- `colours` - Color gradient configuration for particles based on speed

## Key Benefits

- **Fully GPU-driven simulation:** Efficient and scalable for large numbers of particles.
- **Real-time interaction:** Smooth visualization and parameter changes in the browser.
- **Seamless integration:** Works directly with geographic map context (Mapbox).
- **Toggleable scalar overlay:** Provides richer oceanographic insights by combining vector flow with sea level anomaly data.

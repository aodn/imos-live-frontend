# IMOS Live

## Overview

IMOS Live is an interactive marine data visualisation platform built for Australia's Integrated Marine Observing System. It combines multiple ocean datasets on an interactive Mapbox map, allowing users to explore and analyse current conditions across the Australasian region.

The platform visualises [processed GSLA data](./doc/DataProcessing.md) as a WebGL-accelerated particle field showing geostrophic ocean current patterns, alongside raster overlays for sea level anomalies and sea surface temperature (SST) anomalies. Wave buoy observations are displayed as interactive clustered map points with time-series charts. A temporal date slider lets users navigate through the available data history, and a distance measurement tool is provided for spatial analysis.

## Key Features

- Interactive global map with multiple style options
- WebGL-accelerated particle animation showing ocean geostrophic current direction and speed
- GSLA sea level anomaly raster overlay
- Sea surface temperature (SST) anomaly overlay for coral bleaching monitoring
- Wave buoy data with clustered map points and interactive time-series charts
- Distance measurement tool
- Customizable particle settings (count, size, speed, fade)
- Temporal date slider for navigating available data
- Optional world land boundary overlay

## [Technical Implementation](./doc/TechnicalDoc.md)

## Setup and Usage

### Prerequisites

- Node.js >= 22.0.0
- pnpm >= 10
- Mapbox API key (set as `VITE_MAPBOX_KEY` environment variable)
- Dataset base URL (set as `VITE_S3_BASE_URL` environment variable)

### Installation

1. Install dependencies:

   ```
   pnpm install
   ```

1. Set required environment variables:

   ```
   VITE_MAPBOX_KEY=your_mapbox_key_here
   VITE_S3_BASE_URL=[file server endpoint which contains the output of gsla_processing_script and wave_buoys_processing_script scripts]
   ```

1. Run the app:

   ```
   pnpm dev
   ```

   You can run the frontend using mock data, which does not require the `VITE_S3_BASE_URL` environment variable. To start the application with randomly generated local data, use:

   ```
   pnpm dev:mock
   ```

## Performance Considerations

- WebGL acceleration enables smooth animation of up to 100,000 particles
- Particle count can be adjusted based on device performance
- Animation automatically pauses during map interaction
- Efficient "ping-pong" texture technique minimizes GPU operations

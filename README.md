# IMOS Live

## Overview

IMOS Live is an interactive marine data visualisation platform built for Australia's Integrated Marine Observing System. It combines multiple ocean datasets on an interactive Mapbox map, allowing users to explore and analyse current conditions across the Australasian region.

The platform visualises daily oceanographic data as a WebGL-accelerated particle field showing geostrophic ocean current patterns, alongside WebGL scalar overlays for sea level anomalies and AusTEMP marine-heatwave products (SST mosaic, SST-anomaly mosaic, and a discrete marine-heatwave-category layer). Wave buoy observations are displayed as interactive clustered map points with time-series charts. A temporal date slider lets users navigate through the available data history, and a distance measurement tool is provided for spatial analysis.

## Key Features

- Interactive global map with multiple style options
- WebGL-accelerated particle animation showing ocean geostrophic current direction and speed
- GSLA sea level anomaly WebGL heatmap overlay
- AusTEMP marine-heatwave overlays: SST mosaic, SST-anomaly (SSTA) mosaic, and a categorical marine-heatwave-category (MCS) layer
- Wave buoy data with clustered map points and interactive time-series charts
- Distance measurement tool
- Customizable particle settings (count, size, speed, fade)
- Temporal date slider for navigating available data
- Optional world land boundary overlay

## Documentation

- [Atlas Rendering System](./src/AtlasRenderingSystem/README.md) — WebGL atlas infrastructure, shader coordinate lookup, LOD blending, API reference

## Setup and Usage

### Prerequisites

- Node.js >= 22.0.0
- pnpm >= 10
- Mapbox API key (set as `VITE_MAPBOX_KEY` environment variable)

### Installation

1. Install dependencies:

   ```
   pnpm install
   ```

1. Set required environment variables:

   ```
   VITE_MAPBOX_KEY=your_mapbox_key_here
   ```

1. Run the app:

   ```
   pnpm dev
   ```

   You can run the frontend using mock data instead of a live data source. To start the application with randomly generated local data, use:

   ```
   pnpm dev:mock
   ```

## API Routing

The application currently makes two kinds of HTTP calls:

- **Wave-buoy REST** — relative path `/api/v1/...`. In production this is
  routed by CloudFront to the OGC API; in development `vite.config.ts`
  proxies it to `https://portal.edge.aodn.org.au`.
- **Tile / manifest data** — absolute URL built from the `VITE_TILE_BASE_URL`
  environment variable (see [`.env.example`](.env.example)). No proxy is
  needed because the URL is fully-qualified.

The production CloudFront distribution may still define additional path
patterns (`/data/*`, `/tiles/*`, `/legends/*`, `/thredds/*`) for historical
or future use, but the application no longer calls them, so the dev proxy
does not mirror them either. `pnpm dev:mock` intercepts `/api` with a local
Vite middleware serving randomly generated data.

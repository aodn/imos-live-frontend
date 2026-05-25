# IMOS Live

## Overview

IMOS Live is an interactive marine data visualisation platform built for Australia's Integrated Marine Observing System. It combines multiple ocean datasets on an interactive Mapbox map, allowing users to explore and analyse current conditions across the Australasian region.

The platform visualises daily oceanographic data as a WebGL-accelerated particle field showing geostrophic ocean current patterns, alongside scalar heatmap overlays for sea level anomalies and sea surface temperature (SST) anomalies. Wave buoy observations are displayed as interactive clustered map points with time-series charts. A temporal date slider lets users navigate through the available data history, and a distance measurement tool is provided for spatial analysis.

## Key Features

- Interactive global map with multiple style options
- WebGL-accelerated particle animation showing ocean geostrophic current direction and speed
- GSLA sea level anomaly WebGL heatmap overlay
- Sea surface temperature (SST) anomaly overlay for coral bleaching monitoring
- Wave buoy data with clustered map points and interactive time-series charts
- Distance measurement tool
- Customizable particle settings (count, size, speed, fade)
- Temporal date slider for navigating available data
- Optional world land boundary overlay

## Documentation

- [Atlas Rendering System](./src/AtlasRenderingSystem/README.md) — WebGL atlas infrastructure, shader coordinate lookup, LOD blending, API reference
- [Data Processing](./docs/DataProcessing.md) — Python scripts that generate chunked PNG tiles from IMOS S3 data

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

All API calls use relative paths — no base URL or CORS configuration is required. Routing is handled at the infrastructure level in production, and mirrored locally via the Vite dev proxy.

**Production:** A CloudFront distribution routes requests by path pattern to the appropriate backend origin:

| Path pattern    | Origin           |
| --------------- | ---------------- |
| `/api/v1/*`     | OGC API          |
| `/data/*`       | S3 bucket        |
| `/tiles/*`      | Thredds Server   |
| `/legends/*`    | Thredds Server   |
| `/thredds/*`    | Thredds Server   |
| `/_cf-errors/*` | AODN error pages |
| `*` (default)   | Frontend app     |

**Development:** `vite.config.ts` proxies the same paths to their respective backends, so the app behaves identically to production without any local configuration. When using `pnpm dev:mock`, `/api` and `/data` are intercepted by a local Vite middleware serving randomly generated data instead.

# IMOS Live

## Overview

IMOS Live is an interactive marine data visualisation platform built for Australia's Integrated Marine Observing System. It combines multiple ocean datasets on an interactive Mapbox map, allowing users to explore and analyse current conditions across the Australasian region.

The platform visualises daily oceanographic data as a WebGL-accelerated particle field showing geostrophic ocean current patterns, alongside WebGL scalar overlays for sea level anomalies and AusTEMP marine-heatwave products (SST mosaic, SST-anomaly mosaic, and a discrete marine-heatwave-category layer). Wave buoy and mooring observations are displayed as interactive clustered map points with time-series charts (wave height/direction for buoys; per-depth temperature for moorings). A temporal date slider lets users navigate through the available data history, and a distance measurement tool is provided for spatial analysis.

## Key Features

- Interactive global map with multiple style options
- WebGL-accelerated particle animation showing ocean geostrophic current direction and speed
- GSLA sea level anomaly WebGL heatmap overlay
- AusTEMP marine-heatwave overlays: SST mosaic, SST-anomaly (SSTA) mosaic, and a categorical marine-heatwave-category (MCS) layer
- Wave buoy and mooring data with clustered map points and interactive time-series charts
- Distance measurement tool
- Customizable particle settings (count, size, speed, fade)
- Temporal date slider for navigating available data
- Optional world land boundary overlay

## Documentation

- [Atlas Rendering System](./src/AtlasRenderingSystem/README.md) — WebGL atlas infrastructure, shader coordinate lookup, LOD blending, API reference

## Adding a New Product

A product is _rendered_ by the Atlas Rendering System but _defined_ and _wired_ in the host app. The package's input contract (tiles, `manifest.json`, `ColorPalette`, the `createScalarAtlasLayer` / `createParticleAtlasLayer` factories) is documented in [Integrating a Product](./src/AtlasRenderingSystem/README.md#integrating-a-product); the IMOS-specific wiring is below. Touch these files in order:

1. **`src/constants/products.ts`** — add an entry to `PRODUCT` and `PRODUCTS` (`name`, `layerId`, `sourceId`, optional `variables`, `description`, `portalLink`). For a scalar/particle tiles product, also add the slug to `TILES_GROUP`.
2. **`src/constants/legends.ts`** — add a `PRODUCTLEGENDS` entry whose `colorKey` selects a palette from `COLOR_OPTIONS` (`src/constants/colors.ts`). `buildProductPalette` (`src/helpers/buildProductPalette.ts`) converts the legend into the `ColorPalette` the WebGL layer uploads.
3. **`src/hooks/layers/`** — wire the layer. **Tiles products** (scalar/particle) get a dedicated `use<ProductName>Layer.ts` that calls `createScalarAtlasLayer` / `createParticleAtlasLayer` from the package, reusing `useMapboxLayerSetup` and `useDidMountEffect`. **Site products** (clustered map points like wave buoys and moorings) instead reuse the shared `useSiteLayer` + `useSiteLayerEventHandler` (parameterized by product, fetch fns, and intermediate layer IDs) — register their cluster/unclustered/label layer IDs in `src/constants/layerIds.ts`, and point styling in `src/constants/layerSpecs.ts`.
4. **`src/components/MapComponent/MapComponent.tsx`** — register the new hook.
5. **`src/constants/layerOrder.ts`** — register the layer id in `LAYERS_ORDER` (the last entry is the top-most layer); always add layers via `addLayerInOrder`, not Mapbox's `addLayer` directly.
6. **`src/components/MainSidebar/products.tsx`** — add a `featuredPresentation` entry (`product`, `title`, `image`, `icon`); `featuredDataset` derives `description`/`portalLink`/`layerId` from `PRODUCTS`.
7. **`src/pages/Map.tsx`** — add the product icon entry to `LayersIndicator`.

Layer paint/layout config lives in `src/constants/layerSpecs.ts`.

## Setup and Usage

### Prerequisites

- Node.js >= 22.0.0
- pnpm >= 10
- A Mapbox API key

### Installation

1. Install dependencies:

   ```
   pnpm install
   ```

1. Configure environment variables. Copy [`.env.example`](.env.example) to `.env` (or `.env.local`) and fill in the values — at minimum `VITE_MAPBOX_KEY` (your Mapbox access token). See `.env.example` for the full list of supported variables.

   ```
   cp .env.example .env
   ```

1. Run the app:

   ```
   pnpm dev
   ```

## API Routing

The application currently makes two kinds of HTTP calls:

- **Wave-buoy REST** — relative path `/api/v1/...`. In production this is
  routed by CloudFront to the OGC API; in development `vite.config.ts`
  proxies it to `https://portal.edge.aodn.org.au`.
- **Tile / manifest data** — absolute URL built from `TILE_BASE_PATH` in
  `src/api/tiles.ts`. No proxy is needed because the URL is fully-qualified.

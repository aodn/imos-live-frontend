# CLAUDE.md — IMOS Live Frontend

IMOS Live is a geospatial oceanography visualization platform rendering real-time ocean data (SST, currents, wave buoys) on an interactive Mapbox map with WebGL-accelerated particle animations.

## Before You Write Code

Before creating a new hook, utility function, or UI component, check `src/hooks/`, `src/utils/`, and `src/components/` for an existing one that covers the need. Only create new ones if nothing suitable exists.

## Code Conventions

### TypeScript

- Prefer `type` over `interface`
- Prefer named exports (`export const`) over `export default`

### Function Style

Use regular functions for all named, exported declarations. Reserve arrow functions for inline/anonymous usage (callbacks, `useCallback`, `useMemo`, event handlers).

- **Components** — `export function Foo() { ... }`
- **Hooks** — `export function useFoo() { ... }`
- **Utils** — `export function foo() { ... }`

### Components

When creating a UI component, also create a Storybook story alongside it (`MyComponent.tsx` → `MyComponent.stories.tsx`). Each story should include:

- A default state
- One variant example (if applicable)

### Styling

Use the `cn` utility from `@/utils` to merge Tailwind classes:

```tsx
import { cn } from '@/utils';
<div className={cn('base-styles', conditionalClass, className)} />;
```

### State Management

- UI state lives in `src/store/useMapUIStore.ts` and is synced to URL query params
- Don't store server data in Zustand — that belongs in React Query cache

### Data Fetching

- Use React Query for all remote data fetching — never `useEffect` + fetch combos
- Don't call Axios directly in components
- Use `enabled` for conditional fetching, not manual guards inside `queryFn`
- Global `staleTime`/`gcTime` defaults are in `src/api/queryClient.ts` — only override per-query when the query has different caching needs
- Axios instances live in `src/api/` — reuse existing ones where possible; if a new instance is needed, add it there

## Products & Map Layers

Products are defined across three sibling files in `src/constants/` — never hardcode any of the following elsewhere:

| File          | What it owns                                                                                                                                                           |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `products.ts` | `PRODUCT` slugs and `PRODUCTS[slug] = { name, layerId, sourceId, variables?, description, portalLink }`; also `TILES_GROUP` and `MAX_VECTOR_SPEED`                     |
| `legends.ts`  | `PRODUCTLEGENDS[slug]` — legend config (label, scale type, min/max range, optional scale tick values, and a `colorKey`) consumed by the sidebar UI and the layer hooks |
| `colors.ts`   | `COLOR_OPTIONS` — the named palettes a legend's `colorKey` indexes into                                                                                                |

`buildProductPalette` (`src/helpers/buildProductPalette.ts`) converts a legend into the `ColorPalette` the WebGL layer uploads as its color-ramp texture.

Each product is visualized via its own dedicated hook in `src/hooks/layers/`:

- `useParticleAtlasLayer` — GSLA Ocean Geostrophic Current (WebGL particle animation)
- `useScalarAtlasLayer` — used by all four scalar tiles products: GSLA Anomaly Sea Levels, Marine Heatwave SST Mosaic, SSTA Mosaic, and MCS Category (WebGL atlas scalar overlay)
- `useWaveBuoysLayer` — Wave Buoys (clustered circle layer)

When adding a new product, touch these files in order:

1. **`src/constants/products.ts`** — add an entry to `PRODUCT` and `PRODUCTS` (with `layerId`/`sourceId` plus the user-facing `description` and `portalLink` — this is the single source of truth for product copy); if it's a scalar/particle tiles product, also add the slug to `TILES_GROUP`
2. **`src/constants/legends.ts`** — add a `PRODUCTLEGENDS` entry whose `colorKey` selects a palette from `COLOR_OPTIONS` in `src/constants/colors.ts`
3. **`src/hooks/layers/use<ProductName>Layer.ts`** — create a dedicated layer hook; reuse the shared layer hooks already used across existing products:
   - `useMapboxLayerSetup` — handles layer initialisation lifecycle
   - `useDidMountEffect` — re-fetches data when date changes
   - `useMapboxLayerVisibility` — handles show/hide based on enabled/error state (used by non-WebGL layers only, e.g. wave buoys)
4. **`src/components/MapComponent/MapComponent.tsx`** — register the new hook
5. **`src/components/MainSidebar/products.tsx`** — add an entry to `featuredPresentation` with the sidebar-only presentation (`product`, display `title`, `image`, `icon`); `featuredDataset` is derived from it, pulling `description`/`portalLink`/`layerId` from `PRODUCTS` — don't restate those here
6. **`src/pages/Map.tsx`** — add the product icon entry to the `LayersIndicator`

Layer paint/layout config belongs in `src/constants/layerSpecs.ts`. Always add layers to the map via `addLayerInOrder` (not Mapbox's `addLayer` directly) — and register the new layer's ID in `LAYERS_ORDER` in `src/constants/layerOrder.ts`, where the last entry is the top-most layer.

## Performance

- Memoize Mapbox layer objects with `useMemo` in layer hooks — passing new objects on every render causes unnecessary layer re-registration
- Use `useRAFDFn` from `@/hooks` for high-frequency event handlers (drag, resize, slider interactions)
- Use `useShallow` from Zustand when subscribing to multiple state slices to avoid unnecessary re-renders

## WebGL Particle Engine

`src/AtlasRenderingSystem/layers/ParticlesAtlasField.ts` and `src/AtlasRenderingSystem/webgl/particlesShader.ts` implement the ping-pong texture particle system — be cautious modifying them. Particle settings (count, speed, fade, size) are configurable via `src/AtlasRenderingSystem/config/particleConfig.ts`. The atlas renderer is a self-contained package, driven only through its public factories `createScalarAtlasLayer` / `createParticleAtlasLayer` (`src/AtlasRenderingSystem/index.ts`) — the `use*AtlasLayer` hooks are the host-app glue around them; see `src/AtlasRenderingSystem/README.md` for its full architecture and API.

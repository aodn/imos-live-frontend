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
- Global `staleTime`/`gcTime` defaults are in `src/config/reactQueryConfig.ts` — only override per-query when the query has different caching needs
- Axios instances live in `src/api/` — reuse existing ones where possible; if a new instance is needed, add it there

## Products & Map Layers

`src/constants/product.ts` is the single source of truth for all products and their `layerId`/`sourceId` — never hardcode layer or source IDs elsewhere.

Each product is visualized via its own dedicated hook in `src/hooks/`:

- `useParticleLayer` — GSLA Ocean Geostrophic Current (WebGL particle animation)
- `useRasterLayer` — GSLA Anomaly Sea Levels and SST Anomaly Mosaic (raster image overlay)
- `useWaveBuoysLayer` — Wave Buoys (clustered circle layer)

When adding a new product, touch these files in order:

1. **`src/constants/product.ts`** — add to `PRODUCT`, `PRODUCTS` (with `layerId`/`sourceId`), and `PRODUCTLEGENDS`
2. **`src/hooks/use<ProductName>Layer.ts`** — create a dedicated layer hook; reuse the shared layer hooks already used across existing products:
   - `useMapboxLayerSetup` — handles layer initialisation lifecycle
   - `useMapboxLayerVisibility` — handles show/hide based on enabled/error state
   - `useDidMountEffect` — re-fetches data when date changes
3. **`src/components/MapComponent/MapComponent.tsx`** — register the new hook
4. **`src/components/MainSidebar/products.tsx`** — add an entry to `featuredDataset` (image, title, description, icon, legend, `dateCheckUrl`, `portalLink`)
5. **`src/pages/Map.tsx`** — add the product icon entry

Layer paint/layout config belongs in `src/config/layerConfig.ts`. Always add layers to the map via `addLayerInOrder` (not Mapbox's `addLayer` directly) — and register the new layer's ID in `LAYERS_ORDER` in `layerConfig.ts`, where the last entry is the top-most layer.

## Performance

- Memoize Mapbox layer objects with `useMemo` in layer hooks — passing new objects on every render causes unnecessary layer re-registration
- Use `useRAFDFn` from `@/hooks` for high-frequency event handlers (drag, resize, slider interactions)
- Use `useShallow` from Zustand when subscribing to multiple state slices to avoid unnecessary re-renders

## WebGL Particle Engine

`src/layers/VectorField.js` uses a ping-pong texture technique for GPU-side computations — be cautious modifying it. Particle settings (count, speed, fade, size) are configurable via `src/config/particleConfig.ts`.

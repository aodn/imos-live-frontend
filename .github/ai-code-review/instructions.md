This repository is `imos-live-frontend`, the IMOS Live web app: a geospatial
oceanography viewer that renders real-time ocean data (SST, currents, sea
level, wave buoys, moorings, water quality) on a Mapbox GL map, with custom
WebGL scalar overlays and particle animations. Stack: React 19, TypeScript,
Vite, Tailwind CSS v4, Zustand (UI state synced to URL query params), TanStack
React Query + Axios (remote data), Mapbox GL v3, twgl.js (WebGL), Highcharts,
Vitest for unit tests, Playwright for end-to-end tests and Storybook for
components.

Pay particular attention to:

- React correctness: hook dependency arrays, stale closures, effects that
  subscribe or add map layers/sources without cleaning up, state updates after
  unmount, and keys in lists.
- Mapbox GL: layers and sources added more than once, event handlers not
  removed, and work done before the map or style has loaded (a style switch
  removes custom layers). Layers must be added through `addLayerInOrder`
  (`src/helpers/`), never `map.addLayer` directly, and every new layer ID
  must be registered in `LAYERS_ORDER` (`src/constants/layerOrder.ts`).
  Layer objects passed to hooks should be memoised with `useMemo`.
- WebGL / `src/AtlasRenderingSystem/`: leaked textures, buffers, framebuffers
  or programs; missing cleanup on layer removal or context loss; changes to
  the ping-pong particle system (`layers/ParticlesAtlasField.ts`,
  `webgl/particlesShader.ts`) that break the read/write texture swap. The
  renderer is a self-contained package: host-app code should only use the
  public factories `createScalarAtlasLayer` / `createParticleAtlasLayer` from
  `src/AtlasRenderingSystem/index.ts`, not reach into its internals.
- Data fetching: all remote data goes through React Query; flag
  `useEffect` + fetch combos, Axios called directly from components, manual
  guards inside `queryFn` instead of `enabled`, and per-query
  `staleTime`/`gcTime` overrides without a reason (defaults live in
  `src/api/queryClient.ts`). Server data must not be copied into Zustand.
  Watch for assumptions about the shape of tile manifests and site API
  responses (fields may be missing).
- State: UI state belongs in `src/store/useMapUIStore.ts` and must stay in
  sync with URL query params (`src/store/serialization.ts`, `urlSync.ts`);
  a new store field usually needs serialization support. Subscriptions to
  several slices should use `useShallow`.
- Products: product slugs, names, layer/source IDs, descriptions, portal
  links, legends and palettes are defined only in `src/constants/products.ts`,
  `legends.ts` and `colors.ts`. Flag any of these hard-coded elsewhere. A new
  product should follow the steps in `CLAUDE.md` (constants → layer
  hook → `MapComponent` → `MainSidebar/products.tsx` → `LayersIndicator` in
  `src/pages/Map.tsx`); a missing step is worth reporting. Site products must
  reuse `useSiteLayer` + `useSiteLayerEventHandler`, not a new hook.
- Performance: high-frequency handlers (drag, resize, sliders, map move)
  should use `useRAFDFn` from `@/hooks`; avoid per-frame allocations in
  render loops.
- Security: `dangerouslySetInnerHTML`, building URLs or queries from user or
  API data, and anything committed that looks like a token or key. `VITE_*`
  values in `.env*` files are build-time config and end up in the public
  bundle (the Mapbox token is expected to be public; others may not be).
- Tests: behaviour changes and bug fixes in utils, helpers, hooks and store
  should have Vitest coverage in a colocated `*.spec.ts(x)` file. Map
  rendering is not pixel-tested by design; shader colour logic is checked by
  the isolated Playwright readback in `tests/scalarColor.spec.ts`, and UI
  flow changes may need `tests/happyPath.spec.ts` updated. New UI components
  should come with a `*.stories.tsx` Storybook story (default state plus a
  variant where applicable).

Reusable code, for the duplicate-implementation check:

- Hooks: `src/hooks/common/` (e.g. `useDidMountEffect`, `useRAFDFn`,
  `useDrag`, `useToggle`, `useResizeObserver`, `useViewPortSize`),
  `src/hooks/map/` (map lifecycle: `useMapInitialization`, `useMapResize`,
  `useMapStyle`, `useIsMapDragging`, ...) and `src/hooks/layers/` (layer
  lifecycle: `useMapboxLayerSetup`, `useMapboxLayerVisibility`,
  `useSiteLayer`, and the site interaction hooks in `siteLayers/`).
- Utilities: `src/utils/`, one function per file (`cn`, `clamp`, `debounce`,
  `throttle`, `dateUtils`, `rgbToHex`, `formatLatLngToDirectional`, ...).
- Map helpers: `src/helpers/` (`addLayerInOrder`, `addOrUpdateGeoJsonSource`,
  `addOrUpdateVectorSource`, `showPopup`, `buildProductPalette`,
  `normalizeSiteData`, ...).
- Shared UI: `src/components/` (`Button`, `Dropdown`, `Input`, `Switch`,
  `Slider`, `DatePicker`, `Collapsible`, `Drawer`, `FloatingPanel`, `Toast`,
  `Skeleton`, `Icons`, ...), each in its own folder with an `index.ts`.
- API: Axios instances and React Query `queryOptions` in `src/api/`; a new
  Axios instance or fetch function may duplicate an existing one.
- Constants: layer IDs, layer paint/layout specs and layer order in
  `src/constants/` (`layerIds.ts`, `layerSpecs.ts`, `layerOrder.ts`); inline
  paint config in a hook belongs in `layerSpecs.ts`.
- Styling: Tailwind classes merged with `cn` from `@/utils`; a hand-rolled
  class-concatenation helper or new hard-coded colour may duplicate existing
  ones.

A new component that is a restyled copy of a shared one, or a new hook or util
whose logic already exists in one of these places, may be reusable. Report it
only when both do the same job and the same callers could share one
implementation; then prefer extending the existing one with a prop or
parameter.

Conventions: `type` over `interface`; named exports over `export default`;
regular `function` declarations for exported components, hooks and utils
(arrow functions only for inline callbacks); `@/` path aliases; PascalCase
component files and folders; `use`-prefixed hooks; Tailwind arbitrary values
in `px`, not `rem`. Single quotes and other formatting are enforced by
Prettier and ESLint, so do not report issues they would catch.

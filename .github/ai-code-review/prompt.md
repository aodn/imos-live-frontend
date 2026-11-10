## IMOS Live-specific review direction

For the shared duplicate-implementation check, pay particular attention to
newly added React components, hooks (especially map and layer hooks),
helpers under `src/helpers/` and TypeScript utilities. Apply the
repository-specific reuse locations and conventions below when searching for
an existing implementation.

Changes to `src/AtlasRenderingSystem/` (WebGL scalar and particle rendering)
and to product definitions in `src/constants/` deserve extra care: check GPU
resource cleanup, and that product copy, layer IDs and legends are not
duplicated outside `src/constants/`.

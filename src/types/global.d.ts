// global.d.ts
import type { Map as MapboxMap } from 'mapbox-gl';

declare module '*.json' {
  // Standard asset-import shim; resolveJsonModule is off for the app config.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const value: any;
  export default value;
}

declare global {
  interface Window {
    // Set only under VITE_AUTOMATED_TEST_RUNNING; read by Playwright tests (tests/atlasRenderingSystem.spec.ts).
    map?: MapboxMap;
  }
}

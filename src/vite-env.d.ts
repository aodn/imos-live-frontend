/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FEEDBACK_ENABLED: string;
  readonly VITE_AUTOMATED_TEST_RUNNING: boolean;
  readonly VITE_MAPBOX_KEY: string;
  readonly VITE_TILE_BASE_URL: string;
}

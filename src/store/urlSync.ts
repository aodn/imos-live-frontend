import {
  INITIAL_CENTER,
  INITIAL_DATE,
  INITIAL_PARTICLE_CONFIG,
  INITIAL_PRODUCT_ENABLED,
  INITIAL_STYLE,
  INITIAL_WORLD_BOUNDARIES_ENABLED,
  INITIAL_ZOOM,
} from '@/constants';
import type { StateStorage } from 'zustand/middleware';
import { createJSONStorage } from 'zustand/middleware';
import { deserialize, serialize } from './serialization';
import type { MapUIState } from './useMapUIStore';

export const URL_SYNCED_KEYS = [
  'center',
  'zoom',
  'style',
  'particleConfig',
  'worldBoundariesEnabled',
  'date',
  'productEnabled',
] as const satisfies readonly (keyof MapUIState)[];

const URL_SYNCED_KEY_SET = new Set<string>(URL_SYNCED_KEYS);

const INITIAL_URL_STATE = {
  center: INITIAL_CENTER,
  zoom: INITIAL_ZOOM,
  style: INITIAL_STYLE,
  particleConfig: INITIAL_PARTICLE_CONFIG,
  worldBoundariesEnabled: INITIAL_WORLD_BOUNDARIES_ENABLED,
  date: INITIAL_DATE,
  productEnabled: INITIAL_PRODUCT_ENABLED,
} satisfies Record<(typeof URL_SYNCED_KEYS)[number], unknown>;

const SERIALIZED_INITIAL_STATE = new Map<string, string>(
  URL_SYNCED_KEYS.map(key => [key, serialize(INITIAL_URL_STATE[key], key)]),
);

// Must be kept
const ALWAYS_SYNCED_KEYS = new Set<string>(['date']);

// A param belongs in the URL only when it differs from the initial state.
function isInitialUrlValue(key: string, encoded: string): boolean {
  if (ALWAYS_SYNCED_KEYS.has(key)) return false;
  return SERIALIZED_INITIAL_STATE.get(key) === encoded;
}

// One-way mirror of UI state into the query string. Writes go through
// `history.replaceState` *by design*, not React Router:
//   - these keys change on high-frequency interactions (pan/zoom/slider drag),
//     and `replaceState` mirrors them silently — no navigation, no re-render;
//   - the flow is one-way + read-once: `getItem` reads the URL only at init,
//     and we only write afterwards, so the router never needs to observe us.
// Trade-off: `replaceState` doesn't fire `popstate`, so React Router never sees
// these writes and its `location` goes stale w.r.t. them. Therefore synced keys
// must NOT be read reactively via `useSearchParams` expecting live updates —
// read them from the store instead.
const hashStorage: StateStorage = {
  getItem: () => {
    const url = new URL(location.href);
    const restoredState: Record<string, unknown> = {};
    for (const [key, value] of url.searchParams.entries()) {
      if (!URL_SYNCED_KEY_SET.has(key)) continue;
      restoredState[key] = deserialize(value, key);
    }

    return JSON.stringify({ state: restoredState });
  },
  setItem: (_key, newValue) => {
    const { state } = JSON.parse(newValue);
    const url = new URL(location.href);
    for (const [k, v] of Object.entries(state)) {
      const encoded = serialize(v, k);
      // Omit defaults (and drop any stale param) so the URL carries only the
      // state that actually differs from the initial state.
      if (isInitialUrlValue(k, encoded)) {
        url.searchParams.delete(k);
      } else {
        url.searchParams.set(k, encoded);
      }
    }
    window.history.replaceState({}, '', url.toString());
  },
  removeItem: key => {
    const url = new URL(location.href);
    url.searchParams.delete(key);
    window.history.replaceState({}, '', url.toString());
  },
};

export const storageOptions = {
  name: 'url-sync',
  storage: createJSONStorage<MapUIState>(() => hashStorage),
  // Sync only the URL_SYNCED_KEYS subset of the state to the URL, instead of the entire state.
  partialize: (state: MapUIState) => {
    const synced = {} as MapUIState;
    for (const k of URL_SYNCED_KEYS) {
      (synced as Record<string, unknown>)[k] = state[k];
    }
    return synced;
  },
};

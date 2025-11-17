import { GSLA_OVERLAY_SOURCE_ID, OverlaySource } from '@/constants';
import { StyleTitle } from '@/styles';
import { getLast7Dates } from '@/utils';
import { LngLat } from 'mapbox-gl';
import { create } from 'zustand';
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware';

export type NumParticles = 10000 | 30000 | 60000 | 100000;

export const INITIAL_DATE = getLast7Dates().at(0)!;

export interface MapUIState {
  center: LngLat;
  zoom: number;
  style: StyleTitle;
  overlay: boolean;
  circle: boolean;
  particles: boolean;
  numParticles: NumParticles;
  distanceMeasurement: boolean;
  worldBoundaries: boolean;
  overlaySource: OverlaySource;
  date: string;
  dates: string[];
  setCenter: (center: LngLat) => void;
  setZoom: (zoom: number) => void;
  setStyle: (style: StyleTitle) => void;
  setOverlay: (v: boolean, layer?: OverlaySource) => void;
  setCircle: (v: boolean) => void;
  setParticles: (v: boolean) => void;
  setNumParticles: (n: NumParticles) => void;
  setDistanceMeasurement: (v: boolean) => void;
  setWorldBoundaries: (v: boolean) => void;
  setDate: (d: string) => void;
  refreshDates: () => void;
}

const stateKeysToExcludeFromUrl = ['dates'];
const hashStorage: StateStorage = {
  getItem: () => {
    const url = new URL(location.href);
    const restoredState: Record<string, string> = {};
    for (const [key, value] of url.searchParams.entries()) {
      restoredState[key] = JSON.parse(value);
    }
    return JSON.stringify({ state: restoredState });
  },
  setItem: (_key, newValue) => {
    const { state } = JSON.parse(newValue);
    const url = new URL(location.href);
    for (const [k, v] of Object.entries(state)) {
      if (stateKeysToExcludeFromUrl.includes(k)) continue;
      url.searchParams.set(k, JSON.stringify(v));
    }
    window.history.replaceState({}, '', url.toString());
  },
  removeItem: key => {
    const url = new URL(location.href);
    url.searchParams.delete(key);
    window.history.replaceState({}, '', url.toString());
  },
};

const storageOptions = {
  name: 'url-sync',
  storage: createJSONStorage<MapUIState>(() => hashStorage),
};

export const useMapUIStore = create(
  persist<MapUIState>(
    set => ({
      center: new LngLat(133.7751, -25.2744),
      zoom: 3,
      style: 'ESRIWorldImagery',
      overlaySource: GSLA_OVERLAY_SOURCE_ID,
      overlay: true,
      circle: true,
      particles: true,
      numParticles: 10000,
      distanceMeasurement: false,
      worldBoundaries: false,
      dates: getLast7Dates(),
      date: INITIAL_DATE,
      setCenter: center => set({ center }),
      setZoom: zoom => set({ zoom }),
      setStyle: style => set({ style }),
      setOverlay: (overlay, overlaySource) => {
        set({ overlay, overlaySource: overlaySource || GSLA_OVERLAY_SOURCE_ID });
      },
      setCircle: circle => set({ circle }),
      setParticles: particles => set({ particles }),
      setNumParticles: numParticles => set({ numParticles }),
      setDistanceMeasurement: distanceMeasurement => set({ distanceMeasurement }),
      setWorldBoundaries: worldBoundaries => set({ worldBoundaries }),
      setDate: date => set({ date }),
      refreshDates: () => {
        const newDates = getLast7Dates();
        set(prev => ({ ...prev, dates: newDates }));
      },
    }),
    storageOptions,
  ),
);

export const selectAllStates = (s: MapUIState) => ({
  center: s.center,
  zoom: s.zoom,
  style: s.style,
  overlay: s.overlay,
  circle: s.circle,
  particles: s.particles,
  distanceMeasurement: s.distanceMeasurement,
  numParticles: s.numParticles,
  date: s.date,
  overlaySource: s.overlaySource,
});

export const {
  setCenter,
  setCircle,
  setDate,
  setDistanceMeasurement,
  setNumParticles,
  setOverlay,
  setParticles,
  setStyle,
  setWorldBoundaries,
  setZoom,
  refreshDates,
} = useMapUIStore.getState();

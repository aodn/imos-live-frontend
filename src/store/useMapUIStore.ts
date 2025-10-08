import { GSLA_OVERLAY_SOURCE_ID, OverlaySource } from '@/constants';
import { StyleTitle } from '@/styles';
import { getLast7DatesEnding3DaysAgo } from '@/utils';
import { LngLat } from 'mapbox-gl';
import { create } from 'zustand';
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware';

export type NumParticles = 1000 | 10000 | 100000;

export const INITIAL_DATASET = getLast7DatesEnding3DaysAgo().at(0)!;

export interface MapUIState {
  center: LngLat;
  zoom: number;
  style: StyleTitle;
  overlay: boolean;
  circle: boolean;
  particles: boolean;
  numParticles: NumParticles;
  distanceMeasurement: boolean;
  overlaySource: OverlaySource;
  dataset: string;
  datasets: string[];
  setCenter: (center: LngLat) => void;
  setZoom: (zoom: number) => void;
  setStyle: (style: StyleTitle) => void;
  setOverlay: (v: boolean, layer?: OverlaySource) => void;
  setCircle: (v: boolean) => void;
  setParticles: (v: boolean) => void;
  setNumParticles: (n: NumParticles) => void;
  setDistanceMeasurement: (v: boolean) => void;
  setDataset: (d: string) => void;
  refreshDatasets: () => void;
}

const stateKeysToExcludeFromUrl = ['datasets'];
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
      datasets: getLast7DatesEnding3DaysAgo(),
      dataset: INITIAL_DATASET,
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
      setDataset: dataset => set({ dataset }),
      refreshDatasets: () => {
        const newDatasets = getLast7DatesEnding3DaysAgo();
        set(prev => ({ ...prev, datasets: newDatasets }));
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
  dataset: s.dataset,
  overlaySource: s.overlaySource,
});

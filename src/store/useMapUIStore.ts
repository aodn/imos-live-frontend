import { create } from 'zustand';
import { StyleTitle } from '@/styles';
import { deserialize, getLast7DatesEnding3DaysAgo } from '@/utils';
import { LngLat } from 'mapbox-gl';

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
  dataset: string;
  datasets: string[];
  setCenter: (center: LngLat) => void;
  setZoom: (zoom: number) => void;
  setStyle: (style: StyleTitle) => void;
  setOverlay: (v: boolean) => void;
  setCircle: (v: boolean) => void;
  setParticles: (v: boolean) => void;
  setNumParticles: (n: NumParticles) => void;
  setDistanceMeasurement: (v: boolean) => void;
  setDataset: (d: string) => void;
  refreshDatasets: () => void;
}

const mapUIStateTypes: Record<keyof MapUIState, string> = {
  center: 'object',
  zoom: 'number',
  style: 'string',
  overlay: 'boolean',
  circle: 'boolean',
  particles: 'boolean',
  numParticles: 'number',
  distanceMeasurement: 'boolean',
  dataset: 'string',
  datasets: 'object',
  setCenter: 'function',
  setZoom: 'function',
  setStyle: 'function',
  setOverlay: 'function',
  setCircle: 'function',
  setParticles: 'function',
  setNumParticles: 'function',
  setDistanceMeasurement: 'function',
  setDataset: 'function',
  refreshDatasets: 'function',
};

export function getUrlState<T extends keyof MapUIState>(keys: T[]) {
  const params = new URLSearchParams(window.location.search);

  return keys.reduce(
    (acc, key) => {
      const typeHint = mapUIStateTypes[key];
      acc[key] = deserialize(params.get(key), typeHint);
      return acc;
    },
    {} as Partial<Record<T, MapUIState[T]>>,
  );
}

export const useMapUIStore = create<MapUIState>(set => {
  //set initial state from url params if params not empty.
  const params = getUrlState([
    'center',
    'zoom',
    'style',
    'overlay',
    'particles',
    'numParticles',
    'distanceMeasurement',
    'circle',
    'dataset',
  ]);

  return {
    center: (params.center as LngLat) ?? new LngLat(133.7751, -25.2744),
    zoom: (params.zoom as number) ?? 3,
    style: (params.style as StyleTitle) ?? 'ESRIWorldImagery',
    overlay: (params.overlay as boolean) ?? true,
    circle: (params.circle as boolean) ?? true,
    particles: (params.particles as boolean) ?? true,
    numParticles: (params.numParticles as NumParticles) ?? 10000,
    distanceMeasurement: (params.distanceMeasurement as boolean) ?? false,
    datasets: getLast7DatesEnding3DaysAgo(),
    dataset: (params.dataset as string) ?? INITIAL_DATASET,
    setCenter: center => set({ center }),
    setZoom: zoom => set({ zoom }),
    setStyle: style => set({ style }),
    setOverlay: overlay => {
      set({ overlay });
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
  };
});

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
});

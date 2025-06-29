import { create } from 'zustand';
import { StyleTitle } from '@/styles';
import { getLast7DatesEnding3DaysAgo } from '@/utils';
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

export const useMapUIStore = create<MapUIState>(set => ({
  center: new LngLat(133.7751, -25.2744),
  zoom: 3,
  style: 'Dark',
  overlay: false,
  circle: false,
  particles: false,
  numParticles: 10000,
  distanceMeasurement: false,
  datasets: getLast7DatesEnding3DaysAgo(),
  dataset: INITIAL_DATASET,
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
}));

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

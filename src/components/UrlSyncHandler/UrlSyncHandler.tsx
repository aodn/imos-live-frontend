import { useZustandUrlSync } from '@/hooks';
import { useMapUIStore } from '@/store';
import { useShallow } from 'zustand/shallow';

// responsible for updating query parameters in url when state udpates. the logic that set query params from
// url to zustand state is processed in useMapUIStore.
export const UrlSyncHandler = () => {
  const {
    center,
    zoom,
    style,
    overlay,
    particles,
    numParticles,
    distanceMeasurement,
    circle,
    dataset,
  } = useMapUIStore(
    useShallow(s => ({
      center: s.center,
      zoom: s.zoom,
      style: s.style,
      overlay: s.overlay,
      particles: s.particles,
      numParticles: s.numParticles,
      distanceMeasurement: s.distanceMeasurement,
      circle: s.circle,
      dataset: s.dataset,
    })),
  );

  useZustandUrlSync({
    keys: [
      'center',
      'zoom',
      'style',
      'overlay',
      'particles',
      'numParticles',
      'distanceMeasurement',
      'circle',
      'dataset',
    ],
    getState: () => ({
      center: center,
      zoom: zoom,
      style: style,
      overlay: overlay,
      particles: particles,
      numParticles: numParticles,
      distanceMeasurement: distanceMeasurement,
      circle: circle,
      dataset: dataset,
    }),
  });

  return null;
};

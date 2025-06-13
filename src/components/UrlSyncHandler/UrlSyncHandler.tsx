import { useZustandUrlSync } from '@/hooks';
import { useMapUIStore } from '@/store';
import { useShallow } from 'zustand/shallow';

// responsible for sync query paramenters with zustand store states and when states update also
// update corresponding query parameters.
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
    setCenter,
    setZoom,
    setStyle,
    setOverlay,
    setCircle,
    setParticles,
    setNumParticles,
    setDistanceMeasurement,
    setDataset,
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
      setCenter: s.setCenter,
      setZoom: s.setZoom,
      setStyle: s.setStyle,
      setOverlay: s.setOverlay,
      setCircle: s.setCircle,
      setParticles: s.setParticles,
      setNumParticles: s.setNumParticles,
      setDistanceMeasurement: s.setDistanceMeasurement,
      setDataset: s.setDataset,
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
    setState: (key, value) => {
      switch (key) {
        case 'center':
          setCenter(value);
          break;
        case 'zoom':
          setZoom(value);
          break;
        case 'style':
          setStyle(value);
          break;
        case 'overlay':
          setOverlay(value);
          break;
        case 'particles':
          setParticles(value);
          break;
        case 'numParticles':
          setNumParticles(value);
          break;
        case 'distanceMeasurement':
          setDistanceMeasurement(value);
          break;
        case 'circle':
          setCircle(value);
          break;
        case 'dataset':
          setDataset(value);
          break;
        default:
          break;
      }
    },
  });

  return null;
};

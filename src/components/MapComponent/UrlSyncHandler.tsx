import { useZustandUrlSync } from '@/hooks';
import { useMapUIStore } from '@/store';
import { useShallow } from 'zustand/shallow';

// responsible for sync query paramenters with zustand store states and when states update also
// update corresponding query parameters. If want to sync other states, just update keys, getState and setState as you wish.
export const UrlSyncHandler = () => {
  const { overlay, particles, circle, dataset, setOverlay, setCircle, setParticles, setDataset } =
    useMapUIStore(
      useShallow(s => ({
        overlay: s.overlay,
        particles: s.particles,
        circle: s.circle,
        dataset: s.dataset,
        setOverlay: s.setOverlay,
        setCircle: s.setCircle,
        setParticles: s.setParticles,
        setDataset: s.setDataset,
      })),
    );

  useZustandUrlSync({
    keys: ['overlay', 'particles', 'circle', 'dataset'],
    getState: () => ({
      overlay: overlay,
      particles: particles,
      circle: circle,
      dataset: dataset,
    }),
    setState: (key, value) => {
      switch (key) {
        case 'overlay':
          setOverlay(value);
          break;
        case 'particles':
          setParticles(value);
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

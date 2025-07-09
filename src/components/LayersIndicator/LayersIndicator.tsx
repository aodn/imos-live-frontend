import { MapUIState, useMapUIStore } from '@/store';
import { cn } from '@/utils';
import { useShallow } from 'zustand/shallow';
import { Button } from '../Button';
import { CloseIcon } from '../Icons';

type Label = keyof Pick<MapUIState, 'circle' | 'particles' | 'overlay'>;

type LayersIndicatorProps = {
  layers: {
    Icon: React.ComponentType<any>;
    label: Label;
  }[];
  className?: string;
};

export const LayersIndicator = ({ layers, className }: LayersIndicatorProps) => {
  const { particles, overlay, circle, setCircle, setOverlay, setParticles } = useMapUIStore(
    useShallow(s => ({
      overlay: s.overlay,
      particles: s.particles,
      circle: s.circle,
      setOverlay: s.setOverlay,
      setParticles: s.setParticles,
      setCircle: s.setCircle,
    })),
  );
  const visibles: Record<Label, boolean> = {
    particles,
    overlay,
    circle,
  };

  const handleClose = (label: Label) => () => {
    switch (label) {
      case 'circle':
        setCircle(false);
        break;
      case 'overlay':
        setOverlay(false);
        break;
      case 'particles':
        setParticles(false);
        break;
      default:
        break;
    }
  };

  return (
    <div className={cn('flex flex-col gap-y-4', className)}>
      {layers.map(({ Icon, label }) => {
        return (
          <Button
            key={'LayersIndicator-' + label}
            aria-label={label}
            className={cn('relative h-10 w-10 rounded bg-white flex justify-center items-center', {
              hidden: !visibles[label],
            })}
            onClick={handleClose(label)}
          >
            <Icon size="lg" />
            <CloseIcon
              size="xs"
              color="imos-red"
              className="absolute right-0 top-0 border rounded-4xl"
            />
          </Button>
        );
      })}
    </div>
  );
};

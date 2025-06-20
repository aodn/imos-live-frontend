import { MapUIState, useMapUIStore } from '@/store';
import { cn } from '@/utils';
import { useShallow } from 'zustand/shallow';
import { Button } from '../Button';

type Label = keyof Pick<MapUIState, 'circle' | 'particles' | 'overlay'>;

type LayersIndicatorProps = {
  layers: {
    Icon: React.ComponentType<any>;
    label: Label;
  }[];
  className?: string;
};

export const LayersIndicator = ({ layers, className }: LayersIndicatorProps) => {
  const { particles, overlay, circle } = useMapUIStore(
    useShallow(s => ({ overlay: s.overlay, particles: s.particles, circle: s.circle })),
  );
  const visibles: Record<Label, boolean> = {
    particles,
    overlay,
    circle,
  };

  return (
    <div className={cn('flex flex-col gap-y-4', className)}>
      {layers.map(({ Icon, label }) => {
        return (
          <Button
            key={'LayersIndicator-' + label}
            aria-label={label}
            className={cn('h-10 w-10 rounded bg-white flex justify-center items-center', {
              hidden: !visibles[label],
            })}
          >
            <Icon size="lg" />
          </Button>
        );
      })}
    </div>
  );
};

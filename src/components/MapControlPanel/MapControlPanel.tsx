import { Button } from '@/components';
import { AddCircleIcon, MinusCircleIcon, HandIcon } from '../Icons';
import { cn } from '@/lib/utils';

export const MapControlPanel = ({
  onZoomIn,
  onZoomOut,
  onPan,
  isPanActive = false,
  className = '',
}: {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onPan?: () => void;
  isPanActive?: boolean;
  className?: string;
}) => (
  <div className={cn('flex flex-col items-center gap-2  bg-transparent', className)}>
    <Button variant="ghost" size="icon" aria-label="Zoom in" onClick={onZoomIn}>
      <AddCircleIcon size="xl" color="imos-white" />
    </Button>
    <Button variant="ghost" size="icon" aria-label="Zoom out" onClick={onZoomOut}>
      <MinusCircleIcon size="xl" color="imos-white" />
    </Button>
    <Button variant="ghost" size="icon" aria-label="Pan" onClick={onPan} isActive={isPanActive}>
      <HandIcon size="xl" color="imos-white" />
    </Button>
  </div>
);

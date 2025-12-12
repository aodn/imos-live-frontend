import { Button } from '@/components';
import { cn } from '@/utils';
import { AddCircleIcon, HandIcon, MinusCircleIcon } from '../Icons';

export const MapControlPanel = ({
  ref: mapRef,
  isPanActive = false,
  className = '',
}: {
  ref: React.RefObject<mapboxgl.Map | null>;
  isPanActive?: boolean;
  className?: string;
}) => {
  const handleZoomIn = () => {
    mapRef.current?.zoomIn({ duration: 300 });
  };

  const handleZoomOut = () => {
    mapRef.current?.zoomOut({ duration: 300 });
  };

  const handlePan = () => {};

  return (
    <div className={cn('flex flex-col items-center gap-3 p-4', className)}>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Zoom in"
        onClick={handleZoomIn}
        className="hover:bg-transparent hover:text-imos-white text-imos-white hover:scale-110 w-9 h-9 drop-shadow-[0_0_3px_rgba(0,0,0,1)]"
        asChild
      >
        <AddCircleIcon size="xl" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Zoom out"
        onClick={handleZoomOut}
        className="hover:bg-transparent hover:text-imos-white text-imos-white hover:scale-110 w-9 h-9 drop-shadow-[0_0_3px_rgba(0,0,0,1)]"
        asChild
      >
        <MinusCircleIcon size="xl" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Pan"
        onClick={handlePan}
        isActive={isPanActive}
        className="hover:bg-transparent hover:text-imos-white text-imos-white hover:scale-110 w-9 h-9 drop-shadow-[0_0_3px_rgba(0,0,0,1)]"
        asChild
      >
        <HandIcon />
      </Button>
    </div>
  );
};

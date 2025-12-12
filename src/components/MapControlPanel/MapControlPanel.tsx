import { Button } from '@/components';
import { cn } from '@/utils';
import { AddCircleIcon, HandIcon, MinusCircleIcon, ZoomResetIcon } from '../Icons';
import { INITIAL_ZOOM } from '@/config';

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

  const handleResetZoom = () => {
    mapRef.current?.setZoom(INITIAL_ZOOM);
  };
  const handlePan = () => {};

  return (
    <div className={cn('flex items-center', className)}>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Zoom in"
        onClick={handleZoomIn}
        asChild
        className="hover:bg-transparent hover:text-imos-white text-imos-white hover:scale-110 w-9 h-9 drop-shadow-[0_0_3px_rgba(0,0,0,1)]"
      >
        <AddCircleIcon />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Zoom out"
        onClick={handleZoomOut}
        asChild
        className="hover:bg-transparent hover:text-imos-white text-imos-white hover:scale-110 w-9 h-9 ml-1 drop-shadow-[0_0_3px_rgba(0,0,0,1)]"
      >
        <MinusCircleIcon />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Zoom reset"
        onClick={handleResetZoom}
        isActive={isPanActive}
        asChild
        className="hover:bg-transparent hover:text-imos-white text-imos-white hover:scale-110 w-9 h-9 ml-1 drop-shadow-[0_0_3px_rgba(0,0,0,1)]"
      >
        <ZoomResetIcon />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Pan"
        onClick={handlePan}
        isActive={isPanActive}
        asChild
        className="hover:bg-transparent hover:text-imos-white text-imos-white hover:scale-110 w-9 h-9 ml-1 drop-shadow-[0_0_3px_rgba(0,0,0,1)]"
      >
        <HandIcon />
      </Button>
    </div>
  );
};

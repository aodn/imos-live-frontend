import { Button } from '@/components';
import { cn } from '@/utils';
import { RenewIcon, PlusIcon, MinusIcon } from '../Icons';
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

  return (
    <div className={cn('flex flex-col gap-y-2 justify-center', className)}>
      <Button
        size="icon"
        aria-label="Zoom in"
        onClick={handleZoomIn}
        className="bg-imos-white rounded-full p-2 hover:[&_svg]:text-imos-white"
      >
        <PlusIcon className="text-imos-grey" size="lg" />
      </Button>
      <Button
        size="icon"
        aria-label="Zoom out"
        onClick={handleZoomOut}
        className="bg-imos-white rounded-full p-2 hover:[&_svg]:text-imos-white"
      >
        <MinusIcon className="text-imos-grey" size="lg" />
      </Button>
      <Button
        size="icon"
        aria-label="Zoom reset"
        onClick={handleResetZoom}
        isActive={isPanActive}
        className="bg-imos-white rounded-full p-2 hover:[&_svg]:text-imos-white"
      >
        <RenewIcon className="text-imos-grey" size="lg" />
      </Button>
    </div>
  );
};

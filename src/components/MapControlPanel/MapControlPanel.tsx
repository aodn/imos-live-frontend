import { Button } from '@/components';
import { cn } from '@/utils';
import { RenewIcon, PlusIcon, MinusIcon, FullScreenIcon, CloseFullScreenIcon } from '../Icons';
import { INITIAL_ZOOM } from '@/config';
import { useIsMapDragging, useIsMapZooming } from '@/hooks';
import { setSidebarOpen, useSidebarStore } from '@/store';

export const MapControlPanel = ({
  ref: mapRef,
  className = '',
}: {
  ref: React.RefObject<mapboxgl.Map | null>;
  className?: string;
}) => {
  const isDragging = useIsMapDragging(mapRef);
  const isZooming = useIsMapZooming(mapRef);

  const isMapOnOperation = isDragging || isZooming;
  const isSidebarOpen = useSidebarStore(s => s.isOpen);

  const handleZoomIn = () => {
    mapRef.current?.zoomIn({ duration: 300 });
  };

  const handleZoomOut = () => {
    mapRef.current?.zoomOut({ duration: 300 });
  };

  const handleResetZoom = () => {
    mapRef.current?.setZoom(INITIAL_ZOOM);
  };

  const handleOpenFullScreen = () => {
    setSidebarOpen(true);
  };
  const handleCloseFullScreen = () => {
    setSidebarOpen(false);
  };

  return (
    <div className={cn('flex flex-col gap-y-2 items-center', className)}>
      <Button
        size="icon"
        aria-label="Zoom in"
        onClick={isSidebarOpen ? handleCloseFullScreen : handleOpenFullScreen}
        className="bg-imos-white  p-2 hover:[&_svg]:text-imos-white"
        disabled={isMapOnOperation}
      >
        {isSidebarOpen ? (
          <FullScreenIcon className="text-imos-grey" size="base" />
        ) : (
          <CloseFullScreenIcon className="text-imos-grey" size="base" />
        )}
      </Button>
      <Button
        size="icon"
        aria-label="Zoom in"
        onClick={handleZoomIn}
        className="bg-imos-white rounded-full p-1 hover:[&_svg]:text-imos-white"
        disabled={isMapOnOperation}
      >
        <PlusIcon className="text-imos-grey" size="lg" />
      </Button>
      <Button
        size="icon"
        aria-label="Zoom out"
        onClick={handleZoomOut}
        className="bg-imos-white rounded-full p-1 hover:[&_svg]:text-imos-white"
        disabled={isMapOnOperation}
      >
        <MinusIcon className="text-imos-grey" size="lg" />
      </Button>
      <Button
        size="icon"
        aria-label="Zoom reset"
        onClick={handleResetZoom}
        className="bg-imos-white rounded-full p-1 hover:[&_svg]:text-imos-white"
        disabled={isMapOnOperation}
      >
        <RenewIcon className="text-imos-grey" size="lg" />
      </Button>
    </div>
  );
};

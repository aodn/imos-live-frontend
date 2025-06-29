import { Button } from '@/components';
import { AddCircleIcon, MinusCircleIcon, HandIcon } from '../Icons';
import { cn } from '@/utils';
import { useMapUIStore } from '@/store';
import { useMapView } from '@/hooks';
import { useShallow } from 'zustand/shallow';

export const MapControlPanel = ({
  ref: mapRef,
  isPanActive = false,
  className = '',
}: {
  ref: React.RefObject<mapboxgl.Map | null>;
  isPanActive?: boolean;
  className?: string;
}) => {
  const { center, zoom, setCenter, setZoom } = useMapUIStore(
    useShallow(s => ({
      center: s.center,
      zoom: s.zoom,
      setCenter: s.setCenter,
      setZoom: s.setZoom,
    })),
  );

  useMapView(mapRef, center, zoom, setCenter, setZoom);

  const handleZoomIn = () => {
    mapRef.current?.zoomIn({ duration: 300 });
  };

  const handleZoomOut = () => {
    mapRef.current?.zoomOut({ duration: 300 });
  };

  const handlePan = () => {};

  return (
    <div className={cn('flex flex-col items-center gap-2 p-4  bg-transparent', className)}>
      <Button variant="ghost" size="icon" aria-label="Zoom in" onClick={handleZoomIn}>
        <AddCircleIcon size="xl" color="imos-white" />
      </Button>
      <Button variant="ghost" size="icon" aria-label="Zoom out" onClick={handleZoomOut}>
        <MinusCircleIcon size="xl" color="imos-white" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Pan"
        onClick={handlePan}
        isActive={isPanActive}
      >
        <HandIcon size="xl" color="imos-white" />
      </Button>
    </div>
  );
};

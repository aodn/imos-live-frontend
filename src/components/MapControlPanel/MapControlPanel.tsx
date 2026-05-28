import { Button } from '@/components';
import { cn } from '@/utils';
import {
  RenewIcon,
  PlusIcon,
  MinusIcon,
  FullScreenIcon,
  CloseFullScreenIcon,
  DownloadIcon,
} from '../Icons';
import { COLOR_OPTIONS, INITIAL_ZOOM, MIN_EXPORT_MAP_WIDTH } from '@/constants';
import { useIsMapDragging, useIsMapZooming, useMapCanvasWidth } from '@/hooks';
import { setSidebarOpen, useMapUIStore, useSidebarStore } from '@/store';
import { exportMapImage } from '@/helpers';
import { useShallow } from 'zustand/shallow';
import { TILES_GROUP, PRODUCTLEGENDS, PRODUCTS } from '@/constants';
import { colorTuplesToCss } from '@/utils';

export function MapControlPanel({
  ref: mapRef,
  className = '',
}: {
  ref: React.RefObject<mapboxgl.Map | null>;
  className?: string;
}) {
  const isDragging = useIsMapDragging(mapRef);
  const isZooming = useIsMapZooming(mapRef);
  const mapCanvasWidth = useMapCanvasWidth(mapRef);

  const { date, productEnabled } = useMapUIStore(
    useShallow(s => ({
      date: s.date,
      productEnabled: s.productEnabled,
    })),
  );

  const activeProduct = TILES_GROUP.find(p => productEnabled[p]);

  const isMapOnOperation = isDragging || isZooming;
  const isMapTooNarrow = mapCanvasWidth > 0 && mapCanvasWidth < MIN_EXPORT_MAP_WIDTH;
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

  const downloadMapImage = () => {
    if (!mapRef.current) return;

    const productArg = activeProduct
      ? {
          name: PRODUCTS[activeProduct].name,
          colors: colorTuplesToCss(COLOR_OPTIONS[PRODUCTLEGENDS[activeProduct].colorKey]),
          scales: PRODUCTLEGENDS[activeProduct].scales,
          label: PRODUCTLEGENDS[activeProduct].label,
        }
      : undefined;

    const rawBounds = mapRef.current.getBounds();
    const bounds = rawBounds
      ? {
          west: rawBounds.getWest(),
          east: rawBounds.getEast(),
          south: rawBounds.getSouth(),
          north: rawBounds.getNorth(),
        }
      : undefined;

    mapRef.current.once('render', () => {
      exportMapImage(mapRef.current!.getCanvas(), date, productArg, bounds);
    });

    mapRef.current.triggerRepaint();
  };
  return (
    <div className={cn('flex flex-col gap-y-2 items-center', className)}>
      <Button
        size="icon"
        aria-label="Zoom in"
        onClick={isSidebarOpen ? handleCloseFullScreen : handleOpenFullScreen}
        className="bg-imos-white  p-2 hover:[&_svg]:text-imos-grey"
        disabled={isMapOnOperation}
      >
        {isSidebarOpen ? (
          <FullScreenIcon className="text-imos-grey" size="sm" />
        ) : (
          <CloseFullScreenIcon className="text-imos-grey" size="sm" />
        )}
      </Button>
      <Button
        size="icon"
        aria-label="Zoom in"
        onClick={handleZoomIn}
        className="bg-imos-white rounded-full p-1 hover:[&_svg]:text-imos-grey"
        disabled={isMapOnOperation}
      >
        <PlusIcon className="text-imos-grey" size="lg" />
      </Button>
      <Button
        size="icon"
        aria-label="Zoom out"
        onClick={handleZoomOut}
        className="bg-imos-white rounded-full p-1 hover:[&_svg]:text-imos-grey"
        disabled={isMapOnOperation}
      >
        <MinusIcon className="text-imos-grey" size="lg" />
      </Button>
      <Button
        size="icon"
        aria-label="Zoom reset"
        onClick={handleResetZoom}
        className="bg-imos-white rounded-full p-1 hover:[&_svg]:text-imos-grey"
        disabled={isMapOnOperation}
      >
        <RenewIcon className="text-imos-grey" size="lg" />
      </Button>
      <Button
        size="icon"
        aria-label="download map"
        onClick={downloadMapImage}
        className="bg-imos-white rounded-full p-1 hover:[&_svg]:text-imos-grey"
        disabled={isMapOnOperation || isMapTooNarrow}
        title={isMapTooNarrow ? 'Widen the map to enable image export' : undefined}
      >
        <DownloadIcon className="text-imos-grey" size="lg" />
      </Button>
    </div>
  );
}

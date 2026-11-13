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
import type { LegendArgs } from '@/constants';
import { COLOR_OPTIONS, INITIAL_CENTER, INITIAL_ZOOM, MIN_EXPORT_MAP_WIDTH } from '@/constants';
import {
  useIsMapDragging,
  useIsMapZooming,
  useMapCanvasWidth,
  useProductFlagMeanings,
} from '@/hooks';
import { setSidebarOpen, useMapUIStore, useSidebarStore } from '@/store';
import { useShallow } from 'zustand/shallow';
import { SCALAR_TILES_GROUP, PRODUCTS } from '@/constants';
import { CategoryColorScaleBar, LinearColorScaleBar, LogColorScaleBar } from '../ColorScaleBar';

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

  const { date, productEnabled, productLegends } = useMapUIStore(
    useShallow(s => ({
      date: s.date,
      productEnabled: s.productEnabled,
      productLegends: s.productLegends,
    })),
  );

  const activeProduct = SCALAR_TILES_GROUP.find(p => productEnabled[p]);
  const activeFlagMeanings = useProductFlagMeanings(activeProduct);

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
    mapRef.current?.easeTo({ center: INITIAL_CENTER, zoom: INITIAL_ZOOM, duration: 300 });
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
          legend: buildExportLegend(productLegends[activeProduct], activeFlagMeanings),
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
      void import('@/helpers/mapImageExport').then(({ exportMapImage }) =>
        exportMapImage(mapRef.current!.getCanvas(), date, productArg, bounds),
      );
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

/** Mirrors LayerCard's legend rendering so the exported PNG shows the same scale bar. */
function buildExportLegend(legend: LegendArgs, flagMeanings?: string[]) {
  const colors = COLOR_OPTIONS[legend.colorKey];

  if (legend.scale === 'category') {
    return <CategoryColorScaleBar colors={colors} scales={flagMeanings} />;
  }
  const [min, max] = legend.range;
  if (legend.scale === 'log') {
    return <LogColorScaleBar colors={colors} min={min} max={max} />;
  }
  return <LinearColorScaleBar colors={colors} min={min} max={max} scales={legend.scales} />;
}

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
import { COLOR_OPTIONS, MIN_EXPORT_MAP_WIDTH } from '@/constants';
import { useIsMapDragging, useIsMapZooming, useMapCanvasWidth, useProductLabels } from '@/hooks';
import { fitDefaultView } from '@/helpers';
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
  const { flagMeanings: activeFlagMeanings } = useProductLabels(activeProduct);

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
    if (mapRef.current) fitDefaultView(mapRef.current, 300);
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
        className="bg-white  p-2 hover:[&_svg]:text-ink-muted"
        disabled={isMapOnOperation}
      >
        {isSidebarOpen ? (
          <FullScreenIcon className="text-ink-muted" size="sm" />
        ) : (
          <CloseFullScreenIcon className="text-ink-muted" size="sm" />
        )}
      </Button>
      <Button
        size="icon"
        aria-label="Zoom in"
        onClick={handleZoomIn}
        className="bg-white rounded-full p-1 hover:[&_svg]:text-ink-muted"
        disabled={isMapOnOperation}
      >
        <PlusIcon className="text-ink-muted" size="lg" />
      </Button>
      <Button
        size="icon"
        aria-label="Zoom out"
        onClick={handleZoomOut}
        className="bg-white rounded-full p-1 hover:[&_svg]:text-ink-muted"
        disabled={isMapOnOperation}
      >
        <MinusIcon className="text-ink-muted" size="lg" />
      </Button>
      <Button
        size="icon"
        aria-label="Zoom reset"
        onClick={handleResetZoom}
        className="bg-white rounded-full p-1 hover:[&_svg]:text-ink-muted"
        disabled={isMapOnOperation}
      >
        <RenewIcon className="text-ink-muted" size="lg" />
      </Button>
      <Button
        size="icon"
        aria-label="download map"
        onClick={downloadMapImage}
        className="bg-white rounded-full p-1 hover:[&_svg]:text-ink-muted"
        disabled={isMapOnOperation || isMapTooNarrow}
        title={isMapTooNarrow ? 'Widen the map to enable image export' : undefined}
      >
        <DownloadIcon className="text-ink-muted" size="lg" />
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

import { useEffect } from 'react';
import { setProductErrorByProduct } from '@/store';
import { isOverlaySourceId, sourceIdToProduct } from '@/constants';
import { MapSourceDataEvent } from 'mapbox-gl';

/**
 * Detect products erros: GSLA_ANOMALY_SEA_LEVELS, SST_ANOMALY_MOSAIC
 *
 * Mapbox will not throw error for tiles fail loading in addOrUpdateWMSSource. So this hook
 * can catch tiles error.
 * "sourcedata" fires when tiles or sources attempt to load, but it does not catch and throw
 * image load error like what did in useParcileLayer.
 *
 * issue of this validation: it only check the visible product layer, as the not visible product
 * layer will not fire sourcedata event. And currently, either of GSLA_ANOMALY_SEA_LEVELS, SST_ANOMALY_MOSAIC
 * enabled. So this check only work on the visible product.
 *
 * Parallel validation implemented in RasterLegend, the legened image loaded validated. It could validate both
 * products, but it does not validate tiles directly.
 */
export function useOverlayProductErrorDetect(map: React.RefObject<mapboxgl.Map | null>) {
  const mapInstance = map.current;

  useEffect(() => {
    if (!mapInstance) return;

    const handleError = (e: MapSourceDataEvent) => {
      if (e.sourceDataType !== 'error' || !e.isSourceLoaded || !e.sourceId) return;
      if (isOverlaySourceId(e.sourceId)) {
        setProductErrorByProduct(sourceIdToProduct(e.sourceId), true);
      }
    };

    mapInstance.on('sourcedata', handleError);
    return () => {
      mapInstance.off('sourcedata', handleError);
    };
  }, [map, mapInstance]);
}

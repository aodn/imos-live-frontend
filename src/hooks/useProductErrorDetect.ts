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

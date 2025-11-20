import { useEffect } from 'react';
import { setProductErrorByProduct } from '@/store';
import { isProductSourceId, sourceIdToProduct } from '@/constants';
import { MapSourceDataEvent } from 'mapbox-gl';

/**
 * Detect products erros: GSLA_ANOMALY_SEA_LEVELS, WAVE_BUOYS, SST_ANOMALY_MOSAIC
 *
 * Mapbox will not throw error for tiles fail loading in addOrUpdateWMSSource.
 * "sourcedata" fires when tiles or sources attempt to load, but it does not catch and throw
 * image load error like what did in useParcileLayer.
 *
 */
export function useProductErrorDetect(map: React.RefObject<mapboxgl.Map | null>) {
  const mapInstance = map.current;

  useEffect(() => {
    if (!mapInstance) return;

    const handleError = (e: MapSourceDataEvent) => {
      if (!e.sourceId) return;
      if (e.sourceDataType !== 'error' || !e.isSourceLoaded) return;
      const sourceId = e.sourceId;
      if (isProductSourceId(sourceId)) {
        console.log(e);
        setProductErrorByProduct(sourceIdToProduct(sourceId), true);
      }
    };

    mapInstance.on('sourcedata', handleError);
    return () => {
      mapInstance.off('sourcedata', handleError);
    };
  }, [map, mapInstance]);
}

import { useEffect } from 'react';
import { setProductErrorByProduct } from '@/store';
import { isProductSourceId, Product, Products, sourceIdToProduct } from '@/constants';
import { MapSourceDataEvent } from 'mapbox-gl';

interface UseWmsErrorHandlingParams {
  map: React.RefObject<mapboxgl.Map | null>;
}

export function useProductErrorDetect({ map }: UseWmsErrorHandlingParams) {
  const mapInstance = map.current;

  useEffect(() => {
    if (!mapInstance) return;

    const handleError = (e: MapSourceDataEvent) => {
      console.log(e.sourceId);
      if (e.sourceId === Products[Product.GSLA_OCEAN_GEOSTROPHIC_CURRENT].sourceId)
        console.log(e.sourceId);
      if (e.sourceDataType !== 'error' || !e.isSourceLoaded) return;
      const sourceId = e.sourceId || '';
      if (isProductSourceId(sourceId)) {
        console.log({ id: sourceIdToProduct(sourceId) });
        setProductErrorByProduct(sourceIdToProduct(sourceId), true);
      }
    };

    mapInstance.on('sourcedata', handleError);
    return () => {
      mapInstance.off('sourcedata', handleError);
    };
  }, [map, mapInstance]);
}

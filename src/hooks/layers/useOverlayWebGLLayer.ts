import type { WebGlLayerProduct, WebGLOverlayLayer, WebGLOverlaySource } from '@/constants';
import { PRODUCT, PRODUCTCOLORPALETTES, PRODUCTLEGENDS, PRODUCTS } from '@/constants';
import { addLayerInOrder, addOrUpdateImageSource } from '@/helpers';
import { webGLOverlayLayer as WebglOverlayLayer } from '@/layers';
import { useMapUIStore } from '@/store';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/shallow';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';
import axios from 'axios';
import type { ColorPalette } from '@/layers/WebGLOverlayField';
import { useDidMountEffect } from '../useDidMountEffect';
import { useCustomLayerVisibility } from './useCustomLayerVisibility';

type UseOverlayWebGLLayer = {
  map: React.RefObject<mapboxgl.Map | null>;
  layerId: WebGLOverlayLayer;
  sourceId: WebGLOverlaySource;
  product: WebGlLayerProduct;
};

export function useOverlayWebGLLayer({ map, layerId, sourceId, product }: UseOverlayWebGLLayer) {
  const { date, enabled, isError } = useMapUIStore(
    useShallow(s => ({
      date: s.date,
      enabled: s.productEnabled[product],
      isError: s.productError[product],
    })),
  );

  const currentMetaDataQuery = useQuery({
    queryKey: [PRODUCTS[product].metaDataName, date, product],
    queryFn: () => axios.get(PRODUCTS[product].metaDataName),
    enabled: !!date && enabled,
  });

  const layer = useMemo(
    () => WebglOverlayLayer(layerId, sourceId, PRODUCTCOLORPALETTES[product]),
    [layerId, product, sourceId],
  );

  const setDataByDataset = useCallback(async () => {
    try {
      const data = await currentMetaDataQuery.promise;
      if (!data) return;

      const meta = data.data;
      const { latRange, lonRange, rawLatRange, rawLonRange, valueRange } = meta;

      const displayLonRange = rawLonRange || lonRange;
      const displayLatRange = rawLatRange || latRange;
      //TODO: investigate why this is different from bounds in processMetaData
      const bounds: [number, number, number, number] = [
        displayLonRange[0], // west
        displayLatRange[0], // south
        displayLonRange[1], // east
        displayLatRange[1], // north
      ];

      layer.metadata = {
        bounds: bounds,
        range: valueRange,
        legendRange: PRODUCTLEGENDS[PRODUCT.SST_ANOM_MOSAIC_WEBGL].range,
      };

      addOrUpdateImageSource(
        map.current!,
        sourceId,
        PRODUCTS[product].imageName,
        displayLonRange,
        displayLatRange,
      );
    } catch (error) {
      console.error('Error setting up SST anomaly mosaic layer:', error);
    }
  }, [currentMetaDataQuery.promise, layer, map, product, sourceId]);

  const setupLayer = useCallback(async () => {
    if (!layer) return;
    await setDataByDataset();
    if (!map.current!.getLayer(layer.id)) {
      addLayerInOrder(map, layer);
    }
  }, [map, layer, setDataByDataset]);

  const { loadComplete } = useMapboxLayerSetup(map, setupLayer);

  useCustomLayerVisibility(map, loadComplete, layer, enabled && !isError);

  useDidMountEffect(() => {
    if (!map.current || !loadComplete) return;
    setDataByDataset();
  }, [loadComplete, date]);

  const updatePalette = useCallback((p: ColorPalette) => layer.updatePalette(p), [layer]);

  return { updatePalette };
}

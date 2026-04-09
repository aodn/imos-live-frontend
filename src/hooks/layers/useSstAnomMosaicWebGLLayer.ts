import {
  PRODUCT,
  PRODUCTLEGENDS,
  SST_ANOM_MOSAIC_META_NAME,
  SST_ANOM_MOSAIC_WEBGL_LAYER_ID,
  SST_ANOM_MOSAIC_WEBGL_SOURCE_ID,
} from '@/constants';
import { addLayerInOrder, addOrUpdateImageSource } from '@/helpers';
import { webGLOverlayLayer as WebglOverlayLayer } from '@/layers';
import { useMapUIStore } from '@/store';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { useShallow } from 'zustand/shallow';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';
import { sstAnomMosaicLinearPalette } from '@/config';
import axios from 'axios';
import type { ColorPalette } from '@/layers/WebGLOverlayField';
import { useDidMountEffect } from '../useDidMountEffect';
import { useCustomLayerVisibility } from './useCustomLayerVisibility';

export function useSstAnomMosaicWebGLLayer(map: React.RefObject<mapboxgl.Map | null>) {
  const [isError, setIsError] = useState(false);
  const { sstAnomMosaic, date } = useMapUIStore(
    useShallow(s => ({
      sstAnomMosaic: s.productEnabled[PRODUCT.SST_ANOM_MOSAIC_WEBGL],
      date: s.date,
    })),
  );

  const currentMetaDataQuery = useQuery({
    queryKey: [SST_ANOM_MOSAIC_META_NAME, date],
    queryFn: () => axios.get('sst_anom_mosaic_meta.json'),
    enabled: !!date && sstAnomMosaic,
  });

  const sstWebglLayer = useMemo(
    () =>
      WebglOverlayLayer(
        SST_ANOM_MOSAIC_WEBGL_LAYER_ID,
        SST_ANOM_MOSAIC_WEBGL_SOURCE_ID,
        sstAnomMosaicLinearPalette,
      ),
    [],
  );

  const setDataByDataset = useCallback(async () => {
    try {
      const data = await currentMetaDataQuery.promise;
      if (!data) return;

      const meta = data.data;
      const { latRange, lonRange, rawLatRange, rawLonRange, sstAnomMosaicRange } = meta;

      const displayLonRange = rawLonRange || lonRange;
      const displayLatRange = rawLatRange || latRange;
      //TODO: investigate why this is different from bounds in processMetaData
      const overlayBounds: [number, number, number, number] = [
        displayLonRange[0], // west
        displayLatRange[0], // south
        displayLonRange[1], // east
        displayLatRange[1], // north
      ];

      sstWebglLayer.metadata = {
        bounds: overlayBounds,
        range: sstAnomMosaicRange,
        legendRange: PRODUCTLEGENDS[PRODUCT.SST_ANOM_MOSAIC_WEBGL].range,
      };

      addOrUpdateImageSource(
        map.current!,
        SST_ANOM_MOSAIC_WEBGL_SOURCE_ID,
        'sst_anom_mosaic_overlay_input.webp',
        displayLonRange,
        displayLatRange,
      );
      setIsError(false);
    } catch (error) {
      console.error('Error setting up SST anomaly mosaic layer:', error);
      setIsError(true);
    }
  }, [currentMetaDataQuery.promise, map, sstWebglLayer]);

  const setupLayer = useCallback(async () => {
    if (!sstWebglLayer) return;
    await setDataByDataset();
    if (!map.current!.getLayer(sstWebglLayer.id)) {
      addLayerInOrder(map, sstWebglLayer);
    }
  }, [map, sstWebglLayer, setDataByDataset]);

  const { loadComplete } = useMapboxLayerSetup(map, setupLayer);

  useCustomLayerVisibility(map, loadComplete, sstWebglLayer, sstAnomMosaic && !isError);

  useDidMountEffect(() => {
    if (!map.current || !loadComplete) return;
    setDataByDataset();
  }, [loadComplete, date]);

  const updatePalette = useCallback(
    (p: ColorPalette) => sstWebglLayer.updatePalette(p),
    [sstWebglLayer],
  );

  return { updatePalette };
}

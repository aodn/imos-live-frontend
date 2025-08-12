import {
  GSLA_META_NAME,
  GSLA_SEA_LEVEL_NAME,
  OVERLAY_LAYER_ID,
  OVERLAY_SOURCE_ID,
} from '@/constants';
import { addLayerInOrder, addOrUpdateImageSource } from '@/helpers';
import { imageLayer } from '@/layers';
import { processMetaData, buildGSLADatasetFullPath, buildGSLADatasetPath } from '@/utils';
import { useMapboxLayerVisibility } from './useMapboxLayerVisibility';
import { useMapboxLayerRef } from './useMapboxLayerRef';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';
import { overlayLayerConfig } from '@/config';
import { useToast } from '@/components';
import { useCallback, useEffect, useState } from 'react';
import { getMetaData } from '@/api';
import { useQueryClient } from '@tanstack/react-query';
import { useDidMountEffect } from './useDidMountEffect';

export function useOverlayLayer(
  map: React.RefObject<mapboxgl.Map | null>,
  overlay: boolean,
  style: string,
  dataset: string,
) {
  const { showToast } = useToast();
  const [isError, setIsError] = useState(false);
  const queryClient = useQueryClient();

  const overlayLayer = useMapboxLayerRef(
    () =>
      imageLayer(
        { id: OVERLAY_LAYER_ID, source: OVERLAY_SOURCE_ID, ...overlayLayerConfig },
        overlay,
      ),
    style,
  );

  const setDataByDataset = useCallback(async () => {
    try {
      const meta = await queryClient.fetchQuery({
        queryKey: [GSLA_META_NAME, dataset],
        queryFn: () => getMetaData(buildGSLADatasetPath(dataset, GSLA_META_NAME)),
      });

      if (!meta) return;

      const { maxBounds, lonRange, latRange, rawLatRange, rawLonRange } = processMetaData(meta);

      map.current!.setMaxBounds(maxBounds);

      addOrUpdateImageSource(
        map.current!,
        OVERLAY_SOURCE_ID,
        buildGSLADatasetFullPath(dataset, GSLA_SEA_LEVEL_NAME),
        rawLonRange || lonRange,
        rawLatRange || latRange,
      );
      setIsError(false);
    } catch {
      setIsError(true);
    }
  }, [dataset, map, queryClient]);

  const setupLayer = useCallback(async () => {
    if (!overlayLayer.current) return;
    await setDataByDataset();
    if (!map.current?.getLayer(OVERLAY_LAYER_ID)) {
      addLayerInOrder(map, overlayLayer.current, OVERLAY_LAYER_ID);
    }
  }, [map, overlayLayer, setDataByDataset]);

  const { loadComplete } = useMapboxLayerSetup(map, setupLayer, [style]);

  useMapboxLayerVisibility(map, loadComplete, [overlayLayer], overlay && !isError);

  useDidMountEffect(() => {
    if (!map.current || !loadComplete) return;
    setDataByDataset();
  }, [loadComplete, dataset]);

  useEffect(() => {
    if (isError)
      showToast({
        type: 'error',
        title: 'Error occurred',
        message: 'Failed to get GSLA anamly sea level data of this date',
        duration: 6000,
      });
  }, [isError, showToast]);

  return { loadComplete, overlayLayer };
}

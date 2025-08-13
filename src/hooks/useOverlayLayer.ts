import { getMetaData } from '@/api';
import { useToast } from '@/components';
import { overlayLayerConfig } from '@/config';
import {
  GSLA_META_NAME,
  GSLA_SEA_LEVEL_NAME,
  OVERLAY_LAYER_ID,
  OVERLAY_SOURCE_ID,
} from '@/constants';
import { addLayerInOrder, addOrUpdateImageSource } from '@/helpers';
import { imageLayer } from '@/layers';
import { useMapUIStore } from '@/store';
import { buildGSLADatasetFullPath, buildGSLADatasetPath, processMetaData } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { useShallow } from 'zustand/shallow';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';
import { useMapboxLayerVisibility } from './useMapboxLayerVisibility';
import { useDidMountEffect } from './useDidMountEffect';

export function useOverlayLayer(map: React.RefObject<mapboxgl.Map | null>) {
  const { showToast } = useToast();
  const [isError, setIsError] = useState(false);
  const { overlay, dataset, style } = useMapUIStore(
    useShallow(s => ({
      overlay: s.overlay,
      dataset: s.dataset,
      style: s.style,
    })),
  );

  const gslaQuery = useQuery({
    queryKey: [GSLA_META_NAME, dataset],
    queryFn: () => getMetaData(buildGSLADatasetPath(dataset, GSLA_META_NAME)),
  });

  const overlayLayer = useMemo(
    () =>
      imageLayer(
        { id: OVERLAY_LAYER_ID, source: OVERLAY_SOURCE_ID, ...overlayLayerConfig },
        overlay,
      ),
    [overlay],
  );

  const setDataByDataset = useCallback(async () => {
    try {
      const data = await gslaQuery.promise;
      if (!data) return;
      const { lonRange, latRange } = processMetaData(data);

      addOrUpdateImageSource(
        map.current!,
        OVERLAY_SOURCE_ID,
        buildGSLADatasetFullPath(dataset, GSLA_SEA_LEVEL_NAME),
        lonRange,
        latRange,
      );
      setIsError(false);
    } catch (error) {
      console.error('Error adding layers back after style changes:', error);
      setIsError(true);
      showToast({
        type: 'error',
        title: 'Error occurred',
        message: 'Failed to get GSLA anamly sea level data of this date',
        duration: 6000,
      });
    }
  }, [dataset, gslaQuery.promise, map, showToast]);

  const setupLayer = useCallback(async () => {
    if (!overlayLayer) return;
    await setDataByDataset();
    addLayerInOrder(map, overlayLayer);
  }, [map, overlayLayer, setDataByDataset]);

  const { loadComplete } = useMapboxLayerSetup(map, setupLayer, [style]);

  useMapboxLayerVisibility(map, loadComplete, [overlayLayer], overlay && !isError);

  useDidMountEffect(() => {
    if (!map.current || !loadComplete) return;
    setDataByDataset();
  }, [loadComplete, dataset]);
}

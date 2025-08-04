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
import { useEffect } from 'react';
import { getMetaData } from '@/api';
import { useQuery } from '@tanstack/react-query';

export function useOverlayLayer(
  map: React.RefObject<mapboxgl.Map | null>,
  overlay: boolean,
  style: string,
  dataset: string,
) {
  const { showToast } = useToast();

  //cached by browser.
  const { data: meta, isError } = useQuery({
    queryKey: [GSLA_META_NAME, dataset],
    queryFn: () => getMetaData(buildGSLADatasetPath(dataset, GSLA_META_NAME)),
    enabled: !!dataset,
  });

  useEffect(() => {
    if (isError)
      showToast({
        type: 'error',
        title: 'Error occurred',
        message: 'Failed to get GSLA anamly sea level data of this date',
        duration: 6000,
      });
  }, [isError, showToast]);

  const setDataByDataset = async () => {
    if (!meta) return;

    const { maxBounds, lonRange, latRange } = processMetaData(meta);

    map.current!.setMaxBounds(maxBounds);

    await addOrUpdateImageSource(
      map.current!,
      OVERLAY_SOURCE_ID,
      buildGSLADatasetFullPath(dataset, GSLA_SEA_LEVEL_NAME),
      lonRange,
      latRange,
    );
  };

  const setupLayer = async () => {
    if (!overlayLayer.current) return;
    await setDataByDataset();
    if (!map.current?.getLayer(OVERLAY_LAYER_ID)) {
      addLayerInOrder(map, overlayLayer.current, OVERLAY_LAYER_ID);
    }
  };

  const overlayLayer = useMapboxLayerRef(
    () =>
      imageLayer(
        { id: OVERLAY_LAYER_ID, source: OVERLAY_SOURCE_ID, ...overlayLayerConfig },
        overlay,
      ),
    style,
  );

  const { loadComplete } = useMapboxLayerSetup(map, setupLayer, [style, dataset]);

  useMapboxLayerVisibility(map, loadComplete, [overlayLayer], overlay && !isError);

  return { loadComplete, overlayLayer };
}

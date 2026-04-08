import { getMetaData } from '@/api';
import { useToast } from '@/components';
import { GSLA_META_NAME, WEBGL_OVERLAY_LAYER_ID, WEBGL_OVERLAY_SOURCE_ID } from '@/constants';
import { addLayerInOrder, addOrUpdateImageSource } from '@/helpers';
import { webGLOverlayLayer as WebglOverlayLayer } from '@/layers';
import { useMapUIStore } from '@/store';
import { buildGSLADatasetPath, processMetaData } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { useShallow } from 'zustand/shallow';
import { useDidMountEffect } from './useDidMountEffect';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';
import { useCustomLayerVisibility } from './useCustomLayerVisibility';
import { paletteA } from '@/config';

export function useWebGLOverlayLayer(map: React.RefObject<mapboxgl.Map | null>) {
  const [isError, setIsError] = useState(false);
  const { showToast } = useToast();
  const { webglOverlay, dataset } = useMapUIStore(
    useShallow(s => ({
      webglOverlay: s.webglOverlay,
      dataset: s.dataset,
    })),
  );

  const currentMetaDataQuery = useQuery({
    queryKey: [GSLA_META_NAME, dataset],
    queryFn: () => getMetaData(buildGSLADatasetPath(dataset, GSLA_META_NAME)),
    enabled: !!dataset && webglOverlay,
  });

  const webglOverlayLayer = useMemo(
    () => WebglOverlayLayer(WEBGL_OVERLAY_LAYER_ID, WEBGL_OVERLAY_SOURCE_ID, paletteA),
    [],
  );

  const setDataByDataset = useCallback(async () => {
    try {
      const data = await currentMetaDataQuery.promise;
      if (!data) return;

      const { gslaRange, lonRange, latRange, gslaOverlayBounds } = processMetaData(data);

      webglOverlayLayer.metadata = {
        bounds: gslaOverlayBounds,
        range: gslaRange,
      };

      addOrUpdateImageSource(
        map.current!,
        WEBGL_OVERLAY_SOURCE_ID,
        'overlay_input.png',
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
        message: 'Failed to get buoys locations',
        duration: 6000,
      });
    }
  }, [currentMetaDataQuery.promise, map, webglOverlayLayer, showToast]);

  const setupLayer = useCallback(async () => {
    if (!webglOverlayLayer) return;
    await setDataByDataset();
    if (!map.current!.getLayer(webglOverlayLayer.id)) {
      addLayerInOrder(map, webglOverlayLayer);
    }
  }, [map, webglOverlayLayer, setDataByDataset]);

  const { loadComplete } = useMapboxLayerSetup(map, setupLayer);

  useCustomLayerVisibility(map, loadComplete, webglOverlayLayer, webglOverlay && !isError);

  useDidMountEffect(() => {
    if (!map.current || !loadComplete) return;
    setDataByDataset();
  }, [loadComplete, dataset]);

  return {
    updatePalette: webglOverlayLayer?.updatePalette.bind(webglOverlayLayer),
  };
}

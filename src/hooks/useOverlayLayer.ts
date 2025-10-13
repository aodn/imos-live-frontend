import { overlayLayerConfig } from '@/config';
import { OVERLAY_LAYER_ID, OVERLAY_SOURCE_ID } from '@/constants';
import { addLayerInOrder, addOrUpdateWaveBuoyWMSSource } from '@/helpers';
import { imageLayer } from '@/layers';
import { useMapUIStore } from '@/store';
import { useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/shallow';
import { useDidMountEffect } from './useDidMountEffect';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';
import { useMapboxLayerVisibility } from './useMapboxLayerVisibility';

export function useOverlayLayer(map: React.RefObject<mapboxgl.Map | null>) {
  const { overlay, dataset } = useMapUIStore(
    useShallow(s => ({
      overlay: s.overlay,
      dataset: s.dataset,
    })),
  );

  const overlayLayer = useMemo(
    () =>
      imageLayer(
        { id: OVERLAY_LAYER_ID, source: OVERLAY_SOURCE_ID, ...overlayLayerConfig },
        overlay,
      ),
    [overlay],
  );

  const setDataByDataset = useCallback(async () => {
    addOrUpdateWaveBuoyWMSSource(map.current!, OVERLAY_SOURCE_ID, dataset);
  }, [dataset, map]);

  const setupLayer = useCallback(async () => {
    if (!overlayLayer) return;
    await setDataByDataset();
    addLayerInOrder(map, overlayLayer);
  }, [map, overlayLayer, setDataByDataset]);

  const { loadComplete } = useMapboxLayerSetup(map, setupLayer, [overlayLayer]);

  useMapboxLayerVisibility(map, loadComplete, [overlayLayer], overlay);

  useDidMountEffect(() => {
    if (!map.current || !loadComplete) return;
    setDataByDataset();
  }, [loadComplete, dataset]);
}

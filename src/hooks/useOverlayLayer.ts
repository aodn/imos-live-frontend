import { overlayLayerConfig } from '@/config';
import { OVERLAY_LAYER_ID } from '@/constants';
import { addLayerInOrder, addOrUpdateWMSSource } from '@/helpers';
import { imageLayer } from '@/layers';
import { useMapUIStore } from '@/store';
import { useCallback, useMemo, useState } from 'react';
import { useShallow } from 'zustand/shallow';
import { useDidMountEffect } from './useDidMountEffect';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';
import { useMapboxLayerVisibility } from './useMapboxLayerVisibility';

export function useOverlayLayer(map: React.RefObject<mapboxgl.Map | null>) {
  const [isError, setIsError] = useState(false);
  const { overlay, date, overlaySource } = useMapUIStore(
    useShallow(s => ({
      overlaySource: s.overlaySource,
      overlay: s.overlay,
      date: s.date,
    })),
  );

  const overlayLayer = useMemo(
    () =>
      imageLayer(
        { id: OVERLAY_LAYER_ID, source: OVERLAY_LAYER_ID, ...overlayLayerConfig },
        overlay,
      ),
    [overlay],
  );

  const setDataByDataset = useCallback(async () => {
    try {
      await addOrUpdateWMSSource(map.current!, overlaySource, date);
      setIsError(false);
    } catch (error) {
      console.error(error);
      setIsError(true);
    }
  }, [date, map, overlaySource]);

  const setupLayer = useCallback(async () => {
    if (!overlayLayer) return;
    await setDataByDataset();
    addLayerInOrder(map, overlayLayer);
  }, [map, overlayLayer, setDataByDataset]);

  const { loadComplete } = useMapboxLayerSetup(map, setupLayer, [overlayLayer]);

  useMapboxLayerVisibility(map, loadComplete, [overlayLayer], overlay && !isError);

  useDidMountEffect(() => {
    if (!map.current || !loadComplete) return;
    setDataByDataset();
  }, [loadComplete, date, overlaySource]);
}

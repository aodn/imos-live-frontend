import {
  ISOBATH_LABEL_CONFIG,
  ISOBATH_LABEL_LAYER_ID,
  ISOBATH_LINE_CONFIG,
  ISOBATH_LINE_LAYER_ID,
  ISOBATH_SOURCE_ID,
} from '@/constants';
import { addLayerInOrder, addOrUpdateVectorSource } from '@/helpers';
import { lineLayer, symbolLayer } from '@/layers';
import { useMapUIStore } from '@/store';
import { isobathStyle } from '@/styles';
import { useCallback, useMemo } from 'react';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';
import { useMapboxLayerVisibility } from './useMapboxLayerVisibility';

// Depth contour lines and their labels, toggled by `isobathsEnabled`.
export function useIsobathLayer(map: React.RefObject<mapboxgl.Map | null>) {
  const isobathsEnabled = useMapUIStore(s => s.isobathsEnabled);

  const isobathLineLayer = useMemo(
    () =>
      lineLayer(
        { id: ISOBATH_LINE_LAYER_ID, source: ISOBATH_SOURCE_ID, ...ISOBATH_LINE_CONFIG },
        isobathsEnabled,
      ),
    [isobathsEnabled],
  );

  const isobathLabelLayer = useMemo(
    () =>
      symbolLayer(
        { id: ISOBATH_LABEL_LAYER_ID, source: ISOBATH_SOURCE_ID, ...ISOBATH_LABEL_CONFIG },
        isobathsEnabled,
      ),
    [isobathsEnabled],
  );

  const layers = useMemo(
    () => [isobathLineLayer, isobathLabelLayer],
    [isobathLineLayer, isobathLabelLayer],
  );

  const setupLayer = useCallback(async () => {
    if (!map.current) return;
    addOrUpdateVectorSource({ map: map.current, id: ISOBATH_SOURCE_ID, url: isobathStyle.source });
    layers.forEach(layer => addLayerInOrder(map, layer));
  }, [map, layers]);

  const { loadComplete } = useMapboxLayerSetup(map, setupLayer, [setupLayer]);

  useMapboxLayerVisibility(map, loadComplete, layers, isobathsEnabled);
}

import {
  GSLA_META_NAME,
  GSLA_SEA_LEVEL_NAME,
  OVERLAY_LAYER_ID,
  OVERLAY_SOURCE_ID,
} from '@/constants';
import { addLayerInOrder, addOrUpdateImageSource } from '@/helpers';
import { imageLayer } from '@/layers';
import { loadMetaDataFromUrl, buildDatasetUrl } from '@/utils';
import { useDidMountEffect } from './useDidMountEffect';
import { useMapboxLayerVisibility } from './useMapboxLayerVisibility';
import { useMapboxLayerRef } from './useMapboxLayerRef';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';
import { layersOrder, overlayLayerConfig } from '@/config';

export function useOverlayLayer(
  map: React.RefObject<mapboxgl.Map | null>,
  overlay: boolean,
  style: string,
  dataset: string,
) {
  const setDataByDataset = async () => {
    const { maxBounds, lonRange, latRange } = await loadMetaDataFromUrl(
      buildDatasetUrl(dataset, GSLA_META_NAME),
    );
    map.current!.setMaxBounds(maxBounds);

    addOrUpdateImageSource(
      map.current!,
      OVERLAY_SOURCE_ID,
      buildDatasetUrl(dataset, GSLA_SEA_LEVEL_NAME),
      lonRange,
      latRange,
    );
  };

  const setupLayer = async () => {
    if (!overlayLayer.current) return;
    await setDataByDataset();

    if (!map.current?.getLayer(OVERLAY_LAYER_ID)) {
      addLayerInOrder(map, layersOrder, overlayLayer.current, OVERLAY_LAYER_ID);
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

  useMapboxLayerVisibility(map, loadComplete, overlayLayer, overlay);

  useDidMountEffect(() => {
    if (!map.current || !loadComplete) return;
    setDataByDataset();
  }, [loadComplete, dataset]);

  return { loadComplete, overlayLayer };
}

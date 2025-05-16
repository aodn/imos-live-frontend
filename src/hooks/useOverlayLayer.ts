import { GSLAMETANAME, GSLASEALEVELNAME, OVERLAY_LAYER_ID, OVERLAY_SOURCE_ID } from '@/constants';
import { addOrUpdateImageSource } from '@/helpers';
import { imageLayer } from '@/layers';
import { loadMetaDataFromUrl, buildDatasetUrl } from '@/utils';
import { useDidMountEffect } from './useDidMountEffect';
import { useMapboxLayerVisibility } from './useMapboxLayerVisibility';
import { useMapboxLayerRef } from './useMapboxLayerRef';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';

export function useOverlayLayer(
  map: React.RefObject<mapboxgl.Map | null>,
  overlay: boolean,
  style: string,
  dataset: string,
) {
  const setDataByDataset = async () => {
    const { maxBounds, lonRange, latRange } = await loadMetaDataFromUrl(
      buildDatasetUrl(dataset, GSLAMETANAME),
    );
    map.current!.setMaxBounds(maxBounds);

    addOrUpdateImageSource(
      map.current!,
      OVERLAY_SOURCE_ID,
      buildDatasetUrl(dataset, GSLASEALEVELNAME),
      lonRange,
      latRange,
    );
  };

  const setupLayer = async () => {
    if (!overlayLayer.current) return;
    await setDataByDataset();

    if (!map.current!.getLayer(OVERLAY_LAYER_ID)) {
      map.current!.addLayer(overlayLayer.current);
    }
  };

  const overlayLayer = useMapboxLayerRef(
    () => imageLayer(OVERLAY_LAYER_ID, OVERLAY_SOURCE_ID, overlay),
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

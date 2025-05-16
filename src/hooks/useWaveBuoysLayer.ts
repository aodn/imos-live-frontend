import { circleLayer } from '@/layers';
import { GSLAMETANAME, WAVE_BUOYS_LAYER_ID, WAVE_BUOYS_SOURCE_ID } from '@/constants';
import { addOrUpdateGeoJsonSource } from '@/helpers';
import { buildDatasetUrl, buildOgcBuoysUrl, loadMetaDataFromUrl } from '@/utils';
import { useDidMountEffect } from './useDidMountEffect';
import { useMapboxLayerVisibility } from './useMapboxLayerVisibility';
import { useMapboxLayerRef } from './useMapboxLayerRef';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';

export function useWaveBuoysLayer(
  map: React.RefObject<mapboxgl.Map | null>,
  circle: boolean,
  style: string,
  dataset: string,
) {
  const setDataByDataset = async () => {
    const { maxBounds } = await loadMetaDataFromUrl(buildDatasetUrl(dataset, GSLAMETANAME));
    map.current!.setMaxBounds(maxBounds);
    addOrUpdateGeoJsonSource(
      map.current!,
      WAVE_BUOYS_SOURCE_ID,
      buildOgcBuoysUrl('b299cdcd-3dee-48aa-abdd-e0fcdbb9cadc'),
    );
  };

  const setupLayer = async () => {
    if (!waveBuoysLayer.current) return;
    await setDataByDataset();
    if (!map.current!.getLayer(WAVE_BUOYS_LAYER_ID)) {
      map.current!.addLayer(waveBuoysLayer.current);
    }
  };

  const waveBuoysLayer = useMapboxLayerRef(
    () => circleLayer(WAVE_BUOYS_LAYER_ID, WAVE_BUOYS_SOURCE_ID, circle),
    style,
  );

  const { loadComplete } = useMapboxLayerSetup(map, setupLayer, [style, dataset]);

  useMapboxLayerVisibility(map, loadComplete, waveBuoysLayer, circle);

  useDidMountEffect(() => {
    if (!map.current || !loadComplete) return;
    setDataByDataset();
  }, [loadComplete]);

  return { waveBuoysLayer };
}

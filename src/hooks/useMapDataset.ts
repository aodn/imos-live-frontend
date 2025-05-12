import { useEffect, RefObject } from 'react';
import { updateSourceByDataset } from '@/helpers';
import { useDidMountEffect } from '@/hooks';
import { VectoryLayerInterface } from '@/layers';
import { OVERLAY_LAYER_ID, PARTICLE_LAYER_ID, WAVE_BUOYS_LAYER_ID } from '@/constants';

export const useMapDataset = (
  map: RefObject<mapboxgl.Map | null>,
  dataset: string,
  loadComplete: boolean,
  setLoadComplete: (value: boolean) => void,
  particleLayer: RefObject<VectoryLayerInterface | null>,
  overlayLayer: RefObject<mapboxgl.Layer | null>,
  waveBuoysLayer: RefObject<mapboxgl.Layer | null>,
) => {
  /**
   * When the map is loaded or map.setStyle called, style.load event is fired.
   * This is where we can add our layers to the map.
   * When style changes, update the layers with the new dataset. That's why
   * we need to call fetchDataset here and add dataset to the dependency array.
   * Otherwise, the layers will not be updated with the new dataset due to closure which still stores the old dataset.
   */
  useEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance) return;

    const setupLayers = async () => {
      if (!overlayLayer.current || !particleLayer.current || !waveBuoysLayer.current) return;

      await updateSourceByDataset(dataset, mapInstance, particleLayer);

      if (!mapInstance.getLayer(OVERLAY_LAYER_ID)) {
        mapInstance.addLayer(overlayLayer.current);
      }
      if (!mapInstance.getLayer(PARTICLE_LAYER_ID)) {
        mapInstance.addLayer(particleLayer.current);
      }
      if (!mapInstance.getLayer(WAVE_BUOYS_LAYER_ID)) {
        mapInstance.addLayer(waveBuoysLayer.current);
      }

      setLoadComplete(true);
    };

    mapInstance.on('style.load', setupLayers);

    return () => {
      mapInstance.off('style.load', setupLayers);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataset]);
  /**
   * When the dataset changes, we need to update the layers with the new dataset.
   * We also need to avoid the initial call to fetchDataset which is done in the
   * style.load event.
   */
  useDidMountEffect(() => {
    if (!map.current || !loadComplete || !particleLayer.current) return;
    updateSourceByDataset(dataset, map.current, particleLayer);
  }, [loadComplete, dataset]);
};

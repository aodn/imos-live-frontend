/* eslint-disable react-hooks/exhaustive-deps */
import { GSLAMETANAME, GSLASEALEVELNAME, OVERLAY_LAYER_ID, OVERLAY_SOURCE_ID } from '@/constants';
import { addOrUpdateImageSource } from '@/helpers';
import { imageLayer } from '@/layers';
import { loadMetaDataFromUrl, buildDatasetUrl } from '@/utils';
import { useEffect, useRef, useState } from 'react';
import { useDidMountEffect } from './useDidMountEffect';

export function useOverlayLayer(
  map: React.RefObject<mapboxgl.Map | null>,
  overlay: boolean,
  style: string,
  dataset: string,
) {
  const [loadComplete, setLoadComplete] = useState(false);
  const overlayLayer = useRef<mapboxgl.Layer | null>(null);

  useEffect(() => {
    overlayLayer.current = imageLayer(OVERLAY_LAYER_ID, OVERLAY_SOURCE_ID, overlay);
  }, [style]);

  useEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance) return;

    const setupLayers = async () => {
      if (!overlayLayer.current) return;
      const { maxBounds, lonRange, latRange } = await loadMetaDataFromUrl(
        buildDatasetUrl(dataset, GSLAMETANAME),
      );
      mapInstance.setMaxBounds(maxBounds);

      addOrUpdateImageSource(
        mapInstance,
        OVERLAY_SOURCE_ID,
        buildDatasetUrl(dataset, GSLASEALEVELNAME),
        lonRange,
        latRange,
      );

      if (!mapInstance.getLayer(OVERLAY_LAYER_ID)) {
        mapInstance.addLayer(overlayLayer.current);
      }
      console.log('Overlay layer added');
      setLoadComplete(true);
    };

    mapInstance.on('style.load', setupLayers);

    return () => {
      mapInstance.off('style.load', setupLayers);
    };
  }, [style, dataset]);

  useEffect(() => {
    if (!map.current || !loadComplete || !overlayLayer.current) return;
    map.current.setLayoutProperty(
      overlayLayer.current.id,
      'visibility',
      overlay ? 'visible' : 'none',
    );
  }, [loadComplete, overlay]);

  useDidMountEffect(() => {
    if (!map.current || !loadComplete) return;

    const updateDataByDataset = async () => {
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

    updateDataByDataset();
  }, [loadComplete, dataset]);

  return { loadComplete, overlayLayer };
}

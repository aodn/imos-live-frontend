/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from 'react';
import { VectoryLayerInterface, vectorLayer, imageLayer, circleLayer } from '@/layers';
import {
  OVERLAY_LAYER_ID,
  OVERLAY_SOURCE_ID,
  PARTICLE_LAYER_ID,
  PARTICLE_SOURCE_ID,
  WAVE_BUOYS_LAYER_ID,
  WAVE_BUOYS_SOURCE_ID,
} from '@/constants';
import { updateSourceByDataset } from '@/helpers';

export function useMapLayers(
  map: React.RefObject<mapboxgl.Map | null>,
  overlay: boolean,
  circle: boolean,
  particles: boolean,
  numParticles: number,
  style: string,
  dataset: string,
) {
  const [loadComplete, setLoadComplete] = useState(false);
  const particleLayer = useRef<VectoryLayerInterface | null>(null);
  const overlayLayer = useRef<mapboxgl.Layer | null>(null);
  const waveBuoysLayer = useRef<mapboxgl.Layer | null>(null);

  // Initialize layers
  useEffect(() => {
    if (!particleLayer.current) {
      particleLayer.current = vectorLayer(PARTICLE_LAYER_ID, PARTICLE_SOURCE_ID, particles);
    }
    overlayLayer.current = imageLayer(OVERLAY_LAYER_ID, OVERLAY_SOURCE_ID, overlay);
    waveBuoysLayer.current = circleLayer(WAVE_BUOYS_LAYER_ID, WAVE_BUOYS_SOURCE_ID, circle);
  }, [style]);

  /**
   * add sources and layers to the map
   *
   * When the map is loaded or map.setStyle called, style.load event is fired.
   * This is where we can add our layers to the map.
   * When style changes, update the layers with the new dataset. That's why
   * we need to call fetchDataset here and add dataset to the dependency array.
   * Otherwise, the layers will not be updated with the new dataset due to closure which still memorizes the old dataset.
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
  }, [dataset]);

  // Toggle overlay visibility
  useEffect(() => {
    if (!map.current || !loadComplete || !overlayLayer.current) return;
    map.current.setLayoutProperty(
      overlayLayer.current.id,
      'visibility',
      overlay ? 'visible' : 'none',
    );
  }, [loadComplete, overlay]);

  // Toggle wave buoys visibility
  useEffect(() => {
    if (!map.current || !loadComplete || !waveBuoysLayer.current) return;
    map.current.setLayoutProperty(
      waveBuoysLayer.current.id,
      'visibility',
      circle ? 'visible' : 'none',
    );
  }, [loadComplete, circle]);

  // Toggle particles visibility
  useEffect(() => {
    if (!map.current || !loadComplete || !particleLayer.current) return;
    particleLayer.current.setVisible(particles);
  }, [loadComplete, particles]);

  // Set number of particles
  useEffect(() => {
    if (!map || !loadComplete || !particleLayer.current) return;
    particleLayer.current.vectorField?.setParticleNum(numParticles);
  }, [loadComplete, numParticles]);

  return { loadComplete, particleLayer, overlayLayer, waveBuoysLayer };
}

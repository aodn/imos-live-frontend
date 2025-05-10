/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef } from "react";
import {
  VectoryLayerInterface,
  vectorLayer,
  imageLayer,
  circleLayer,
} from "@/layers";
import {
  OVERLAY_LAYER_ID,
  OVERLAY_SOURCE_ID,
  PARTICLE_LAYER_ID,
  PARTICLE_SOURCE_ID,
  WAVE_BUOYS_LAYER_ID,
  WAVE_BUOYS_SOURCE_ID,
} from "@/constants";

export const useMapLayers = (
  map: React.RefObject<mapboxgl.Map | null>,
  loadComplete: boolean,
  overlay: boolean,
  circle: boolean,
  particles: boolean,
  numParticles: number,
  style: string,
) => {
  const particleLayer = useRef<VectoryLayerInterface | null>(null);
  const overlayLayer = useRef<mapboxgl.Layer | null>(null);
  const waveBuoysLayer = useRef<mapboxgl.Layer | null>(null);

  // Initialize layers
  useEffect(() => {
    if (!particleLayer.current) {
      particleLayer.current = vectorLayer(
        PARTICLE_LAYER_ID,
        PARTICLE_SOURCE_ID,
        particles,
      );
    }
    overlayLayer.current = imageLayer(
      OVERLAY_LAYER_ID,
      OVERLAY_SOURCE_ID,
      overlay,
    );
    waveBuoysLayer.current = circleLayer(
      WAVE_BUOYS_LAYER_ID,
      WAVE_BUOYS_SOURCE_ID,
      circle,
    );
  }, [style]);

  // Toggle overlay visibility
  useEffect(() => {
    if (!map.current || !loadComplete || !overlayLayer.current) return;
    map.current.setLayoutProperty(
      overlayLayer.current.id,
      "visibility",
      overlay ? "visible" : "none",
    );
  }, [loadComplete, overlay]);

  // Toggle wave buoys visibility
  useEffect(() => {
    if (!map.current || !loadComplete || !waveBuoysLayer.current) return;
    map.current.setLayoutProperty(
      waveBuoysLayer.current.id,
      "visibility",
      circle ? "visible" : "none",
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

  return { particleLayer, overlayLayer, waveBuoysLayer };
};

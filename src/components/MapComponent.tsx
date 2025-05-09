import React, { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import {
  VectoryLayerInterface,
  vectorLayer,
  imageLayer,
  circleLayer,
} from "@/layers";
import { styles } from "@/styles";
import {
  OVERLAY_LAYER_ID,
  OVERLAY_SOURCE_ID,
  PARTICLE_LAYER_ID,
  PARTICLE_SOURCE_ID,
  WAVE_BUOYS_LAYER_ID,
  WAVE_BUOYS_SOURCE_ID,
} from "@/constants";
import { fetchDataset } from "@/helpers";
import { useDidMountEffect, useMapClickHandlers } from "@/hooks";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_KEY;

type MapComponentProps = {
  style: string;
  overlay: boolean;
  circle: boolean;
  particles: boolean;
  numParticles: number;
  dataset: string;
};

export const MapComponent = React.memo(
  ({
    style,
    overlay,
    circle,
    particles,
    numParticles,
    dataset,
  }: MapComponentProps) => {
    const mapContainer = useRef(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const particleLayer = useRef<VectoryLayerInterface>(null);
    const overlayLayer = useRef<mapboxgl.Layer>(null);
    const waveBuoysLayer = useRef<mapboxgl.Layer>(null);
    const [loadComplete, setLoadComplete] = useState(false);

    useMapClickHandlers({
      map: map.current,
      dataset,
      overlay,
      particles,
      circle,
    });

    const selectedStyle = useMemo(() => {
      return styles.find((s) => s.title === style)?.source;
    }, [style]);

    useEffect(() => {
      particleLayer.current = vectorLayer(
        PARTICLE_LAYER_ID,
        PARTICLE_SOURCE_ID,
        particles,
      );
    }, []);

    useEffect(() => {
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

    //toggle different styles
    useEffect(() => {
      if (!map.current) return;

      map.current.setStyle(
        styles.find((_style) => {
          return _style.title === style;
        })?.source || styles[0].source,
      );
    }, [style]);

    //toggle overlay visible
    useEffect(() => {
      if (!map.current || !loadComplete || !overlayLayer.current) return;
      map.current.setLayoutProperty(
        overlayLayer.current.id,
        "visibility",
        overlay ? "visible" : "none",
      );
    }, [overlay, loadComplete]);

    //toggle waveBuoysLayer visible
    useEffect(() => {
      if (!map.current || !loadComplete || !waveBuoysLayer.current) return;
      map.current.setLayoutProperty(
        waveBuoysLayer.current.id,
        "visibility",
        circle ? "visible" : "none",
      );
    }, [circle, loadComplete]);

    //toggle particles visible
    useEffect(() => {
      if (!map.current || !loadComplete || !particleLayer.current) return;
      particleLayer.current.setVisible(particles);
    }, [particles, loadComplete]);

    //set the number of particles shown in the map
    useEffect(() => {
      if (!map.current || !loadComplete || !particleLayer.current) return;
      particleLayer.current.vectorField?.setParticleNum(numParticles);
    }, [numParticles, loadComplete]);

    //only get new dataset when dataset date updates, avoid initial fetch, which is already done in style.load.
    useDidMountEffect(() => {
      if (!map.current || !loadComplete || !particleLayer.current) return;
      fetchDataset(dataset, map.current, particleLayer);
    }, [dataset]);

    useEffect(() => {
      if (map.current) return;
      //Step 1. Initialize map
      map.current = new mapboxgl.Map({
        container: mapContainer.current as unknown as HTMLElement,
        style: selectedStyle,
        zoom: 3,
        antialias: true,
        projection: "mercator",
        touchPitch: false,
        touchZoomRotate: false,
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      if (!map.current) return;
      //Step 4. Add layers to map
      map.current.once("style.load", async () => {
        if (
          !overlayLayer.current ||
          !particleLayer.current ||
          !waveBuoysLayer.current
        )
          return;
        await fetchDataset(dataset, map.current!, particleLayer);

        if (!map.current?.getLayer(OVERLAY_LAYER_ID)) {
          map.current?.addLayer(overlayLayer.current);
        }
        if (!map?.current?.getLayer(PARTICLE_LAYER_ID)) {
          map.current?.addLayer(particleLayer.current);
        }
        if (!map?.current?.getLayer(WAVE_BUOYS_LAYER_ID)) {
          map.current?.addLayer(waveBuoysLayer.current);
        }
        setLoadComplete(true);
      });
    }, [dataset, style]);

    return (
      <div className="w-full h-full">
        <div ref={mapContainer} className="w-full h-full" />
      </div>
    );
  },
);

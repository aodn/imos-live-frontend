import React, { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { VectoryLayerInterface, vectorLayer, imageLayer } from "@/layers";
import { styles } from "@/styles";
import { loadMetaDataFromUrl, buildDatasetUrl, debounce } from "@/utils";
import {
  GSLAMETANAME,
  GSLAPARTICLENAME,
  GSLASEALEVELNAME,
  OVERLAY_LAYER_ID,
  OVERLAY_SOURCE_ID,
  PARTICLE_LAYER_ID,
  PARTICLE_SOURCE_ID,
} from "@/constants";
import { addOrUpdateSource, showPopup } from "@/helpers";
import { getOceanCurrentDetails } from "@/api";
import { useDidMountEffect } from "@/hooks";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_KEY;

type MapComponentProps = {
  style: string;
  overlay: boolean;
  particles: boolean;
  numParticles: number;
  dataset: string;
};

export const MapComponent = React.memo(
  ({ style, overlay, particles, numParticles, dataset }: MapComponentProps) => {
    const mapContainer = useRef(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const particleLayer = useRef<VectoryLayerInterface>(null);
    const overlayLayer = useRef<mapboxgl.Layer>(null);
    const [loadComplete, setLoadComplete] = useState(false);

    const selectedStyle = useMemo(() => {
      return styles.find((s) => s.title === style)?.source;
    }, [style]);

    async function fetchDataset(dataset: string, map: mapboxgl.Map) {
      if (!particleLayer.current) return;
      const { maxBounds, bounds, lonRange, latRange, uRange, vRange } =
        await loadMetaDataFromUrl(buildDatasetUrl(dataset, GSLAMETANAME));

      map.setMaxBounds(maxBounds);
      particleLayer.current.metadata = {
        bounds,
        range: [uRange, vRange],
      };
      //Step 3. Add sources to layer
      addOrUpdateSource(
        map,
        PARTICLE_SOURCE_ID,
        buildDatasetUrl(dataset, GSLAPARTICLENAME),
        lonRange,
        latRange,
      );
      addOrUpdateSource(
        map,
        OVERLAY_SOURCE_ID,
        buildDatasetUrl(dataset, GSLASEALEVELNAME),
        lonRange,
        latRange,
      );
    }

    useEffect(() => {
      //Step 2. Create particleLayer
      particleLayer.current = vectorLayer(
        PARTICLE_LAYER_ID,
        PARTICLE_SOURCE_ID,
        particles,
      );
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      //Step 2. Create overlayLayer
      overlayLayer.current = imageLayer(
        OVERLAY_LAYER_ID,
        OVERLAY_SOURCE_ID,
        overlay,
      );
    }, [overlay]);

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

    //toggle particles visibile
    useEffect(() => {
      if (!map.current || !loadComplete || !particleLayer.current) return;
      particleLayer.current.setVisible(particles);
    }, [particles, loadComplete]);

    //set the numebr of particles shown in the map
    useEffect(() => {
      if (!map.current || !loadComplete || !particleLayer.current) return;
      particleLayer.current.vectorField?.setParticleNum(numParticles);
    }, [numParticles, loadComplete]);

    //only get new dataset when dataset date updates, aovid initial fetch, which is already done in style.load.
    useDidMountEffect(() => {
      if (!map.current || !loadComplete) return;
      fetchDataset(dataset, map.current);
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
      //Step 4. Add layers to map{
      map.current.once("style.load", async () => {
        if (!overlayLayer.current || !particleLayer.current) return;
        await fetchDataset(dataset, map.current!);

        if (!map.current?.getLayer(OVERLAY_LAYER_ID)) {
          map.current?.addLayer(overlayLayer.current);
        }
        if (!map?.current?.getLayer(PARTICLE_LAYER_ID)) {
          map.current?.addLayer(particleLayer.current);
        }
        setLoadComplete(true);
      });

      const handleClick = async (e: mapboxgl.MapMouseEvent) => {
        const { lng, lat } = e.lngLat;
        const { alpha, speed, degree, direction } =
          await getOceanCurrentDetails(dataset, lat, lng);
        //if alpha is 0, this point could be land.
        if (!alpha) return;

        showPopup(map.current!, { lat, lng, speed, direction, degree });
      };

      const debounceClick = debounce(handleClick, 300);

      map.current?.on("click", debounceClick);

      //clean up
      return () => {
        map.current?.off("click", debounceClick);

        if (map.current?.getLayer(OVERLAY_LAYER_ID)) {
          map.current.removeLayer(OVERLAY_LAYER_ID);
        }

        if (map.current?.getLayer(PARTICLE_LAYER_ID)) {
          map.current.removeLayer(PARTICLE_LAYER_ID);
        }
      };
    }, [dataset, style]);

    return (
      <div className="map-component">
        <div ref={mapContainer} className="map-container" />
      </div>
    );
  },
);

import { useEffect, useRef, useState } from "react";
import mapboxgl, { MapMouseEvent } from "mapbox-gl";
import { VectoryLayerInterface, vectorLayer, imageLayer } from "../layers";
import styles from "../styles/styles";
import { createRoot } from "react-dom/client";
import { PopupContent } from "./PopupContent";
import {
  lngLatToImagePixel,
  getVelocityAtPixel,
  velocityToReadable,
  extractImageData,
  loadImageBitmapFromUrl,
  loadMetaDataFromUrl,
  buildDatasetUrl,
  addOrUpdateSource,
} from "../utils";
import {
  GSLAMETANAME,
  GSLAPARTICLENAME,
  GSLASEALEVELNAME,
  OVERLAY_LAYER_ID,
  OVERLAY_SOURCE_ID,
  PARTICLE_LAYER_ID,
  PARTICLE_SOURCE_ID,
} from "../constants";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_KEY;

type MapComponentProps = {
  style: string;
  overlay: boolean;
  particles: boolean;
  numParticles: number;
  dataset: string;
};

let particleLayer: VectoryLayerInterface;
let overlayLayer: mapboxgl.Layer;

export const MapComponent = ({
  style,
  overlay,
  particles,
  numParticles,
  dataset,
}: MapComponentProps) => {
  const mapContainer = useRef(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [loadComplete, setLoadComplete] = useState(false);

  async function fetchDataset(dataset: string, map: mapboxgl.Map) {
    const { maxBounds, bounds, lonRange, latRange, uRange, vRange } =
      await loadMetaDataFromUrl(buildDatasetUrl(dataset, GSLAMETANAME));

    //set map bounds
    map.setMaxBounds(maxBounds);
    particleLayer.metadata = {
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
    //Step 2. Create layers
    particleLayer = vectorLayer(
      PARTICLE_LAYER_ID,
      PARTICLE_SOURCE_ID,
      particles,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    overlayLayer = imageLayer(OVERLAY_LAYER_ID, OVERLAY_SOURCE_ID, overlay);
  }, [overlay]);

  useEffect(() => {
    if (!map.current) return;

    map.current.setStyle(
      styles.find((_style) => {
        return _style.title === style;
      })?.source || "default-style",
    );
  }, [style]);

  useEffect(() => {
    if (!map.current || !loadComplete) return;

    map.current.setLayoutProperty(
      overlayLayer.id,
      "visibility",
      overlay ? "visible" : "none",
    );
  }, [overlay, loadComplete]);

  useEffect(() => {
    if (!map.current || !loadComplete) return;

    particleLayer.setVisible(particles);
  }, [particles, loadComplete]);

  useEffect(() => {
    if (!map.current || !loadComplete) return;

    particleLayer.vectorField?.setParticleNum(numParticles);
  }, [numParticles, loadComplete]);

  useEffect(() => {
    if (!map.current) return;
    fetchDataset(dataset, map.current);
  }, [dataset]);

  useEffect(() => {
    if (map.current) return;
    //Step 1. Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current as unknown as HTMLElement,
      style:
        styles.find((_style) => {
          return _style.title === style;
        })?.source || "default-style",
      zoom: 3,
      antialias: true,
      projection: "mercator",
      touchPitch: false,
      touchZoomRotate: false,
    });

    map.current.on("style.load", async () => {
      await fetchDataset(dataset, map.current!);
      map.current?.addLayer(overlayLayer);
      map.current?.addLayer(particleLayer);
      setLoadComplete(true);
    });

    map.current.on("click", async (e: MapMouseEvent) => {
      console.log(e);
      const { lng, lat } = e.lngLat;

      const [{ bounds, vRange, uRange }, imageBitmap] = await Promise.all([
        loadMetaDataFromUrl(buildDatasetUrl(dataset, "gsla_meta.json")),
        loadImageBitmapFromUrl(buildDatasetUrl(dataset, "gsla_input.png")),
      ]);

      const { width, height } = imageBitmap;

      const imageData = extractImageData(imageBitmap, width, height);

      const [x, y] = lngLatToImagePixel(lng, lat, bounds, width, height);
      const { u, v } = getVelocityAtPixel(
        x,
        y,
        imageData,
        width,
        uRange,
        vRange,
      );

      const { speed, direction } = velocityToReadable(u, v);

      const container = document.createElement("div");
      const root = createRoot(container);

      root.render(
        <PopupContent
          lat={lat}
          lng={lng}
          speed={speed}
          direction={direction}
        />,
      );

      new mapboxgl.Popup()
        .setLngLat([lng, lat])
        .setDOMContent(container)
        .addTo(map.current!);
    });
  }, [dataset, style]);

  return (
    <div className="map-component">
      <div ref={mapContainer} className="map-container" />
    </div>
  );
};

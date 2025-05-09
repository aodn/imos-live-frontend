import { useEffect, useRef } from "react";
import { getOceanCurrentDetails } from "@/api";
import { showPopup } from "@/helpers";
import { CircleDetails } from "@/components";
import { WAVE_BUOYS_LAYER_ID } from "@/constants";
import { useDrawerStore } from "@/store";
import { debounce } from "@/utils";
// @ts-ignore
import mapboxgl from "mapbox-gl";
import { WaveBuoyProperties } from "@/types";

type UseMapClickHandlersOptions = {
  map: mapboxgl.Map | null;
  dataset: string;
  overlay: boolean;
  particles: boolean;
  circle: boolean;
};

export function useMapClickHandlers({
  map,
  dataset,
  overlay,
  particles,
  circle,
}: UseMapClickHandlersOptions) {
  const waveBuoysLayerClicked = useRef(false);
  const { openDrawer } = useDrawerStore();

  useEffect(() => {
    if (!map) return;
    const handleMouseDown = (
      e: mapboxgl.MapMouseEvent & { originalEvent: MouseEvent },
    ) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: [WAVE_BUOYS_LAYER_ID],
      });
      waveBuoysLayerClicked.current = !!(features && features.length > 0);
    };

    map.on("mousedown", handleMouseDown);
    return () => {
      map.off("mousedown", handleMouseDown);
    };
  }, [map]);

  useEffect(() => {
    if (!map || (!particles && !overlay)) return;

    const handleClick = async (e: mapboxgl.MapMouseEvent) => {
      if (waveBuoysLayerClicked.current) {
        waveBuoysLayerClicked.current = false;
        return;
      }

      const { lng, lat } = e.lngLat;
      const { gsla, alpha, speed, degree, direction } =
        await getOceanCurrentDetails(dataset, lat, lng);

      if (!alpha) return;

      showPopup(map, {
        lat,
        lng,
        ...(particles ? { speed, direction, degree } : {}),
        ...(overlay ? { gsla } : {}),
      });
    };

    const debounceClick = debounce(handleClick, 100);
    map.on("click", debounceClick);
    return () => {
      map.off("click", debounceClick);
    };
  }, [map, dataset, overlay, particles]);

  useEffect(() => {
    if (!map || !circle) return;

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      if (!e.features?.length) return;
      const { properties } = e.features[0];
      openDrawer(<CircleDetails {...(properties as WaveBuoyProperties)} />);
    };

    map.on("click", WAVE_BUOYS_LAYER_ID, handleClick);

    return () => {
      map.off("click", WAVE_BUOYS_LAYER_ID, handleClick);
    };
  }, [map, circle, openDrawer]);
}

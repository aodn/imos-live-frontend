/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, RefObject } from "react";
import { getOceanCurrentDetails } from "@/api";
import { showPopup } from "@/helpers";
import { CircleDetails } from "@/components";
import { WAVE_BUOYS_LAYER_ID } from "@/constants";
import { useDrawerStore } from "@/store";
import { debounce } from "@/utils";
import { WaveBuoyProperties } from "@/types";

type UseMapClickHandlersOptions = {
  map: RefObject<mapboxgl.Map | null>;
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
    if (!map.current) return;
    const mapInstance = map.current;
    const handleMouseDown = (
      e: mapboxgl.MapMouseEvent & { originalEvent: MouseEvent },
    ) => {
      const features = map.current!.queryRenderedFeatures(e.point, {
        layers: [WAVE_BUOYS_LAYER_ID],
      });
      waveBuoysLayerClicked.current = !!(features && features.length > 0);
    };

    mapInstance.on("mousedown", handleMouseDown);
    return () => {
      mapInstance.off("mousedown", handleMouseDown);
    };
  }, []);

  useEffect(() => {
    if (!map.current || (!particles && !overlay)) return;
    const mapInstance = map.current;
    const handleClick = async (e: mapboxgl.MapMouseEvent) => {
      if (waveBuoysLayerClicked.current) {
        waveBuoysLayerClicked.current = false;
        return;
      }

      const { lng, lat } = e.lngLat;
      const { gsla, alpha, speed, degree, direction } =
        await getOceanCurrentDetails(dataset, lat, lng);

      if (!alpha) return;

      showPopup(mapInstance, {
        lat,
        lng,
        ...(particles ? { speed, direction, degree } : {}),
        ...(overlay ? { gsla } : {}),
      });
    };

    const debounceClick = debounce(handleClick, 100);
    mapInstance.on("click", debounceClick);
    return () => {
      mapInstance.off("click", debounceClick);
    };
  }, [dataset, overlay, particles]);

  useEffect(() => {
    if (!map.current || !circle) return;

    const mapInstance = map.current;
    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      if (!e.features?.length) return;
      const { properties } = e.features[0];
      openDrawer(<CircleDetails {...(properties as WaveBuoyProperties)} />);
    };

    mapInstance.on("click", WAVE_BUOYS_LAYER_ID, handleClick);

    return () => {
      mapInstance.off("click", WAVE_BUOYS_LAYER_ID, handleClick);
    };
  }, [circle, openDrawer]);
}

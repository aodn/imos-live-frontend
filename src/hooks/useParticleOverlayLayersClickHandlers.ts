import { getOceanCurrentData } from '@/api';
import { useToast } from '@/components';
import { showPopup } from '@/helpers';
import { debounce, processOceanCurrentDetails } from '@/utils';
import { RefObject, useCallback, useEffect } from 'react';
import { GSLA_DATA_NAME, OverlaySource } from '@/constants';
import { useQuery } from '@tanstack/react-query';
import { getFeatureInfoUrl } from '@/helpers/threddsUrl';

type UseMapClickHandlersOptions = {
  map: RefObject<mapboxgl.Map | null>;
  dataset: string;
  overlay: boolean;
  particles: boolean;
  waveBuoysLayerClicked: React.RefObject<boolean>;
  tempPointsEventPrevent: React.RefObject<boolean>;
  distanceMeasurement: boolean;
  overlaySource: OverlaySource;
};

export function useParticleOverlayLayersClickHandlers({
  map,
  dataset,
  overlay,
  particles,
  waveBuoysLayerClicked,
  tempPointsEventPrevent,
  distanceMeasurement,
  overlaySource,
}: UseMapClickHandlersOptions) {
  const { showToast } = useToast();

  //cached by browser
  const { data: oceanCurrentData, isError } = useQuery({
    queryKey: [GSLA_DATA_NAME, dataset],
    queryFn: () => getOceanCurrentData(dataset),
    enabled: !!dataset,
  });

  useEffect(() => {
    if (isError)
      showToast({
        type: 'error',
        title: 'Error occurred',
        message: 'Failed to get ocean current details',
        duration: 6000,
      });
  }, [isError, showToast]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleMapClick = useCallback(
    debounce(async (e: mapboxgl.MapMouseEvent) => {
      if (!map?.current || !oceanCurrentData || distanceMeasurement || (!particles && !overlay))
        return;

      if (waveBuoysLayerClicked.current) {
        waveBuoysLayerClicked.current = false;
        return;
      }

      if (tempPointsEventPrevent.current) {
        tempPointsEventPrevent.current = false;
        return;
      }

      const { lngLat } = e;
      const bounds = map.current.getBounds();
      if (!bounds) return;
      const mapBounds: [number, number, number, number] = [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ];
      const mapSize = {
        width: map.current.getCanvas().width,
        height: map.current.getCanvas().height,
      };

      const url = getFeatureInfoUrl(overlaySource, new Date(dataset), mapBounds, mapSize, e.point);
      const response = await fetch(url);
      const data = await response.text();

      // Parse XML to extract the value
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(data, 'text/xml');

      const [value] = Array.from(xmlDoc.querySelectorAll('FeatureInfoResponse FeatureInfo value'));
      const overlayData: {
        gsla?: number;
        sstAnom?: number;
      } = {};
      if (value !== undefined) {
        const fieldValue = Number(value.textContent);
        if (overlaySource === 'gsla-overlay-source') {
          overlayData.gsla = Number(fieldValue);
        } else {
          overlayData.sstAnom = Number(fieldValue);
        }
      }

      let popupData = {
        ...(overlay ? overlayData : {}),
      };

      if (particles) {
        popupData = { ...popupData, ...processOceanCurrentDetails(lngLat, oceanCurrentData) };
      }

      if (Object.keys(popupData).length === 0) return;

      showPopup(map.current, {
        ...lngLat,
        ...popupData,
      });
    }, 400),
    [oceanCurrentData, distanceMeasurement, overlay, particles, overlaySource],
  );

  useEffect(() => {
    if (!map?.current) return;
    const { current } = map;

    current.on('click', handleMapClick);
    return () => {
      current.off('click', handleMapClick);
    };
  }, [map, handleMapClick]);
}

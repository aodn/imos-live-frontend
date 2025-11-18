import { getOceanCurrentData } from '@/api';
import {
  GSLA_DATA_NAME,
  GSLA_OVERLAY_SOURCE_ID,
  SST_ANOMALY_MOSAIC_OVERLAY_SOURCE_ID,
} from '@/constants';
import { fetchGslaAnomalySeaLevelsData, fetchSstAnomalyMosaic } from '@/helpers';
import { useMapUIStore } from '@/store';
import { processOceanCurrentDetails } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { LngLat, Point } from 'mapbox-gl';
import { useShallow } from 'zustand/shallow';

type PopupContentProps = {
  onClose?: () => void;
  lngLat?: LngLat;
  point?: Point;
  mapSize?: {
    width: number;
    height: number;
  };
  mapBounds?: [number, number, number, number];
};

export const PopupContent = ({ onClose, lngLat, mapBounds, mapSize, point }: PopupContentProps) => {
  const { particles, overlay, overlaySource, date } = useMapUIStore(
    useShallow(s => ({
      particles: s.particles,
      overlay: s.overlay,
      overlaySource: s.overlaySource,
      date: s.date,
    })),
  );
  const { lat, lng } = lngLat || {};

  const { data: gslaOceanCurrent } = useQuery({
    queryKey: [GSLA_DATA_NAME, date],
    queryFn: () => getOceanCurrentData(date),
    enabled: !!date && particles,
    select: raw => {
      const oceanCurrentDetails = processOceanCurrentDetails(lngLat!, raw);
      return {
        speed: oceanCurrentDetails?.speed,
        direction: oceanCurrentDetails?.direction,
        degree: oceanCurrentDetails?.degree,
      };
    },
  });

  const { data: gslaAnomalySeaLevels } = useQuery({
    queryKey: [GSLA_OVERLAY_SOURCE_ID, date, mapBounds, mapSize, point],
    queryFn: () => fetchGslaAnomalySeaLevelsData(date, mapBounds!, mapSize!, point!),
    enabled: !!date && overlay && overlaySource === GSLA_OVERLAY_SOURCE_ID,
  });

  const { data: sstAnomalyMosatic } = useQuery({
    queryKey: [SST_ANOMALY_MOSAIC_OVERLAY_SOURCE_ID, date, mapBounds, mapSize, point],
    queryFn: () => fetchSstAnomalyMosaic(date, mapBounds!, mapSize!, point!),
    enabled: !!date && overlay && overlaySource === SST_ANOMALY_MOSAIC_OVERLAY_SOURCE_ID,
  });

  return (
    <div
      className="w-50 md:w-90 bg-white rounded-lg shadow-lg overflow-hidden"
      aria-label="Current value from coordinates"
    >
      {/* Header */}
      <div className="relative bg-imos-light  text-black p-2  flex justify-between items-center ">
        <h4 className="text-base text-center w-full">
          ({lat?.toFixed(2)}, {lng?.toFixed(2)})
        </h4>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close popup"
            className="absolute top-1 right-1 text-black hover:text-gray-200 text-xl  w-6 h-6 flex items-center justify-center cursor-pointer"
          >
            ×
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-2 space-y-2">
        {particles && (
          <div
            className="flex-col md:flex-row flex justify-between md:items-center"
            aria-label="Ocean surface current details"
          >
            <span className="text-gray-600 text-left">Ocean geostrophic current direction:</span>
            <span className="text-gray-900 text-left">
              {gslaOceanCurrent?.degree?.toFixed(2)} ({gslaOceanCurrent?.direction})° @{' '}
              {gslaOceanCurrent?.speed?.toFixed(2)} m/s
            </span>
          </div>
        )}

        {overlay && overlaySource === 'gsla-overlay-source' && (
          <div
            className="flex-col md:flex-row flex justify-between md:items-center"
            aria-label="Sea level anomaly details"
          >
            <span className="text-gray-600 ">Sea level anomaly:</span>
            <span className="text-gray-900 ">
              {gslaAnomalySeaLevels?.['gsla-anomaly-sea-levels']?.gsla?.toFixed(2)} m
            </span>
          </div>
        )}
        {overlay && overlaySource === 'sst-anom-mosaic-source' && (
          <div
            className="flex-col md:flex-row flex justify-between md:items-center"
            aria-label="Sea level anomaly details"
          >
            <span className="text-gray-600 ">Sea surface temperature anomaly:</span>
            <span className="text-gray-900 ">
              {sstAnomalyMosatic?.['sst-anom-mosaic']?.sstAnom?.toFixed(2)} °C
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

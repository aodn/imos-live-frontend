import { usePopupContentData } from '@/hooks';
import { useMapUIStore } from '@/store';
import type { LngLat, Point } from 'mapbox-gl';
import { useShallow } from 'zustand/shallow';
import { LoaderIcon } from '../Icons';

type PopupContentProps = {
  onClose?: () => void;
  lngLat: LngLat;
  point: Point;
  mapSize: {
    width: number;
    height: number;
  };
  mapBounds: [number, number, number, number];
};

export const PopupContent = ({ onClose, lngLat, mapBounds, mapSize, point }: PopupContentProps) => {
  const { gslaAnomalySeaLevelsEnabled, sstAnomMosaicEnabled, oceanCurrentEnabled, date } =
    useMapUIStore(
      useShallow(s => ({
        gslaAnomalySeaLevelsEnabled: s.productEnabled['gsla-anomaly-sea-levels'],
        sstAnomMosaicEnabled: s.productEnabled['sst-anom-mosaic'],
        oceanCurrentEnabled: s.productEnabled['gsla-ocean-geostrophic-current'],
        date: s.date,
      })),
    );

  const { data, isLoading } = usePopupContentData({
    mapBounds,
    mapSize,
    oceanCurrentEnabled,
    gslaAnomalySeaLevelsEnabled,
    sstAnomMosaicEnabled,
    date,
    lngLat,
    point,
  });

  const { lat, lng } = lngLat || {};

  return (
    <div
      className="w-50 md:w-90 min-h-25 flex flex-col bg-white rounded-lg shadow-lg overflow-hidden"
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
      <div className="p-2 space-y-2 flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex justify-center items-center flex-1">
            <LoaderIcon className="animate-spin" color="imos-grey" size="lg" />
          </div>
        ) : (
          <div>
            {oceanCurrentEnabled && data['gsla-ocean-geostrophic-current'] && (
              <div
                className="flex-col md:flex-row flex justify-between md:items-center"
                aria-label="Ocean surface current details"
              >
                <span className="text-gray-600 text-left">
                  Ocean geostrophic current direction:
                </span>
                <span className="text-gray-900 text-left">
                  {Math.round(data['gsla-ocean-geostrophic-current']?.degree ?? 0)}° (
                  {data['gsla-ocean-geostrophic-current']?.direction}) @{' '}
                  {data['gsla-ocean-geostrophic-current']?.speed?.toFixed(2)} m/s
                </span>
              </div>
            )}

            {gslaAnomalySeaLevelsEnabled && data['gsla-anomaly-sea-levels'] && (
              <div
                className="flex-col md:flex-row flex justify-between md:items-center"
                aria-label="Sea level anomaly details"
              >
                <span className="text-gray-600 ">Sea level anomaly:</span>
                <span className="text-gray-900 ">
                  {data['gsla-anomaly-sea-levels']?.gsla?.toFixed(2)} m
                </span>
              </div>
            )}

            {sstAnomMosaicEnabled && data['sst-anom-mosaic'] && (
              <div
                className="flex-col md:flex-row flex justify-between md:items-center"
                aria-label="Sea level anomaly details"
              >
                <span className="text-gray-600 ">Sea surface temperature anomaly:</span>
                <span className="text-gray-900 ">
                  {data['sst-anom-mosaic']?.sstAnom?.toFixed(2)} °C
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

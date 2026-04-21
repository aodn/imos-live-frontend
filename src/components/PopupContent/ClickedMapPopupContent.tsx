import { useClickedMapPopupContentData } from '@/hooks';
import { useMapUIStore } from '@/store';
import { useShallow } from 'zustand/shallow';
import { LoaderIcon } from '../Icons';
import type { LngLat, Point } from 'mapbox-gl';
import type { ClosePopupFn } from '@/helpers';
import { PRODUCT } from '@/constants';

export type ClickedMapPopupContentProps = {
  onClose?: ClosePopupFn;
  lngLat: LngLat;
  point: Point;
  mapSize: {
    width: number;
    height: number;
  };
  mapBounds: [number, number, number, number];
};

export function ClickedMapPopupContent({
  onClose,
  lngLat,
  mapBounds,
  mapSize,
  point,
}: ClickedMapPopupContentProps) {
  const {
    gslaAnomalySeaLevelsEnabled,
    sstAnomMosaicEnabled,
    dhdAnomalMosaicEnabled,
    oceanCurrentEnabled,
    date,
  } = useMapUIStore(
    useShallow(s => ({
      gslaAnomalySeaLevelsEnabled: s.productEnabled[PRODUCT.GSLA_ANOMALY_SEA_LEVELS],
      sstAnomMosaicEnabled: s.productEnabled[PRODUCT.AUSTEMP_SSTA_MOSAIC],
      dhdAnomalMosaicEnabled: s.productEnabled[PRODUCT.AUSTEMP_DHD_MOSAIC],
      oceanCurrentEnabled: s.productEnabled[PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT],
      date: s.date,
    })),
  );

  const { data, isLoading } = useClickedMapPopupContentData({
    mapBounds,
    mapSize,
    oceanCurrentEnabled,
    gslaAnomalySeaLevelsEnabled,
    sstAnomMosaicEnabled,
    dhdAnomalMosaicEnabled,
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
            {oceanCurrentEnabled && data[PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT] && (
              <div
                className="flex-col md:flex-row flex justify-between md:items-center"
                aria-label="Ocean surface current details"
              >
                <span className="text-gray-600 text-left">
                  Ocean geostrophic current direction:
                </span>
                <span className="text-gray-900 text-left">
                  {Math.round(data[PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT]?.degree ?? 0)}° (
                  {data[PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT]?.direction}) @{' '}
                  {data[PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT]?.speed?.toFixed(2)} m/s
                </span>
              </div>
            )}

            {gslaAnomalySeaLevelsEnabled && data[PRODUCT.GSLA_ANOMALY_SEA_LEVELS] && (
              <div
                className="flex-col md:flex-row flex justify-between md:items-center"
                aria-label="Sea level anomaly details"
              >
                <span className="text-gray-600 ">Sea level anomaly:</span>
                <span className="text-gray-900 ">
                  {data[PRODUCT.GSLA_ANOMALY_SEA_LEVELS]?.gsla?.toFixed(2)} m
                </span>
              </div>
            )}

            {sstAnomMosaicEnabled && data[PRODUCT.AUSTEMP_SSTA_MOSAIC] && (
              <div
                className="flex-col md:flex-row flex justify-between md:items-center"
                aria-label="Sea level anomaly details"
              >
                <span className="text-gray-600 ">Sea surface temperature anomaly mosaic:</span>
                <span className="text-gray-900 ">
                  {data[PRODUCT.AUSTEMP_SSTA_MOSAIC]?.sstAnom?.toFixed(2)} °C
                </span>
              </div>
            )}

            {dhdAnomalMosaicEnabled && data[PRODUCT.AUSTEMP_DHD_MOSAIC] && (
              <div
                className="flex-col md:flex-row flex justify-between md:items-center"
                aria-label="Sea level anomaly details"
              >
                <span className="text-gray-600 ">DHD mosaic:</span>
                <span className="text-gray-900 ">
                  {data[PRODUCT.AUSTEMP_DHD_MOSAIC]?.dhdAnom?.toFixed(2)} °C
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

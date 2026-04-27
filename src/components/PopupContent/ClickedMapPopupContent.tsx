import { useClickedMapPopupContentData } from '@/hooks';
import { useMapUIStore } from '@/store';
import { useShallow } from 'zustand/shallow';
import { LoaderIcon } from '../Icons';
import type { LngLat } from 'mapbox-gl';
import type { ClosePopupFn } from '@/helpers';
import { PRODUCT, PRODUCTLEGENDS } from '@/constants';

export type ClickedMapPopupContentProps = {
  onClose?: ClosePopupFn;
  lngLat: LngLat;
};

export function ClickedMapPopupContent({ onClose, lngLat }: ClickedMapPopupContentProps) {
  const {
    oceanCurrentEnabled,
    gslaAnomalySeaLevelsEnabled,
    sstAnomMosaicEnabled,
    marineHeatwaveDhdEnabled,
    marineHeatwaveSstaEnabled,
    date,
  } = useMapUIStore(
    useShallow(s => ({
      oceanCurrentEnabled: s.productEnabled[PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT],
      gslaAnomalySeaLevelsEnabled: s.productEnabled[PRODUCT.GSLA_ANOMALY_SEA_LEVELS],
      sstAnomMosaicEnabled: s.productEnabled[PRODUCT.SST_ANOMALY_MOSAIC],
      marineHeatwaveDhdEnabled: s.productEnabled[PRODUCT.MARINE_HEATWAVE_DHD_MOSAIC],
      marineHeatwaveSstaEnabled: s.productEnabled[PRODUCT.MARINE_HEATWAVE_SSTA_MOSAIC],
      date: s.date,
    })),
  );

  const { data, isLoading } = useClickedMapPopupContentData({
    oceanCurrentEnabled,
    gslaAnomalySeaLevelsEnabled,
    sstAnomMosaicEnabled,
    marineHeatwaveDhdEnabled,
    marineHeatwaveSstaEnabled,
    date,
    lngLat,
  });

  const { lat, lng } = lngLat || {};

  return (
    <div
      className="w-50 md:w-90 min-h-25 flex flex-col bg-white rounded-lg shadow-lg overflow-hidden"
      aria-label="Current value from coordinates"
    >
      <div className="relative bg-imos-light text-black p-2 flex justify-between items-center">
        <h4 className="text-base text-center w-full">
          ({lat?.toFixed(2)}, {lng?.toFixed(2)})
        </h4>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close popup"
            className="absolute top-1 right-1 text-black hover:text-gray-200 text-xl w-6 h-6 flex items-center justify-center cursor-pointer"
          >
            ×
          </button>
        )}
      </div>

      <div className="p-2 space-y-2 flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex justify-center items-center flex-1">
            <LoaderIcon className="animate-spin" color="imos-grey" size="lg" />
          </div>
        ) : (
          <div className="space-y-1">
            {oceanCurrentEnabled && data[PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT] && (
              <div
                className="flex-col md:flex-row flex justify-between md:items-center"
                aria-label="Ocean surface current details"
              >
                <span className="text-gray-600 text-left">
                  {PRODUCTLEGENDS[PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT].label}:
                </span>
                <span className="text-gray-900 text-left">
                  {Math.round(data[PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT]?.degree ?? 0)}° (
                  {data[PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT]?.direction}) @{' '}
                  {data[PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT]?.speed?.toFixed(2)} m/s
                </span>
              </div>
            )}

            {gslaAnomalySeaLevelsEnabled && data[PRODUCT.GSLA_ANOMALY_SEA_LEVELS] !== null && (
              <div
                className="flex-col md:flex-row flex justify-between md:items-center"
                aria-label="Sea level anomaly details"
              >
                <span className="text-gray-600 text-left">
                  {PRODUCTLEGENDS[PRODUCT.GSLA_ANOMALY_SEA_LEVELS].label}:
                </span>
                <span className="text-gray-900 text-left">
                  {data[PRODUCT.GSLA_ANOMALY_SEA_LEVELS]?.toFixed(3)} m
                </span>
              </div>
            )}

            {sstAnomMosaicEnabled && data[PRODUCT.SST_ANOMALY_MOSAIC] !== null && (
              <div
                className="flex-col md:flex-row flex justify-between md:items-center"
                aria-label="SST anomaly details"
              >
                <span className="text-gray-600 text-left">
                  {PRODUCTLEGENDS[PRODUCT.SST_ANOMALY_MOSAIC].label}:
                </span>
                <span className="text-gray-900 text-left">
                  {data[PRODUCT.SST_ANOMALY_MOSAIC]?.toFixed(2)} °C
                </span>
              </div>
            )}

            {marineHeatwaveDhdEnabled && data[PRODUCT.MARINE_HEATWAVE_DHD_MOSAIC] !== null && (
              <div
                className="flex-col md:flex-row flex justify-between md:items-center"
                aria-label="Marine heatwave DHD details"
              >
                <span className="text-gray-600 text-left">
                  {PRODUCTLEGENDS[PRODUCT.MARINE_HEATWAVE_DHD_MOSAIC].label}:
                </span>
                <span className="text-gray-900 text-left">
                  {data[PRODUCT.MARINE_HEATWAVE_DHD_MOSAIC]?.toFixed(2)} °C·days
                </span>
              </div>
            )}

            {marineHeatwaveSstaEnabled && data[PRODUCT.MARINE_HEATWAVE_SSTA_MOSAIC] !== null && (
              <div
                className="flex-col md:flex-row flex justify-between md:items-center"
                aria-label="Marine heatwave SSTA details"
              >
                <span className="text-gray-600 text-left">
                  {PRODUCTLEGENDS[PRODUCT.MARINE_HEATWAVE_SSTA_MOSAIC].label}:
                </span>
                <span className="text-gray-900 text-left">
                  {data[PRODUCT.MARINE_HEATWAVE_SSTA_MOSAIC]?.toFixed(2)} °C
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

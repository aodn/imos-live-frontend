import { useMapPopupStore } from '@/store';
import { useShallow } from 'zustand/shallow';

type PopupContentProps = {
  onClose?: () => void;
};

export const PopupContent = ({ onClose }: PopupContentProps) => {
  const { gslaOceanCurrent, gslaAnomalySeaLevels, sstAnomalyMosatic, metaData } = useMapPopupStore(
    useShallow(s => ({
      gslaOceanCurrent: s['gsla-ocean-geostrophic-current'],
      gslaAnomalySeaLevels: s['gsla-anomaly-sea-levels'],
      sstAnomalyMosatic: s['sst-anom-mosaic'],
      metaData: s.metaData,
    })),
  );

  const { lngLat } = metaData;
  const { lat, lng } = lngLat || {};

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
        {gslaOceanCurrent.speed !== undefined && gslaOceanCurrent.degree !== undefined && (
          <div
            className="flex-col md:flex-row flex justify-between md:items-center"
            aria-label="Ocean surface current details"
          >
            <span className="text-gray-600 text-left">Ocean geostrophic current direction:</span>
            <span className="text-gray-900 text-left">
              {gslaOceanCurrent.degree.toFixed(2)} ({gslaOceanCurrent.direction})° @{' '}
              {gslaOceanCurrent.speed.toFixed(2)} m/s
            </span>
          </div>
        )}

        {gslaAnomalySeaLevels.gsla !== undefined && (
          <div
            className="flex-col md:flex-row flex justify-between md:items-center"
            aria-label="Sea level anomaly details"
          >
            <span className="text-gray-600 ">Sea level anomaly:</span>
            <span className="text-gray-900 ">{gslaAnomalySeaLevels.gsla.toFixed(2)} m</span>
          </div>
        )}
        {sstAnomalyMosatic.sstAnom !== undefined && (
          <div
            className="flex-col md:flex-row flex justify-between md:items-center"
            aria-label="Sea level anomaly details"
          >
            <span className="text-gray-600 ">Sea surface temperature anomaly:</span>
            <span className="text-gray-900 ">{sstAnomalyMosatic.sstAnom.toFixed(2)} °C</span>
          </div>
        )}
      </div>
    </div>
  );
};

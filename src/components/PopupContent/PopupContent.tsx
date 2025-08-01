type PopupContentProps = {
  lat: number;
  lng: number;
  speed?: number;
  direction?: string;
  degree?: number;
  gsla?: number;
  onClose?: () => void;
};

export const PopupContent = ({
  lat,
  lng,
  speed,
  degree,
  direction,
  gsla,
  onClose,
}: PopupContentProps) => {
  return (
    <div className="w-50 md:w-80 bg-white rounded-lg shadow-lg overflow-hidden" aria-label="Current value from coordinates">
      {/* Header */}
      <div className="relative bg-imos-light  text-black p-2  flex justify-between items-center ">
        <h4 className="text-base text-center w-full">
          ({lat.toFixed(2)}, {lng.toFixed(2)})
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
        {speed !== undefined && degree !== undefined && (
          <div className="flex-col md:flex-row flex justify-between md:items-center">
            <span className="text-gray-600 text-left">Ocean surface current:</span>
            <span className="text-gray-900 text-left">
              {degree.toFixed(2)}degrees ({direction}) @ {speed.toFixed(2)} m/s
            </span>
          </div>
        )}

        {gsla !== undefined && (
          <div className="flex-col md:flex-row flex justify-between md:items-center">
            <span className="text-gray-600 ">Sea level anomaly:</span>
            <span className="text-gray-900 ">{gsla.toFixed(2)} m</span>
          </div>
        )}
      </div>
    </div>
  );
};

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
    <div className="w-56 bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 flex justify-between items-center">
        <h4 className="font-semibold text-base">Location Info</h4>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-xl  w-6 h-6 flex items-center justify-center cursor-pointer"
          >
            ×
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600 font-medium">Coordinates:</span>
          <span className="text-gray-900 font-mono text-sm">
            {lat.toFixed(2)}, {lng.toFixed(2)}
          </span>
        </div>

        {speed !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">Speed:</span>
            <span className="text-green-600 font-semibold">{speed.toFixed(2)} m/s</span>
          </div>
        )}

        {direction !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">Direction:</span>
            <span className="text-blue-600 font-semibold">{direction}</span>
          </div>
        )}

        {degree !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">Bearing:</span>
            <span className="text-purple-600 font-semibold">{degree.toFixed(2)}°</span>
          </div>
        )}

        {gsla !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">GSLA:</span>
            <span className="text-orange-600 font-semibold">{gsla.toFixed(2)} m</span>
          </div>
        )}
      </div>
    </div>
  );
};

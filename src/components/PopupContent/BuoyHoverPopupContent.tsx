import type { ClosePopupFn } from '@/helpers';

export type BuoyHoverPopupContentProps = {
  buoy: string;
  date: string;
  onClose?: ClosePopupFn;
};

export const BuoyHoverPopupContent = ({ buoy, date, onClose }: BuoyHoverPopupContentProps) => {
  return (
    <div>
      <div className="relative bg-imos-light  text-black p-2  flex justify-between items-center ">
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
      <div>
        <strong>Buoy:</strong> {buoy}
        <br />
        <strong>Date:</strong> {date}
      </div>
    </div>
  );
};

import type { ClosePopupFn } from '@/helpers';

export type BuoyHoverPopupContentProps = {
  buoy: string;
  date: string;
  onClose?: ClosePopupFn;
};

export const BuoyHoverPopupContent = ({ buoy, date }: BuoyHoverPopupContentProps) => {
  return (
    <div
      className="w-40 min-h-10 relative bg-white rounded-lg shadow-lg overflow-hidden p-2"
      aria-label="Current buoy information"
    >
      {/* {onClose && (
        <button
          onClick={onClose}
          aria-label="Close popup"
          className="absolute top-1 right-1 text-black hover:text-gray-200 text-xl  w-6 h-6 flex items-center justify-center cursor-pointer"
        >
          ×
        </button>
      )} */}

      <div>
        <p>Buoy: {buoy}</p>
        <p>Date: {date}</p>
      </div>
    </div>
  );
};

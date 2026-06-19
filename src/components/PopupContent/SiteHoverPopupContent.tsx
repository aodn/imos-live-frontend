import type { ClosePopupFn } from '@/helpers';

export type SiteHoverPopupContentProps = {
  site: string;
  date: string;
  // Label for the site row (e.g. "Buoy", "Mooring"). Defaults to "Buoy".
  label?: string;
  onClose?: ClosePopupFn;
};

export function SiteHoverPopupContent({ site, date, label = 'Buoy' }: SiteHoverPopupContentProps) {
  return (
    <div
      className="w-40 min-h-10 relative bg-white rounded-lg shadow-lg overflow-hidden p-2"
      aria-label={`Current ${label.toLowerCase()} information`}
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
        <p>
          <strong>{label}: </strong> {site}
        </p>
        <p>
          <strong>Date: </strong> {date}
        </p>
      </div>
    </div>
  );
}

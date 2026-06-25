import type { DateLabelRenderProps } from '../type';

// Default floating date-label renderer used when `renderProps.renderDateLabel` is omitted.
export function customDateLabelRenderer({ label }: DateLabelRenderProps) {
  return (
    <span className="bg-blue-700 text-white text-xs px-3 py-1.5 rounded shadow-md font-semibold whitespace-nowrap">
      {label}
    </span>
  );
}

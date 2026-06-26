import type { DateFormat, DateFormatFn, DateLabelRenderProps } from '../DateSlider';

export function renderDateLabel({ label }: DateLabelRenderProps) {
  return (
    <span className="frosted  text-sm text-imos-black px-3 py-1 rounded whitespace-nowrap shadow-lg">
      {label}
    </span>
  );
}

function isFirstOfYear(date: Date) {
  return date.getUTCMonth() === 0 && date.getUTCDate() === 1;
}

function isFirstOfMonth(date: Date) {
  return date.getUTCDate() === 1;
}

export const dateFormat: DateFormat = {
  label: () => 'DD MMM YYYY',
  scale: (({ date, unit }) => {
    if (unit === 'day' && isFirstOfMonth(date)) return 'MMM YYYY';
    if (unit === 'month' && isFirstOfYear(date)) return 'YYYY';
    return '';
  }) satisfies DateFormatFn,
};

import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import type {
  DateLabelRenderProps,
  SelectionPanelRenderProps,
  TimeUnitSelectionRenderProps,
} from '../type';

// Custom render prop examples
export const customDateLabelRenderer = ({ label }: DateLabelRenderProps) => {
  return (
    <span className="bg-blue-700 text-white text-xs px-3 py-1.5 rounded shadow-md font-semibold whitespace-nowrap">
      {label}
    </span>
  );
};

export const customSelectionPanelRenderer = ({
  toNextDate,
  toPrevDate,
  dateLabel,
}: SelectionPanelRenderProps) => {
  return (
    <div className="hidden md:flex items-center gap-1 bg-white rounded-lg px-2 py-1.5 shadow-sm border border-gray-300 w-40 shrink-0">
      <button
        onClick={toPrevDate}
        className="p-1 hover:bg-blue-50 rounded transition-colors shrink-0 cursor-pointer"
        aria-label="Previous date"
      >
        <ChevronLeftIcon className="w-4 h-4 text-gray-700" />
      </button>
      <span className="text-sm font-semibold text-gray-900 flex-1 text-center">{dateLabel}</span>
      <button
        onClick={toNextDate}
        className="p-1 hover:bg-blue-50 rounded transition-colors shrink-0 cursor-pointer"
        aria-label="Next date"
      >
        <ChevronRightIcon className="w-4 h-4 text-gray-700" />
      </button>
    </div>
  );
};

export const customTimeUnitSelectionRenderer = ({
  timeUnit,
  handleTimeUnitNextSelect,
  handleTimeUnitPreviousSelect,
  isNextBtnDisabled,
  isPrevBtnDisabled,
}: TimeUnitSelectionRenderProps) => {
  return (
    <div className="flex flex-col items-center gap-1 bg-white rounded-lg px-3 py-2 shadow-sm border border-gray-300 w-20 shrink-0">
      <button
        onClick={handleTimeUnitPreviousSelect}
        disabled={isPrevBtnDisabled()}
        className="p-1 hover:bg-blue-50 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer"
        aria-label="Previous time unit"
      >
        <ChevronLeftIcon className="w-3 h-3 text-gray-700 rotate-90" />
      </button>
      <span className="text-xs font-bold text-gray-900 uppercase tracking-wide">{timeUnit}</span>
      <button
        onClick={handleTimeUnitNextSelect}
        disabled={isNextBtnDisabled()}
        className="p-1 hover:bg-blue-50 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer"
        aria-label="Next time unit"
      >
        <ChevronRightIcon className="w-3 h-3 text-gray-700 rotate-90" />
      </button>
    </div>
  );
};

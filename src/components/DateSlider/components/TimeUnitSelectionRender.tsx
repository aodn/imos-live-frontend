import { TriangleIcon } from '@/components';
import { TimeUnitSelectionRenderProps } from '../type';

export const timeUnitSelectionRender = ({
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
        className=" hover:bg-blue-50 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer"
        aria-label="Previous time unit"
      >
        <TriangleIcon className="text-slate-700!" />
      </button>
      <span className="text-xs font-bold text-gray-900 uppercase tracking-wide">{timeUnit}</span>
      <button
        onClick={handleTimeUnitNextSelect}
        disabled={isNextBtnDisabled()}
        className=" hover:bg-blue-50 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer"
        aria-label="Next time unit"
      >
        <TriangleIcon className="text-slate-700! rotate-180" />
      </button>
    </div>
  );
};

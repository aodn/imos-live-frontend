import { Button, TriangleIcon } from '@/components';
import type { TimeUnitSelectionRenderProps } from '../type';

export const timeUnitSelectionRender = ({
  timeUnit,
  handleTimeUnitNextSelect,
  handleTimeUnitPreviousSelect,
  isNextBtnDisabled,
  isPrevBtnDisabled,
}: TimeUnitSelectionRenderProps) => {
  return (
    <div className="flex flex-col items-center gap-1 bg-white rounded-lg px-3 py-2 shadow-sm border border-gray-300 w-20 shrink-0">
      <Button
        onClick={handleTimeUnitPreviousSelect}
        disabled={isPrevBtnDisabled()}
        aria-label="Previous time unit"
        variant="ghost"
        size="icon"
      >
        <TriangleIcon className="text-slate-700!" size="xs" />
      </Button>
      <span className="text-xs font-bold text-gray-900 uppercase tracking-wide">{timeUnit}</span>
      <Button
        onClick={handleTimeUnitNextSelect}
        disabled={isNextBtnDisabled()}
        aria-label="Next time unit"
        variant="ghost"
        size="icon"
      >
        <TriangleIcon className="text-slate-700! rotate-180" size="xs" />
      </Button>
    </div>
  );
};

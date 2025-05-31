import { useRef } from 'react';
import { TriangleIcon } from '..';
import { DateSlider, PointSelection, SelectionResult } from '../DateSlider';
import { cn } from '@/lib/utils';
import { getLast7DatesEnding3DaysAgo, toShortDateFormat } from '@/utils';
import { useMapUIStore } from '@/store';

type DateSelectionBarProps = { className?: string };

export const DateSelectionBar = ({ className }: DateSelectionBarProps) => {
  const sliderContainerRef = useRef<HTMLDivElement>(null);
  const lastSevenDays = getLast7DatesEnding3DaysAgo('yyyy-mm-dd');

  const setDataset = useMapUIStore(s => s.setDataset);

  const handleSelect = (v: PointSelection) => {
    setDataset(toShortDateFormat(v.point));
  };
  //TODO 1. the date value in storybook point mode is accurate between two scale units, but in here it span two units.

  return (
    <div
      className={cn('border-2 mx-auto mt-20 px-4 overflow-hidden bg-red-400/30', className)}
      ref={sliderContainerRef}
    >
      <DateSlider
        viewMode="point"
        timeUnit="day"
        startDate={new Date(lastSevenDays[0])}
        endDate={new Date(lastSevenDays.at(-1)!)}
        pointHandleIcon={<TriangleIcon size="xxl" color="imos-grey" />}
        wrapperClassName="my-6 bg-gray-300"
        trackActiveClassName="hidden"
        onChange={handleSelect as (v: SelectionResult) => void}
        parentContainerRef={sliderContainerRef}
        sliderMovabale={true}
        scaleUnitConfig={{
          gap: 72,
          width: { short: 1, medium: 2, long: 2 },
          height: { short: 16, medium: 32, long: 64 },
        }}
      />
    </div>
  );
};

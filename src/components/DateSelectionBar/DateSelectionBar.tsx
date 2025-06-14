import { TriangleIcon } from '..';
import {
  DateSlider,
  dateSliderStyles,
  PointSelection,
  SelectionResult,
  SliderExposedMethod,
} from '../DateSlider';
import { getLast7DatesEnding3DaysAgo, shortDateFormatToUTC, toShortDateFormat } from '@/utils';
import { useMapUIStore } from '@/store';
import { cn } from '@/utils';
import { useMemo, useRef } from 'react';
import { useShallow } from 'zustand/shallow';
import { useSliderDateSyncWithUrl } from '@/hooks';

type DateSelectionBarProps = { className?: string };

export const DateSelectionBar = ({ className }: DateSelectionBarProps) => {
  const { dataset, setDataset } = useMapUIStore(
    useShallow(s => ({
      dataset: s.dataset,
      setDataset: s.setDataset,
    })),
  );

  const dateSliderMethod = useRef<SliderExposedMethod>(null);

  useSliderDateSyncWithUrl(dataset, dateSliderMethod);

  const lastSevenDays = useMemo(() => getLast7DatesEnding3DaysAgo('yyyy-mm-dd'), []);
  const startDate = useMemo(() => new Date(lastSevenDays[0]), [lastSevenDays]);
  const endDate = useMemo(() => {
    const last = new Date(lastSevenDays.at(-1)!);
    last.setDate(last.getDate() + 1);
    return last;
  }, [lastSevenDays]);

  const handleSelect = (v: PointSelection) => {
    setDataset(toShortDateFormat(v.point));
  };

  return (
    <div className={cn('shadow-xl', className)}>
      <DateSlider
        viewMode="point"
        initialTimeUnit="day"
        startDate={startDate}
        endDate={endDate}
        initialPoint={shortDateFormatToUTC(dataset)}
        pointHandleIcon={<TriangleIcon size="xxl" color="imos-grey" />}
        sliderClassName={dateSliderStyles.frosted}
        timeUnitSlectionClassName={dateSliderStyles.frosted}
        trackActiveClassName="hidden"
        onChange={handleSelect as (v: SelectionResult) => void}
        scrollable={true}
        scaleUnitConfig={{
          gap: 40,
          width: { short: 1, medium: 2, long: 2 },
          height: { short: 18, medium: 36, long: 60 },
        }}
        sliderHeight={110}
        sliderWidth={'fill'}
        imperativeHandleRef={dateSliderMethod}
      />
    </div>
  );
};

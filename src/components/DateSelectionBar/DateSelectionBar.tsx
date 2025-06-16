import { TriangleIcon } from '../Icons';
import {
  DateSlider,
  dateSliderStyles,
  PointSelection,
  SelectionResult,
  SliderExposedMethod,
} from '../DateSlider';
import { getLast7DatesEnding3DaysAgo, shortDateFormatToUTC, toShortDateFormat, cn } from '@/utils';
import { useMapUIStore } from '@/store';
import { memo, useCallback, useMemo, useRef } from 'react';
import { useShallow } from 'zustand/shallow';
import { useSliderDateSyncWithUrl } from '@/hooks';

type DateSelectionBarProps = { className?: string };

export const DateSelectionBar = memo(({ className }: DateSelectionBarProps) => {
  const { dataset, setDataset } = useMapUIStore(
    useShallow(s => ({
      dataset: s.dataset,
      setDataset: s.setDataset,
    })),
  );

  const dateSliderMethodRef = useRef<SliderExposedMethod>(null);

  useSliderDateSyncWithUrl(dataset, dateSliderMethodRef);

  const lastSevenDays = useMemo(() => getLast7DatesEnding3DaysAgo('yyyy-mm-dd'), []);
  const startDate = useMemo(() => new Date(lastSevenDays[0]), [lastSevenDays]);
  const endDate = useMemo(() => {
    const last = new Date(lastSevenDays.at(-1)!);
    last.setDate(last.getDate() + 1);
    return last;
  }, [lastSevenDays]);

  const handleSelect = useCallback(
    (v: PointSelection) => {
      setDataset(toShortDateFormat(v.point));
    },
    [setDataset],
  );

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
          width: { short: 1, medium: 2, long: 2 },
          height: { short: 18, medium: 36, long: 60 },
        }}
        sliderHeight={110}
        sliderWidth={'fill'}
        imperativeHandleRef={dateSliderMethodRef}
      />
    </div>
  );
});

DateSelectionBar.displayName = 'DateSelectionBar';

import { TriangleIcon } from '..';
import { DateSlider, PointSelection, SelectionResult } from '../DateSlider';
import {
  convertUTCToLocalDateTime,
  getLast7DatesEnding3DaysAgo,
  shortDateFormatToUTC,
  toShortDateFormat,
} from '@/utils';
import { useMapUIStore } from '@/store';
import { cn } from '@/lib/utils';

type DateSelectionBarProps = { className?: string };

export const DateSelectionBar = ({ className }: DateSelectionBarProps) => {
  const lastSevenDays = getLast7DatesEnding3DaysAgo('yyyy-mm-dd');
  const dataset = useMapUIStore(s => s.dataset);
  const setDataset = useMapUIStore(s => s.setDataset);
  console.log(dataset);
  const handleSelect = (v: PointSelection) => {
    //currently, gsla ocean current data is naming in yy-mm-dd pattern, so need to convert same fromat.
    setDataset(toShortDateFormat(v.point));
  };

  return (
    <div className={cn('shadow-xl', className)}>
      <DateSlider
        viewMode="point"
        initialTimeUnit="day"
        startDate={convertUTCToLocalDateTime(new Date(lastSevenDays[0]))}
        endDate={convertUTCToLocalDateTime(new Date(lastSevenDays.at(-1)!))}
        initialPoint={convertUTCToLocalDateTime(shortDateFormatToUTC(dataset))}
        pointHandleIcon={<TriangleIcon size="xxl" color="imos-grey" />}
        wrapperClassName="rounded-xl bg-gray-300/70"
        trackActiveClassName="hidden"
        onChange={handleSelect as (v: SelectionResult) => void}
        scrollable={true}
        scaleUnitConfig={{
          gap: 36,
          width: { short: 1, medium: 2, long: 2 },
          height: { short: 24, medium: 48, long: 108 },
        }}
      />
    </div>
  );
};

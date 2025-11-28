import { Button } from '@/components/Button';
import { cn } from '@/utils';
import { ArrowIcon } from '@/components/Icons';
import { useMemo } from 'react';
import { formatForDisplay, getDateFromPercent, addTime } from '../utils';
import { DateGranularity } from '../type';

type TimeDisplayProps = {
  className?: string;
  position: number;
  startDate: Date;
  endDate: Date;
  granularity: DateGranularity;
  setDateTime: (date: Date, target?: 'point' | 'rangeStart' | 'rangeEnd') => void;
};

export const TimeDisplay = ({
  className,
  position,
  startDate,
  endDate,
  granularity,
  setDateTime,
}: TimeDisplayProps) => {
  const dateLabel = useMemo(() => {
    const date = getDateFromPercent(position, startDate, endDate);
    return formatForDisplay(date, granularity, 'en-AU', true);
  }, [position, startDate, endDate, granularity]);

  const handleDateUpdate = (direction: 'forward' | 'backward') => {
    const currentDate = getDateFromPercent(position, startDate, endDate);
    const amount = direction === 'forward' ? 1 : -1;

    const unit = granularity;
    const newDate = addTime(currentDate, amount, unit);
    setDateTime(newDate, 'point');
  };

  return (
    <div className={cn('flex rounded-xl overflow-hidden', className)}>
      <div className="h-full flex items-center justify-center w-28">
        <p className="text-imos-grey font-semibold">{dateLabel}</p>
      </div>
      <div className="h-full flex items-center">
        <Button variant="ghost" onClick={() => handleDateUpdate('backward')} className="p-0!">
          <ArrowIcon className="rotate-90" color="imos-grey" size="xxl" />
        </Button>
        <Button variant="ghost" onClick={() => handleDateUpdate('forward')} className="p-0!">
          <ArrowIcon className="rotate-270" color="imos-grey" size="xxl" />
        </Button>
      </div>
    </div>
  );
};

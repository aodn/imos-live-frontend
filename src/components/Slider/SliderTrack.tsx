/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { cn } from '@/lib/utils';
import { TimeUnit } from './Slider';
import { addTimeUnit } from '@/utils';

type BaseSliderTrackProps = {
  onTrackClick: (e: React.MouseEvent) => void;
  baseTrackclassName?: string;
  timeUnit: TimeUnit;
  startDate: Date;
  endDate: Date;
  totalUnits: number;
};

type PointModeProps = {
  mode: 'point';
  activeTrackClassName?: string;
  pointPosition: number;
};

type CombinedModeProps = {
  mode: 'combined';
  rangeStart: number;
  rangeEnd: number;
  pointPosition: number;
  inactiveTrackClassName?: string;
  activeTrackClassName?: string;
};

type RangeModeProps = {
  mode: 'range';
  rangeStart: number;
  rangeEnd: number;
  inactiveTrackClassName?: string;
  activeTrackClassName?: string;
};

type SliderTrackProps = BaseSliderTrackProps &
  (PointModeProps | RangeModeProps | CombinedModeProps);

const generateRulerScales = (
  startDate: Date,
  endDate: Date,
  timeUnit: TimeUnit,
  totalUnits: number,
) => {
  const scales: { position: number; type: 'short' | 'medium' | 'long'; date: Date }[] = [];

  if (timeUnit === 'day') {
    // Generate all days as short scales
    for (let i = 0; i <= totalUnits; i++) {
      const currentDate = addTimeUnit(startDate, i, 'day');
      if (currentDate <= endDate) {
        const position = (i / totalUnits) * 100;
        const dayOfWeek = currentDate.getDay();
        const dayOfMonth = currentDate.getDate();

        let type: 'short' | 'medium' | 'long' = 'short';

        // Long scale for first day of month
        if (dayOfMonth === 1) {
          type = 'long';
        }
        // Medium scale for Mondays (start of week)
        else if (dayOfWeek === 1) {
          type = 'medium';
        }

        scales.push({ position, type, date: currentDate });
      }
    }
  } else if (timeUnit === 'month') {
    // Generate all months as short scales
    for (let i = 0; i <= totalUnits; i++) {
      const currentDate = addTimeUnit(startDate, i, 'month');
      if (currentDate <= endDate) {
        const position = (i / totalUnits) * 100;
        const month = currentDate.getMonth();

        let type: 'short' | 'medium' | 'long' = 'short';

        // Long scale for January (start of year)
        if (month === 0) {
          type = 'long';
        }
        // Medium scale for every 3 months (Jan, Apr, Jul, Oct)
        else if (month % 3 === 0) {
          type = 'medium';
        }

        scales.push({ position, type, date: currentDate });
      }
    }
  } else if (timeUnit === 'year') {
    // Generate all years as short scales
    for (let i = 0; i <= totalUnits; i++) {
      const currentDate = addTimeUnit(startDate, i, 'year');
      if (currentDate <= endDate) {
        const position = (i / totalUnits) * 100;
        const year = currentDate.getFullYear();

        let type: 'short' | 'medium' | 'long' = 'short';

        // Long scale for every 10 years
        if (year % 10 === 0) {
          type = 'long';
        }
        // Medium scale for every 5 years
        else if (year % 5 === 0) {
          type = 'medium';
        }

        scales.push({ position, type, date: currentDate });
      }
    }
  }

  return scales;
};

export const SliderTrack = ({
  onTrackClick,
  baseTrackclassName,
  timeUnit,
  startDate,
  endDate,
  totalUnits,
  ...props
}: SliderTrackProps) => {
  const rulerScales = generateRulerScales(startDate, endDate, timeUnit, totalUnits);

  const renderRulerScales = () => (
    <div className="absolute inset-0 pointer-events-none">
      {rulerScales.map((scale, index) => (
        <div
          key={index}
          className={cn('absolute bg-gray-600 transform -translate-x-0.5', {
            'w-px h-1 -top-1': scale.type === 'short',
            'w-px h-2 -top-2': scale.type === 'medium',
            'w-px h-3 -top-3': scale.type === 'long',
          })}
          style={{ left: `${scale.position}%` }}
        />
      ))}
    </div>
  );

  if (props.mode === 'point') {
    return (
      <div
        className={cn(
          'w-full h-2 bg-gray-300 rounded-full relative overflow-visible cursor-pointer',
          baseTrackclassName,
        )}
        onClick={onTrackClick}
      >
        {renderRulerScales()}
        <div
          className={cn(
            'h-full bg-red-500 rounded-full transition-all duration-200 relative z-10',
            props.activeTrackClassName,
          )}
          style={{ width: `${props.pointPosition}%` }}
        />
      </div>
    );
  }
  if (props.mode === 'range') {
    return (
      <div
        className={cn(
          'w-full h-2 bg-gray-300 rounded-full relative overflow-visible cursor-pointer',
          baseTrackclassName,
        )}
        onClick={onTrackClick}
      >
        {renderRulerScales()}
        <div
          className={cn(
            'absolute h-full bg-gray-300 rounded-l-full z-10',
            props.inactiveTrackClassName,
          )}
          style={{ width: `${props.rangeStart}%` }}
        />
        <div
          className={cn(
            'absolute h-full bg-gray-300 rounded-r-full right-0 z-10',
            props.inactiveTrackClassName,
          )}
          style={{ width: `${100 - props.rangeEnd}%` }}
        />
        <div
          className={cn(
            'absolute h-full bg-blue-500 transition-all duration-200 z-10',
            props.activeTrackClassName,
          )}
          style={{
            left: `${props.rangeStart}%`,
            width: `${props.rangeEnd - props.rangeStart}%`,
          }}
        />
      </div>
    );
  }

  if (props.mode === 'combined') {
    return (
      <div
        className={cn(
          'w-full h-2 bg-gray-300 rounded-full relative overflow-visible cursor-pointer',
          baseTrackclassName,
        )}
        onClick={onTrackClick}
      >
        {renderRulerScales()}
        <div
          className={cn(
            'absolute h-full bg-gray-300 rounded-l-full z-10',
            props.inactiveTrackClassName,
          )}
          style={{ width: `${props.rangeStart}%` }}
        />
        <div
          className={cn(
            'absolute h-full bg-gray-300 rounded-r-full right-0 z-10',
            props.inactiveTrackClassName,
          )}
          style={{ width: `${100 - props.rangeEnd}%` }}
        />
        <div
          className={cn(
            'absolute h-full bg-blue-500 transition-all duration-200 z-10',
            props.activeTrackClassName,
          )}
          style={{
            left: `${props.rangeStart}%`,
            width: `${props.rangeEnd - props.rangeStart}%`,
          }}
        />
      </div>
    );
  }
};

import React, { useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { SliderHandle } from './SliderHandle';
import { SliderTrack } from './SliderTrack';
import { addTimeUnit, formatDateForDisplay, generateTimeSteps, getTimeDifference } from '@/utils';

export type ViewMode = 'range' | 'point' | 'combined';
export type IsDragging = 'start' | 'end' | 'point' | null;
export type TimeUnit = 'day' | 'month' | 'year';

type RangeSelection = {
  range: {
    start: Date;
    end: Date;
  };
};

type PointSelection = {
  point: Date;
};

type CombinedSelection = RangeSelection & PointSelection;

export type SelectionResult = RangeSelection | PointSelection | CombinedSelection;

export type SliderProps = {
  viewMode: ViewMode;
  startDate: Date;
  endDate: Date;
  timeUnit: TimeUnit;
  stepSize?: number; // How many units per major tick (default: 1 for days, 1 for months, 5 for years)
  initialRange?: { start: Date; end: Date };
  initialPoint?: Date;
  wrapperClassName?: string;
  pointHandleIcon?: ReactNode;
  rangeHandleIcon?: ReactNode;
  onChange: (v: SelectionResult) => void;
};

export const Slider = ({
  viewMode,
  startDate,
  endDate,
  timeUnit,
  stepSize,
  initialRange,
  initialPoint,
  wrapperClassName,
  pointHandleIcon,
  rangeHandleIcon,
  onChange,
}: SliderProps) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const defaultStepSize = stepSize || (timeUnit === 'year' ? 5 : 1);
  const timeSteps = generateTimeSteps(startDate, endDate, timeUnit, defaultStepSize); //display date below slider.

  const totalTimeUnits = getTimeDifference(startDate, endDate, timeUnit);
  const minGapPercent = (1 / totalTimeUnits) * 100 * 5; //when move selection at minimum 5 units gap.

  // Initialize positions
  const getInitialRangeStart = () => {
    if (initialRange?.start) {
      const diff = getTimeDifference(startDate, initialRange.start, timeUnit);
      return Math.max(0, Math.min(100, (diff / totalTimeUnits) * 100));
    }
    return 0;
  };

  const getInitialRangeEnd = () => {
    if (initialRange?.end) {
      const diff = getTimeDifference(startDate, initialRange.end, timeUnit);
      return Math.max(0, Math.min(100, (diff / totalTimeUnits) * 100));
    }
    return 100;
  };

  const getInitialPointPosition = () => {
    if (initialPoint) {
      const diff = getTimeDifference(startDate, initialPoint, timeUnit);
      return Math.max(0, Math.min(100, (diff / totalTimeUnits) * 100));
    }
    return 50;
  };

  const [rangeStart, setRangeStart] = useState(getInitialRangeStart());
  const [rangeEnd, setRangeEnd] = useState(getInitialRangeEnd());
  const [pointPosition, setPointPosition] = useState(getInitialPointPosition());
  const [isDragging, setIsDragging] = useState<IsDragging>(null);

  const getDateFromPercent = (percent: number): Date => {
    const unitsFromStart = (percent / 100) * totalTimeUnits;
    return addTimeUnit(startDate, Math.round(unitsFromStart), timeUnit);
  };

  const startLabel = getDateFromPercent(rangeStart);
  const endLabel = getDateFromPercent(rangeEnd);
  const pointLabel = getDateFromPercent(pointPosition);

  useEffect(() => {
    switch (viewMode) {
      case 'range':
        onChange({ range: { start: startLabel, end: endLabel } });
        break;
      case 'point':
        onChange({ point: pointLabel });
        break;
      case 'combined':
        onChange({
          range: { start: startLabel, end: endLabel },
          point: pointLabel,
        });
        break;
    }
  }, [endLabel, onChange, pointLabel, startLabel, viewMode]);

  const handleMouseDown = (handle: IsDragging) => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(handle);
  };

  const handleMouseMove = useCallback(
    (e: globalThis.MouseEvent) => {
      if (!isDragging || !sliderRef.current) return;
      const rect = sliderRef.current.getBoundingClientRect();
      const percentage = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));

      if (isDragging === 'start') {
        setRangeStart(Math.min(percentage, rangeEnd - minGapPercent));
      } else if (isDragging === 'end') {
        setRangeEnd(Math.max(percentage, rangeStart + minGapPercent));
      } else if (isDragging === 'point') {
        setPointPosition(percentage);
      }
    },
    [isDragging, rangeStart, rangeEnd, minGapPercent],
  );

  const handleMouseUp = useCallback(() => setIsDragging(null), []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleTrackClick = (e: React.MouseEvent) => {
    if (!sliderRef.current || isDragging) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = ((e.clientX - rect.left) / rect.width) * 100;

    const setClosestHandle = (pos: number) => {
      const distances = [
        { type: 'start', dist: Math.abs(pos - rangeStart) },
        { type: 'end', dist: Math.abs(pos - rangeEnd) },
        { type: 'point', dist: Math.abs(pos - pointPosition) },
      ];
      const closest = distances.reduce((a, b) => (a.dist < b.dist ? a : b)).type;
      if (closest === 'point') {
        setPointPosition(pos);
      } else if (closest === 'start') {
        setRangeStart(Math.min(pos, rangeEnd - minGapPercent));
      } else if (closest === 'end') {
        setRangeEnd(Math.max(pos, rangeStart + minGapPercent));
      }
    };

    if (viewMode === 'range') {
      const distanceToStart = Math.abs(percentage - rangeStart);
      const distanceToEnd = Math.abs(percentage - rangeEnd);
      if (distanceToStart < distanceToEnd) {
        setRangeStart(Math.min(percentage, rangeEnd - minGapPercent));
      } else {
        setRangeEnd(Math.max(percentage, rangeStart + minGapPercent));
      }
    } else if (viewMode === 'point') {
      setPointPosition(percentage);
    } else if (viewMode === 'combined') {
      setClosestHandle(percentage);
    }
  };

  const renderHandles = () => {
    const handleProps = {
      range: [
        <SliderHandle
          key="start"
          className="top-0"
          labelClassName="-top-6 bg-blue-600"
          icon={rangeHandleIcon}
          onDragging={isDragging === 'start'}
          position={rangeStart}
          label={formatDateForDisplay(startLabel, timeUnit)}
          onMouseDown={handleMouseDown('start')}
        />,
        <SliderHandle
          key="end"
          className="top-0"
          labelClassName="-top-6 bg-blue-600"
          icon={rangeHandleIcon}
          onDragging={isDragging === 'end'}
          position={rangeEnd}
          label={formatDateForDisplay(endLabel, timeUnit)}
          onMouseDown={handleMouseDown('end')}
        />,
      ],
      point: [
        <SliderHandle
          key="point"
          className="top-2"
          labelClassName="top-10 bg-red-600"
          icon={pointHandleIcon}
          onDragging={isDragging === 'point'}
          position={pointPosition}
          label={formatDateForDisplay(pointLabel, timeUnit)}
          onMouseDown={handleMouseDown('point')}
        />,
      ],
    };

    if (viewMode === 'range') return handleProps.range;
    if (viewMode === 'point') return handleProps.point;
    return [...handleProps.range, ...handleProps.point];
  };

  return (
    <div className="border-4 w-100 absolute top-1/2 left-1/2 -translate-x-1/2">
      <div className={cn('relative', wrapperClassName)} ref={sliderRef}>
        <SliderTrack
          mode={viewMode}
          pointPosition={pointPosition}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          onTrackClick={handleTrackClick}
          timeUnit={timeUnit}
          startDate={startDate}
          endDate={endDate}
          totalUnits={totalTimeUnits}
        />
        {renderHandles()}
        <div className="flex justify-between mt-4 text-sm text-gray-500">
          {timeSteps.map((date, index) => (
            <span key={index} className="text-center">
              {formatDateForDisplay(date, timeUnit)}
            </span>
          ))}
        </div>
      </div>{' '}
    </div>
  );
};

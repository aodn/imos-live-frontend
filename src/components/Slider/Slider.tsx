import React, { useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import { Chart } from './Chart';
import { generateYearsByStep } from '@/utils';
import { SliderHandle } from './SliderHandle';
import { SliderTrack } from './SliderTrack';
import { cn } from '@/lib/utils';

export type ViewMode = 'range' | 'point' | 'combined';

type SliderProps = {
  viewMode: ViewMode;
  startYear: number;
  endYear: number;
  currentPointYear: number;
  initialRange?: {
    start: number;
    end: number;
  };
  showChart?: boolean;
  wrapperClassName?: string;
  sliderClassName?: string;
  pointHandleIcon?: ReactNode;
  rangeHandleIcon?: ReactNode;
  allData: {
    year: number;
    value: number;
  }[];
};

export type IsDragging = 'start' | 'end' | 'point' | null;

export const Slider = ({
  viewMode,
  startYear,
  endYear,
  currentPointYear,
  allData,
  initialRange,
  showChart = true,
  wrapperClassName,
  sliderClassName,
  pointHandleIcon,
  rangeHandleIcon,
}: SliderProps) => {
  // Range mode state
  const [rangeStart, setRangeStart] = useState(initialRange?.start || 0);
  const [rangeEnd, setRangeEnd] = useState(initialRange?.end || 100);
  const [isDragging, setIsDragging] = useState<IsDragging>(null);

  // Point mode state
  const [pointPosition, setPointPosition] = useState(50);

  const sliderRef = useRef<HTMLDivElement>(null);

  const yearsByStep = generateYearsByStep(startYear, endYear, 5);
  // Calculate data based on current mode
  const totalYears = allData.length;
  let visibleData = allData;
  let startYearCopy = startYear;
  let endYearCopy = endYear;
  let currentPointYearCopy = currentPointYear;

  if (viewMode === 'range') {
    const startIndex = Math.floor((rangeStart / 100) * (totalYears - 1));
    const endIndex = Math.floor((rangeEnd / 100) * (totalYears - 1));
    visibleData = allData.slice(startIndex, endIndex + 1);
    startYearCopy = allData[startIndex]?.year || 1990;
    endYearCopy = allData[endIndex]?.year || 2025;
  } else if (viewMode === 'point') {
    const pointIndex = Math.floor((pointPosition / 100) * (totalYears - 1));
    currentPointYearCopy = allData[pointIndex]?.year || 1990;
    // Show a wider range around the point for context
    const contextStart = Math.max(0, pointIndex - 10);
    const contextEnd = Math.min(totalYears - 1, pointIndex + 10);
    visibleData = allData.slice(contextStart, contextEnd + 1);
  } else if (viewMode === 'combined') {
    // Combined mode: show range with point
    const startIndex = Math.floor((rangeStart / 100) * (totalYears - 1));
    const endIndex = Math.floor((rangeEnd / 100) * (totalYears - 1));
    const pointIndex = Math.floor((pointPosition / 100) * (totalYears - 1));

    visibleData = allData.slice(startIndex, endIndex + 1);
    startYearCopy = allData[startIndex]?.year || startYear;
    endYearCopy = allData[endIndex]?.year || endYear;
    currentPointYearCopy = allData[pointIndex]?.year || currentPointYear;
  }

  // Range slider handlers
  const handleMouseDown = (handle: 'start' | 'end' | 'point') => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(handle);
  };

  const handleRangeMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !sliderRef.current) return;

      const rect = sliderRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));

      if (isDragging === 'start') {
        setRangeStart(Math.min(percentage, rangeEnd - 5));
      } else if (isDragging === 'end') {
        setRangeEnd(Math.max(percentage, rangeStart + 5));
      } else if (isDragging === 'point') {
        setPointPosition(percentage);
      }
    },
    [isDragging, rangeEnd, rangeStart],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  // Point slider handlers - now integrated into main mouse handlers
  const handlePointMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging('point');
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleRangeMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleRangeMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleRangeMouseMove, handleMouseUp]);

  const handleTrackClick = (e: React.MouseEvent) => {
    if (!sliderRef.current || isDragging) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;

    if (viewMode === 'range') {
      const distanceToStart = Math.abs(percentage - rangeStart);
      const distanceToEnd = Math.abs(percentage - rangeEnd);

      if (distanceToStart < distanceToEnd) {
        setRangeStart(Math.min(percentage, rangeEnd - 5));
      } else {
        setRangeEnd(Math.max(percentage, rangeStart + 5));
      }
    } else if (viewMode === 'point') {
      setPointPosition(percentage);
    } else if (viewMode === 'combined') {
      // In combined mode, find the closest handle
      const distanceToStart = Math.abs(percentage - rangeStart);
      const distanceToEnd = Math.abs(percentage - rangeEnd);
      const distanceToPoint = Math.abs(percentage - pointPosition);

      const minDistance = Math.min(distanceToStart, distanceToEnd, distanceToPoint);

      if (minDistance === distanceToPoint) {
        setPointPosition(percentage);
      } else if (minDistance === distanceToStart) {
        setRangeStart(Math.min(percentage, rangeEnd - 5));
      } else {
        setRangeEnd(Math.max(percentage, rangeStart + 5));
      }
    }
  };

  let sliderContent: ReactNode;

  if (viewMode === 'range') {
    sliderContent = (
      <>
        {/* Range Slider */}
        <SliderTrack
          mode="range"
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          onTrackClick={handleTrackClick}
        />

        {/* Start handle */}
        <SliderHandle
          className="top-0"
          labelClassName="-top-6 bg-blue-600"
          icon={rangeHandleIcon}
          onDragging={isDragging === 'start'}
          position={rangeStart}
          label={startYearCopy}
          onMouseDown={handleMouseDown('start')}
        />

        {/* End handle */}
        <SliderHandle
          className="top-0"
          labelClassName="-top-6 bg-blue-600"
          icon={rangeHandleIcon}
          onDragging={isDragging === 'end'}
          position={rangeEnd}
          label={endYearCopy}
          onMouseDown={handleMouseDown('end')}
        />
      </>
    );
  } else if (viewMode === 'point') {
    sliderContent = (
      <>
        {/* Point Slider */}
        <SliderTrack pointPosition={pointPosition} onTrackClick={handleTrackClick} mode="point" />

        {/* Point handle */}
        <SliderHandle
          className="top-2"
          labelClassName="top-10 bg-red-600"
          icon={pointHandleIcon}
          onDragging={isDragging === 'point'}
          position={pointPosition}
          label={currentPointYearCopy}
          onMouseDown={handlePointMouseDown}
        />
      </>
    );
  } else {
    sliderContent = (
      <>
        {/* Combined Slider */}
        <SliderTrack
          pointPosition={pointPosition}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          onTrackClick={handleTrackClick}
          mode="combined"
        />

        {/* Range start handle */}
        <SliderHandle
          className="top-0"
          labelClassName="-top-6 bg-blue-600"
          icon={rangeHandleIcon}
          onDragging={isDragging === 'start'}
          position={rangeStart}
          label={startYearCopy}
          onMouseDown={handleMouseDown('start')}
        />

        {/* Range end handle */}
        <SliderHandle
          className="top-0"
          labelClassName="-top-6 bg-blue-600"
          icon={rangeHandleIcon}
          onDragging={isDragging === 'end'}
          position={rangeEnd}
          label={endYearCopy}
          onMouseDown={handleMouseDown('end')}
        />

        {/* Point handle */}
        <SliderHandle
          className="top-2"
          labelClassName="top-10 bg-red-600"
          icon={pointHandleIcon}
          onDragging={isDragging === 'point'}
          position={pointPosition}
          label={currentPointYearCopy}
          onMouseDown={handleMouseDown('point')}
        />
      </>
    );
  }

  return (
    <div className={cn('w-full', wrapperClassName)}>
      {/* Chart */}
      {showChart && (
        <Chart
          viewMode={viewMode}
          visibleData={visibleData}
          currentPointYear={currentPointYearCopy}
        />
      )}

      {/* Slider Container */}
      <div className={cn('relative', sliderClassName)} ref={sliderRef}>
        {sliderContent}

        {/* Timeline labels */}
        <div className="flex justify-between mt-4 text-sm text-gray-500">
          {yearsByStep.map(year => (
            <span key={year}>{year}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

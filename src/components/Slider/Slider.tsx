import React, { useState, useRef, useCallback, useEffect, ReactNode, useLayoutEffect } from 'react';
import { cn } from '@/lib/utils';
import { SliderHandle } from './SliderHandle';
import { SliderTrack } from './SliderTrack';
import {
  addTimeUnit,
  formatDateForDisplay,
  generateTimeSteps,
  getTotalTimeUnitsByTimeMode,
} from '@/utils';
import { useDrag } from '@/hooks';

export type ViewMode = 'range' | 'point' | 'combined';
export type TimeUnit = 'day' | 'month' | 'year';
export type DragHandle = 'start' | 'end' | 'point' | null;

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

export interface SliderProps {
  viewMode: ViewMode;
  startDate: Date;
  endDate: Date;
  timeUnit: TimeUnit;
  stepSize?: number;
  initialRange?: { start: Date; end: Date };
  initialPoint?: Date;
  wrapperClassName?: string;
  pointHandleIcon?: ReactNode;
  rangeHandleIcon?: ReactNode;
  onChange: (selection: SelectionResult) => void;
}

// Constants
const DEFAULT_STEP_SIZES = {
  day: 1,
  month: 1,
  year: 5,
} as const;

const MIN_GAP_UNITS = 5;

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
  // Refs
  const sliderRef = useRef<HTMLDivElement>(null);
  const sliderParentRef = useRef<HTMLDivElement>(null);

  // Computed values
  const effectiveStepSize = stepSize ?? DEFAULT_STEP_SIZES[timeUnit];
  const timeSteps = generateTimeSteps(startDate, endDate, timeUnit, effectiveStepSize);
  const totalTimeUnits = getTotalTimeUnitsByTimeMode(startDate, endDate, timeUnit);
  const minGapPercent = (1 / totalTimeUnits) * 100 * MIN_GAP_UNITS;

  // State
  const [dimensions, setDimensions] = useState({ parent: 0, slider: 0 });
  const [isDragging, setIsDragging] = useState<DragHandle>(null);
  const [dragStarted, setDragStarted] = useState(false);

  // Position state
  const [rangeStart, setRangeStart] = useState(() => getInitialRangeStart());
  const [rangeEnd, setRangeEnd] = useState(() => getInitialRangeEnd());
  const [pointPosition, setPointPosition] = useState(() => getInitialPointPosition());

  // Initialize dimensions
  useLayoutEffect(() => {
    updateDimensions();
  }, []);

  // Drag hook
  const {
    // position,
    dragHandlers,
    isDragging: isContainerDragging,
  } = useDrag({
    targetRef: sliderRef,
    initialPosition: { x: 0, y: 0 },
    constrainToAxis: 'x',
    bounds: {
      left: dimensions.parent - dimensions.slider,
      right: 0,
    },
    onDragEnd: handleDragComplete,
    onDragStarted: () => {
      setDragStarted(true);
    },
  });

  // Helper functions
  function updateDimensions() {
    if (sliderParentRef.current && sliderRef.current) {
      const parentWidth = sliderParentRef.current.getBoundingClientRect().width;
      const sliderWidth = sliderRef.current.getBoundingClientRect().width;
      setDimensions({ parent: parentWidth, slider: sliderWidth });
    }
  }

  function getInitialRangeStart(): number {
    if (!initialRange?.start) return 0;
    const diff = getTotalTimeUnitsByTimeMode(startDate, initialRange.start, timeUnit);
    return clampPercent((diff / totalTimeUnits) * 100);
  }

  function getInitialRangeEnd(): number {
    if (!initialRange?.end) return 100;
    const diff = getTotalTimeUnitsByTimeMode(startDate, initialRange.end, timeUnit);
    return clampPercent((diff / totalTimeUnits) * 100);
  }

  function getInitialPointPosition(): number {
    if (!initialPoint) return 50;
    const diff = getTotalTimeUnitsByTimeMode(startDate, initialPoint, timeUnit);
    return clampPercent((diff / totalTimeUnits) * 100);
  }

  function clampPercent(value: number): number {
    return Math.max(0, Math.min(100, value));
  }

  const getDateFromPercent = useCallback(
    (percent: number): Date => {
      const unitsFromStart = (percent / 100) * totalTimeUnits;
      return addTimeUnit(startDate, Math.round(unitsFromStart), timeUnit);
    },
    [startDate, totalTimeUnits, timeUnit],
  );

  function handleDragComplete() {
    // Add a small delay before resetting dragStarted to ensure track clicks are properly blocked
    setTimeout(() => {
      setDragStarted(false);
    }, 50);
  }

  const getPercentageFromMouseEvent = useCallback(
    (e: MouseEvent | React.MouseEvent): number => {
      if (!sliderRef.current) return 0;
      const rect = sliderRef.current.getBoundingClientRect();
      return clampPercent(((e.clientX - rect.left) / rect.width) * 100);
    },
    [sliderRef],
  );

  const updateHandlePosition = useCallback(
    (handle: DragHandle, percentage: number) => {
      switch (handle) {
        case 'start':
          setRangeStart(percentage => {
            setRangeEnd(currentEnd => Math.min(percentage, currentEnd - minGapPercent));
            return percentage;
          });
          break;
        case 'end':
          setRangeEnd(percentage => {
            setRangeStart(currentStart => Math.max(percentage, currentStart + minGapPercent));
            return percentage;
          });
          break;
        case 'point':
          setPointPosition(percentage);
          break;
      }
    },
    [minGapPercent],
  );

  function findClosestHandle(percentage: number): DragHandle {
    const distances = [
      { type: 'start' as const, dist: Math.abs(percentage - rangeStart) },
      { type: 'end' as const, dist: Math.abs(percentage - rangeEnd) },
      { type: 'point' as const, dist: Math.abs(percentage - pointPosition) },
    ];
    return distances.reduce((a, b) => (a.dist < b.dist ? a : b)).type;
  }

  function handleRangeClick(percentage: number) {
    const distanceToStart = Math.abs(percentage - rangeStart);
    const distanceToEnd = Math.abs(percentage - rangeEnd);
    const closestHandle = distanceToStart < distanceToEnd ? 'start' : 'end';
    updateHandlePosition(closestHandle, percentage);
  }

  const createSelectionResult = useCallback((): SelectionResult => {
    const startLabel = getDateFromPercent(rangeStart);
    const endLabel = getDateFromPercent(rangeEnd);
    const pointLabel = getDateFromPercent(pointPosition);

    switch (viewMode) {
      case 'range':
        return { range: { start: startLabel, end: endLabel } };
      case 'point':
        return { point: pointLabel };
      case 'combined':
        return {
          range: { start: startLabel, end: endLabel },
          point: pointLabel,
        };
    }
  }, [rangeStart, rangeEnd, pointPosition, viewMode, getDateFromPercent]);

  // Event handlers
  const handleMouseDown = (handle: DragHandle) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(handle);
    setDragStarted(false); // Reset drag state
  };

  const handleMouseMove = useCallback(
    (e: globalThis.MouseEvent) => {
      if (!isDragging) return;
      const percentage = getPercentageFromMouseEvent(e);

      // Update positions directly to avoid stale closure issues
      if (isDragging === 'start') {
        setRangeStart(currentStart => {
          setRangeEnd(currentEnd => Math.max(currentStart, currentEnd));
          return Math.min(percentage, rangeEnd - minGapPercent);
        });
      } else if (isDragging === 'end') {
        setRangeEnd(currentEnd => {
          setRangeStart(currentStart => Math.min(currentEnd, currentStart));
          return Math.max(percentage, rangeStart + minGapPercent);
        });
      } else if (isDragging === 'point') {
        setPointPosition(percentage);
      }
    },
    [isDragging, getPercentageFromMouseEvent, rangeEnd, minGapPercent, rangeStart],
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      handleDragComplete();
    }
    setIsDragging(null);
  }, [isDragging]);

  const handleTrackClick = (e: React.MouseEvent) => {
    if (isDragging || dragStarted || isContainerDragging || !sliderRef.current) {
      return;
    }

    const percentage = getPercentageFromMouseEvent(e);

    switch (viewMode) {
      case 'range':
        handleRangeClick(percentage);
        break;
      case 'point':
        setPointPosition(percentage);
        break;
      case 'combined': {
        const closestHandle = findClosestHandle(percentage);
        updateHandlePosition(closestHandle, percentage);
        break;
      }
    }
  };

  // Effects
  useEffect(() => {
    const selection = createSelectionResult();
    onChange(selection);
  }, [rangeStart, rangeEnd, pointPosition, viewMode, onChange, createSelectionResult]);

  useEffect(() => {
    if (!isDragging) return;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Render helpers
  function renderHandles() {
    const handles = [];

    if (viewMode === 'range' || viewMode === 'combined') {
      handles.push(
        <SliderHandle
          key="start"
          className="top-0"
          labelClassName="-top-6 bg-blue-600"
          icon={rangeHandleIcon}
          onDragging={isDragging === 'start'}
          position={rangeStart}
          label={formatDateForDisplay(getDateFromPercent(rangeStart), timeUnit)}
          onMouseDown={handleMouseDown('start')}
        />,
        <SliderHandle
          key="end"
          className="top-0"
          labelClassName="-top-6 bg-blue-600"
          icon={rangeHandleIcon}
          onDragging={isDragging === 'end'}
          position={rangeEnd}
          label={formatDateForDisplay(getDateFromPercent(rangeEnd), timeUnit)}
          onMouseDown={handleMouseDown('end')}
        />,
      );
    }

    if (viewMode === 'point' || viewMode === 'combined') {
      handles.push(
        <SliderHandle
          key="point"
          className="top-2"
          labelClassName="top-10 bg-red-600"
          icon={pointHandleIcon}
          onDragging={isDragging === 'point'}
          position={pointPosition}
          label={formatDateForDisplay(getDateFromPercent(pointPosition), timeUnit)}
          onMouseDown={handleMouseDown('point')}
        />,
      );
    }

    return handles;
  }

  function renderTimeLabels() {
    return (
      <div className="flex justify-between mt-4 text-sm text-gray-500">
        {timeSteps.map((date, index) => (
          <span key={index} className="text-center shrink-0">
            {formatDateForDisplay(date, timeUnit)}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div
      className="border-4 w-100 absolute top-1/2 left-1/2 -translate-x-1/2"
      ref={sliderParentRef}
    >
      <div className={cn('relative w-fit', wrapperClassName)} ref={sliderRef} {...dragHandlers}>
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
        {renderTimeLabels()}
      </div>
    </div>
  );
};

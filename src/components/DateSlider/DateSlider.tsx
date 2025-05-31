import React, { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { SliderHandle } from './SliderHandle';
import { SliderTrack } from './SliderTrack';
import {
  calculateLabelPositions,
  formatDateForDisplay,
  generateScalesWithInfo,
  generateTimeLabels,
  getTotalTimeScales,
  generateTrackWidth,
  clamp,
} from '@/utils';
import { useDrag, useResizeObserver } from '@/hooks';
import { SliderProps, DragHandle, SelectionResult } from './type';

export const DateSlider = ({
  viewMode,
  startDate,
  endDate,
  timeUnit,
  initialRange,
  initialPoint,
  wrapperClassName,
  trackActiveClassName,
  trackBaseClassName,
  pointHandleIcon,
  rangeHandleIcon,
  sliderMovabale = true,
  isFixedWidth = false,
  fixedWidth = 300,
  minGapScaleUnits = 3,
  onChange,
  parentContainerRef,
  trackPaddingX = 24,
  scaleUnitConfig = {
    gap: 12,
    width: { short: 1, medium: 2, long: 2 },
    height: { short: 8, medium: 16, long: 64 },
  },
}: SliderProps) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const totalScaleUnits = getTotalTimeScales(startDate, endDate, timeUnit);
  const minGapPercent = (1 / totalScaleUnits) * 100 * minGapScaleUnits;
  const { scales, numberOfScales } = generateScalesWithInfo(
    startDate,
    endDate,
    timeUnit,
    totalScaleUnits,
  );
  const sliderWidth = isFixedWidth
    ? fixedWidth
    : generateTrackWidth(totalScaleUnits, numberOfScales, scaleUnitConfig);

  const timeLabels = calculateLabelPositions(
    startDate,
    generateTimeLabels(startDate, endDate, timeUnit),
    timeUnit,
    totalScaleUnits,
    sliderWidth,
  );

  const [dimensions, setDimensions] = useState({ parent: 0, slider: 0 });
  const [isDragging, setIsDragging] = useState<DragHandle>(null);
  const [dragStarted, setDragStarted] = useState(false);

  const [rangeStart, setRangeStart] = useState(() => getInitialRangeStart());
  const [rangeEnd, setRangeEnd] = useState(() => getInitialRangeEnd());
  const [pointPosition, setPointPosition] = useState(() => getInitialPointPosition());

  const rangeStartRef = useRef(rangeStart);
  const rangeEndRef = useRef(rangeEnd);
  const pointPositionRef = useRef(pointPosition);

  useEffect(() => {
    rangeStartRef.current = rangeStart;
    rangeEndRef.current = rangeEnd;
    pointPositionRef.current = pointPosition;
  }, [rangeStart, rangeEnd, pointPosition]);

  useResizeObserver(parentContainerRef || { current: null }, updateDimensions);

  const { dragHandlers, isDragging: isContainerDragging } = useDrag({
    targetRef: sliderMovabale ? sliderRef : undefined,
    initialPosition: { x: 0, y: 0 },
    constrainToAxis: 'x',
    bounds: {
      left: Math.min(0, dimensions.parent - dimensions.slider),
      right: 0,
    },
    onDragEnd: handleDragComplete,
    onDragStarted: () => {
      setDragStarted(true);
    },
  });

  function updateDimensions() {
    if (parentContainerRef?.current && sliderRef.current) {
      const parentWidth = parentContainerRef.current.getBoundingClientRect().width;
      const sliderWidth = sliderRef.current.getBoundingClientRect().width;

      setDimensions({ parent: parentWidth, slider: sliderWidth });
    }
  }

  function getInitialRangeStart(): number {
    if (!initialRange?.start) return 0;
    const diff = getTotalTimeScales(startDate, initialRange.start, timeUnit);
    return clampPercent((diff / totalScaleUnits) * 100);
  }

  function getInitialRangeEnd(): number {
    if (!initialRange?.end) return 100;
    const diff = getTotalTimeScales(startDate, initialRange.end, timeUnit);
    return clampPercent((diff / totalScaleUnits) * 100);
  }

  function getInitialPointPosition(): number {
    if (!initialPoint) return 50;
    const diff = getTotalTimeScales(startDate, initialPoint, timeUnit);
    return clampPercent((diff / totalScaleUnits) * 100);
  }

  function clampPercent(value: number): number {
    return clamp(value, 0, 100);
  }

  const getDateFromPercent = useCallback(
    (percent: number): Date => {
      const startTime = startDate.getTime();
      const endTime = endDate.getTime();
      const targetTime = startTime + (percent / 100) * (endTime - startTime);
      return new Date(targetTime);
    },
    [startDate, endDate],
  );

  function handleDragComplete() {
    // Add a small delay before resetting dragStarted to ensure track clicks are properly blocked
    setTimeout(() => {
      setDragStarted(false);
    }, 50);
  }

  const getPercentageFromMouseEvent = useCallback(
    (e: MouseEvent | React.MouseEvent): number => {
      if (!trackRef.current) return 0;
      const rect = trackRef.current.getBoundingClientRect();
      return clampPercent(((e.clientX - rect.left) / rect.width) * 100);
    },
    [trackRef],
  );

  // Optimized handle position update using refs for immediate response
  const updateHandlePositionOptimized = useCallback(
    (handle: DragHandle, percentage: number) => {
      requestAnimationFrame(() => {
        switch (handle) {
          case 'start': {
            const newStart = Math.max(0, Math.min(percentage, rangeEndRef.current - minGapPercent));
            setRangeStart(newStart);
            break;
          }
          case 'end': {
            const newEnd = Math.min(
              100,
              Math.max(percentage, rangeStartRef.current + minGapPercent),
            );
            setRangeEnd(newEnd);
            break;
          }
          case 'point': {
            const newPoint = clampPercent(percentage);
            setPointPosition(newPoint);
            break;
          }
        }
      });
    },
    [minGapPercent],
  );

  function findClosestHandle(percentage: number): DragHandle {
    const distances = [
      { type: 'start' as const, dist: Math.abs(percentage - rangeStartRef.current) },
      { type: 'end' as const, dist: Math.abs(percentage - rangeEndRef.current) },
      { type: 'point' as const, dist: Math.abs(percentage - pointPositionRef.current) },
    ];
    return distances.reduce((a, b) => (a.dist < b.dist ? a : b)).type;
  }

  function handleRangeClick(percentage: number) {
    const distanceToStart = Math.abs(percentage - rangeStartRef.current);
    const distanceToEnd = Math.abs(percentage - rangeEndRef.current);
    const closestHandle = distanceToStart < distanceToEnd ? 'start' : 'end';
    updateHandlePositionOptimized(closestHandle, percentage);
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
    setDragStarted(false);
  };

  const handleMouseMove = useCallback(
    (e: globalThis.MouseEvent) => {
      if (!isDragging) return;

      const percentage = getPercentageFromMouseEvent(e);
      updateHandlePositionOptimized(isDragging, percentage);
    },
    [isDragging, getPercentageFromMouseEvent, updateHandlePositionOptimized],
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
        updateHandlePositionOptimized('point', percentage);
        break;
      case 'combined': {
        const closestHandle = findClosestHandle(percentage);
        updateHandlePositionOptimized(closestHandle, percentage);
        break;
      }
    }
  };

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

  function renderHandles() {
    const handles = [];

    if (viewMode === 'range' || viewMode === 'combined') {
      handles.push(
        <SliderHandle
          key="start"
          className="top-0"
          labelClassName="top-10 bg-red-600"
          icon={rangeHandleIcon}
          onDragging={isDragging === 'start'}
          position={rangeStart}
          label={formatDateForDisplay(getDateFromPercent(rangeStart), timeUnit)}
          onMouseDown={handleMouseDown('start')}
        />,
        <SliderHandle
          key="end"
          className="top-0"
          labelClassName="top-10 bg-red-600"
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
          className="top-0"
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

  function renderTimeLabels(width: number) {
    return (
      <div className="relative text-sm text-gray-500 " style={{ width: width }}>
        {timeLabels.map(({ date, position }, index) => (
          <span key={index} className="text-center shrink-0 absolute" style={{ left: position }}>
            {formatDateForDisplay(date, timeUnit)}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('w-fit', wrapperClassName)} ref={sliderRef} {...dragHandlers}>
      <div style={{ paddingLeft: trackPaddingX, paddingRight: trackPaddingX }}>
        <div className="relative">
          <SliderTrack
            mode={viewMode}
            pointPosition={pointPosition}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            onTrackClick={handleTrackClick}
            scales={scales}
            width={sliderWidth}
            scaleUnitConfig={scaleUnitConfig}
            baseTrackclassName={trackBaseClassName}
            activeTrackClassName={trackActiveClassName}
            trackRef={trackRef}
          />
          {renderHandles()}
        </div>
      </div>
      <div style={{ paddingLeft: trackPaddingX, paddingRight: trackPaddingX }}>
        {renderTimeLabels(sliderWidth)}
      </div>
    </div>
  );
};

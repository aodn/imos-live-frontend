import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { SliderHandle } from './SliderHandle';
import { SliderTrack } from './SliderTrack';
import {
  calculateLabelPositions,
  formatDateForDisplay,
  generateScalesWithInfo,
  generateTimeLabels,
  getPeriodTimeScales,
  generateTrackWidth,
  clamp,
  checkDateDuration,
} from '@/utils';
import { useDrag, useResizeObserver } from '@/hooks';
import { SliderProps, DragHandle, SelectionResult, TimeUnit } from './type';
import { TimeUnitSelection } from './TimeUnitSelection';

const DEFAULT_SCALE_CONFIG = {
  gap: 12,
  width: { short: 1, medium: 2, long: 2 },
  height: { short: 8, medium: 16, long: 64 },
};

const SLIDER_MIN_WIDTH = 260;

export const Slider = ({
  viewMode,
  startDate,
  endDate,
  initialTimeUnit,
  initialRange,
  initialPoint,
  wrapperClassName,
  trackActiveClassName,
  trackBaseClassName,
  pointHandleIcon,
  rangeHandleIcon,
  scrollable = true,
  isTrackFixedWidth = false,
  trackFixedWidth = 300,
  minGapScaleUnits = 3,
  onChange,
  trackPaddingX = 36,
  scaleUnitConfig = DEFAULT_SCALE_CONFIG,
  sliderWidth,
  sliderHeight,
}: SliderProps) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const sliderContainerRef = useRef<HTMLDivElement>(null);
  const [timeUnit, setTimeUnit] = useState<TimeUnit>(initialTimeUnit);

  const totalScaleUnits = useMemo(
    () => getPeriodTimeScales(startDate, endDate, timeUnit),
    [startDate, endDate, timeUnit],
  );

  const minGapPercent = (1 / totalScaleUnits) * 100 * minGapScaleUnits;

  const { scales, numberOfScales } = useMemo(
    () => generateScalesWithInfo(startDate, endDate, timeUnit, totalScaleUnits),
    [endDate, startDate, timeUnit, totalScaleUnits],
  );

  const trackWidth = useMemo(
    () =>
      isTrackFixedWidth
        ? trackFixedWidth
        : generateTrackWidth(totalScaleUnits, numberOfScales, scaleUnitConfig),
    [trackFixedWidth, isTrackFixedWidth, numberOfScales, scaleUnitConfig, totalScaleUnits],
  );

  const safeSliderWidth = useMemo(() => {
    if (trackWidth + trackPaddingX * 2 < (sliderWidth ?? SLIDER_MIN_WIDTH))
      return trackWidth + trackPaddingX * 2;
    return sliderWidth ?? SLIDER_MIN_WIDTH;
  }, [sliderWidth, trackPaddingX, trackWidth]);

  const timeLabels = useMemo(
    () =>
      calculateLabelPositions(
        startDate,
        generateTimeLabels(startDate, endDate, timeUnit),
        timeUnit,
        totalScaleUnits,
        trackWidth,
      ),
    [endDate, trackWidth, startDate, timeUnit, totalScaleUnits],
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

  const updateDimensions = useCallback(() => {
    if (sliderContainerRef?.current && sliderRef.current) {
      const parentWidth = sliderContainerRef.current.getBoundingClientRect().width;
      const trackWidth = sliderRef.current.getBoundingClientRect().width;
      setDimensions({ parent: parentWidth, slider: trackWidth });
    }
  }, [sliderContainerRef]);

  useResizeObserver(sliderRef || { current: null }, updateDimensions);

  const {
    dragHandlers,
    isDragging: isContainerDragging,
    resetPosition,
  } = useDrag({
    targetRef: scrollable ? sliderRef : undefined,
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

  const handleTimeUnitChange = useCallback((unit: TimeUnit) => {
    setTimeUnit(unit);
    resetPosition({ x: 0, y: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getInitialRangeStart(): number {
    if (!initialRange?.start) return 0;
    const diff = getPeriodTimeScales(startDate, initialRange.start, timeUnit);
    return clampPercent((diff / totalScaleUnits) * 100);
  }

  function getInitialRangeEnd(): number {
    if (!initialRange?.end) return 100;
    const diff = getPeriodTimeScales(startDate, initialRange.end, timeUnit);
    return clampPercent((diff / totalScaleUnits) * 100);
  }

  function getInitialPointPosition(): number {
    if (!initialPoint) return 50;
    const diff = getPeriodTimeScales(startDate, initialPoint, timeUnit);
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
  }, [onChange, createSelectionResult]);

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

  function renderTimeLabels() {
    const isFirstTimeLabelHidden = timeLabels[0].date.getTime() < scales[0].date.getTime();
    return (
      <>
        {timeLabels.map(({ date, position }, index) => (
          <span
            key={index}
            className="bottom-0 text-center  text-sm text-gray-700 absolute"
            style={index === 0 && isFirstTimeLabelHidden ? { left: 0 } : { left: position }}
          >
            {formatDateForDisplay(date, timeUnit, false).toUpperCase()}
          </span>
        ))}
      </>
    );
  }
  return (
    <div
      className={cn('w-fit flex border', wrapperClassName)}
      style={{ height: sliderHeight ?? 96 }}
    >
      <div
        ref={sliderContainerRef}
        className="overflow-hidden h-full"
        style={{ width: safeSliderWidth }}
      >
        <div className={cn('w-fit h-full')} ref={sliderRef} {...dragHandlers}>
          <div
            style={{ paddingLeft: trackPaddingX, paddingRight: trackPaddingX }}
            className="h-full"
          >
            <div className="relative h-full">
              <SliderTrack
                mode={viewMode}
                pointPosition={pointPosition}
                rangeStart={rangeStart}
                rangeEnd={rangeEnd}
                onTrackClick={handleTrackClick}
                scales={scales}
                width={trackWidth}
                scaleUnitConfig={scaleUnitConfig}
                baseTrackclassName={trackBaseClassName}
                activeTrackClassName={trackActiveClassName}
                trackRef={trackRef}
              />
              {renderHandles()}
              {renderTimeLabels()}
            </div>
          </div>
        </div>
      </div>
      <TimeUnitSelection
        isMonthValid={checkDateDuration(startDate, endDate).moreThanOneMonth}
        isYearValid={checkDateDuration(startDate, endDate).moreThanOneYear}
        onChange={handleTimeUnitChange}
        initialTimeUnit={initialTimeUnit}
      />
    </div>
  );
};

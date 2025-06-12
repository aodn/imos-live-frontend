import { useState, useRef, useCallback, useEffect, useMemo, useImperativeHandle } from 'react';
import { cn, debounce } from '@/utils';
import { SliderHandle } from './SliderHandle';
import { SliderTrack } from './SliderTrack';
import {
  calculateLabelPositions,
  formatDateForDisplay,
  generateScalesWithInfo,
  generateTimeLabels,
  getPeriodTimeScales,
  generateTrackWidth,
  checkDateDuration,
  clampPercent,
  clamp,
  convertUTCToLocalDateTime,
} from '@/utils';
import { useDrag, useElementSize, useResizeObserver } from '@/hooks';
import { SliderProps, DragHandle, SelectionResult, TimeUnit, TimeLabel } from './type';
import { TimeUnitSelection } from './TimeUnitSelection';

const DEFAULT_SCALE_CONFIG = {
  gap: 12,
  width: { short: 1, medium: 2, long: 2 },
  height: { short: 8, medium: 16, long: 64 },
};

export const DateSlider = ({
  viewMode,
  startDate: propStartDate,
  endDate: propEndDate,
  initialTimeUnit,
  initialRange,
  initialPoint,
  wrapperClassName,
  trackActiveClassName,
  trackBaseClassName,
  sliderClassName,
  timeUnitSlectionClassName,
  pointHandleIcon,
  rangeHandleIcon,
  scrollable = true,
  isTrackFixedWidth = false,
  minGapScaleUnits = 3,
  onChange,
  trackPaddingX = 36,
  scaleUnitConfig = DEFAULT_SCALE_CONFIG,
  sliderWidth,
  sliderHeight,
  imperativeHandleRef,
}: SliderProps) => {
  const [dimensions, setDimensions] = useState({ parent: 0, slider: 0 });
  const [isDragging, setIsDragging] = useState<DragHandle>(null);
  const [dragStarted, setDragStarted] = useState(false);
  const [timeUnit, setTimeUnit] = useState<TimeUnit>(initialTimeUnit);
  const startDate = useMemo(() => convertUTCToLocalDateTime(propStartDate), [propStartDate]);
  const endDate = useMemo(() => convertUTCToLocalDateTime(propEndDate), [propEndDate]);
  const totalScaleUnits = useMemo(
    () => getPeriodTimeScales(startDate, endDate, timeUnit),
    [startDate, endDate, timeUnit],
  );

  const [rangeStart, setRangeStart] = useState(() => getInitialPosition('rangeStart'));
  const [rangeEnd, setRangeEnd] = useState(() => getInitialPosition('rangeEnd'));
  const [pointPosition, setPointPosition] = useState(() => getInitialPosition('point'));

  const sliderRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const rangeStartRef = useRef(rangeStart);
  const rangeEndRef = useRef(rangeEnd);
  const pointPositionRef = useRef(pointPosition);

  // Refs for handles for programmatic focusing
  const startHandleRef = useRef<HTMLButtonElement>(null);
  const endHandleRef = useRef<HTMLButtonElement>(null);
  const pointHandleRef = useRef<HTMLButtonElement>(null);

  const minGapPercent = useMemo(
    () => (1 / totalScaleUnits) * 100 * minGapScaleUnits,
    [minGapScaleUnits, totalScaleUnits],
  );

  const { scales, numberOfScales } = useMemo(
    () => generateScalesWithInfo(startDate, endDate, timeUnit, totalScaleUnits),
    [endDate, startDate, timeUnit, totalScaleUnits],
  );
  const {
    ref: sliderContainerRef,
    size: { width: sliderContainerWidth },
  } = useElementSize<HTMLDivElement>();

  const trackWidth = useMemo(() => {
    const safeGap = sliderContainerWidth / totalScaleUnits;

    const safeScaleUnitConfig = {
      ...scaleUnitConfig,
      gap: Math.max(safeGap, scaleUnitConfig.gap ?? 0),
    };
    return generateTrackWidth(totalScaleUnits, numberOfScales, safeScaleUnitConfig);
  }, [numberOfScales, scaleUnitConfig, sliderContainerWidth, totalScaleUnits]);

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

  // New function to focus a specific handle
  const focusHandle = useCallback((handleType: DragHandle) => {
    if (handleType === 'start' && startHandleRef.current) {
      startHandleRef.current.focus();
    } else if (handleType === 'end' && endHandleRef.current) {
      endHandleRef.current.focus();
    } else if (handleType === 'point' && pointHandleRef.current) {
      pointHandleRef.current.focus();
    }
  }, []);

  const handleDragComplete = useCallback(() => {
    setTimeout(() => {
      setDragStarted(false);
    }, 50);

    if (isDragging) {
      focusHandle(isDragging);
    }
  }, [isDragging, focusHandle]);

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

  function getInitialPosition(type: 'rangeStart' | 'rangeEnd' | 'point') {
    const valueMap = {
      rangeStart: initialRange?.start,
      rangeEnd: initialRange?.end,
      point: initialPoint,
    };

    const defaultMap = {
      rangeStart: 0,
      rangeEnd: 100,
      point: 50,
    };

    const targetDate = valueMap[type];
    if (!targetDate) return defaultMap[type];

    const diff = getPeriodTimeScales(startDate, targetDate, timeUnit);
    return clampPercent((diff / totalScaleUnits) * 100);
  }

  const handleTimeUnitChange = useCallback((unit: TimeUnit) => {
    setTimeUnit(unit);
    resetPosition({ x: 0, y: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getDateFromPercent = useCallback(
    (percent: number): Date => {
      const startTime = startDate.getTime();
      const endTime = endDate.getTime();
      const targetTime = startTime + (percent / 100) * (endTime - startTime);

      return new Date(targetTime);
    },
    [startDate, endDate],
  );

  const getPercentFromDate = useCallback(
    (date: Date): number => {
      const startTime = startDate.getTime();
      const endTime = endDate.getTime();
      const targetTime = date.getTime();

      const clampedTime = Math.max(startTime, Math.min(endTime, targetTime));
      const percent = ((clampedTime - startTime) / (endTime - startTime)) * 100;

      return clampPercent(percent);
    },
    [startDate, endDate],
  );

  const setDateTime = useCallback(
    (date: Date, target?: 'point' | 'rangeStart' | 'rangeEnd') => {
      const percentage = getPercentFromDate(date);

      let actualTarget = target;
      if (!actualTarget) {
        switch (viewMode) {
          case 'point':
            actualTarget = 'point';
            break;
          case 'range': {
            const distanceToStart = Math.abs(percentage - rangeStartRef.current);
            const distanceToEnd = Math.abs(percentage - rangeEndRef.current);
            actualTarget = distanceToStart < distanceToEnd ? 'rangeStart' : 'rangeEnd';
            break;
          }
          case 'combined':
            actualTarget = 'point';
            break;
        }
      }

      // Update the appropriate handle
      switch (actualTarget) {
        case 'rangeStart': {
          const newStart = clamp(percentage, 0, rangeEndRef.current - minGapPercent);
          setRangeStart(newStart);
          break;
        }
        case 'rangeEnd': {
          const newEnd = clamp(percentage, 100, rangeStartRef.current + minGapPercent);
          setRangeEnd(newEnd);
          break;
        }
        case 'point': {
          setPointPosition(percentage);
          break;
        }
      }
    },
    [getPercentFromDate, viewMode, minGapPercent],
  );

  useImperativeHandle(imperativeHandleRef, () => ({
    setDateTime: setDateTime,
    focusHandle: focusHandle, // Expose the new focus method
  }));

  const getPercentageFromMouseEvent = useCallback(
    (e: MouseEvent | React.MouseEvent): number => {
      if (!trackRef.current) return 0;
      const rect = trackRef.current.getBoundingClientRect();
      return clampPercent(((e.clientX - rect.left) / rect.width) * 100);
    },
    [trackRef],
  );

  const updateHandlePosition = useCallback(
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
    const availableHandles = distances.filter(d => {
      if (viewMode === 'point' && d.type !== 'point') return false;
      if (viewMode === 'range' && d.type === 'point') return false;
      return true;
    });

    if (availableHandles.length === 0) {
      return 'point';
    }

    return availableHandles.reduce((a, b) => (a.dist < b.dist ? a : b)).type;
  }

  function handleRangeClick(percentage: number) {
    const distanceToStart = Math.abs(percentage - rangeStartRef.current);
    const distanceToEnd = Math.abs(percentage - rangeEndRef.current);
    const closestHandle = distanceToStart < distanceToEnd ? 'start' : 'end';
    updateHandlePosition(closestHandle, percentage);
    // *Crucial*: After clicking on track, focus the moved handle
    focusHandle(closestHandle);
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

  const handleMouseDown = (handle: DragHandle) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(handle);
    setDragStarted(false);
    // *Crucial*: Focus the handle immediately on mousedown
    focusHandle(handle);
  };

  const handleMouseMove = useCallback(
    (e: globalThis.MouseEvent) => {
      if (!isDragging) return;

      const percentage = getPercentageFromMouseEvent(e);

      updateHandlePosition(isDragging, percentage);
    },
    [isDragging, getPercentageFromMouseEvent, updateHandlePosition],
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      handleDragComplete(); // Calls focusHandle internally
    }
    setIsDragging(null);
  }, [isDragging, handleDragComplete]); // Add handleDragComplete to deps

  const handleTrackClick = (e: React.MouseEvent) => {
    if (isDragging || dragStarted || isContainerDragging || !sliderRef.current) {
      return;
    }

    const percentage = getPercentageFromMouseEvent(e);

    switch (viewMode) {
      case 'range':
        handleRangeClick(percentage); // Calls focusHandle internally
        break;
      case 'point':
        updateHandlePosition('point', percentage);
        focusHandle('point'); // *Crucial*: Focus the point handle
        break;
      case 'combined': {
        const closestHandle = findClosestHandle(percentage);
        updateHandlePosition(closestHandle, percentage);
        focusHandle(closestHandle); // *Crucial*: Focus the closest handle
        break;
      }
    }
  };

  // Keyboard navigation handler for handles (already good, but now it will receive focus)
  const handleHandleKeyDown = useCallback(
    (handle: DragHandle) => (e: React.KeyboardEvent) => {
      const step = (1 / totalScaleUnits) * 100;
      let newPercentage: number | undefined;

      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowDown':
          e.preventDefault();
          if (handle === 'start') newPercentage = rangeStartRef.current - step;
          else if (handle === 'end') newPercentage = rangeEndRef.current - step;
          else if (handle === 'point') newPercentage = pointPositionRef.current - step;
          break;
        case 'ArrowRight':
        case 'ArrowUp':
          e.preventDefault();
          if (handle === 'start') newPercentage = rangeStartRef.current + step;
          else if (handle === 'end') newPercentage = rangeEndRef.current + step;
          else if (handle === 'point') newPercentage = pointPositionRef.current + step;
          break;
        case 'Home':
          e.preventDefault();
          newPercentage = 0;
          break;
        case 'End':
          e.preventDefault();
          newPercentage = 100;
          break;
      }

      if (newPercentage !== undefined) {
        updateHandlePosition(handle, newPercentage);
      }
    },
    [totalScaleUnits, updateHandlePosition],
  );

  useEffect(() => {
    if (!isDragging) return;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const debouncedOnChange = useMemo(
    () => debounce((selection: SelectionResult) => onChange(selection), 100),
    [onChange],
  );

  useEffect(() => {
    const selection = createSelectionResult();
    debouncedOnChange(selection);
  }, [createSelectionResult, debouncedOnChange]);

  function renderHandles() {
    const handles = [];

    if (viewMode === 'range' || viewMode === 'combined') {
      handles.push(
        <SliderHandle
          key="start"
          ref={startHandleRef}
          className="top-0"
          labelClassName="-top-8 bg-red-600"
          icon={rangeHandleIcon}
          onDragging={isDragging === 'start'}
          position={rangeStart}
          label={formatDateForDisplay(getDateFromPercent(rangeStart), timeUnit)}
          onMouseDown={handleMouseDown('start')}
          min={0}
          max={100}
          value={rangeStart}
          handleType={'range start'}
          onKeyDown={handleHandleKeyDown('start')}
        />,
        <SliderHandle
          key="end"
          ref={endHandleRef}
          className="top-0"
          labelClassName="-top-8 bg-red-600"
          icon={rangeHandleIcon}
          onDragging={isDragging === 'end'}
          position={rangeEnd}
          label={formatDateForDisplay(getDateFromPercent(rangeEnd), timeUnit)}
          onMouseDown={handleMouseDown('end')}
          min={0}
          max={100}
          value={rangeEnd}
          handleType={'range end'}
          onKeyDown={handleHandleKeyDown('end')}
        />,
      );
    }

    if (viewMode === 'point' || viewMode === 'combined') {
      handles.push(
        <SliderHandle
          key="point"
          ref={pointHandleRef}
          className="top-0"
          labelClassName="-top-8 bg-red-600"
          icon={pointHandleIcon}
          onDragging={isDragging === 'point'}
          position={pointPosition}
          label={formatDateForDisplay(getDateFromPercent(pointPosition), timeUnit)}
          onMouseDown={handleMouseDown('point')}
          min={0}
          max={100}
          value={pointPosition}
          handleType={'point'}
          onKeyDown={handleHandleKeyDown('point')}
        />,
      );
    }

    return handles;
  }

  function renderTimeLabels() {
    const isFirstTimeLabelHidden = timeLabels[0].date.getTime() < scales[0].date.getTime();
    const minDistance = 80;

    const visibleLabels: TimeLabel[] = [];
    let lastVisiblePosition = -Infinity;

    timeLabels.forEach((label, index) => {
      const currentPosition = index === 0 && isFirstTimeLabelHidden ? 0 : label.position;

      if (currentPosition - lastVisiblePosition >= minDistance) {
        visibleLabels.push({ ...label, position: currentPosition });
        lastVisiblePosition = currentPosition;
      } else {
        visibleLabels.pop();
        visibleLabels.push({ ...label, position: currentPosition });
        lastVisiblePosition = currentPosition;
      }
    });
    return (
      <>
        {visibleLabels.map(({ date, position }, index) => (
          <span
            key={index}
            className="bottom-0 text-center text-sm text-gray-700 absolute thisistest"
            style={{ left: position }}
          >
            {formatDateForDisplay(date, timeUnit, false).toUpperCase()}
          </span>
        ))}
      </>
    );
  }

  return (
    <div
      className={cn('flex min-w-40', wrapperClassName, {
        'w-full': sliderWidth === 'fill',
      })}
      style={
        sliderWidth !== 'fill'
          ? { height: sliderHeight ?? 96, width: sliderWidth }
          : { height: sliderHeight ?? 96 }
      }
      aria-label="Date and Time Slider"
    >
      <div ref={sliderContainerRef} className="overflow-hidden h-full flex-1 flex flex-col">
        <Spacer />
        <div
          className="flex-1"
          style={isTrackFixedWidth ? { width: '100%' } : { width: trackWidth }}
          ref={sliderRef}
          {...dragHandlers}
        >
          <div
            style={{ paddingLeft: trackPaddingX, paddingRight: trackPaddingX }}
            className={cn('h-full w-full pointer-events-auto', sliderClassName)}
          >
            <div className={cn('relative h-full w-full')}>
              <SliderTrack
                mode={viewMode}
                pointPosition={pointPosition}
                rangeStart={rangeStart}
                rangeEnd={rangeEnd}
                onTrackClick={handleTrackClick}
                scales={scales}
                scaleUnitConfig={scaleUnitConfig}
                baseTrackclassName={trackBaseClassName}
                activeTrackClassName={trackActiveClassName}
                trackRef={trackRef}
                aria-label="Date slider track"
              />
              {renderTimeLabels()}
              {renderHandles()}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col">
        <Spacer />
        <TimeUnitSelection
          className={cn('pointer-events-auto flex-1', timeUnitSlectionClassName)}
          isMonthValid={checkDateDuration(startDate, endDate).moreThanOneMonth}
          isYearValid={checkDateDuration(startDate, endDate).moreThanOneYear}
          onChange={handleTimeUnitChange}
          initialTimeUnit={initialTimeUnit}
        />
      </div>
    </div>
  );
};

const Spacer = ({
  height,
  width,
  className,
}: {
  height?: number;
  width?: number;
  className?: string;
}) => {
  return (
    <div
      style={{ width: width, height: height }}
      className={cn('h-10 pointer-events-none ', className)}
      aria-hidden="true"
    ></div>
  );
};

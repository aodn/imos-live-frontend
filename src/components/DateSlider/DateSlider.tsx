import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  useImperativeHandle,
  memo,
} from 'react';
import { cn, debounce } from '@/utils';
import { SliderHandle } from './SliderHandle';
import { SliderTrack } from './SliderTrack';
import { checkDateDuration, clampPercent, clamp, convertUTCToLocalDateTime } from '@/utils';
import { useDrag, useElementSize, useResizeObserver } from '@/hooks';
import { SliderProps, DragHandle, SelectionResult, TimeUnit, TimeLabel } from './type';
import { TimeUnitSelection } from './TimeUnitSelection';
import { useDragState } from './useDragState';
import { useFocusManagement } from './useFocusManagement';
import { usePositionState } from './usePositionState';
import {
  getPeriodTimeScales,
  generateScalesWithInfo,
  generateTrackWidth,
  generateTimeLabelsWithPositions,
  formatDateForDisplay,
} from './dateSliderUtils';

const DEFAULT_SCALE_CONFIG = {
  gap: 36,
  width: { short: 1, medium: 2, long: 2 },
  height: { short: 8, medium: 16, long: 64 },
} as const;

// Memoized subcomponents
const MemoizedSliderHandle = memo(SliderHandle);
const MemoizedSliderTrack = memo(SliderTrack);
const MemoizedTimeUnitSelection = memo(TimeUnitSelection);

// Custom hooks for better separation of concerns

export const DateSlider = memo(
  ({
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
    const [timeUnit, setTimeUnit] = useState<TimeUnit>(initialTimeUnit);

    // Memoize date conversions
    const startDate = useMemo(() => convertUTCToLocalDateTime(propStartDate), [propStartDate]);
    const endDate = useMemo(() => convertUTCToLocalDateTime(propEndDate), [propEndDate]);

    const totalScaleUnits = useMemo(
      () => getPeriodTimeScales(startDate, endDate, timeUnit),
      [startDate, endDate, timeUnit],
    );

    const minGapPercent = useMemo(
      () => (1 / totalScaleUnits) * 100 * minGapScaleUnits,
      [minGapScaleUnits, totalScaleUnits],
    );

    // Use custom hooks
    const {
      rangeStart,
      rangeEnd,
      pointPosition,
      setRangeStart,
      setRangeEnd,
      setPointPosition,
      rangeStartRef,
      rangeEndRef,
      pointPositionRef,
    } = usePositionState(initialRange, initialPoint, startDate, timeUnit, totalScaleUnits);

    const {
      requestHandleFocus,
      handleHandleFocus,
      setLastInteractionType,
      startHandleRef,
      endHandleRef,
      pointHandleRef,
    } = useFocusManagement();

    const { isDragging, dragStarted, setIsDragging, setDragStarted, handleDragComplete } =
      useDragState();

    const sliderRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);

    // Memoize expensive calculations
    const { scales, numberOfScales } = useMemo(
      () => generateScalesWithInfo(startDate, endDate, timeUnit, totalScaleUnits),
      [endDate, startDate, timeUnit, totalScaleUnits],
    );

    const {
      ref: sliderContainerRef,
      size: { width: sliderContainerWidth },
    } = useElementSize<HTMLDivElement>();

    const trackWidth = useMemo(() => {
      const safeGap =
        (sliderContainerWidth -
          (numberOfScales.long * scaleUnitConfig.width.long +
            numberOfScales.medium * scaleUnitConfig.width.medium +
            numberOfScales.short * scaleUnitConfig.width.short)) /
        totalScaleUnits;
      const safeScaleUnitConfig = {
        ...scaleUnitConfig,
        gap: Math.max(safeGap, scaleUnitConfig.gap ?? 0),
      };
      return generateTrackWidth(totalScaleUnits, numberOfScales, safeScaleUnitConfig);
    }, [numberOfScales, scaleUnitConfig, sliderContainerWidth, totalScaleUnits]);

    const timeLabels = useMemo(
      () => generateTimeLabelsWithPositions(startDate, endDate, timeUnit),
      [endDate, startDate, timeUnit],
    );

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
      onDragStarted: () => setDragStarted(true),
    });

    const resetPositionRef = useRef(resetPosition);
    resetPositionRef.current = resetPosition;

    const handleTimeUnitChange = useCallback((unit: TimeUnit) => {
      setTimeUnit(unit);
      resetPositionRef.current({ x: 0, y: 0 });
    }, []);

    // Memoize date conversion functions
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
      [
        getPercentFromDate,
        viewMode,
        rangeStartRef,
        rangeEndRef,
        minGapPercent,
        setRangeStart,
        setRangeEnd,
        setPointPosition,
      ],
    );

    useImperativeHandle(
      imperativeHandleRef,
      () => ({
        setDateTime,
        focusHandle: (handleType: DragHandle) => requestHandleFocus(handleType, 'keyboard'),
      }),
      [setDateTime, requestHandleFocus],
    );

    const getPercentageFromMouseEvent = useCallback((e: MouseEvent | React.MouseEvent): number => {
      if (!trackRef.current) return 0;
      const rect = trackRef.current.getBoundingClientRect();
      return clampPercent(((e.clientX - rect.left) / rect.width) * 100);
    }, []);

    const updateHandlePosition = useCallback(
      (handle: DragHandle, percentage: number) => {
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
      },
      [rangeEndRef, minGapPercent, setRangeStart, rangeStartRef, setRangeEnd, setPointPosition],
    );

    const findClosestHandle = useCallback(
      (percentage: number): DragHandle => {
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

        if (availableHandles.length === 0) return 'point';
        return availableHandles.reduce((a, b) => (a.dist < b.dist ? a : b)).type;
      },
      [pointPositionRef, rangeEndRef, rangeStartRef, viewMode],
    );

    const handleRangeClick = useCallback(
      (percentage: number) => {
        const distanceToStart = Math.abs(percentage - rangeStartRef.current);
        const distanceToEnd = Math.abs(percentage - rangeEndRef.current);
        const closestHandle = distanceToStart < distanceToEnd ? 'start' : 'end';
        updateHandlePosition(closestHandle, percentage);
        requestHandleFocus(closestHandle, 'mouse');
      },
      [rangeStartRef, rangeEndRef, updateHandlePosition, requestHandleFocus],
    );

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
    const handleMouseDown = useCallback(
      (handle: DragHandle) => (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(handle);
        setDragStarted(false);
        setLastInteractionType('mouse');
      },
      [setIsDragging, setDragStarted, setLastInteractionType],
    );

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
        handleDragComplete();
      }
    }, [isDragging, handleDragComplete]);

    const handleTrackClick = useCallback(
      (e: React.MouseEvent) => {
        if (isDragging || dragStarted || isContainerDragging || !sliderRef.current) {
          return;
        }

        const percentage = getPercentageFromMouseEvent(e);

        switch (viewMode) {
          case 'range':
            handleRangeClick(percentage);
            break;
          case 'point':
            updateHandlePosition('point', percentage);
            requestHandleFocus('point', 'mouse');
            break;
          case 'combined': {
            const closestHandle = findClosestHandle(percentage);
            updateHandlePosition(closestHandle, percentage);
            requestHandleFocus(closestHandle, 'mouse');
            break;
          }
        }
      },
      [
        isDragging,
        dragStarted,
        isContainerDragging,
        getPercentageFromMouseEvent,
        viewMode,
        handleRangeClick,
        updateHandlePosition,
        requestHandleFocus,
        findClosestHandle,
      ],
    );

    // Keyboard navigation
    const handleHandleKeyDown = useCallback(
      (handle: DragHandle) => (e: React.KeyboardEvent) => {
        const step = (1 / totalScaleUnits) * 100;
        const largeStep = step * 5;
        let newPercentage: number | undefined;

        const currentPosition =
          handle === 'start'
            ? rangeStartRef.current
            : handle === 'end'
              ? rangeEndRef.current
              : pointPositionRef.current;

        switch (e.key) {
          case 'ArrowLeft':
          case 'ArrowDown':
            e.preventDefault();
            newPercentage = currentPosition - step;
            break;
          case 'ArrowRight':
          case 'ArrowUp':
            e.preventDefault();
            newPercentage = currentPosition + step;
            break;
          case 'PageDown':
            e.preventDefault();
            newPercentage = currentPosition - largeStep;
            break;
          case 'PageUp':
            e.preventDefault();
            newPercentage = currentPosition + largeStep;
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
          setLastInteractionType('keyboard');
          updateHandlePosition(handle, newPercentage);
        }
      },
      [
        totalScaleUnits,
        rangeStartRef,
        rangeEndRef,
        pointPositionRef,
        setLastInteractionType,
        updateHandlePosition,
      ],
    );

    // Mouse event listeners
    useEffect(() => {
      if (!isDragging) return;

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    // Debounced onChange
    const debouncedOnChange = useMemo(
      () => debounce((selection: SelectionResult) => onChange(selection), 100),
      [onChange],
    );

    useEffect(() => {
      const selection = createSelectionResult();
      debouncedOnChange(selection);
    }, [createSelectionResult, debouncedOnChange]);

    const renderHandles = useCallback(() => {
      const handles = [];
      const commonProps = {
        className: 'top-0',
        labelClassName: '-top-8 bg-red-600',
        onFocus: handleHandleFocus,
        min: 0,
        max: 100,
      };

      if (viewMode === 'range' || viewMode === 'combined') {
        handles.push(
          <MemoizedSliderHandle
            key="start"
            ref={startHandleRef}
            {...commonProps}
            icon={rangeHandleIcon}
            onDragging={isDragging === 'start'}
            position={rangeStart}
            label={formatDateForDisplay(getDateFromPercent(rangeStart), timeUnit)}
            onMouseDown={handleMouseDown('start')}
            value={rangeStart}
            handleType="range start"
            onKeyDown={handleHandleKeyDown('start')}
          />,
          <MemoizedSliderHandle
            key="end"
            ref={endHandleRef}
            {...commonProps}
            icon={rangeHandleIcon}
            onDragging={isDragging === 'end'}
            position={rangeEnd}
            label={formatDateForDisplay(getDateFromPercent(rangeEnd), timeUnit)}
            onMouseDown={handleMouseDown('end')}
            value={rangeEnd}
            handleType="range end"
            onKeyDown={handleHandleKeyDown('end')}
          />,
        );
      }

      if (viewMode === 'point' || viewMode === 'combined') {
        handles.push(
          <MemoizedSliderHandle
            key="point"
            ref={pointHandleRef}
            {...commonProps}
            icon={pointHandleIcon}
            onDragging={isDragging === 'point'}
            position={pointPosition}
            label={formatDateForDisplay(getDateFromPercent(pointPosition), timeUnit)}
            onMouseDown={handleMouseDown('point')}
            value={pointPosition}
            handleType="point"
            onKeyDown={handleHandleKeyDown('point')}
          />,
        );
      }

      return handles;
    }, [
      handleHandleFocus,
      viewMode,
      startHandleRef,
      rangeHandleIcon,
      isDragging,
      rangeStart,
      getDateFromPercent,
      timeUnit,
      handleMouseDown,
      handleHandleKeyDown,
      endHandleRef,
      rangeEnd,
      pointHandleRef,
      pointHandleIcon,
      pointPosition,
    ]);

    const renderTimeLabels = useCallback(() => {
      const isFirstTimeLabelHidden = timeLabels[0]?.date.getTime() < scales[0]?.date.getTime();
      const minDistance = 40;

      const visibleLabels: TimeLabel[] = [];
      let lastVisiblePosition = -Infinity;

      timeLabels.forEach((label, index) => {
        const currentPosition = index === 0 && isFirstTimeLabelHidden ? 0 : label.position;

        if ((currentPosition - lastVisiblePosition) * trackWidth >= minDistance) {
          visibleLabels.push({ ...label, position: currentPosition });
          lastVisiblePosition = currentPosition;
        } else if (visibleLabels.length > 0) {
          visibleLabels.pop();
          visibleLabels.push({ ...label, position: currentPosition });
          lastVisiblePosition = currentPosition;
        }
      });

      return visibleLabels.map(({ date, position }, index) => (
        <span
          key={`${date.getTime()}-${index}`}
          className="bottom-0 text-center text-sm text-gray-700 absolute"
          style={{ left: `${position}%` }}
          aria-hidden="true"
        >
          {formatDateForDisplay(date, timeUnit, false).toUpperCase()}
        </span>
      ));
    }, [timeLabels, scales, trackWidth, timeUnit]);

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
        role="group"
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
              <div className="relative h-full w-full">
                <MemoizedSliderTrack
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
          <MemoizedTimeUnitSelection
            className={cn('pointer-events-auto flex-1', timeUnitSlectionClassName)}
            isMonthValid={checkDateDuration(startDate, endDate).moreThanOneMonth}
            isYearValid={checkDateDuration(startDate, endDate).moreThanOneYear}
            onChange={handleTimeUnitChange}
            initialTimeUnit={initialTimeUnit}
          />
        </div>
      </div>
    );
  },
);

DateSlider.displayName = 'DateSlider';

const Spacer = memo(
  ({ height, width, className }: { height?: number; width?: number; className?: string }) => {
    return (
      <div
        style={{ width, height }}
        className={cn('h-10 pointer-events-none', className)}
        aria-hidden="true"
      />
    );
  },
);

Spacer.displayName = 'Spacer';

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
import { RenderSliderHandle } from './SliderHandle';
import { SliderTrack } from './SliderTrack';
import { checkDateDuration, clampPercent, clamp, convertUTCToLocalDateTime } from '@/utils';
import { useDrag, useElementSize, useResizeObserver } from '@/hooks';
import { SliderProps, DragHandle, SelectionResult, TimeUnit } from './type';
import { TimeUnitSelection } from './TimeUnitSelection';
import { useDragState } from './useDragState';
import { useFocusManagement } from './useFocusManagement';
import { usePositionState } from './usePositionState';
import {
  getPeriodTimeScales,
  generateScalesWithInfo,
  generateTrackWidth,
  generateTimeLabelsWithPositions,
  getPercentageFromMouseEvent,
  getPercentFromDate,
  createSelectionResult,
} from './dateSliderUtils';
import { TimeLabels } from './TimeLabels';
import { Spacer } from '../Spacer';
import { useRAFDFn } from '../../hooks/useRAFDFn';

const DEFAULT_SCALE_CONFIG = {
  gap: 36,
  width: { short: 1, medium: 2, long: 2 },
  height: { short: 8, medium: 16, long: 64 },
} as const;

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

    const scheduleUpdateDimensions = useRAFDFn(updateDimensions);

    useResizeObserver(sliderRef || { current: null }, scheduleUpdateDimensions);

    const dragBounds = useMemo(
      () => ({
        left: Math.min(0, dimensions.parent - dimensions.slider),
        right: 0,
      }),
      [dimensions.parent, dimensions.slider],
    );

    const {
      dragHandlers,
      isDragging: isContainerDragging,
      resetPosition,
    } = useDrag({
      targetRef: scrollable ? sliderRef : undefined,
      initialPosition: { x: 0, y: 0 },
      constrainToAxis: 'x',
      bounds: dragBounds,
      onDragEnd: handleDragComplete,
      onDragStarted: () => setDragStarted(true),
    });

    const resetPositionRef = useRef(resetPosition);
    resetPositionRef.current = resetPosition;

    const handleTimeUnitChange = useCallback((unit: TimeUnit) => {
      setTimeUnit(unit);
      resetPositionRef.current({ x: 0, y: 0 });
    }, []);

    const setDateTime = useCallback(
      (date: Date, target?: 'point' | 'rangeStart' | 'rangeEnd') => {
        const percentage = getPercentFromDate(convertUTCToLocalDateTime(date), startDate, endDate);

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
        const clampPercentage = clampPercent(percentage, 99.9999);
        switch (actualTarget) {
          case 'rangeStart': {
            const newStart = clamp(clampPercentage, 0, rangeEndRef.current - minGapPercent);
            setRangeStart(newStart);
            break;
          }
          case 'rangeEnd': {
            const newEnd = clamp(clampPercentage, 100, rangeStartRef.current + minGapPercent);
            setRangeEnd(newEnd);
            break;
          }
          case 'point': {
            setPointPosition(clampPercentage);
            break;
          }
        }
      },
      [
        startDate,
        endDate,
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

    const updateHandlePosition = useCallback(
      (handle: DragHandle, percentage: number) => {
        const clampedPercentage = clampPercent(percentage, 99.9999);

        switch (handle) {
          case 'start': {
            const newStart = Math.max(
              0,
              Math.min(clampedPercentage, rangeEndRef.current - minGapPercent),
            );
            setRangeStart(newStart);
            break;
          }
          case 'end': {
            const newEnd = Math.min(
              clampedPercentage,
              Math.max(percentage, rangeStartRef.current + minGapPercent), // Use original percentage here
            );
            setRangeEnd(newEnd);
            break;
          }
          case 'point': {
            setPointPosition(clampedPercentage);
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

    // Event handlers
    const handleMouseDown = useCallback(
      (handle: DragHandle) => (e: React.MouseEvent) => {
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
        requestAnimationFrame(() => {
          const percentage = getPercentageFromMouseEvent(e, trackRef);
          updateHandlePosition(isDragging, percentage);
        });
      },
      [isDragging, updateHandlePosition],
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

        const percentage = getPercentageFromMouseEvent(e, trackRef);

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
        viewMode,
        handleRangeClick,
        updateHandlePosition,
        requestHandleFocus,
        findClosestHandle,
      ],
    );

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
            newPercentage = 99.9999;
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
      const selection = createSelectionResult(
        rangeStart,
        startDate,
        endDate,
        rangeEnd,
        pointPosition,
        viewMode,
      );
      debouncedOnChange(selection);
    }, [debouncedOnChange, endDate, pointPosition, rangeEnd, rangeStart, startDate, viewMode]);

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
          <Spacer height={40} />
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
                  timeUnit={timeUnit}
                  startDate={startDate}
                  endDate={endDate}
                  onDragging={!!isDragging}
                />
                <TimeLabels
                  timeLabels={timeLabels}
                  scales={scales}
                  trackWidth={trackWidth}
                  timeUnit={timeUnit}
                />
                <RenderSliderHandle
                  viewMode={viewMode}
                  rangeStart={rangeStart}
                  rangeEnd={rangeEnd}
                  pointPosition={pointPosition}
                  startDate={startDate}
                  endDate={endDate}
                  timeUnit={timeUnit}
                  isDragging={isDragging}
                  rangeHandleIcon={rangeHandleIcon}
                  pointHandleIcon={pointHandleIcon}
                  startHandleRef={startHandleRef}
                  endHandleRef={endHandleRef}
                  pointHandleRef={pointHandleRef}
                  onHandleFocus={handleHandleFocus}
                  onMouseDown={handleMouseDown}
                  onKeyDown={handleHandleKeyDown}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col">
          <Spacer height={40} />
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
  },
);

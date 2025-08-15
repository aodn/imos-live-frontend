import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  useImperativeHandle,
  memo,
} from 'react';
import { checkDateDuration, clampPercent, clamp, toLocalDate, cn, debounce } from '@/utils';
import { useDrag, useElementSize, useResizeObserver, useRAFDFn } from '@/hooks';
import { SliderProps, DragHandle, SelectionResult, TimeUnit } from './type';
import { useDragState, useFocusManagement, usePositionState, useEventHanlders } from './hooks';
import {
  getPeriodTimeScales,
  generateScalesWithInfo,
  generateTrackWidth,
  generateTimeLabelsWithPositions,
  getPercentFromDate,
  createSelectionResult,
} from './utils';
import {
  TimeLabels,
  RenderSliderHandle,
  SliderTrack,
  TimeUnitSelection,
  Spacer,
} from './components';

const DEFAULT_SCALE_CONFIG = {
  gap: 36,
  width: { short: 1, medium: 1, long: 1 },
  height: { short: 8, medium: 16, long: 64 },
} as const;

export const DateSlider = memo(
  ({
    viewMode,
    startDate: propStartDate,
    endDate: propEndDate,
    initialTimeUnit,
    initialRange: propInitialRange,
    initialPoint: propInitialPoint,
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
    pointLabelPersistent,
    isTimeLabelPerDay = false,
    withEndLabel = true,
    freeSelectionOnTrackClick = false,
  }: SliderProps) => {
    const [dimensions, setDimensions] = useState({ parent: 0, slider: 0 });
    const [timeUnit, setTimeUnit] = useState<TimeUnit>(initialTimeUnit);

    const startDate = useMemo(() => toLocalDate(propStartDate), [propStartDate]);
    const endDate = useMemo(() => toLocalDate(propEndDate), [propEndDate]);
    const initialPoint = useMemo(() => {
      if (!propInitialPoint) return undefined;
      return toLocalDate(propInitialPoint);
    }, [propInitialPoint]);
    const initialRange = useMemo(() => {
      if (!propInitialRange) return undefined;
      return {
        start: toLocalDate(propInitialRange?.start),
        end: toLocalDate(propInitialRange?.end),
      };
    }, [propInitialRange]);
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

    const {
      ref: sliderContainerRef,
      size: { width: sliderContainerWidth },
    } = useElementSize<HTMLDivElement>();

    const sliderRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);

    const { scales, numberOfScales } = useMemo(
      () => generateScalesWithInfo(startDate, endDate, timeUnit, totalScaleUnits),
      [endDate, startDate, timeUnit, totalScaleUnits],
    );

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
      () => generateTimeLabelsWithPositions(startDate, endDate, timeUnit, isTimeLabelPerDay),
      [startDate, endDate, timeUnit, isTimeLabelPerDay],
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
        const percentage = getPercentFromDate(toLocalDate(date), startDate, endDate);

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

    const {
      handleMouseDown,
      handleTouchStart,
      handleTrackClick,
      handleTrackTouch,
      handleHandleKeyDown,
    } = useEventHanlders(
      rangeStartRef,
      rangeEndRef,
      pointPositionRef,
      viewMode,
      updateHandlePosition,
      requestHandleFocus,
      setIsDragging,
      setDragStarted,
      setLastInteractionType,
      isDragging,
      trackRef,
      handleDragComplete,
      sliderRef,
      dragStarted,
      isContainerDragging,
      totalScaleUnits,
      freeSelectionOnTrackClick,
    );

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
                  onTrackTouch={handleTrackTouch}
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
                  isTimeLabelPerDay={isTimeLabelPerDay}
                  withEndLabel={withEndLabel}
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
                  onTouchStart={handleTouchStart}
                  onKeyDown={handleHandleKeyDown}
                  pointLabelPersistent={pointLabelPersistent}
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

DateSlider.displayName = 'DateSlider';

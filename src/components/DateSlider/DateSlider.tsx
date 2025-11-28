import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  useImperativeHandle,
  memo,
} from 'react';
import { checkDateDuration, clampPercent, clamp, cn, debounce } from '@/utils';
import { useDrag, useElementSize, useResizeObserver, useRAFDFn } from '@/hooks';
import { SliderProps, DragHandle, SelectionResult, TimeUnit } from './type';
import {
  useHandlerDragState as useHandleDragState,
  useFocusManagement,
  usePositionState,
  useEventHandlers,
  useInitialAutoScrollPosition,
} from './hooks';
import {
  getTotalScales,
  generateScalesWithInfo,
  generateTrackWidth,
  generateTimeLabelsWithPositions,
  createSelectionResult,
  getPercentFromDate,
} from './utils';
import {
  TimeLabels,
  RenderSliderHandle,
  SliderTrack,
  TimeUnitSelection,
  TimeDisplay,
} from './components';
import {
  DEFAULT_SCALE_CONFIG,
  LAYOUT,
  PERCENTAGE,
  DEFAULTS,
  ACCESSIBILITY,
  TIMING,
} from './constants';

export const DateSlider = memo(
  ({
    viewMode,
    startDate: propStartDate,
    endDate: propEndDate,
    initialTimeUnit,
    initialRange: propInitialRange,
    initialPoint: propInitialPoint,
    granularity = 'day',
    wrapperClassName,
    trackActiveClassName,
    trackBaseClassName,
    sliderClassName,
    timeUnitSelectionClassName,
    timeDisplayCLassName,
    pointHandleIcon,
    rangeHandleIcon,
    scrollable = true,
    isTrackFixedWidth = false,
    minGapScaleUnits = DEFAULTS.MIN_GAP_SCALE_UNITS,
    onChange,
    trackPaddingX = LAYOUT.TRACK_PADDING_X,
    scaleUnitConfig = DEFAULT_SCALE_CONFIG,
    sliderWidth,
    sliderHeight,
    imperativeHandleRef,
    withEndLabel = true,
    timeUnitSelectionEnabled = true,
    freeSelectionOnTrackClick = false,
    timeDisplayEnabled = false,
  }: SliderProps) => {
    const [dimensions, setDimensions] = useState({ parent: 0, slider: 0 });
    const [timeUnit, setTimeUnit] = useState<TimeUnit>(initialTimeUnit);

    /**
     * All prop dates are expected to be UTC Date objects
     * No conversion needed - consumers use toUTCDate()  helpers
     */
    const startDate = propStartDate;
    const endDate = propEndDate;
    const initialPoint = propInitialPoint;
    const initialRange = propInitialRange;

    const totalScaleUnits = useMemo(
      () => getTotalScales(startDate, endDate, timeUnit),
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

    const {
      isHandleDragging,
      handleDragStarted,
      setIsHandleDragging,
      setHandleDragStarted,
      handleDragComplete,
    } = useHandleDragState();

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

    //TODO: could refactor this to always generate full labels regardless of time unit. But later,
    // in formatForDisplay to decide what to display and how display format.
    //day unit, generate all labels per day. month unit, generate per month. year unit, per year.
    const timeLabels = useMemo(
      () => generateTimeLabelsWithPositions(startDate, endDate, timeUnit),
      [startDate, endDate, timeUnit],
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

    const autoScrollToVisibleAreaEnabled = useRef(false);

    const {
      position: sliderPosition,
      dragHandlers,
      isDragging: isSliderDragging,
      resetPosition,
    } = useDrag({
      targetRef: scrollable ? sliderRef : undefined,
      initialPosition: { x: 0, y: 0 },
      constrainToAxis: 'x',
      bounds: dragBounds,
      //inform slider is being dragged to prevent handle interactions
      onDragEnd: handleDragComplete,
      onDragStarted: () => {
        setHandleDragStarted(true);
        autoScrollToVisibleAreaEnabled.current = false;
      },
    });

    // auto scroll slider to keep point handle in view when point date changes by moving point handle
    if (
      !isSliderDragging &&
      !isHandleDragging &&
      pointHandleRef.current &&
      sliderContainerRef.current &&
      autoScrollToVisibleAreaEnabled.current
    ) {
      const pointHandleRect = pointHandleRef.current.getBoundingClientRect();
      const containerRect = sliderContainerRef.current.getBoundingClientRect();

      const distanceFromRightEdge = containerRect.right - pointHandleRect.right;
      const distanceFromLeftEdge = pointHandleRect.left - containerRect.left;

      if (distanceFromRightEdge < 0) {
        const newX = sliderPosition.x - dimensions.parent / 2;
        const clampedX = Math.max(newX, dragBounds.left);
        resetPosition({ x: clampedX, y: 0 });
        autoScrollToVisibleAreaEnabled.current = false;
      } else if (distanceFromLeftEdge < 0) {
        const newX = sliderPosition.x + dimensions.parent / 2;
        const clampedX = Math.min(newX, dragBounds.right);
        resetPosition({ x: clampedX, y: 0 });
        autoScrollToVisibleAreaEnabled.current = false;
      }
    }

    useInitialAutoScrollPosition({
      scrollable,
      dimensions,
      viewMode,
      pointPosition,
      rangeStart,
      rangeEnd,
      resetPosition,
    });

    const handleTimeUnitChange = useCallback(
      (unit: TimeUnit) => {
        setTimeUnit(unit);
        resetPosition({ x: 0, y: 0 });
      },
      [resetPosition],
    );

    /**
     * Sets the date time for the specified target handle
     *
     * Accepts UTC Date objects only. Consumers should use toUTCDate()
     * to convert their data before passing to this function.
     *
     * @param date - UTC Date object
     * @param target - The target handle ('point', 'rangeStart', 'rangeEnd')
     */
    const setDateTime = useCallback(
      (date: Date, target?: 'point' | 'rangeStart' | 'rangeEnd') => {
        // Date is expected to be UTC, no conversion needed
        const percentage = getPercentFromDate(date, startDate, endDate);

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
        const clampPercentage = clampPercent(percentage, PERCENTAGE.MAX);

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
        autoScrollToVisibleAreaEnabled.current = true;
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
        const clampedPercentage = clampPercent(percentage, PERCENTAGE.MAX);

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
    } = useEventHandlers(
      startDate,
      endDate,
      timeUnit,
      rangeStartRef,
      rangeEndRef,
      pointPositionRef,
      viewMode,
      updateHandlePosition,
      requestHandleFocus,
      setIsHandleDragging,
      setHandleDragStarted,
      setLastInteractionType,
      isHandleDragging,
      trackRef,
      handleDragComplete,
      sliderRef,
      handleDragStarted,
      isSliderDragging,
      totalScaleUnits,
      freeSelectionOnTrackClick,
    );

    const onChangeRef = useRef(onChange);
    useEffect(() => {
      onChangeRef.current = onChange;
    }, [onChange]);

    const debouncedOnChange = useMemo(
      () =>
        debounce(
          (selection: SelectionResult) => onChangeRef.current(selection),
          TIMING.DEBOUNCE_DELAY,
        ),
      [],
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
            ? { height: sliderHeight ?? LAYOUT.DEFAULT_SLIDER_HEIGHT, width: sliderWidth }
            : { height: sliderHeight ?? LAYOUT.DEFAULT_SLIDER_HEIGHT }
        }
        role="group"
        aria-label={ACCESSIBILITY.SLIDER_ARIA_LABEL}
      >
        {timeDisplayEnabled && (
          <TimeDisplay
            className={cn('pointer-events-auto', timeDisplayCLassName)}
            startDate={startDate}
            endDate={endDate}
            position={pointPosition}
            granularity={granularity}
            setDateTime={setDateTime}
          />
        )}
        <div ref={sliderContainerRef} className="overflow-hidden h-full flex-1 rounded-2xl">
          <div
            className="h-full"
            style={isTrackFixedWidth ? { width: '100%' } : { width: trackWidth }}
            ref={sliderRef}
            {...dragHandlers}
          >
            <div
              style={{ paddingLeft: trackPaddingX, paddingRight: trackPaddingX }}
              className={cn('h-full w-full pointer-events-auto', sliderClassName)}
            >
              <div className="relative h-full w-full" ref={trackRef}>
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
                  aria-label={ACCESSIBILITY.TRACK_ARIA_LABEL}
                  startDate={startDate}
                  endDate={endDate}
                  onDragging={!!isHandleDragging}
                  startHandleRef={startHandleRef}
                  endHandleRef={endHandleRef}
                  pointHandleRef={pointHandleRef}
                />
                <TimeLabels
                  timeLabels={timeLabels}
                  scales={scales}
                  trackWidth={trackWidth}
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
                  isDragging={isHandleDragging}
                  rangeHandleIcon={rangeHandleIcon}
                  pointHandleIcon={pointHandleIcon}
                  startHandleRef={startHandleRef}
                  endHandleRef={endHandleRef}
                  pointHandleRef={pointHandleRef}
                  onHandleFocus={handleHandleFocus}
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleTouchStart}
                  onKeyDown={handleHandleKeyDown}
                />
              </div>
            </div>
          </div>
        </div>

        {timeUnitSelectionEnabled && (
          <TimeUnitSelection
            className={cn('pointer-events-auto h-full', timeUnitSelectionClassName)}
            isMonthValid={checkDateDuration(startDate, endDate).moreThanOneMonth}
            isYearValid={checkDateDuration(startDate, endDate).moreThanOneYear}
            onChange={handleTimeUnitChange}
            initialTimeUnit={initialTimeUnit}
          />
        )}
      </div>
    );
  },
);

DateSlider.displayName = 'DateSlider';

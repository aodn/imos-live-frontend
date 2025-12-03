import {
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

import { SliderTrack } from './SliderTrack';
import { TimeDisplay } from './TimeDisplay';
import { TimeUnitLabels } from './TimeUnitLabels';
import { TimeUnitSelection } from './TimeUnitSelection';
import { useElementSize, useRAFDFn, useResizeObserver, useDrag } from '@/hooks';
import { clampPercent, clamp, debounce, cn, checkDateDuration } from '@/utils';
import {
  LAYOUT,
  DEFAULTS,
  DEFAULT_SCALE_CONFIG,
  PERCENTAGE,
  TIMING,
  ACCESSIBILITY,
} from '../constants';
import {
  usePositionState,
  useFocusManagement,
  useHandleDragState,
  useHandleVisible,
  useInitialAutoScrollPosition,
  useEventHandlers,
} from '../hooks';
import { SliderProps, Dimension, TimeUnit, DragHandle, SelectionResult } from '../type';
import {
  getTotalScales,
  generateScalesWithInfo,
  generateTrackWidth,
  generateTimeLabelsWithPositions,
  getPercentFromDate,
  createSelectionResult,
} from '../utils';
import { RenderSliderHandle } from './SliderHandle';

export const DateSlider = memo(
  ({
    // Core props
    mode: viewMode,
    value,
    min: propStartDate,
    max: propEndDate,
    initialTimeUnit,
    onChange,
    renderProps,
    // Grouped configs
    classNames,
    icons,
    behavior,
    layout,
    // Advanced
    granularity = 'day',
    imperativeRef: imperativeHandleRef,
  }: SliderProps) => {
    // Extract icon config with defaults - safely handle discriminated union
    const pointHandleIcon = icons && 'point' in icons ? icons.point : undefined;
    const rangeHandleIcon =
      icons && ('rangeStart' in icons || 'rangeEnd' in icons)
        ? (icons.rangeStart ?? icons.rangeEnd)
        : undefined;

    // Extract behavior config with defaults
    const scrollable = behavior?.scrollable ?? true;
    const freeSelectionOnTrackClick = behavior?.freeSelectionOnTrackClick ?? false;
    const handleLabelPersistent = behavior?.handleLabelPersistent ?? false;
    const handleLabelDisabled = behavior?.handleLabelDisabled ?? false;

    // Extract layout config with defaults
    const sliderWidth = layout?.width;
    const sliderHeight = layout?.height;
    const trackPaddingX = layout?.trackPaddingX ?? LAYOUT.TRACK_PADDING_X;
    // if not scrollable, track is fixed with, which is 100% of slider container width.
    const isTrackFixedWidth = !scrollable;
    const withEndLabel = layout?.showEndLabel ?? true;
    const minGapScaleUnits = layout?.minGapScaleUnits ?? DEFAULTS.MIN_GAP_SCALE_UNITS;
    const scaleUnitConfig = layout?.scaleUnitConfig ?? DEFAULT_SCALE_CONFIG;
    const [dimensions, setDimensions] = useState<Dimension>({
      sliderContainerWidth: 0,
      trackContainerWidth: 0,
    });
    const [timeUnit, setTimeUnit] = useState<TimeUnit>(initialTimeUnit);

    /**
     * All prop dates are expected to be UTC Date objects
     * No conversion needed - consumers use toUTCDate()  helpers
     */
    const startDate = propStartDate;
    const endDate = propEndDate;

    // Extract initial values from the unified value prop (or use defaults based on mode)
    const propInitialPoint =
      value && 'point' in value ? value.point : viewMode === 'point' ? startDate : undefined;
    const propInitialRange =
      value && 'start' in value && 'end' in value
        ? { start: value.start, end: value.end }
        : viewMode === 'range' || viewMode === 'combined'
          ? { start: startDate, end: endDate }
          : undefined;

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

    const trackContainerRef = useRef<HTMLDivElement>(null);
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
      if (sliderContainerRef?.current && trackContainerRef.current) {
        const sliderContainerWidth = sliderContainerRef.current.getBoundingClientRect().width;
        const trackContainerWidth = trackContainerRef.current.getBoundingClientRect().width;
        setDimensions({ sliderContainerWidth, trackContainerWidth });
      }
    }, [sliderContainerRef]);

    const scheduleUpdateDimensions = useRAFDFn(updateDimensions);

    useResizeObserver(trackContainerRef || { current: null }, scheduleUpdateDimensions);

    const dragBounds = useMemo(
      () => ({
        left: Math.min(0, dimensions.sliderContainerWidth - dimensions.trackContainerWidth),
        right: 0,
      }),
      [dimensions.sliderContainerWidth, dimensions.trackContainerWidth],
    );

    const autoScrollToVisibleAreaEnabled = useRef(false);

    const {
      position: sliderPosition,
      dragHandlers,
      isDragging: isSliderDragging,
      resetPosition,
    } = useDrag({
      targetRef: scrollable ? trackContainerRef : undefined,
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

    //TODO: 2. date label and time unit label format should be customizable.
    //TODO: 4. add tests.
    //TODO: 5. improve performance, avoid too many re-renders when dragging.

    useHandleVisible({
      pointHandleRef,
      isHandleDragging,
      sliderContainerRef,
      dragBounds,
      sliderPosition,
      resetPosition,
      pointPosition,
      isSliderDragging,
      autoScrollToVisibleAreaEnabled,
    });

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
      (date: Date, target?: DragHandle) => {
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
              actualTarget = distanceToStart < distanceToEnd ? 'start' : 'end';
              break;
            }
            case 'combined':
              actualTarget = 'point';
              break;
          }
        }
        const clampPercentage = clampPercent(percentage, PERCENTAGE.MAX);

        switch (actualTarget) {
          case 'start': {
            const newStart = clamp(clampPercentage, 0, rangeEndRef.current - minGapPercent);
            setRangeStart(newStart);
            break;
          }
          case 'end': {
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
      trackContainerRef,
      handleDragStarted,
      isSliderDragging,
      totalScaleUnits,
      freeSelectionOnTrackClick,
      autoScrollToVisibleAreaEnabled,
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
      // Date Slider wrapper
      <div
        className={cn('flex', classNames?.wrapper)}
        style={
          sliderWidth === 'fill'
            ? {
                height: sliderHeight ?? LAYOUT.DEFAULT_SLIDER_HEIGHT,
                width: '100%',
                minWidth: LAYOUT.MIN_SLIDER_WIDTH,
              }
            : {
                height: sliderHeight ?? LAYOUT.DEFAULT_SLIDER_HEIGHT,
                width: sliderWidth,
                minWidth: LAYOUT.MIN_SLIDER_WIDTH,
              }
        }
        role="group"
        aria-label={ACCESSIBILITY.SLIDER_ARIA_LABEL}
      >
        {/*
          Layout Architecture:
          - DateSlider wrapper width = TimeDisplay + SliderContainer + TimeUnitSelection (flex layout)
          - SliderContainer is the scrollable viewport (flex-1)
          - Track is the actual slider with scales, contained in SliderContainer

          Width Modes:
          1. 'fill' mode: Sets width: 100%, fills parent container. DateSlider wrapper width same as parent, SliderContainer width is flex-1, fill remaining width besides
          TimeUnitSelection and TimeDisplay. 
          2. Specified width: Sets explicit width in pixels. DateSlider wrapper width is specified width, SliderContainer width is flex-1, fill remaining width besides
          TimeUnitSelection and TimeDisplay. 
          3. Undefined: Uses flex sizing without width constraint. DateSlider wrapper width will fit content, largest to fill its parent div or screen. SliderContainer 
          width is flex-1, fill remaining width besides TimeUnitSelection and TimeDisplay. 

          Track Behavior:
          - Scrollable (default): Track width = calculated from scales, enables horizontal scroll if needed
          - Fixed: Track width = 100% of SliderContainer, no scrolling
        */}

        {/* Time display and date selection operation */}
        {renderProps?.renderTimeDisplay && (
          <TimeDisplay
            startDate={startDate}
            endDate={endDate}
            position={pointPosition}
            granularity={granularity}
            setDateTime={setDateTime}
            renderTimeDisplay={renderProps?.renderTimeDisplay}
          />
        )}

        {/* Date slider container */}
        <div
          ref={sliderContainerRef}
          className="overflow-hidden flex-1 rounded-2xl"
          style={{ height: '100%' }}
        >
          {/* Track width, this trackContainerRef div width = track width + 2*trackPaddingX */}
          <div
            // if track width is fixed, it will fill the width of slider container, it cannot be scrolled.
            style={
              isTrackFixedWidth
                ? { width: '100%', height: '100%' }
                : { width: trackWidth, height: '100%' }
            }
            ref={trackContainerRef}
            {...dragHandlers}
          >
            <div
              style={{
                paddingLeft: trackPaddingX,
                paddingRight: trackPaddingX,
                height: '100%',
                width: '100%',
              }}
              className={cn('pointer-events-auto', classNames?.slider)}
            >
              <div className="relative" style={{ height: '100%', width: '100%' }} ref={trackRef}>
                <SliderTrack
                  mode={viewMode}
                  pointPosition={pointPosition}
                  rangeStart={rangeStart}
                  rangeEnd={rangeEnd}
                  onTrackClick={handleTrackClick}
                  onTrackTouch={handleTrackTouch}
                  scales={scales}
                  scaleUnitConfig={scaleUnitConfig}
                  trackRef={trackRef}
                  aria-label={ACCESSIBILITY.TRACK_ARIA_LABEL}
                  startDate={startDate}
                  endDate={endDate}
                  onDragging={!!isHandleDragging}
                  startHandleRef={startHandleRef}
                  endHandleRef={endHandleRef}
                  pointHandleRef={pointHandleRef}
                  handleLabelPersistent={handleLabelPersistent}
                  handleLabelDisabled={handleLabelDisabled}
                  classNames={classNames}
                  renderDateLabel={renderProps?.renderDateLabel}
                />
                {/* TODO: move TimeUnitLabels to SliderTrack?*/}
                <TimeUnitLabels
                  timeLabels={timeLabels}
                  scales={scales}
                  trackWidth={trackWidth}
                  withEndLabel={withEndLabel}
                  classNames={classNames}
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
                  isSliderDragging={isSliderDragging}
                  handleLabelPersistent={handleLabelPersistent}
                  handleLabelDisabled={handleLabelDisabled}
                  classNames={classNames}
                  renderDateLabel={renderProps?.renderDateLabel}
                  sliderContainerRef={sliderContainerRef}
                />
              </div>
            </div>
          </div>
        </div>

        {/* toggle time unit */}
        {renderProps?.renderTimeUnitSelection && (
          <TimeUnitSelection
            isMonthValid={checkDateDuration(startDate, endDate).moreThanOneMonth}
            isYearValid={checkDateDuration(startDate, endDate).moreThanOneYear}
            onChange={handleTimeUnitChange}
            initialTimeUnit={initialTimeUnit}
            renderTimeUnitSelection={renderProps.renderTimeUnitSelection}
          />
        )}
      </div>
    );
  },
);

DateSlider.displayName = 'DateSlider';

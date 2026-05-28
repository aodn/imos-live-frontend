import { memo, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { ACCESSIBILITY } from '../constants';
import {
  useDrag,
  useViewportSize,
  useSliderConfig,
  useScales,
  usePositionState,
  useFocusManagement,
  useHandleDragState,
  useSliderDimesions,
  useSliderVirtualization,
  useHandleAutoScrollToVisible,
  useInitialAutoScrollPosition,
  useHandlePosition,
  useEventHandlers,
  useOnChangeNotifier,
  useSliderRePosition,
} from '../hooks';
import type { SliderProps, TimeUnit, DragHandle } from '../type';
import { cn, checkDateDuration, generateTrackWidth } from '../utils';
import { DateSliderWrapper } from './DateSliderWrapper';
import {
  customSelectionPanelRenderer,
  customDateLabelRenderer,
  customTimeUnitSelectionRenderer,
} from './defaultRender';
import { SelectionPanel } from './SelectionPanel';
import { RenderSliderHandle } from './SliderHandle';
import { SliderTrack } from './SliderTrack';
import { TimeUnitSelection } from './TimeUnitSelection';

//TODO: 2. testing.
//TODO: 3. beautify stories.
//TODO: 4. snap to unit.

export const DateSlider = memo(function DateSlider({
  mode: viewMode,
  min: propStartDate,
  max: propEndDate,
  initialTimeUnit,
  onChange,
  renderProps,
  classNames,
  imperativeRef,
  ...restProps
}: SliderProps) {
  const { isSmallScreen } = useViewportSize();

  const { locale, scaleTypeResolver, initialValues, icons, layout, behavior, dateFormat } =
    useSliderConfig(restProps as SliderProps, isSmallScreen);

  const [timeUnit, setTimeUnit] = useState<TimeUnit>(initialTimeUnit);

  const startDate = propStartDate;
  const endDate = propEndDate;

  const { allScales, numberOfScales, totalScaleUnits } = useScales({
    startDate,
    endDate,
    timeUnit,
    scaleTypeResolver,
  });

  const minGapPercent = useMemo(
    () => (1 / totalScaleUnits) * 100 * layout.minGapScaleUnits,
    [layout.minGapScaleUnits, totalScaleUnits],
  );

  const {
    rangeStartPosition,
    rangeEndPosition,
    pointPosition,
    setRangeStartPosition,
    setRangeEndPosition,
    setPointPosition, //this is the one that actually select date time.
    rangeStartRef,
    rangeEndRef,
    pointPositionRef,
  } = usePositionState(
    initialValues.range,
    initialValues.point,
    startDate,
    timeUnit,
    totalScaleUnits,
  );

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

  const trackContainerRef = useRef<HTMLDivElement>(null);
  const sliderContainerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const { sliderContainerWidth, trackContainerWidth } = useSliderDimesions(
    sliderContainerRef,
    trackContainerRef,
  );

  const previousSliderContainerWidth = useRef(sliderContainerWidth);

  const safeGap = useMemo(
    () =>
      (sliderContainerWidth -
        (numberOfScales.long * layout.scaleUnitConfig.width.long +
          numberOfScales.medium * layout.scaleUnitConfig.width.medium +
          numberOfScales.short * layout.scaleUnitConfig.width.short)) /
      totalScaleUnits,
    [
      layout.scaleUnitConfig.width.long,
      layout.scaleUnitConfig.width.medium,
      layout.scaleUnitConfig.width.short,
      numberOfScales.long,
      numberOfScales.medium,
      numberOfScales.short,
      sliderContainerWidth,
      totalScaleUnits,
    ],
  );

  const safeScaleUnitConfig = useMemo(
    () => ({
      ...layout.scaleUnitConfig,
      gap: Math.max(safeGap, layout.scaleUnitConfig.gap ?? 0),
    }),
    [layout.scaleUnitConfig, safeGap],
  );

  const trackWidth = useMemo(() => {
    return generateTrackWidth(totalScaleUnits, numberOfScales, safeScaleUnitConfig);
  }, [totalScaleUnits, numberOfScales, safeScaleUnitConfig]);

  const dragBounds = useMemo(
    () => ({
      left: Math.min(0, sliderContainerWidth - trackContainerWidth),
      right: 0,
    }),
    [sliderContainerWidth, trackContainerWidth],
  );

  const autoScrollToVisibleAreaRef = useRef(false);

  const {
    position: sliderPosition,
    dragHandlers,
    isDragging: isSliderDragging,
    resetPosition,
  } = useDrag({
    targetRef: behavior.scrollable ? trackContainerRef : undefined,
    initialPosition: { x: 0, y: 0 },
    constrainToAxis: 'x',
    bounds: dragBounds,
    //inform slider is being dragged to prevent handle interactions
    onDragEnd: handleDragComplete,
    onDragStarted: () => {
      setHandleDragStarted(true);
      autoScrollToVisibleAreaRef.current = false;
    },
  });

  useSliderRePosition({
    sliderContainerWidth,
    sliderPosition,
    resetPosition,
    autoScrollToVisibleAreaRef,
    previousSliderContainerWidth,
  });

  const { scales } = useSliderVirtualization({
    behavior,
    trackWidth,
    sliderContainerWidth,
    sliderPositionX: sliderPosition.x,
    allScales,
  });

  useHandleAutoScrollToVisible({
    pointHandleRef,
    isHandleDragging,
    sliderContainerRef,
    dragBounds,
    sliderPosition,
    resetPosition,
    pointPosition,
    isSliderDragging,
    autoScrollToVisibleAreaRef,
    sliderAutoScrollToPointHandleVisibleEnabled:
      behavior.sliderAutoScrollToPointHandleVisibleEnabled,
  });

  useInitialAutoScrollPosition({
    scrollable: behavior.scrollable,
    sliderContainerWidth,
    trackContainerWidth,
    viewMode,
    pointPosition,
    rangeStartPosition,
    rangeEndPosition,
    resetPosition,
  });

  const handleTimeUnitChange = useCallback(
    (unit: TimeUnit) => {
      setTimeUnit(unit);
      resetPosition({ x: 0, y: 0 });
    },
    [resetPosition],
  );

  const { setDateTime, moveByStep, updateHandlePosition } = useHandlePosition({
    minGapPercent,
    startDate,
    endDate,
    viewMode,
    setRangeStartPosition,
    setRangeEndPosition,
    setPointPosition,
    rangeStartRef,
    rangeEndRef,
    pointPositionRef,
    autoScrollToVisibleAreaRef,
    step: behavior.step,
    timeUnit,
  });

  useImperativeHandle(
    imperativeRef,
    () => ({
      setDateTime,
      moveByStep,
      focusHandle: (handleType: DragHandle) => requestHandleFocus(handleType, 'keyboard'),
    }),
    [setDateTime, moveByStep, requestHandleFocus],
  );

  const {
    handleMouseDown,
    handleTouchStart,
    handleTrackClick,
    handleTrackTouch,
    handleHandleKeyDown,
  } = useEventHandlers({
    dates: { startDate, endDate },
    timeUnit,
    viewMode,
    positions: { rangeStartRef, rangeEndRef, pointPositionRef },
    handlers: {
      updateHandlePosition,
      moveByStep: moveByStep,
      requestHandleFocus,
      handleDragComplete,
    },
    dragState: {
      isDragging: isHandleDragging,
      handleDragStarted,
      isContainerDragging: isSliderDragging,
    },
    setters: {
      setIsDragging: setIsHandleDragging,
      setDragStarted: setHandleDragStarted,
      setLastInteractionType,
    },
    refs: { trackRef, sliderRef: trackContainerRef, autoScrollToVisibleAreaRef },
    config: {
      totalScaleUnits,
      freeSelectionOnTrackClick: behavior.freeSelectionOnTrackClick,
    },
  });

  useOnChangeNotifier({
    onChange,
    rangeStartPosition,
    rangeEndPosition,
    pointPosition,
    startDate,
    endDate,
    viewMode,
  });

  return (
    <DateSliderWrapper classNames={classNames} layout={layout}>
      {/* Time display and date selection operation */}
      {layout.selectionPanelEnabled && (
        <SelectionPanel
          startDate={startDate}
          endDate={endDate}
          position={pointPosition}
          moveByStep={moveByStep}
          renderSelectionPanel={renderProps?.renderSelectionPanel || customSelectionPanelRenderer}
          dateFormat={dateFormat}
          locale={locale}
          timeUnit={timeUnit}
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
            layout.isTrackFixedWidth
              ? { width: '100%', height: '100%' }
              : { width: trackWidth, height: '100%' }
          }
          ref={trackContainerRef}
          {...dragHandlers}
        >
          <div
            style={{
              paddingLeft: layout.trackPaddingX,
              paddingRight: layout.trackPaddingX,
              height: '100%',
              width: '100%',
            }}
            className={cn('pointer-events-auto', classNames?.slider)}
          >
            <div className="relative" style={{ height: '100%', width: '100%' }}>
              <SliderTrack
                mode={viewMode}
                pointPosition={pointPosition}
                rangeStartPosition={rangeStartPosition}
                rangeEndPosition={rangeEndPosition}
                onTrackClick={handleTrackClick}
                onTrackTouch={handleTrackTouch}
                scales={scales}
                scaleUnitConfig={layout.scaleUnitConfig}
                trackRef={trackRef}
                aria-label={ACCESSIBILITY.TRACK_ARIA_LABEL}
                startDate={startDate}
                endDate={endDate}
                onDragging={!!isHandleDragging}
                startHandleRef={startHandleRef}
                endHandleRef={endHandleRef}
                pointHandleRef={pointHandleRef}
                trackHoverDateLabelDisabled={behavior.trackHoverDateLabelDisabled}
                trackHoverCursorLineDisabled={behavior.trackHoverCursorLineDisabled}
                classNames={classNames}
                renderDateLabel={
                  layout.dateLabelEnabled
                    ? renderProps?.renderDateLabel || customDateLabelRenderer
                    : undefined
                }
                trackWidth={trackWidth}
                withEndLabel={layout.withEndLabel}
                dateLabelDistanceOverHandle={layout.dateLabelDistance}
                dateFormat={dateFormat}
                locale={locale}
                timeUnit={timeUnit}
              />

              <RenderSliderHandle
                viewMode={viewMode}
                rangeStartPosition={rangeStartPosition}
                rangeEndPosition={rangeEndPosition}
                pointPosition={pointPosition}
                startDate={startDate}
                endDate={endDate}
                timeUnit={timeUnit}
                isDragging={isHandleDragging}
                rangeHandleIcon={icons.rangeHandleIcon}
                pointHandleIcon={icons.pointHandleIcon}
                startHandleRef={startHandleRef}
                endHandleRef={endHandleRef}
                pointHandleRef={pointHandleRef}
                onHandleFocus={handleHandleFocus}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                onKeyDown={handleHandleKeyDown}
                isSliderDragging={isSliderDragging}
                pointHandleLabelPersistent={behavior.pointHandleLabelPersistent}
                pointHandleLabelDisabled={behavior.pointHandleLabelDisabled}
                rangeHandleLabelPersistent={behavior.rangeHandleLabelPersistent}
                rangeHandleLabelDisabled={behavior.rangeHandleLabelDisabled}
                classNames={classNames}
                renderDateLabel={
                  layout.dateLabelEnabled
                    ? renderProps?.renderDateLabel || customDateLabelRenderer
                    : undefined
                }
                sliderContainerRef={sliderContainerRef}
                dateLabelDistanceOverHandle={layout.dateLabelDistance}
                dateFormat={dateFormat}
                locale={locale}
                sliderPositionX={sliderPosition.x}
                trackWidth={trackWidth}
              />
            </div>
          </div>
        </div>
      </div>

      {/* toggle time unit */}
      {layout.timeUnitSelectionEnabled && (
        <TimeUnitSelection
          isMonthValid={checkDateDuration(startDate, endDate).moreThanOneMonth}
          isYearValid={checkDateDuration(startDate, endDate).moreThanOneYear}
          onChange={handleTimeUnitChange}
          initialTimeUnit={initialTimeUnit}
          renderTimeUnitSelection={
            renderProps?.renderTimeUnitSelection || customTimeUnitSelectionRenderer
          }
        />
      )}
    </DateSliderWrapper>
  );
});

DateSlider.displayName = 'DateSlider';

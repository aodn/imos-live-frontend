import { cn } from '@/utils';
import { useState, useCallback, useLayoutEffect, memo, useMemo } from 'react';
import { useIsScrolling } from '../hooks';
import type { SliderHandleProps, RenderSliderHandleProps } from '../type';
import { handleOutsideVisibleArea, formatDate, getDateFromPercent } from '../utils';
import { DateLabel } from './DateLabel';

export function SliderHandle({
  onDragging,
  position,
  label,
  icon,
  onMouseDown,
  onTouchStart,
  ref,
  min,
  max,
  value,
  handleType,
  onKeyDown,
  onFocus,
  isSliderDragging,
  handleLabelPersistent,
  handleLabelDisabled,
  classNames,
  renderDateLabel,
  sliderContainerRef,
  dateLabelDistanceOverHandle,
  sliderPositionX,
  trackWidth,
}: SliderHandleProps) {
  const { leftOut, rightOut } = handleOutsideVisibleArea({
    handleRef: ref,
    sliderContainerRef,
  });
  const outsideVisibleArea = leftOut || rightOut;

  const [labelPosition, setLabelPosition] = useState<{ x: number; y: number } | undefined>();
  const isScrolling = useIsScrolling(window);

  const updatePosition = useCallback(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setLabelPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - dateLabelDistanceOverHandle,
    });
  }, [ref, dateLabelDistanceOverHandle]);

  useLayoutEffect(() => {
    if (!ref.current) return;

    const handleScroll = () => {
      if (!isScrolling) updatePosition();
    };

    updatePosition();

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [
    ref,
    position,
    dateLabelDistanceOverHandle,
    sliderPositionX,
    trackWidth,
    isScrolling,
    updatePosition,
  ]);

  // Get handle-specific className
  const handleSpecificClass =
    handleType === 'point'
      ? classNames?.handlePoint
      : handleType === 'start'
        ? classNames?.handleStart
        : classNames?.handleEnd;

  const handleBaseClass = classNames?.handle || handleSpecificClass;
  const handleDraggingClass = onDragging ? classNames?.handleDragging : '';

  const isHandleVisible = !onDragging && !isSliderDragging && !outsideVisibleArea && !isScrolling;

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        'group absolute cursor-pointer z-20 transform -translate-x-1/2 hover:scale-110 touch-none top-0 bg-transparent',
        'w-fit h-fit inline-flex items-center justify-center',
        'focus-visible:outline focus-visible:outline-offset-2',
        handleBaseClass,
        handleSpecificClass,
        handleDraggingClass || (onDragging ? 'scale-110' : ''),
      )}
      style={{ left: `${position}%` }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      role="slider"
      aria-orientation="horizontal"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={label}
      aria-label={`${handleType} handle`}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
    >
      {icon}
      <DateLabel
        position={labelPosition}
        label={label}
        visible={isHandleVisible}
        immediateDisappear={isSliderDragging}
        handleLabelPersistent={handleLabelPersistent}
        handleLabelDisabled={handleLabelDisabled}
        renderDateLabel={renderDateLabel}
      />
    </button>
  );
}

export const RenderSliderHandle = memo<RenderSliderHandleProps>(function RenderSliderHandle({
  viewMode,
  rangeStartPosition,
  rangeEndPosition,
  pointPosition,
  startDate,
  endDate,
  isDragging,
  rangeHandleIcon,
  pointHandleIcon,
  startHandleRef,
  endHandleRef,
  pointHandleRef,
  onHandleFocus,
  onMouseDown,
  onTouchStart,
  onKeyDown,
  isSliderDragging,
  pointHandleLabelPersistent,
  pointHandleLabelDisabled,
  rangeHandleLabelPersistent,
  rangeHandleLabelDisabled,
  classNames,
  renderDateLabel,
  sliderContainerRef,
  dateLabelDistanceOverHandle,
  dateFormat,
  locale,
  sliderPositionX,
  trackWidth,
  timeUnit,
}) {
  const commonProps = {
    onFocus: onHandleFocus,
    min: 0,
    max: 100,
    classNames,
  };

  const startLabel = useMemo(
    () =>
      formatDate({
        date: getDateFromPercent(rangeStartPosition, startDate, endDate),
        format: dateFormat,
        locale,
        variant: 'label',
        timeUnit,
      }),
    [rangeStartPosition, startDate, endDate, dateFormat, locale, timeUnit],
  );

  const endLabel = useMemo(
    () =>
      formatDate({
        date: getDateFromPercent(rangeEndPosition, startDate, endDate),
        format: dateFormat,
        locale,
        variant: 'label',
        timeUnit,
      }),
    [rangeEndPosition, startDate, endDate, dateFormat, locale, timeUnit],
  );

  const pointLabel = useMemo(
    () =>
      formatDate({
        date: getDateFromPercent(pointPosition, startDate, endDate),
        format: dateFormat,
        locale,
        variant: 'label',
        timeUnit,
      }),
    [pointPosition, startDate, endDate, dateFormat, locale, timeUnit],
  );

  return (
    <>
      {(viewMode === 'range' || viewMode === 'combined') && (
        <>
          <SliderHandle
            viewMode={viewMode}
            ref={startHandleRef}
            {...commonProps}
            icon={rangeHandleIcon}
            onDragging={isDragging === 'start'}
            position={rangeStartPosition}
            label={startLabel}
            onMouseDown={onMouseDown('start')}
            onTouchStart={onTouchStart('start')}
            value={rangeStartPosition}
            handleType="start"
            onKeyDown={onKeyDown('start')}
            isSliderDragging={isSliderDragging}
            handleLabelPersistent={rangeHandleLabelPersistent}
            handleLabelDisabled={rangeHandleLabelDisabled}
            renderDateLabel={renderDateLabel}
            sliderContainerRef={sliderContainerRef}
            dateLabelDistanceOverHandle={dateLabelDistanceOverHandle}
            sliderPositionX={sliderPositionX}
            trackWidth={trackWidth}
          />
          <SliderHandle
            viewMode={viewMode}
            ref={endHandleRef}
            {...commonProps}
            icon={rangeHandleIcon}
            onDragging={isDragging === 'end'}
            position={rangeEndPosition}
            label={endLabel}
            onMouseDown={onMouseDown('end')}
            onTouchStart={onTouchStart('end')}
            value={rangeEndPosition}
            handleType="end"
            onKeyDown={onKeyDown('end')}
            isSliderDragging={isSliderDragging}
            handleLabelPersistent={rangeHandleLabelPersistent}
            handleLabelDisabled={rangeHandleLabelDisabled}
            renderDateLabel={renderDateLabel}
            sliderContainerRef={sliderContainerRef}
            dateLabelDistanceOverHandle={dateLabelDistanceOverHandle}
            sliderPositionX={sliderPositionX}
            trackWidth={trackWidth}
          />
        </>
      )}

      {(viewMode === 'point' || viewMode === 'combined') && (
        <SliderHandle
          viewMode={viewMode}
          ref={pointHandleRef}
          {...commonProps}
          icon={pointHandleIcon}
          onDragging={isDragging === 'point'}
          position={pointPosition}
          label={pointLabel}
          onMouseDown={onMouseDown('point')}
          onTouchStart={onTouchStart('point')}
          value={pointPosition}
          handleType="point"
          onKeyDown={onKeyDown('point')}
          isSliderDragging={isSliderDragging}
          handleLabelPersistent={pointHandleLabelPersistent}
          handleLabelDisabled={pointHandleLabelDisabled}
          renderDateLabel={renderDateLabel}
          sliderContainerRef={sliderContainerRef}
          dateLabelDistanceOverHandle={dateLabelDistanceOverHandle}
          sliderPositionX={sliderPositionX}
          trackWidth={trackWidth}
        />
      )}
    </>
  );
});

RenderSliderHandle.displayName = 'RenderSliderHandle';

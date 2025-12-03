import { memo } from 'react';
import { DateLabel } from './DateLabel';
import { cn } from '@/utils';
import { SliderHandleProps, RenderSliderHandleProps } from '../type';
import { formatForDisplay, getDateFromPercent, handleOutsideVisibleArea } from '../utils';

export const SliderHandle = ({
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
}: SliderHandleProps) => {
  const { left, right } = handleOutsideVisibleArea({
    handleRef: ref,
    sliderContainerRef,
  });

  const outsideVisibleArea = left || right;

  const generateLabelPosition = () => {
    if (!ref.current || handleType !== 'point') return;
    return {
      x: ref.current.getBoundingClientRect().left + ref.current.getBoundingClientRect().width / 2,
      y: ref.current.getBoundingClientRect().top - 32,
    };
  };

  // Get handle-specific className
  const handleSpecificClass =
    handleType === 'point'
      ? classNames?.handlePoint
      : handleType === 'start'
        ? classNames?.handleStart
        : classNames?.handleEnd;

  const handleBaseClass = classNames?.handle || handleSpecificClass;
  const handleDraggingClass = onDragging ? classNames?.handleDragging : '';

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        'group absolute cursor-pointer z-20 transform -translate-x-1/2 hover:scale-110 hover:bg-transparent active:bg-transparent touch-none top-0',
        'w-9 h-9 inline-flex items-center justify-center rounded-md',
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
      {!onDragging && !isSliderDragging && !outsideVisibleArea && handleType === 'point' && (
        <DateLabel
          position={generateLabelPosition()}
          label={label}
          immediateDisappear={isSliderDragging}
          handleLabelPersistent={handleLabelPersistent}
          handleLabelDisabled={handleLabelDisabled}
          renderDateLabel={renderDateLabel}
        />
      )}
    </button>
  );
};

export const RenderSliderHandle = memo<RenderSliderHandleProps>(
  ({
    viewMode,
    rangeStart,
    rangeEnd,
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
    handleLabelPersistent,
    handleLabelDisabled,
    classNames,
    renderDateLabel,
    sliderContainerRef,
  }) => {
    const commonProps = {
      onFocus: onHandleFocus,
      min: 0,
      max: 100,
      classNames,
    };

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
              position={rangeStart}
              label={formatForDisplay(
                getDateFromPercent(rangeStart, startDate, endDate),
                'day',
                'en-AU',
                true,
              )}
              onMouseDown={onMouseDown('start')}
              onTouchStart={onTouchStart('start')}
              value={rangeStart}
              handleType="start"
              onKeyDown={onKeyDown('start')}
              handleLabelPersistent={handleLabelPersistent}
              handleLabelDisabled={handleLabelDisabled}
              renderDateLabel={renderDateLabel}
              sliderContainerRef={sliderContainerRef}
            />
            <SliderHandle
              viewMode={viewMode}
              ref={endHandleRef}
              {...commonProps}
              icon={rangeHandleIcon}
              onDragging={isDragging === 'end'}
              position={rangeEnd}
              label={formatForDisplay(
                getDateFromPercent(rangeEnd, startDate, endDate),
                'day',
                'en-AU',
                true,
              )}
              onMouseDown={onMouseDown('end')}
              onTouchStart={onTouchStart('end')}
              value={rangeEnd}
              handleType="end"
              onKeyDown={onKeyDown('end')}
              handleLabelPersistent={handleLabelPersistent}
              handleLabelDisabled={handleLabelDisabled}
              renderDateLabel={renderDateLabel}
              sliderContainerRef={sliderContainerRef}
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
            label={formatForDisplay(
              getDateFromPercent(pointPosition, startDate, endDate),
              'day',
              'en-AU',
              true,
            )}
            onMouseDown={onMouseDown('point')}
            onTouchStart={onTouchStart('point')}
            value={pointPosition}
            handleType="point"
            onKeyDown={onKeyDown('point')}
            isSliderDragging={isSliderDragging}
            handleLabelPersistent={handleLabelPersistent}
            handleLabelDisabled={handleLabelDisabled}
            renderDateLabel={renderDateLabel}
            sliderContainerRef={sliderContainerRef}
          />
        )}
      </>
    );
  },
);

RenderSliderHandle.displayName = 'RenderSliderHandle';

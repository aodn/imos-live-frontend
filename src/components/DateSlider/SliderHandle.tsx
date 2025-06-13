import { cn } from '@/utils';
import { Button } from '../Button';
import { RenderSliderHandleProps, SliderHandleProps } from './type';
import { memo } from 'react';
import { formatDateForDisplay, getDateFromPercent } from './dateSliderUtils';

export const SliderHandle = ({
  onDragging,
  position,
  label,
  icon,
  onMouseDown,
  className,
  labelClassName,
  ref,
  min,
  max,
  value,
  handleType,
  onKeyDown,
  onFocus,
}: SliderHandleProps) => {
  return (
    <Button
      ref={ref}
      size={'icon'}
      variant={'ghost'}
      className={cn(
        'group absolute pointer-events-auto z-20 transform  -translate-x-1/2 transition-all duration-50 hover:scale-110 hover:bg-transparent active:bg-transparent focus-visible:ring-0',
        className,
        { 'scale-110': onDragging },
      )}
      style={{ left: `${position}%` }}
      onMouseDown={onMouseDown}
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
      {onDragging && (
        <div
          className={cn(
            'absolute top-0  left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap',
            labelClassName,
          )}
        >
          {label}
        </div>
      )}
      {!onDragging && (
        <div
          className={cn(
            'hidden group-hover:block absolute top-0  left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap',
            labelClassName,
          )}
        >
          {label}
        </div>
      )}
      {icon}
    </Button>
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
    timeUnit,
    isDragging,
    rangeHandleIcon,
    pointHandleIcon,
    startHandleRef,
    endHandleRef,
    pointHandleRef,
    onHandleFocus,
    onMouseDown,
    onKeyDown,
  }) => {
    const commonProps = {
      className: 'top-0',
      labelClassName: '-top-8 bg-red-600',
      onFocus: onHandleFocus,
      min: 0,
      max: 100,
    };

    return (
      <>
        {(viewMode === 'range' || viewMode === 'combined') && (
          <>
            <SliderHandle
              ref={startHandleRef}
              {...commonProps}
              icon={rangeHandleIcon}
              onDragging={isDragging === 'start'}
              position={rangeStart}
              label={formatDateForDisplay(
                getDateFromPercent(rangeStart, startDate, endDate),
                timeUnit,
              )}
              onMouseDown={onMouseDown('start')}
              value={rangeStart}
              handleType="range start"
              onKeyDown={onKeyDown('start')}
            />
            <SliderHandle
              ref={endHandleRef}
              {...commonProps}
              icon={rangeHandleIcon}
              onDragging={isDragging === 'end'}
              position={rangeEnd}
              label={formatDateForDisplay(
                getDateFromPercent(rangeEnd, startDate, endDate),
                timeUnit,
              )}
              onMouseDown={onMouseDown('end')}
              value={rangeEnd}
              handleType="range end"
              onKeyDown={onKeyDown('end')}
            />
          </>
        )}

        {(viewMode === 'point' || viewMode === 'combined') && (
          <SliderHandle
            ref={pointHandleRef}
            {...commonProps}
            icon={pointHandleIcon}
            onDragging={isDragging === 'point'}
            position={pointPosition}
            label={formatDateForDisplay(
              getDateFromPercent(pointPosition, startDate, endDate),
              timeUnit,
            )}
            onMouseDown={onMouseDown('point')}
            value={pointPosition}
            handleType="point"
            onKeyDown={onKeyDown('point')}
          />
        )}
      </>
    );
  },
);

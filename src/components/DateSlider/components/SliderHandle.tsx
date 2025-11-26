import { cn } from '@/utils';
import { Button } from '../../Button';
import { RenderSliderHandleProps, SliderHandleProps } from '../type';
import { memo } from 'react';
import { formatDateForDisplay, getDateFromPercent } from '../utils';

// Updated SliderHandleProps type to include touch event handlers
type UpdatedSliderHandleProps = SliderHandleProps & {
  onTouchStart?: (e: React.TouchEvent) => void;
  labelPersistent?: boolean;
};

export const SliderHandle = ({
  onDragging,
  position,
  label,
  icon,
  onMouseDown,
  onTouchStart,
  className,
  ref,
  min,
  max,
  value,
  handleType,
  onKeyDown,
  onFocus,
}: UpdatedSliderHandleProps) => {
  return (
    <Button
      ref={ref}
      size={'icon'}
      variant={'ghost'}
      className={cn(
        'group absolute pointer-events-auto z-20 transform  -translate-x-1/2 transition-all duration-50 hover:scale-110 hover:bg-transparent active:bg-transparent touch-none',
        'focus-visible:outline  focus-visible:outline-offset-2 focus-visible:outline-blue-500',
        'motion-reduce:transition-none',
        className,
        { 'scale-110': onDragging },
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
    </Button>
  );
};

type UpdatedRenderSliderHandleProps = RenderSliderHandleProps & {
  onTouchStart: (handle: 'start' | 'end' | 'point') => (e: React.TouchEvent) => void;
};

export const RenderSliderHandle = memo<UpdatedRenderSliderHandleProps>(
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
              viewMode={viewMode}
              ref={startHandleRef}
              {...commonProps}
              icon={rangeHandleIcon}
              onDragging={isDragging === 'start'}
              position={rangeStart}
              label={formatDateForDisplay({
                date: getDateFromPercent(rangeStart, startDate, endDate),
                fullDate: true,
              })}
              onMouseDown={onMouseDown('start')}
              onTouchStart={onTouchStart('start')}
              value={rangeStart}
              handleType="range start"
              onKeyDown={onKeyDown('start')}
            />
            <SliderHandle
              viewMode={viewMode}
              ref={endHandleRef}
              {...commonProps}
              icon={rangeHandleIcon}
              onDragging={isDragging === 'end'}
              position={rangeEnd}
              label={formatDateForDisplay({
                date: getDateFromPercent(rangeEnd, startDate, endDate),
                fullDate: true,
              })}
              onMouseDown={onMouseDown('end')}
              onTouchStart={onTouchStart('end')}
              value={rangeEnd}
              handleType="range end"
              onKeyDown={onKeyDown('end')}
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
            label={formatDateForDisplay({
              date: getDateFromPercent(pointPosition, startDate, endDate),
              fullDate: true,
            })}
            onMouseDown={onMouseDown('point')}
            onTouchStart={onTouchStart('point')}
            value={pointPosition}
            handleType="point"
            onKeyDown={onKeyDown('point')}
          />
        )}
      </>
    );
  },
);

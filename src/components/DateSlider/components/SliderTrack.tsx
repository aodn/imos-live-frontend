import { cn } from '@/utils';
import { useState, useCallback, useMemo, memo } from 'react';
import { SliderTrackProps, ScaleType } from '../type';
import { formatDateForDisplay, getDateFromPercent, getPercentageFromMouseEvent } from '../utils';

const DateLabel = memo(
  ({
    position,
    label,
    labelClassName,
  }: {
    position?: number;
    label?: string;
    labelClassName?: string;
  }) => {
    if (!position || !label) return null;

    return (
      <div
        style={{ left: `${position}%` }}
        className={cn(
          'absolute top-0 left-1/2 transform -translate-x-1/2 bg-red-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none',
          labelClassName,
        )}
        role="tooltip"
        aria-live="polite"
      >
        {label}
      </div>
    );
  },
);

const CursorLine = memo(
  ({
    position,
    isVisible,
    className,
  }: {
    position?: number;
    isVisible: boolean;
    className?: string;
  }) => {
    if (!isVisible || position === undefined) return null;

    return (
      <div
        style={{ left: `${position}%` }}
        className={cn(
          'absolute top-0 h-full w-[1px] bg-red-500/70 transform -translate-x-0.5 pointer-events-none z-20 transition-opacity duration-150',
          className,
        )}
        aria-hidden="true"
      />
    );
  },
);

const Scales = memo(
  ({
    scales,
    scaleUnitConfig,
  }: {
    scales?: Array<{ position: number; type: ScaleType }>;
    scaleUnitConfig: { width: Record<ScaleType, number>; height: Record<ScaleType, number> };
  }) => {
    const getSize = useCallback(
      (type: ScaleType) => ({
        width: scaleUnitConfig.width[type] ?? 1,
        height: scaleUnitConfig.height[type] ?? 1,
      }),
      [scaleUnitConfig],
    );

    if (!scales?.length) return null;

    return (
      <div className="absolute inset-0">
        {scales.map((scale, index) => (
          <div
            key={index}
            className="absolute bg-gray-600 transform -translate-x-0.5 top-0"
            style={{ left: `${scale.position}%`, ...getSize(scale.type) }}
            aria-hidden="true"
          />
        ))}
      </div>
    );
  },
);

export const SliderTrack = memo(
  ({
    onTrackClick,
    baseTrackclassName,
    scales,
    scaleUnitConfig,
    trackRef,
    timeUnit,
    startDate,
    endDate,
    onDragging,
    ...props
  }: SliderTrackProps) => {
    const [mouseHoverPosition, setMouseHoverPosition] = useState<number>();
    const [isHover, setIsHover] = useState(false);
    const [dateLabel, setDateLabel] = useState<string>();

    const handleMouseLeave = useCallback(() => {
      setIsHover(false);
      setMouseHoverPosition(undefined);
    }, []);

    const handleMouseMove = useCallback(
      (e: React.MouseEvent<Element, MouseEvent>) => {
        const percentage = getPercentageFromMouseEvent(e, trackRef);
        const label = formatDateForDisplay(
          getDateFromPercent(percentage, startDate, endDate),
          timeUnit,
        );

        setIsHover(true);
        setDateLabel(label);
        setMouseHoverPosition(percentage);
      },
      [trackRef, startDate, endDate, timeUnit],
    );

    const baseClassName = useMemo(
      () => cn('h-full w-full relative overflow-visible cursor-pointer', baseTrackclassName),
      [baseTrackclassName],
    );

    // Show cursor line when hovering and not dragging
    const showCursorLine = isHover && !onDragging;

    if (props.mode === 'point') {
      return (
        <div
          ref={trackRef}
          onClick={onTrackClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className={baseClassName}
          aria-hidden="true"
        >
          <Scales scales={scales} scaleUnitConfig={scaleUnitConfig} />

          {/* Cursor line */}
          <CursorLine position={mouseHoverPosition} isVisible={showCursorLine} />

          {/* Date label */}
          {showCursorLine && (
            <DateLabel label={dateLabel} position={mouseHoverPosition} labelClassName="-top-8" />
          )}

          {/* Active track */}
          <div
            className={cn(
              'absolute h-full bg-red-300 rounded-full transition-all duration-200 z-10',
              props.activeTrackClassName,
            )}
            style={{ width: `${props.pointPosition}%` }}
          />
        </div>
      );
    }

    if (props.mode === 'range' || props.mode === 'combined') {
      return (
        <div
          ref={trackRef}
          className={baseClassName}
          onClick={onTrackClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          aria-hidden="true"
        >
          <Scales scales={scales} scaleUnitConfig={scaleUnitConfig} />

          {/* Cursor line */}
          <CursorLine position={mouseHoverPosition} isVisible={showCursorLine} />

          {/* Date label */}
          {showCursorLine && (
            <DateLabel label={dateLabel} position={mouseHoverPosition} labelClassName="-top-8" />
          )}

          {/* Active track */}
          <div
            className={cn(
              'absolute h-full bg-blue-500/30 transition-all duration-200 z-10',
              props.activeTrackClassName,
            )}
            style={{
              left: `${props.rangeStart}%`,
              width: `${(props.rangeEnd ?? 0) - (props.rangeStart ?? 0)}%`,
            }}
          />
        </div>
      );
    }

    return null;
  },
);

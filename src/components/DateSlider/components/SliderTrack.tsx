import { cn } from '@/utils';
import { useState, useCallback, useMemo, memo, useEffect } from 'react';
import { SliderTrackProps, ScaleType } from '../type';
import {
  calculateLabelPosition,
  formatDateForDisplay,
  getDateFromPercent,
  getPercentageFromMouseEvent,
  getPercentageFromTouchEvent,
} from '../utils';
import { createPortal } from 'react-dom';

export const DateLabel = memo(
  ({
    position,
    label,
    labelClassName,
  }: {
    position?: { x: number; y: number };
    label?: string;
    labelClassName?: string;
  }) => {
    if (!position || !label) return null;

    return createPortal(
      <div
        style={{ left: position.x, top: position.y }}
        className={cn(
          'hidden md:block fixed z-50 transform -translate-x-1/2 bg-red-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none',
          labelClassName,
        )}
        role="tooltip"
        aria-live="polite"
      >
        {label}
      </div>,
      document.body,
    );
  },
);

DateLabel.displayName = 'DateLabel';

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
          'hidden md:block absolute top-0 h-full w-[1px] bg-red-500/70 transform -translate-x-0.5 pointer-events-none z-20 transition-opacity duration-150',
          'motion-reduce:transition-none',
          className,
        )}
        aria-hidden="true"
      />
    );
  },
);
CursorLine.displayName = 'CursorLine';

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
            className="absolute  bg-slate-700 transform -translate-x-0.5 top-0"
            style={{ left: `${scale.position}%`, ...getSize(scale.type) }}
            aria-hidden="true"
          />
        ))}
      </div>
    );
  },
);
Scales.displayName = 'Scales';

// Updated props type to include touch event handler
type UpdatedSliderTrackProps = SliderTrackProps & {
  onTrackTouch: (e: React.TouchEvent) => void;
};

export const SliderTrack = memo(
  ({
    onTrackClick,
    onTrackTouch,
    baseTrackclassName,
    scales,
    scaleUnitConfig,
    trackRef,
    startDate,
    endDate,
    onDragging,
    onHandleHover,
    ...props
  }: UpdatedSliderTrackProps) => {
    const [isHoverTrack, setIsHoverTrack] = useState(false);

    const [mouseHoverPosition, setMouseHoverPosition] = useState<number>();
    const [labelPosition, setLabelPosition] = useState<{ x: number; y: number }>();
    const [dateLabel, setDateLabel] = useState<string>();

    const handleMouseLeave = useCallback(() => {
      setIsHoverTrack(false);
      setMouseHoverPosition(undefined);
      setLabelPosition(undefined);
    }, [setIsHoverTrack]);

    const handleMouseMove = useCallback(
      (e: MouseEvent) => {
        if (!trackRef.current) return;
        const percentage = getPercentageFromMouseEvent(e, trackRef);
        const label = formatDateForDisplay({
          date: getDateFromPercent(percentage, startDate, endDate),
          fullDate: true,
        });

        setIsHoverTrack(true);
        setDateLabel(label);
        setMouseHoverPosition(percentage);
        setLabelPosition(calculateLabelPosition(trackRef, e.clientX));
      },
      [trackRef, startDate, endDate, setIsHoverTrack],
    );

    const handleTouchMove = useCallback(
      (e: TouchEvent) => {
        const percentage = getPercentageFromTouchEvent(e, trackRef);
        const label = formatDateForDisplay({
          date: getDateFromPercent(percentage, startDate, endDate),
          fullDate: true,
        });

        setIsHoverTrack(false);
        setDateLabel(label);
        setMouseHoverPosition(percentage);
        // guard touches access to satisfy TypeScript
        const touchX = e.touches && e.touches[0] ? e.touches[0].clientX : 0;
        setLabelPosition(calculateLabelPosition(trackRef, touchX));
      },
      [trackRef, startDate, endDate, setIsHoverTrack],
    );

    const handleTouchEnd = useCallback(() => {
      setIsHoverTrack(false);
      setMouseHoverPosition(undefined);
      setLabelPosition(undefined);
    }, [setIsHoverTrack]);

    useEffect(() => {
      const trackRefInstance = trackRef.current;
      if (!trackRefInstance) return;
      trackRefInstance.addEventListener('touchend', handleTouchEnd);
      trackRefInstance.addEventListener('touchmove', handleTouchMove);
      trackRefInstance.addEventListener('mousemove', handleMouseMove);
      trackRefInstance.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        if (!trackRefInstance) return;
        trackRefInstance.removeEventListener('touchend', handleTouchEnd);
        trackRefInstance.removeEventListener('touchmove', handleTouchMove);
        trackRefInstance.removeEventListener('mousemove', handleMouseMove);
        trackRefInstance.removeEventListener('mouseleave', handleMouseLeave);
      };
    }, [handleMouseLeave, handleMouseMove, handleTouchEnd, handleTouchMove, trackRef]);

    const baseClassName = useMemo(
      () =>
        cn('h-full w-full relative overflow-visible cursor-pointer touch-none', baseTrackclassName),
      [baseTrackclassName],
    );
    // Show cursor line when hovering and not dragging
    const showCursorLine = isHoverTrack && !onDragging && !onHandleHover;
    const showDateLabel = isHoverTrack;

    if (props.mode === 'point') {
      return (
        <div
          onClick={onTrackClick}
          onTouchStart={onTrackTouch}
          className={baseClassName}
          aria-hidden="true"
        >
          <Scales scales={scales} scaleUnitConfig={scaleUnitConfig} />

          {/* Cursor line */}
          <CursorLine position={mouseHoverPosition} isVisible={showCursorLine} />

          {/* Date label */}
          {showDateLabel && <DateLabel label={dateLabel} position={labelPosition} />}

          {/* Active track */}
          <div
            className={cn(
              'absolute h-full bg-red-300 rounded-full transition-all duration-200 z-10',
              'motion-reduce:transition-none',
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
          className={baseClassName}
          onClick={onTrackClick}
          onTouchStart={onTrackTouch}
          aria-hidden="true"
        >
          <Scales scales={scales} scaleUnitConfig={scaleUnitConfig} />

          {/* Cursor line */}
          <CursorLine position={mouseHoverPosition} isVisible={showCursorLine} />

          {/* Date label */}
          {showDateLabel && <DateLabel label={dateLabel} position={labelPosition} />}

          {/* Active track */}
          <div
            className={cn(
              'absolute h-full bg-blue-500/30 transition-all duration-200 z-10',
              'motion-reduce:transition-none',
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

SliderTrack.displayName = 'SliderTrack';

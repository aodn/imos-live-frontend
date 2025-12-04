import { memo, useCallback, useState, useEffect, useMemo } from 'react';
import { DateLabel } from './DateLabel';
import { cn } from '@/utils';
import { ScaleType, SliderTrackProps } from '../type';
import {
  getPercentageFromMouseEvent,
  formatForDisplay,
  getDateFromPercent,
  calculateLabelPosition,
  getPercentageFromTouchEvent,
} from '../utils';

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
          'hidden md:block absolute top-0 h-full w-px transform -translate-x-0.5 pointer-events-none z-20 transition-opacity duration-150',
          'motion-reduce:transition-none',
          className || 'bg-blue-500/70',
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
    scaleMarkClassName,
    scaleMarkMajorClassName,
    scaleMarkMediumClassName,
    scaleMarkMinorClassName,
  }: {
    scales?: Array<{ position: number; type: ScaleType }>;
    scaleUnitConfig: {
      width: Record<ScaleType, number>;
      height: Record<ScaleType, number>;
    };
    scaleMarkClassName?: string;
    scaleMarkMajorClassName?: string;
    scaleMarkMediumClassName?: string;
    scaleMarkMinorClassName?: string;
  }) => {
    const getSize = useCallback(
      (type: ScaleType) => ({
        width: scaleUnitConfig.width[type] ?? 1,
        height: scaleUnitConfig.height[type] ?? 1,
      }),
      [scaleUnitConfig],
    );

    const getScaleClassName = useCallback(
      (type: ScaleType) => {
        const baseClass = 'absolute transform -translate-x-0.5 top-0';
        const typeSpecificClass =
          type === 'long'
            ? scaleMarkMajorClassName
            : type === 'medium'
              ? scaleMarkMediumClassName
              : scaleMarkMinorClassName;

        return cn(baseClass, typeSpecificClass || scaleMarkClassName || 'bg-slate-600');
      },
      [
        scaleMarkClassName,
        scaleMarkMajorClassName,
        scaleMarkMediumClassName,
        scaleMarkMinorClassName,
      ],
    );

    if (!scales?.length) return null;

    return (
      <div className="absolute inset-0">
        {scales.map((scale, index) => (
          <div
            key={index}
            className={getScaleClassName(scale.type)}
            style={{ left: `${scale.position}%`, ...getSize(scale.type) }}
            aria-hidden="true"
          />
        ))}
      </div>
    );
  },
);
Scales.displayName = 'Scales';

export const SliderTrack = memo(
  ({
    onTrackClick,
    onTrackTouch,
    scales,
    scaleUnitConfig,
    trackRef,
    startDate,
    endDate,
    onDragging,
    startHandleRef,
    endHandleRef,
    pointHandleRef,
    classNames,
    renderDateLabel,
    ...props
  }: SliderTrackProps) => {
    const [isHoverTrack, setIsHoverTrack] = useState(false);
    const [isHandleHover, setIsHandleHover] = useState(false);

    const [mouseHoverPosition, setMouseHoverPosition] = useState<number>();
    const [labelPosition, setLabelPosition] = useState<{
      x: number;
      y: number;
    }>();
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
        const label = formatForDisplay(
          getDateFromPercent(percentage, startDate, endDate),
          'day',
          'en-AU',
          true,
        );

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
        const label = formatForDisplay(
          getDateFromPercent(percentage, startDate, endDate),
          'day',
          'en-AU',
          true,
        );

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

    const handleHandlerMouseMove = () => {
      setIsHandleHover(true);
    };
    const handleHandlerMouseLeave = () => {
      setIsHandleHover(false);
    };

    useEffect(() => {
      const trackRefInstance = trackRef.current;
      const startHandleRefInstance = startHandleRef.current;
      const endHandleRefInstance = endHandleRef.current;
      const pointHandleRefInstance = pointHandleRef.current;
      if (!trackRefInstance) return;
      trackRefInstance.addEventListener('touchend', handleTouchEnd);
      trackRefInstance.addEventListener('touchmove', handleTouchMove);
      trackRefInstance.addEventListener('mousemove', handleMouseMove);
      trackRefInstance.addEventListener('mouseleave', handleMouseLeave);
      startHandleRefInstance?.addEventListener('mousemove', handleHandlerMouseMove);
      endHandleRefInstance?.addEventListener('mousemove', handleHandlerMouseMove);
      pointHandleRefInstance?.addEventListener('mousemove', handleHandlerMouseMove);
      startHandleRefInstance?.addEventListener('mouseleave', handleHandlerMouseLeave);
      endHandleRefInstance?.addEventListener('mouseleave', handleHandlerMouseLeave);
      pointHandleRefInstance?.addEventListener('mouseleave', handleHandlerMouseLeave);

      return () => {
        if (!trackRefInstance) return;
        trackRefInstance.removeEventListener('touchend', handleTouchEnd);
        trackRefInstance.removeEventListener('touchmove', handleTouchMove);
        trackRefInstance.removeEventListener('mousemove', handleMouseMove);
        trackRefInstance.removeEventListener('mouseleave', handleMouseLeave);
        startHandleRefInstance?.removeEventListener('mousemove', handleHandlerMouseMove);
        endHandleRefInstance?.removeEventListener('mousemove', handleHandlerMouseMove);
        pointHandleRefInstance?.removeEventListener('mousemove', handleHandlerMouseMove);
        startHandleRefInstance?.removeEventListener('mouseleave', handleHandlerMouseLeave);
        endHandleRefInstance?.removeEventListener('mouseleave', handleHandlerMouseLeave);
        pointHandleRefInstance?.removeEventListener('mouseleave', handleHandlerMouseLeave);
      };
    }, [
      endHandleRef,
      handleMouseLeave,
      handleMouseMove,
      handleTouchEnd,
      handleTouchMove,
      pointHandleRef,
      startHandleRef,
      trackRef,
    ]);

    const baseClassName = useMemo(
      () =>
        cn('h-full w-full relative overflow-visible cursor-pointer touch-none', classNames?.track),
      [classNames?.track],
    );
    // Show cursor line when hovering and not dragging
    const showCursorLine = isHoverTrack && !onDragging && !isHandleHover;
    const showDateLabel = isHoverTrack;

    if (props.mode === 'point') {
      return (
        <div
          onClick={onTrackClick}
          onTouchEnd={onTrackTouch}
          className={baseClassName}
          aria-hidden="true"
        >
          <Scales
            scales={scales}
            scaleUnitConfig={scaleUnitConfig}
            scaleMarkClassName={classNames?.scaleMark}
            scaleMarkMajorClassName={classNames?.scaleMarkMajor}
            scaleMarkMediumClassName={classNames?.scaleMarkMedium}
            scaleMarkMinorClassName={classNames?.scaleMarkMinor}
          />

          {/* Cursor line */}
          <CursorLine
            position={mouseHoverPosition}
            isVisible={showCursorLine}
            className={classNames?.cursorLine}
          />

          {/* Date label */}
          {showDateLabel && (
            //hide slider track date label on mobile
            <DateLabel
              className="hidden md:block"
              label={dateLabel}
              position={labelPosition}
              renderDateLabel={renderDateLabel}
            />
          )}

          {/* Active track */}
          <div
            className={cn(
              'absolute h-full rounded-full transition-all duration-200 z-10',
              'motion-reduce:transition-none',
              classNames?.trackActive || 'bg-blue-500/30',
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
          onTouchEnd={onTrackTouch}
          aria-hidden="true"
        >
          <Scales
            scales={scales}
            scaleUnitConfig={scaleUnitConfig}
            scaleMarkClassName={classNames?.scaleMark}
            scaleMarkMajorClassName={classNames?.scaleMarkMajor}
            scaleMarkMediumClassName={classNames?.scaleMarkMedium}
            scaleMarkMinorClassName={classNames?.scaleMarkMinor}
          />

          {/* Cursor line */}
          <CursorLine
            position={mouseHoverPosition}
            isVisible={showCursorLine}
            className={classNames?.cursorLine}
          />

          {/* Date label */}
          {showDateLabel && (
            //hide slider track date label on mobile
            <DateLabel label={dateLabel} position={labelPosition} className="hidden md:block" />
          )}

          {/* Active track */}
          <div
            className={cn(
              'absolute h-full transition-all duration-200 z-10',
              'motion-reduce:transition-none',
              classNames?.trackActive || 'bg-blue-500/30',
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

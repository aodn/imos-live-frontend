import { cn } from '@/utils';
import { useMemo } from 'react';
import { formatTickValue } from './utils';

type ColorScaleBarProps = {
  height?: number;
  tickCount?: number;
  className?: string;
  min: number;
  max: number;
  label?: string;
  colors: string[];
};

export function LinearColorScaleBar({
  height = 12,
  tickCount = 5,
  className,
  min,
  max,
  label,
  colors,
}: ColorScaleBarProps) {
  const gradient = useMemo(() => {
    return `linear-gradient(to right, ${colors.join(', ')})`;
  }, [colors]);

  const tickPositions = useMemo(() => {
    return Array.from({ length: tickCount }, (_, i) => ({
      index: i,
      value: min + ((max - min) / (tickCount - 1)) * i,
      position: (i / (tickCount - 1)) * 100,
      isEdge: i === 0 || i === tickCount - 1,
    }));
  }, [min, max, tickCount]);

  const scaleLabels = useMemo(() => {
    return tickPositions.map(({ index, value, position }) => (
      <div
        key={`scale-label-${index}`}
        className="absolute flex flex-col items-center"
        style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
      >
        <span className="text-xs text-black font-medium">{formatTickValue(value)}</span>
      </div>
    ));
  }, [tickPositions]);

  const scaleUnits = useMemo(() => {
    return tickPositions.map(({ index, position, isEdge }) => (
      <div
        key={`scale-unit-${index}`}
        className={cn('absolute flex flex-col items-center h-full', {
          hidden: isEdge,
        })}
        style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
      >
        <span className="h-full bg-black w-0.5" />
      </div>
    ));
  }, [tickPositions]);

  return (
    <div className={className}>
      <div className="w-full">
        <div
          className="w-full"
          style={{
            height: `${height}px`,
            background: gradient,
          }}
        />

        <div className="relative h-1">{scaleUnits}</div>

        <div className="relative mx-2 h-2">{scaleLabels}</div>
      </div>

      {label && (
        <div className="mt-2 text-caption text-imos-grey  text-center">
          <span>{label}</span>
        </div>
      )}
    </div>
  );
}

import { useMemo } from 'react';
import {
  applyTickGuard,
  formatTickValue,
  generateSymlogTicks,
  getSymlogVisualPosition,
  interpolateColor,
} from './utils';
import anomalySeaLevelColorMap from '@/config/anomaly_sea_level_colormap.json';
import { cn } from '@/utils';

type SymLogColorScaleBarProps = {
  height?: number;
  numStops?: number;
  className?: string;
  min?: number;
  max?: number;
  threshold?: number;
  compressedRange?: number;
  title?: string;
  colors?: [number, number, number][];
  intermediateTicks?: number[];
};

export const SymLogColorScaleBar = ({
  height = 12,
  numStops = 256,
  className = '',
  min = -1.2,
  max = 1.2,
  threshold = 0.1,
  compressedRange = 0.2,
  title,
  colors = anomalySeaLevelColorMap as [number, number, number][],
  intermediateTicks = [2, 5],
}: SymLogColorScaleBarProps) => {
  const gradient = useMemo(() => {
    const stops = [];

    for (let i = 0; i < numStops; i++) {
      const value = min + (max - min) * (i / (numStops - 1));
      const position = getSymlogVisualPosition(value, min, max, threshold, compressedRange);

      // Map position to color palette (0 to 1 range)
      const colorPosition = (value - min) / (max - min);
      const color = interpolateColor(colorPosition, colors);

      stops.push(`${color} ${(position * 100).toFixed(2)}%`);
    }

    return `linear-gradient(to right, ${stops.join(', ')})`;
  }, [min, max, threshold, compressedRange, numStops, colors]);

  const tickPositions = useMemo(() => {
    const ticks = generateSymlogTicks(min, max, threshold, intermediateTicks);

    const tickPositions = ticks.map((value, index) => ({
      index,
      value,
      position: getSymlogVisualPosition(value, min, max, threshold, compressedRange) * 100,
      label: formatTickValue(value),
      isEdge: value === min || value === max,
    }));
    return applyTickGuard(tickPositions);
  }, [min, max, threshold, compressedRange, intermediateTicks]);

  const scaleLabels = useMemo(() => {
    return tickPositions.map(({ value, position, label }, index) => (
      <div
        key={`scale-label-${value}-${index}`}
        className="absolute flex flex-col items-center"
        style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
      >
        <span className="text-xs text-black font-medium">{label}</span>
      </div>
    ));
  }, [tickPositions]);

  const scaleUnits = useMemo(() => {
    return tickPositions.map(({ value, position, isEdge }, index) => (
      <div
        key={`scale-unit-${value}-${index}`}
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
        <div className="relative h-2 mx-2">{scaleLabels}</div>
      </div>

      {title && (
        <div className="mt-2">
          <span className="text-sm font-bold text-center">{title}</span>
        </div>
      )}
    </div>
  );
};

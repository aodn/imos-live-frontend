import { useMemo } from 'react';
import {
  applyTickGuard,
  formatTickValue,
  generateSymlogTicks,
  getSymlogVisualPosition,
  interpolateColor,
  getSymlogColorPosition,
} from './utils';
import { particles } from '@/constants';

type SymLogColorScaleBarProps = {
  height?: number;
  numStops?: number;
  className?: string;
  min?: number;
  max?: number;
  threshold?: number;
  compressedRange?: number;
  label?: string;
  colors?: [number, number, number][];
  intermediateTicks?: number[];
};

export function SymLogColorScaleBar({
  height = 10,
  numStops = 256,
  className = '',
  min = -1.2,
  max = 1.2,
  threshold = 0.1,
  compressedRange = 0.2,
  label,
  colors = particles.colors as [number, number, number][],
  intermediateTicks = [2, 5],
}: SymLogColorScaleBarProps) {
  const gradient = useMemo(() => {
    const values = Array.from({ length: numStops }, (_, i) => {
      return min + (max - min) * (i / (numStops - 1));
    });

    const stops = values.map(value => {
      // visual position
      const visualPosition =
        getSymlogVisualPosition(value, min, max, threshold, compressedRange) * 100;

      // color position matches Python's SymLogNorm
      const colorPosition = getSymlogColorPosition(value, min, max, threshold);
      const color = interpolateColor(colorPosition, colors);

      return `${color} ${visualPosition.toFixed(2)}%`;
    });

    return `linear-gradient(to right, ${stops.join(', ')})`;
  }, [numStops, min, max, threshold, compressedRange, colors]);

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

        <div className="relative h-2 mx-2">{scaleLabels}</div>
      </div>

      {label && (
        <div className="mt-2 text-caption text-imos-grey  text-center">
          <span>{label}</span>
        </div>
      )}
    </div>
  );
}

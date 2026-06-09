import { rgbToHex } from '@/utils';
import { useMemo } from 'react';
import { formatTickValue } from './utils';

type ColorScaleBarProps = {
  height?: number;
  tickCount?: number;
  className?: string;
  min: number;
  max: number;
  label?: string;
  colors: readonly [number, number, number][];
  scales?: readonly number[];
};

export function LinearColorScaleBar({
  height = 10,
  tickCount = 5,
  className,
  min,
  max,
  label,
  colors,
  scales,
}: ColorScaleBarProps) {
  const gradient = useMemo(() => {
    const cssColors = colors.map(([r, g, b]) => rgbToHex(r, g, b));
    return `linear-gradient(to right, ${cssColors.join(', ')})`;
  }, [colors]);

  const tickPositions = useMemo(() => {
    if (scales && scales.length > 0) {
      return scales.map((value, i) => ({
        index: i,
        value,
        position: ((value - min) / (max - min)) * 100,
        isEdge: i === 0 || i === scales.length - 1,
      }));
    }
    return Array.from({ length: tickCount }, (_, i) => ({
      index: i,
      value: min + ((max - min) / (tickCount - 1)) * i,
      position: (i / (tickCount - 1)) * 100,
      isEdge: i === 0 || i === tickCount - 1,
    }));
  }, [min, max, tickCount, scales]);

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

import { cn } from '@/utils';
import { useMemo } from 'react';
import speedColors from '@/config/speed_colormap.json';
import { getAdjustedPosition, interpolateColor, generateLogTicks } from './utils';

type LogColorScaleBarProps = {
  height?: number;
  numStops?: number;
  className?: string;
  min: number;
  max: number;
  title?: string;
  colors?: [number, number, number][];
  threshold?: number;
  compressedRange?: number;
  intermediateTicks?: number[];
};

export const LogColorScaleBar = ({
  height = 12,
  numStops = 256, //how smooth the legend can be.
  className,
  min = 0.01, //this cannot be 0.
  max = 7,
  title,
  colors = speedColors as [number, number, number][],
  threshold = 0.1,
  compressedRange = 0.1, //how much space the values smaller than threshold take.
  intermediateTicks = [2, 5],
}: LogColorScaleBarProps) => {
  const formatTickValue = (value: number): string => {
    if (value < 1) return value.toFixed(2).toString();
    if (Math.round(value * 100) % 100 === 0) return (Math.round(value * 100) / 100).toString();
    return (Math.round(value * 100) / 100).toFixed(1).toString();
  };

  const gradient = useMemo(() => {
    const values = Array.from(
      { length: numStops },
      (_, i) => min * Math.pow(max / min, i / (numStops - 1)),
    );

    const stops = values.map(v => {
      // visual postion
      const adjustedPercent =
        getAdjustedPosition({ value: v, min, max, threshold, compressedRange }) * 100;
      // map color based on the logarithmic value position, not visual position, say it is 10 base, 1-10, 10-100, 100-1000. logPercent will be in (0 - 1/3), (1/3 - 2/3), (2/3 - 3/3)
      const logPercent = (Math.log10(v) - Math.log10(min)) / (Math.log10(max) - Math.log10(min));
      const color = interpolateColor(logPercent, colors);
      // color is based on logarithmic value position, but position is from adjustedPercent, because we put all colors
      // less than threshold value within compressedRange to make it look good. like 0.01-0.1 will take large space without compressedRange, thredshold setup
      return `${color} ${adjustedPercent.toFixed(2)}%`;
    });

    return `linear-gradient(to right, ${stops.join(', ')})`;
  }, [numStops, min, max, threshold, compressedRange, colors]);

  const tickPositions = useMemo(() => {
    const ticks = generateLogTicks(min, max, threshold, intermediateTicks);
    const tickData: Array<{
      value: number;
      position: number;
      isEdge: boolean;
      label: string;
    }> = [];

    // add zero tick if min is below threshold
    if (min < threshold) {
      tickData.push({
        value: 0,
        position: 0,
        isEdge: true,
        label: '0',
      });
    }

    // add all other ticks
    ticks.forEach(value => {
      const isLastTick = value === max;
      tickData.push({
        value,
        position: getAdjustedPosition({ value, min, max, threshold, compressedRange }) * 100,
        isEdge: isLastTick, // Only hide tick mark for the maximum value
        label: formatTickValue(value),
      });
    });

    return tickData;
  }, [min, max, threshold, intermediateTicks, compressedRange]);

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

        <div className="relative h-2 mx-1">{scaleLabels}</div>
      </div>

      {title && (
        <div className="mt-2 text-black text-sm text-center">
          <span>{title}</span>
        </div>
      )}
    </div>
  );
};

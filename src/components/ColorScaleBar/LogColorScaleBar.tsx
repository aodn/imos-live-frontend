import { useMemo } from 'react';
import {
  getLogVisualPosition,
  interpolateColor,
  generateLogTicks,
  formatTickValue,
  applyTickGuard,
  getLogColorPosition,
} from './utils';

type LogColorScaleBarProps = {
  height?: number;
  numStops?: number;
  className?: string;
  min?: number;
  max?: number;
  label?: string;
  colors: [number, number, number][];
  threshold?: number;
  compressedRange?: number;
  intermediateTicks?: number[];
};

export const LogColorScaleBar = ({
  height = 12,
  numStops = 256, //how smooth the legend can be.
  className,
  min = 0.01, //this cannot be 0 and has to be 10^n, n is integer, because we are using 10 base log scale.
  max = 7,
  label,
  colors,
  threshold = 0.1, //the threshold value to separate the compressed linear space and logarithmic space.
  compressedRange = 0.1, //how much space the values smaller than threshold take.
  intermediateTicks = [2, 5],
}: LogColorScaleBarProps) => {
  const gradient = useMemo(() => {
    const values = Array.from(
      { length: numStops },
      (_, i) => min * Math.pow(max / min, i / (numStops - 1)),
    );

    const stops = values.map(v => {
      // visual postion
      const visualPosition =
        getLogVisualPosition({ value: v, min, max, threshold, compressedRange }) * 100;
      // map color based on the logarithmic value position, not visual position, say it is 10 base, 1-10, 10-100, 100-1000. logPercent will be in (0 - 1/3), (1/3 - 2/3), (2/3 - 3/3)
      const colorPosition = getLogColorPosition(v, min, max);
      const color = interpolateColor(colorPosition, colors);
      // color is based on logarithmic value position, but position is from visualPosition, because we put all colors
      // less than threshold value within compressedRange to make it look good. like 0.01-0.1 will take large space without compressedRange, thredshold setup
      return `${color} ${visualPosition.toFixed(2)}%`;
    });

    return `linear-gradient(to right, ${stops.join(', ')})`;
  }, [numStops, min, max, threshold, compressedRange, colors]);

  const tickPositions = useMemo(() => {
    const ticks = generateLogTicks(min, max, threshold, intermediateTicks);
    const tickPositions = ticks.map((value, index) => ({
      index,
      value,
      position: getLogVisualPosition({ value, min, max, threshold, compressedRange }) * 100,
      isEdge: value === max,
      label: formatTickValue(value),
    }));

    // add zero tick if min is below threshold
    if (min < threshold) {
      tickPositions.unshift({
        index: 0,
        value: 0,
        position: 0,
        isEdge: true,
        label: '0',
      });
    }

    tickPositions.map((tp, i) => (tp.index = i));
    return applyTickGuard(tickPositions);
  }, [min, max, threshold, intermediateTicks, compressedRange]);

  const scaleLabels = useMemo(() => {
    return tickPositions.map(({ value, position, label }, index) => (
      <div
        key={`scale-label-${value}-${index}`}
        className="absolute flex flex-col items-center"
        style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
      >
        <span className="text-xs text-black font-light">{label}</span>
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

        <div className="relative h-2 mx-1 mt-1">{scaleLabels}</div>
      </div>

      {label && (
        <div className="mt-2 text-caption text-imos-grey text-center">
          <span>{label}</span>
        </div>
      )}
    </div>
  );
};

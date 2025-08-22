import { cn } from '@/utils';
import { useMemo } from 'react';

type ColorScaleBarProps = {
  height?: number;
  tickCount?: number;
  className?: string;
  min: number;
  max: number;
  title: string;
  colors: string[];
};

export const ColorScaleBar = ({
  height = 80,
  tickCount = 5,
  className,
  ...props
}: ColorScaleBarProps) => {
  const gradient = useMemo(() => {
    return `linear-gradient(to right, ${props.colors.join(', ')})`;
  }, [props.colors]);

  const scaleLabels = useMemo(() => {
    const { min, max } = props;
    const tickElements = [];
    const step = (max - min) / (tickCount - 1);

    for (let i = 0; i < tickCount; i++) {
      const value = min + step * i;
      const position = (i / (tickCount - 1)) * 100;

      tickElements.push(
        <div
          key={`ColorScaleBar-ticks-${i}`}
          className={cn('absolute flex flex-col items-center')}
          style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
        >
          <span className="text-xs text-black font-medium">{value.toFixed(1)}</span>
        </div>,
      );
    }

    return tickElements;
  }, [props, tickCount]);

  const scaleUnits = useMemo(() => {
    const tickElements = [];

    for (let i = 0; i < tickCount; i++) {
      const position = (i / (tickCount - 1)) * 100;

      tickElements.push(
        <div
          key={`ColorScaleBar-ticks-${i}`}
          className={cn('absolute flex flex-col items-center', {
            hidden: i === 0 || i === tickCount - 1,
          })}
          style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
        >
          <span className="h-[6px] bg-black w-0.5" />
        </div>,
      );
    }

    return tickElements;
  }, [tickCount]);

  return (
    <div
      className={className}
      style={{
        height: `${height}px`,
      }}
    >
      <div className="w-full">
        <div
          className="w-full"
          style={{
            height: `${height * 0.2}px`,
            background: gradient,
          }}
        />
        <div
          style={{
            height: `${height * 0.1}px`,
          }}
          className="relative "
        >
          {scaleUnits}
        </div>
        <div className="relative  mx-2" style={{ height: `${height * 0.3}px` }}>
          {scaleLabels}
        </div>
      </div>
      <div
        className="text-black text-sm text-center flex flex-col"
        style={{
          height: `${height * 0.4}px`,
        }}
      >
        <span> {props.title}</span>
      </div>
    </div>
  );
};

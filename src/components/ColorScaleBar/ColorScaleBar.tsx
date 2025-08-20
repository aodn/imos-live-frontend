import {
  GSLA_OCEAN_GEOSTROPHIC_CURRENT_PRODUCT_VARIANT,
  GSLA_ANOMALY_SEA_LEVELS_PRODUCT_VARIANT,
} from '@/constants';
import { gslaAnomalySeaLevelsRange, gslaOverlayImageColors, vectorConfig } from '@/config';
import { cn } from '@/utils';
import { useMemo } from 'react';

type BaseColorScaleBarProps = {
  height?: number;
  tickCount?: number;
  className?: string;
  min?: number;
  max?: number;
};

type PredefinedVariant =
  | typeof GSLA_OCEAN_GEOSTROPHIC_CURRENT_PRODUCT_VARIANT
  | typeof GSLA_ANOMALY_SEA_LEVELS_PRODUCT_VARIANT;

type CustomColorScaleBarProps = BaseColorScaleBarProps & {
  variant: 'custom';
  title: string;
  colors: string[];
};

type PredefinedColorScaleBarProps = BaseColorScaleBarProps & {
  variant: PredefinedVariant;
};

type ColorScaleBarProps = PredefinedColorScaleBarProps | CustomColorScaleBarProps;

const variants = {
  [GSLA_OCEAN_GEOSTROPHIC_CURRENT_PRODUCT_VARIANT]: {
    colors: Object.values(vectorConfig.colours),
    title: 'ocean current speed (m/s)',
    min: 0,
    max: vectorConfig.maxSpeed,
  },
  [GSLA_ANOMALY_SEA_LEVELS_PRODUCT_VARIANT]: {
    colors: gslaOverlayImageColors,
    title: 'anomaly sea level (m)',
    min: gslaAnomalySeaLevelsRange[0],
    max: gslaAnomalySeaLevelsRange[1],
  },
};

export const ColorScaleBar = ({
  height = 80,
  tickCount = 5,
  variant,
  className,
  ...props
}: ColorScaleBarProps) => {
  const config = useMemo(() => {
    if (variant === 'custom') {
      const customProps = props as CustomColorScaleBarProps;
      return {
        colors: customProps.colors,
        title: customProps.title,
        min: props.min ?? 0,
        max: props.max ?? 1,
      };
    } else {
      const variantConfig = variants[variant];
      return {
        colors: variantConfig.colors,
        title: variantConfig.title,
        min: variantConfig.min,
        max: variantConfig.max,
      };
    }
  }, [variant, props]);

  const gradient = useMemo(() => {
    return `linear-gradient(to right, ${config.colors.join(', ')})`;
  }, [config.colors]);

  const scaleLabels = useMemo(() => {
    const { min, max } = config;
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
  }, [config, tickCount]);

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
        <span> {config.title}</span>
      </div>
    </div>
  );
};

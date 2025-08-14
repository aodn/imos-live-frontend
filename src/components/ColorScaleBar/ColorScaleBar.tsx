import {
  GSLA_OCEAN_GEOSTROPHIC_CURRENT_PRODUCT_VARIANT,
  GSLA_ANOMALY_SEA_LEVELS_PRODUCT_VARIANT,
  GSLA_OVERLAY_IMAGE_VIRIDIS_COLORS,
} from '@/constants';
import { vectorConfig } from '@/config';
import { cn } from '@/utils';
import { useMemo } from 'react';

type BaseColorScaleBarProps = {
  height?: number;
  tickCount?: number;
  className?: string;
  min: number;
  max: number;
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
  },
  [GSLA_ANOMALY_SEA_LEVELS_PRODUCT_VARIANT]: {
    colors: GSLA_OVERLAY_IMAGE_VIRIDIS_COLORS,
    title: 'anomaly sea level (m)',
  },
};

export const ColorScaleBar = ({
  height = 16,
  tickCount = 7,
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
      };
    } else {
      const variantConfig = variants[variant];
      return {
        colors: variantConfig.colors,
        title: variantConfig.title,
      };
    }
  }, [variant, props]);

  const gradient = useMemo(() => {
    return `linear-gradient(to right, ${config.colors.join(', ')})`;
  }, [config.colors]);

  const ticks = useMemo(() => {
    const { min, max } = props;
    const tickElements = [];
    const step = (max - min) / (tickCount - 1);

    for (let i = 0; i < tickCount; i++) {
      const value = min + step * i;
      const position = (i / (tickCount - 1)) * 100;

      tickElements.push(
        <div
          key={`ColorScaleBar-ticks-${i}`}
          className={cn('absolute flex flex-col items-center', {
            // hidden: i === 0 || i === tickCount - 1,
          })}
          style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
        >
          <span className="text-xs text-black font-medium">{value.toFixed(1)}</span>
        </div>,
      );
    }

    return tickElements;
  }, [props, tickCount]);

  return (
    <div className={className}>
      <div className="w-full">
        <div
          className="rounded-sm w-full"
          style={{
            height: `${height}px`,
            background: gradient,
          }}
        />
        <div className="relative mt-1">{ticks}</div>
      </div>
      <div className="text-black text-sm text-center mt-6">{config.title}</div>
    </div>
  );
};

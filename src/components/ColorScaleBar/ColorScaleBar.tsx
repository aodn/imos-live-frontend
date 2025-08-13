import {
  GSLA_OCEAN_GEOSTROPHIC_CURRENT_PRODUCT_VARIANT,
  GSLA_ANOMALY_SEA_LEVELS_PRODUCT_VARIANT,
} from '@/constants';
import { vectorConfig } from '@/config';

interface ColorScaleBarProps {
  title?: string;
  min?: number;
  max?: number;
  height?: number;
  tickCount?: number;
  className?: string;
  variant:
    | typeof GSLA_OCEAN_GEOSTROPHIC_CURRENT_PRODUCT_VARIANT
    | typeof GSLA_ANOMALY_SEA_LEVELS_PRODUCT_VARIANT;
}

export const ColorScaleBar = ({
  title = 'Height anomaly (m)',
  min = -0.6,
  max = 0.6,
  height = 20,
  tickCount = 7,
  variant,
  className,
}: ColorScaleBarProps) => {
  // Predefined color schemes
  const colorSchemes = {
    height: [
      '#000080', // Dark blue
      '#0000FF', // Blue
      '#00FFFF', // Cyan
      '#00FF00', // Green
      '#FFFF00', // Yellow
      '#FFA500', // Orange
      '#FF0000', // Red
    ],
  };

  const variants = {
    [GSLA_OCEAN_GEOSTROPHIC_CURRENT_PRODUCT_VARIANT]: {
      colors: Object.values(vectorConfig.colours),
    },
    [GSLA_ANOMALY_SEA_LEVELS_PRODUCT_VARIANT]: {
      colors: colorSchemes.height,
    },
  };

  const generateGradient = () => {
    const colors = variants[variant]?.colors ?? colorSchemes.height;
    return `linear-gradient(to right, ${colors.join(', ')})`;
  };

  const generateTicks = () => {
    const ticks = [];
    const step = (max - min) / (tickCount - 1);

    for (let i = 0; i < tickCount; i++) {
      const value = min + step * i;
      const position = (i / (tickCount - 1)) * 100;

      ticks.push(
        <div
          key={i}
          className="absolute flex flex-col items-center"
          style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
        >
          <span className="text-xs text-black font-medium">{value.toFixed(1)}</span>
        </div>,
      );
    }

    return ticks;
  };

  return (
    <div className={className}>
      <div className="w-full">
        <div
          className="rounded-sm  w-full"
          style={{
            height: `${height}px`,
            background: generateGradient(),
          }}
        />
        <div className="relative mt-1 ">{generateTicks()}</div>
      </div>
      <div className="text-black text-sm font-medium  text-center mt-6">{title}</div>
    </div>
  );
};

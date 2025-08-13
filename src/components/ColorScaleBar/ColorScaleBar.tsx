import {
  GSLA_OCEAN_GEOSTROPHIC_CURRENT_PRODUCT_VARIANT,
  GSLA_ANOMALY_SEA_LEVELS_PRODUCT_VARIANT,
  OVERLAY_LAYER_COLORS,
} from '@/constants';
import { vectorConfig } from '@/config';
import { cn } from '@/utils';

interface ColorScaleBarProps {
  height?: number;
  tickCount?: number;
  className?: string;
  variant:
    | typeof GSLA_OCEAN_GEOSTROPHIC_CURRENT_PRODUCT_VARIANT
    | typeof GSLA_ANOMALY_SEA_LEVELS_PRODUCT_VARIANT;
}

export const ColorScaleBar = ({
  height = 16,
  tickCount = 7,
  variant,
  className,
}: ColorScaleBarProps) => {
  const variants = {
    [GSLA_OCEAN_GEOSTROPHIC_CURRENT_PRODUCT_VARIANT]: {
      colors: Object.values(vectorConfig.colours),
      title: 'ocean current speed (m/s)',
      range: [0, 1],
    },
    [GSLA_ANOMALY_SEA_LEVELS_PRODUCT_VARIANT]: {
      colors: OVERLAY_LAYER_COLORS,
      title: 'anomaly sea level (m)',
      range: [-0.6, 0.6],
    },
  };
  //TODO: 1. set OVERLAY_LAYER_COLORS to cmap in hvplot.quadmesh so that plot in these colors.
  // 2. get min, max of both anomaly sea levels and occean current speed saved in meta_data.json in python script.
  const generateGradient = () => {
    const colors = variants[variant]?.colors;
    return `linear-gradient(to right, ${colors.join(', ')})`;
  };

  const generateTicks = () => {
    const [min, max] = variants[variant].range;
    const ticks = [];
    const step = (max - min) / (tickCount - 1);

    for (let i = 0; i < tickCount; i++) {
      const value = min + step * i;
      const position = (i / (tickCount - 1)) * 100;

      ticks.push(
        <div
          key={`ColorScaleBar-ticks-${i}`}
          className={cn('absolute flex flex-col items-center', {
            hidden: i === 0 || i === tickCount - 1,
          })}
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
      <div className="text-black text-sm text-center mt-6">{variants[variant].title}</div>
    </div>
  );
};

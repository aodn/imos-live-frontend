/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { cn } from '@/lib/utils';
import { sliderUnitsConfig } from './config';

export type ScaleType = 'short' | 'medium' | 'long';
export type Scale = { position: number; type: ScaleType; date: Date };
export type NumOfScales = { short: number; medium: number; long: number };

type BaseSliderTrackProps = {
  onTrackClick: (e: React.MouseEvent) => void;
  baseTrackclassName?: string;
  scales: Scale[];
  width: number;
};

type PointModeProps = {
  mode: 'point';
  activeTrackClassName?: string;
  pointPosition: number;
};

type CombinedModeProps = {
  mode: 'combined';
  rangeStart: number;
  rangeEnd: number;
  pointPosition: number;
  inactiveTrackClassName?: string;
  activeTrackClassName?: string;
};

type RangeModeProps = {
  mode: 'range';
  rangeStart: number;
  rangeEnd: number;
  inactiveTrackClassName?: string;
  activeTrackClassName?: string;
};

type SliderTrackProps = BaseSliderTrackProps &
  (PointModeProps | RangeModeProps | CombinedModeProps);

export type ScaltType = 'short' | 'medium' | 'long';

export const SliderTrack = ({
  onTrackClick,
  baseTrackclassName,
  scales,
  width = 300,
  ...props
}: SliderTrackProps) => {
  const getSize = (type: ScaltType) => ({
    width: sliderUnitsConfig.width[type] ?? 1,
    height: sliderUnitsConfig.height[type] ?? 1,
  });

  const renderScales = () => (
    <div className="absolute inset-0 pointer-events-none">
      {scales?.map((scale, index) => (
        <div
          key={index}
          className={cn('absolute bg-gray-600 transform -translate-x-0.5 top-0')}
          style={{ left: `${scale.position}%`, ...getSize(scale.type) }}
        />
      ))}
    </div>
  );

  if (props.mode === 'point') {
    return (
      <div
        style={{
          width: width,
        }}
        className={cn(
          'h-16 bg-gray-300 relative overflow-visible cursor-pointer',
          baseTrackclassName,
        )}
        onClick={onTrackClick}
      >
        {renderScales()}
        <div
          className={cn(
            'h-full bg-red-500 rounded-full transition-all duration-200 z-10',
            props.activeTrackClassName,
          )}
          style={{ width: `${props.pointPosition}%` }}
        />
      </div>
    );
  }
  if (props.mode === 'range') {
    return (
      <div
        style={{
          width: width,
        }}
        className={cn(
          'h-16 bg-gray-300 relative overflow-visible cursor-pointer',
          baseTrackclassName,
        )}
        onClick={onTrackClick}
      >
        {renderScales()}

        <div
          className={cn(
            'absolute h-full bg-blue-500/30 transition-all duration-200 z-10',
            props.activeTrackClassName,
          )}
          style={{
            left: `${props.rangeStart}%`,
            width: `${props.rangeEnd - props.rangeStart}%`,
          }}
        />
      </div>
    );
  }

  if (props.mode === 'combined') {
    return (
      <div
        style={{
          width: width,
        }}
        className={cn(
          'h-16 bg-gray-300 relative overflow-visible cursor-pointer',
          baseTrackclassName,
        )}
        onClick={onTrackClick}
      >
        {renderScales()}
        <div
          className={cn(
            'absolute h-full bg-gray-300 rounded-l-full z-10',
            props.inactiveTrackClassName,
          )}
          style={{ width: `${props.rangeStart}%` }}
        />
        <div
          className={cn(
            'absolute h-full bg-gray-300 rounded-r-full right-0 z-10',
            props.inactiveTrackClassName,
          )}
          style={{ width: `${100 - props.rangeEnd}%` }}
        />
        <div
          className={cn(
            'absolute h-full bg-blue-500/30 transition-all duration-200 z-10',
            props.activeTrackClassName,
          )}
          style={{
            left: `${props.rangeStart}%`,
            width: `${props.rangeEnd - props.rangeStart}%`,
          }}
        />
      </div>
    );
  }
};

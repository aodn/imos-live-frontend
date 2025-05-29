/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { cn } from '@/lib/utils';

type BaseSliderTrackProps = {
  onTrackClick: (e: React.MouseEvent) => void;
  baseTrackclassName?: string;
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

export const SliderTrack = ({ onTrackClick, baseTrackclassName, ...props }: SliderTrackProps) => {
  if (props.mode === 'point') {
    return (
      <div
        className={cn(
          'w-full h-2 bg-gray-300 rounded-full relative overflow-hidden cursor-pointer',
          baseTrackclassName,
        )}
        onClick={onTrackClick}
      >
        <div
          className={cn(
            'h-full bg-red-500 rounded-full transition-all duration-200',
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
        className={cn(
          'w-full h-2 bg-gray-300 rounded-full relative overflow-hidden cursor-pointer',
          baseTrackclassName,
        )}
        onClick={onTrackClick}
      >
        <div
          className={cn('absolute h-full bg-gray-300 rounded-l-full', props.inactiveTrackClassName)}
          style={{ width: `${props.rangeStart}%` }}
        />
        <div
          className={cn(
            'absolute h-full bg-gray-300 rounded-r-full right-0',
            props.inactiveTrackClassName,
          )}
          style={{ width: `${100 - props.rangeEnd}%` }}
        />
        <div
          className={cn(
            'absolute h-full bg-blue-500 transition-all duration-200',
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
        className={cn(
          'w-full h-2 bg-gray-300 rounded-full relative overflow-hidden cursor-pointer',
          baseTrackclassName,
        )}
        onClick={onTrackClick}
      >
        <div
          className={cn('absolute h-full bg-gray-300 rounded-l-full', props.inactiveTrackClassName)}
          style={{ width: `${props.rangeStart}%` }}
        />
        <div
          className={cn(
            'absolute h-full bg-gray-300 rounded-r-full right-0',
            props.inactiveTrackClassName,
          )}
          style={{ width: `${100 - props.rangeEnd}%` }}
        />
        <div
          className={cn(
            'absolute h-full bg-blue-500 transition-all duration-200',
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

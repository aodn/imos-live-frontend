/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { cn } from '@/utils';

import { SliderTrackProps, ScaleType } from './type';

export const SliderTrack = ({
  onTrackClick,
  baseTrackclassName,
  scales,
  scaleUnitConfig,
  trackRef,
  ...props
}: SliderTrackProps) => {
  const getSize = (type: ScaleType) => ({
    width: scaleUnitConfig.width[type] ?? 1,
    height: scaleUnitConfig.height[type] ?? 1,
  });

  const renderScales = () => {
    return (
      <div className="absolute inset-0">
        {scales?.map((scale, index) => (
          <div
            key={index}
            className={cn('absolute bg-gray-600 transform -translate-x-0.5 top-0')}
            style={{ left: `${scale.position}%`, ...getSize(scale.type) }}
          />
        ))}
      </div>
    );
  };

  if (props.mode === 'point') {
    return (
      <div
        ref={trackRef}
        onClick={onTrackClick}
        className={cn('h-full w-full relative overflow-visible cursor-pointer', baseTrackclassName)}
      >
        {renderScales()}

        <div
          className={cn(
            'absolute h-full bg-red-300 rounded-full transition-all duration-200 z-10',
            props.activeTrackClassName,
          )}
          style={{ width: `${props.pointPosition}%` }}
        />
      </div>
    );
  }
  if (props.mode === 'range' || props.mode === 'combined') {
    return (
      <div
        ref={trackRef}
        className={cn('h-full w-full relative overflow-visible cursor-pointer', baseTrackclassName)}
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
};

/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { cn } from '@/lib/utils';
import { sliderUnitsConfig } from './config';
import { SliderTrackProps, ScaltType } from './type';

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

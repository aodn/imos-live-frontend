import { forwardRef } from 'react';
import { cn } from '@/utils';
import { Slider, SliderProps } from './Slider';

export type LabeledSliderProps = {
  label: string;
  decimals?: number;
  className?: string;
  sliderClassName?: string;
  labelClassName?: string;
  valueClassName?: string;
} & SliderProps;

export const LabeledSlider = forwardRef<HTMLInputElement, LabeledSliderProps>(
  (
    {
      label,
      value,
      decimals = 2,
      className,
      sliderClassName,
      labelClassName,
      valueClassName,
      ...sliderProps
    },
    ref,
  ) => {
    return (
      <div className={cn('flex items-center gap-3 w-full', className)} data-testid="labeled-slider">
        <label
          className={cn(
            'text-sm font-medium text-imos-grey  whitespace-nowrap min-w-fit',
            labelClassName,
          )}
        >
          {label}
        </label>
        <Slider
          ref={ref}
          value={value}
          className={cn('flex-1', sliderClassName)}
          {...sliderProps}
        />
        <span
          className={cn('text-sm font-medium text-imos-grey min-w-fit', valueClassName)}
          data-testid="slider-value"
        >
          {value.toFixed(decimals)}
        </span>
      </div>
    );
  },
);

LabeledSlider.displayName = 'LabeledSlider';

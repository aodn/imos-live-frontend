import { cn } from '@/utils';
import type { ReactNode } from 'react';
import { LAYOUT, ACCESSIBILITY } from '../constants';
import type { useSliderConfig } from '../hooks';
import type { DateSliderClassNames } from '../type';

/**
 *        Layout Architecture:
          - DateSlider wrapper width = SelectionPanel + SliderContainer + TimeUnitSelection (flex layout)
          - SliderContainer is the scrollable viewport (flex-1)
          - Track is the actual slider with scales, contained in SliderContainer

          Width Modes:
          1. 'fill' mode: Sets width: 100%, fills parent container. DateSlider wrapper width same as parent, SliderContainer width is flex-1, fill remaining width besides
          TimeUnitSelection and SelectionPanel. 
          2. Specified width: Sets explicit width in pixels. DateSlider wrapper width is specified width, SliderContainer width is flex-1, fill remaining width besides
          TimeUnitSelection and SelectionPanel. 
          3. Undefined: Uses flex sizing without width constraint. DateSlider wrapper width will fit content, largest to fill its parent div or screen. SliderContainer 
          width is flex-1, fill remaining width besides TimeUnitSelection and SelectionPanel. 

          Track Behavior:
          - Scrollable (default): Track width = calculated from scales, enables horizontal scroll if needed
          - Fixed: Track width = 100% of SliderContainer, no scrolling
 * 
 *  
 */
export function DateSliderWrapper({
  classNames,
  layout,
  children,
}: {
  classNames?: DateSliderClassNames;
  layout: ReturnType<typeof useSliderConfig>['layout'];
  children: ReactNode;
}) {
  return (
    <div
      className={cn('flex', classNames?.wrapper)}
      style={
        layout.sliderWidth === 'fill'
          ? {
              height: layout.sliderHeight ?? LAYOUT.DEFAULT_SLIDER_HEIGHT,
              width: '100%',
              minWidth: LAYOUT.MIN_SLIDER_WIDTH,
            }
          : {
              height: layout.sliderHeight ?? LAYOUT.DEFAULT_SLIDER_HEIGHT,
              width: layout.sliderWidth,
              minWidth: LAYOUT.MIN_SLIDER_WIDTH,
            }
      }
      role="group"
      aria-label={ACCESSIBILITY.SLIDER_ARIA_LABEL}
    >
      {children}
    </div>
  );
}

import type { Scale, SliderProps } from '../type';
import { getTrackVisibleRange } from '../utils';
import { useMemo } from 'react';

export function useSliderVirtualization({
  behavior,
  trackWidth,
  sliderContainerWidth,
  sliderPositionX,
  allScales,
}: {
  behavior: SliderProps['behavior'];
  trackWidth: number;
  sliderContainerWidth: number;
  sliderPositionX: number;
  allScales: Scale[];
}) {
  // Only render scales that are visible in the viewport
  const scales = useMemo(() => {
    if (!behavior?.scrollable || trackWidth <= sliderContainerWidth) {
      return allScales;
    }

    const { start: startWithBuffer, end: endWithBuffer } = getTrackVisibleRange({
      sliderPositionX: sliderPositionX,
      trackWidth,
      sliderContainerWidth: sliderContainerWidth,
    });

    return allScales.filter(
      scale => scale.position >= startWithBuffer && scale.position <= endWithBuffer,
    );
  }, [allScales, behavior?.scrollable, trackWidth, sliderContainerWidth, sliderPositionX]);

  return { scales };
}

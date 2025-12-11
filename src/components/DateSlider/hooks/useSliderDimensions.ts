import type { Dimension } from '../type';
import { useState, useCallback, type RefObject } from 'react';
import { useRAFDFn } from './useRAFDFn';
import { useResizeObserver } from './useResizeObserver';

/**
 * dynamically generate sliderContainerRef width and trackContainerRef width
 * @param sliderContainerRef
 * @param trackContainerRef
 * @returns
 */
export function useSliderDimesions(
  sliderContainerRef: RefObject<HTMLDivElement | null>,
  trackContainerRef: RefObject<HTMLDivElement | null>,
) {
  const [dimensions, setDimensions] = useState<Dimension>({
    sliderContainerWidth: 0,
    trackContainerWidth: 0,
  });
  const updateDimensions = useCallback(() => {
    if (sliderContainerRef?.current && trackContainerRef?.current) {
      const sliderContainerWidth = sliderContainerRef.current.getBoundingClientRect().width;
      const trackContainerWidth = trackContainerRef.current.getBoundingClientRect().width;
      setDimensions({ sliderContainerWidth, trackContainerWidth });
    }
  }, [sliderContainerRef, trackContainerRef]);

  const scheduleUpdateDimensions = useRAFDFn(updateDimensions);

  useResizeObserver(trackContainerRef, scheduleUpdateDimensions);
  useResizeObserver(sliderContainerRef, scheduleUpdateDimensions);

  return dimensions;
}

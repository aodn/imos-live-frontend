import type { Dimension } from '../type';
import { useState, useCallback, useEffect, useRef, type RefObject } from 'react';
import { useRAFDFn } from './useRAFDFn';
import { useResizeObserver } from './useResizeObserver';

/**
 * dynamically generate sliderContainerRef width and trackContainerRef width
 * @param sliderContainerRef
 * @param trackContainerRef
 * @param enabled when false, dimensions are frozen and resize events are ignored
 * @returns
 */
export function useSliderDimesions(
  sliderContainerRef: RefObject<HTMLDivElement | null>,
  trackContainerRef: RefObject<HTMLDivElement | null>,
  enabled: boolean = true,
) {
  const [dimensions, setDimensions] = useState<Dimension>({
    sliderContainerWidth: 0,
    trackContainerWidth: 0,
  });
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const updateDimensions = useCallback(() => {
    if (!enabledRef.current) return;
    if (sliderContainerRef?.current && trackContainerRef?.current) {
      const sliderContainerWidth = sliderContainerRef.current.getBoundingClientRect().width;
      const trackContainerWidth = trackContainerRef.current.getBoundingClientRect().width;
      setDimensions({ sliderContainerWidth, trackContainerWidth });
    }
  }, [sliderContainerRef, trackContainerRef]);

  const scheduleUpdateDimensions = useRAFDFn(updateDimensions);

  useResizeObserver(trackContainerRef, scheduleUpdateDimensions);
  useResizeObserver(sliderContainerRef, scheduleUpdateDimensions);

  // Re-sample once when observation is (re)enabled, in case the size changed while frozen.
  useEffect(() => {
    if (enabled) updateDimensions();
  }, [enabled, updateDimensions]);

  return dimensions;
}

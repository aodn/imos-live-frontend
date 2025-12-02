import { useEffect, useRef } from 'react';
import { Dimension } from '../type';

//if the slider is scrollable, auto scroll to center the selected date/range on initial render
export const useInitialAutoScrollPosition = ({
  scrollable,
  dimensions,
  viewMode,
  pointPosition,
  rangeStart,
  rangeEnd,
  resetPosition,
}: {
  scrollable: boolean;
  dimensions: Dimension;
  viewMode: 'point' | 'range' | 'combined';
  pointPosition: number;
  rangeStart: number;
  rangeEnd: number;
  resetPosition: (newPosition?: { x: number; y: number }) => void;
}) => {
  const hasAutoScrolledRef = useRef(false);

  useEffect(() => {
    if (
      !scrollable ||
      dimensions.sliderContainerWidth === 0 ||
      dimensions.trackContainerWidth === 0 ||
      hasAutoScrolledRef.current
    ) {
      return;
    }

    let targetPercent = 0;

    if (viewMode === 'point') {
      targetPercent = pointPosition;
    } else if (viewMode === 'range') {
      // Center on the middle of the range
      targetPercent = (rangeStart + rangeEnd) / 2;
    } else if (viewMode === 'combined') {
      // Center on the point position
      targetPercent = pointPosition;
    }

    // Calculate the scroll offset to center the target
    const targetPixel = (targetPercent / 100) * dimensions.trackContainerWidth;
    const centerOffset = dimensions.sliderContainerWidth / 2;
    const scrollOffset = -(targetPixel - centerOffset);

    // Clamp to valid scroll bounds
    const maxScroll = Math.min(0, dimensions.sliderContainerWidth - dimensions.trackContainerWidth);
    const clampedOffset = Math.max(maxScroll, Math.min(0, scrollOffset));

    resetPosition({ x: clampedOffset, y: 0 });
    hasAutoScrolledRef.current = true;
  }, [scrollable, dimensions, viewMode, pointPosition, rangeStart, rangeEnd, resetPosition]);
};

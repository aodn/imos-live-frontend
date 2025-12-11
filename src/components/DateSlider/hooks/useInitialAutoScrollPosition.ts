import { useLayoutEffect, useRef } from 'react';

//if the slider is scrollable, auto scroll to center the selected date/range on initial render
export const useInitialAutoScrollPosition = ({
  scrollable,
  trackContainerWidth,
  sliderContainerWidth,
  viewMode,
  pointPosition,
  rangeStartPosition,
  rangeEndPosition,
  resetPosition,
}: {
  scrollable: boolean;
  sliderContainerWidth: number;
  trackContainerWidth: number;
  viewMode: 'point' | 'range' | 'combined';
  pointPosition: number;
  rangeStartPosition: number;
  rangeEndPosition: number;
  resetPosition: (newPosition?: { x: number; y: number }) => void;
}) => {
  const hasAutoScrolledRef = useRef(false);

  useLayoutEffect(() => {
    if (
      !scrollable ||
      sliderContainerWidth === 0 ||
      trackContainerWidth === 0 ||
      hasAutoScrolledRef.current
    ) {
      return;
    }

    let targetPercent = 0;

    if (viewMode === 'point') {
      targetPercent = pointPosition;
    } else if (viewMode === 'range') {
      // Center on the middle of the range
      targetPercent = (rangeStartPosition + rangeEndPosition) / 2;
    } else if (viewMode === 'combined') {
      // Center on the point position
      targetPercent = pointPosition;
    }

    // Calculate the scroll offset to center the target
    const targetPixel = (targetPercent / 100) * trackContainerWidth;
    const centerOffset = sliderContainerWidth / 2;
    const scrollOffset = -(targetPixel - centerOffset);

    // Clamp to valid scroll bounds
    const maxScroll = Math.min(0, sliderContainerWidth - trackContainerWidth);
    const clampedOffset = Math.max(maxScroll, Math.min(0, scrollOffset));

    resetPosition({ x: clampedOffset, y: 0 });
    hasAutoScrolledRef.current = true;
  }, [
    scrollable,
    viewMode,
    pointPosition,
    rangeStartPosition,
    rangeEndPosition,
    resetPosition,
    sliderContainerWidth,
    trackContainerWidth,
  ]);
};

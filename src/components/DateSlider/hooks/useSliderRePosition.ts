import { type RefObject, useEffect } from 'react';

//when sliderContainerWidth changes, reset slider position, so it will still fill its parent div.
export function useSliderRePosition({
  sliderContainerWidth,
  previousSliderContainerWidth,
  sliderPosition,
  autoScrollToVisibleAreaRef,
  resetPosition,
}: {
  sliderContainerWidth: number;
  previousSliderContainerWidth: RefObject<number>;
  sliderPosition: { x: number; y: number };
  autoScrollToVisibleAreaRef: RefObject<boolean>;
  resetPosition: (newPosition?: { x: number; y: number }) => void;
}) {
  useEffect(() => {
    if (sliderContainerWidth === previousSliderContainerWidth.current) return;
    resetPosition({
      x: sliderPosition.x + sliderContainerWidth - previousSliderContainerWidth.current,
      y: 0,
    });
    previousSliderContainerWidth.current = sliderContainerWidth;
    autoScrollToVisibleAreaRef.current = true;
  }, [
    autoScrollToVisibleAreaRef,
    previousSliderContainerWidth,
    resetPosition,
    sliderContainerWidth,
    sliderPosition.x,
  ]);
}

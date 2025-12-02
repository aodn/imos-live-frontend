import { useEffect } from 'react';
import type { RefObject } from 'react';
import { DragHandle } from '../type';

type UseHandleVisible = {
  pointPosition: number;
  isHandleDragging: DragHandle;
  sliderPosition: {
    x: number;
    y: number;
  };
  dragBounds: {
    left: number;
    right: number;
  };
  resetPosition: (newPosition?: { x: number; y: number }) => void;
  pointHandleRef: RefObject<HTMLButtonElement | null>;
  sliderContainerRef: RefObject<HTMLDivElement | null>;
  isSliderDragging: boolean;
  autoScrollToVisibleAreaEnabled: RefObject<boolean>;
};
/**
 * auto scroll slider to keep handle in view when position changes via buttons or keyboard
 */
export const useHandleVisible = ({
  pointHandleRef,
  isHandleDragging,
  sliderContainerRef,
  dragBounds,
  sliderPosition,
  resetPosition,
  pointPosition,
  isSliderDragging,
  autoScrollToVisibleAreaEnabled,
}: UseHandleVisible) => {
  useEffect(() => {
    if (
      !isSliderDragging &&
      !isHandleDragging &&
      autoScrollToVisibleAreaEnabled.current &&
      sliderContainerRef.current &&
      pointHandleRef?.current
    ) {
      const handleRect = pointHandleRef.current.getBoundingClientRect();
      const containerRect = sliderContainerRef.current.getBoundingClientRect();

      const distanceFromRightEdge = containerRect.right - handleRect.right;
      const distanceFromLeftEdge = handleRect.left - containerRect.left;
      const sliderContainerWidth = containerRect.width;
      const handleWidth = handleRect.width;

      // Handle is outside visible area on the right
      if (distanceFromRightEdge < 0) {
        const newX =
          sliderPosition.x + distanceFromRightEdge - handleWidth - sliderContainerWidth / 2;
        const clampedX = Math.max(newX, dragBounds.left);
        resetPosition({ x: clampedX, y: 0 });
        autoScrollToVisibleAreaEnabled.current = false;
      }
      // Handle is outside visible area on the left
      else if (distanceFromLeftEdge < 0) {
        const newX =
          sliderPosition.x - distanceFromLeftEdge + handleWidth + sliderContainerWidth / 2;
        const clampedX = Math.min(newX, dragBounds.right);
        resetPosition({ x: clampedX, y: 0 });
        autoScrollToVisibleAreaEnabled.current = false;
      }
    }
  }, [
    pointPosition,
    isHandleDragging,
    sliderPosition.x,
    dragBounds,
    resetPosition,
    pointHandleRef,
    sliderContainerRef,
    isSliderDragging,
    autoScrollToVisibleAreaEnabled,
  ]);
};

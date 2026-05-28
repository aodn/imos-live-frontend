import { useCallback, useEffect } from 'react';
import { PERCENTAGE } from '../constants';
import type { TimeUnit, ViewMode, DragHandle } from '../type';
import {
  clampToLowerBound,
  getPercentageFromTouchEvent,
  getPercentageFromMouseEvent,
  getAllScalesPercentage,
} from '../utils';

type UseEventHandlersParams = {
  // Date range and time settings
  dates: {
    startDate: Date;
    endDate: Date;
  };
  timeUnit: TimeUnit;
  viewMode: ViewMode;

  // Position refs
  positions: {
    rangeStartRef: React.RefObject<number>;
    rangeEndRef: React.RefObject<number>;
    pointPositionRef: React.RefObject<number>;
  };

  // Handler callbacks
  handlers: {
    updateHandlePosition: (handle: DragHandle, percentage: number) => void;
    moveByStep: (direction: 'forward' | 'backward', target?: DragHandle) => void;
    requestHandleFocus: (handleType: DragHandle, interactionType?: 'mouse' | 'keyboard') => void;
    handleDragComplete: () => void;
  };

  // Drag state
  dragState: {
    isDragging: DragHandle;
    handleDragStarted: boolean;
    isContainerDragging: boolean;
  };

  // State setters
  setters: {
    setIsDragging: React.Dispatch<React.SetStateAction<DragHandle>>;
    setDragStarted: React.Dispatch<React.SetStateAction<boolean>>;
    setLastInteractionType: React.Dispatch<React.SetStateAction<'mouse' | 'keyboard' | null>>;
  };

  // Element refs
  refs: {
    trackRef: React.RefObject<HTMLDivElement | null>;
    sliderRef: React.RefObject<HTMLDivElement | null>;
    autoScrollToVisibleAreaRef: React.MutableRefObject<boolean>;
  };

  // Configuration
  config: {
    totalScaleUnits: number;
    freeSelectionOnTrackClick: boolean;
  };
};

/**
 * Custom hook to manage all user interaction event handlers for the slider.
 *
 * Handles:
 * - Mouse/touch drag interactions on handles
 * - Click/touch interactions on the track
 * - Keyboard navigation (arrow keys, Home, End)
 * - Automatic snapping to scale units (optional)
 *
 * Sets up global event listeners for drag operations and cleans them up properly.
 *
 * @returns Event handler functions for mouse, touch, and keyboard events
 */
export function useEventHandlers({
  dates,
  timeUnit,
  viewMode,
  positions,
  handlers,
  dragState,
  setters,
  refs,
  config,
}: UseEventHandlersParams) {
  const { startDate, endDate } = dates;
  const { rangeStartRef, rangeEndRef, pointPositionRef } = positions;
  const { updateHandlePosition, moveByStep, requestHandleFocus, handleDragComplete } = handlers;
  const { isDragging, handleDragStarted, isContainerDragging } = dragState;
  const { setIsDragging, setDragStarted, setLastInteractionType } = setters;
  const { trackRef, sliderRef, autoScrollToVisibleAreaRef } = refs;
  const { totalScaleUnits, freeSelectionOnTrackClick } = config;
  const findClosestHandle = useCallback(
    (percentage: number): DragHandle => {
      const distances = [
        { type: 'start' as const, dist: Math.abs(percentage - rangeStartRef.current) },
        { type: 'end' as const, dist: Math.abs(percentage - rangeEndRef.current) },
        { type: 'point' as const, dist: Math.abs(percentage - pointPositionRef.current) },
      ];

      const availableHandles = distances.filter(d => {
        if (viewMode === 'point' && d.type !== 'point') return false;
        if (viewMode === 'range' && d.type === 'point') return false;
        return true;
      });

      if (availableHandles.length === 0) return 'point';
      return availableHandles.reduce((a, b) => (a.dist < b.dist ? a : b)).type;
    },
    [pointPositionRef, rangeEndRef, rangeStartRef, viewMode],
  );

  const handleRangeClick = useCallback(
    (percentage: number) => {
      const distanceToStart = Math.abs(percentage - rangeStartRef.current);
      const distanceToEnd = Math.abs(percentage - rangeEndRef.current);
      const closestHandle = distanceToStart < distanceToEnd ? 'start' : 'end';

      updateHandlePosition(closestHandle, percentage);
      requestHandleFocus(closestHandle, 'mouse');
    },
    [rangeStartRef, rangeEndRef, updateHandlePosition, requestHandleFocus],
  );

  const handleStart = useCallback(
    (handle: DragHandle) => (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      setIsDragging(handle);
      setDragStarted(false);
      setLastInteractionType('mouse'); // treat both as "mouse" for UI purposes
    },
    [setIsDragging, setDragStarted, setLastInteractionType],
  );

  const handleMove = useCallback(
    (e: globalThis.MouseEvent | globalThis.TouchEvent) => {
      if (!isDragging) return;

      if ('touches' in e) {
        e.preventDefault();
      }

      requestAnimationFrame(() => {
        const percentage =
          'touches' in e
            ? getPercentageFromTouchEvent(e, trackRef)
            : getPercentageFromMouseEvent(e, trackRef);

        updateHandlePosition(isDragging, percentage);
      });
    },
    [isDragging, trackRef, updateHandlePosition],
  );

  const handleEnd = useCallback(() => {
    if (isDragging) {
      handleDragComplete();
    }
  }, [isDragging, handleDragComplete]);

  const handleTrackInteraction = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (isDragging || handleDragStarted || isContainerDragging || !sliderRef.current) {
        return;
      }

      let percentage: number;
      if ('touches' in e) {
        percentage = getPercentageFromTouchEvent(e, trackRef);
      } else {
        percentage = getPercentageFromMouseEvent(e, trackRef);
      }

      //snap the selection stick to the scales.
      const clampedPercentage = clampToLowerBound(
        percentage,
        getAllScalesPercentage(startDate, endDate, timeUnit, totalScaleUnits),
      );

      switch (viewMode) {
        case 'range':
          handleRangeClick(freeSelectionOnTrackClick ? percentage : clampedPercentage);
          break;
        case 'point':
          updateHandlePosition('point', freeSelectionOnTrackClick ? percentage : clampedPercentage);
          requestHandleFocus('point', 'mouse');
          break;
        case 'combined': {
          const closestHandle = findClosestHandle(percentage);
          updateHandlePosition(
            closestHandle,
            freeSelectionOnTrackClick ? percentage : clampedPercentage,
          );
          requestHandleFocus(closestHandle, 'mouse');
          break;
        }
      }
    },
    [
      isDragging,
      handleDragStarted,
      isContainerDragging,
      sliderRef,
      startDate,
      endDate,
      timeUnit,
      totalScaleUnits,
      viewMode,
      trackRef,
      handleRangeClick,
      freeSelectionOnTrackClick,
      updateHandlePosition,
      requestHandleFocus,
      findClosestHandle,
    ],
  );

  const handleMouseDown = handleStart;
  const handleTouchStart = handleStart;
  const handleMouseMove = handleMove;
  const handleTouchMove = handleMove;
  const handleMouseUp = handleEnd;
  const handleTouchEnd = handleEnd;
  const handleTrackClick = handleTrackInteraction;
  const handleTrackTouch = handleTrackInteraction;

  const handleHandleKeyDown = useCallback(
    (handle: DragHandle) => (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowDown':
          e.preventDefault();
          setLastInteractionType('keyboard');
          moveByStep('backward', handle);
          break;
        case 'ArrowRight':
        case 'ArrowUp':
          e.preventDefault();
          setLastInteractionType('keyboard');
          moveByStep('forward', handle);
          break;
        case 'Home': {
          e.preventDefault();
          setLastInteractionType('keyboard');
          updateHandlePosition(handle, 0);
          autoScrollToVisibleAreaRef.current = true;
          break;
        }
        case 'End': {
          e.preventDefault();
          setLastInteractionType('keyboard');
          updateHandlePosition(handle, PERCENTAGE.MAX);
          autoScrollToVisibleAreaRef.current = true;
          break;
        }
      }
    },
    [setLastInteractionType, moveByStep, updateHandlePosition, autoScrollToVisibleAreaRef],
  );

  // Set up global event listeners for mouse and touch events
  useEffect(() => {
    if (!isDragging) return;

    // Mouse events
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      // Clean up mouse events
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      // Clean up touch events
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  return {
    handleMouseDown,
    handleTouchStart,
    handleTrackClick,
    handleTrackTouch,
    handleHandleKeyDown,
  };
}

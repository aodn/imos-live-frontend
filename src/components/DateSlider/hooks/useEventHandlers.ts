import { useCallback, useEffect } from 'react';
import { DragHandle, TimeUnit, ViewMode } from '../type';
import {
  getAllScalesPercentage,
  getPercentageFromMouseEvent,
  getPercentageFromTouchEvent,
} from '../utils';
import { clampToLowerBound, snapToClosestStep } from '@/utils';

export function useEventHanlders(
  startDate: Date,
  endDate: Date,
  timeUnit: TimeUnit,
  rangeStartRef: React.RefObject<number>,
  rangeEndRef: React.RefObject<number>,
  pointPositionRef: React.RefObject<number>,
  viewMode: ViewMode,
  updateHandlePosition: (handle: DragHandle, percentage: number) => void,
  requestHandleFocus: (handleType: DragHandle, interactionType?: 'mouse' | 'keyboard') => void,
  setIsDragging: React.Dispatch<React.SetStateAction<DragHandle>>,
  setDragStarted: React.Dispatch<React.SetStateAction<boolean>>,
  setLastInteractionType: React.Dispatch<React.SetStateAction<'mouse' | 'keyboard' | null>>,
  isDragging: DragHandle,
  trackRef: React.RefObject<HTMLDivElement | null>,
  handleDragComplete: () => void,
  sliderRef: React.RefObject<HTMLDivElement | null>,
  dragStarted: boolean,
  isContainerDragging: boolean,
  totalScaleUnits: number,
  freeSelectionOnTrackClick: boolean,
) {
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
        // TouchEvent
        e.preventDefault(); // prevent scrolling when touch event
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
      if (isDragging || dragStarted || isContainerDragging || !sliderRef.current) {
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
      dragStarted,
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
      const step = (1 / totalScaleUnits) * 100;
      let newPercentage: number | undefined;

      const scaleUnitsPercentags = getAllScalesPercentage(
        startDate,
        endDate,
        timeUnit,
        totalScaleUnits,
      );

      const currentPosition =
        handle === 'start'
          ? rangeStartRef.current
          : handle === 'end'
            ? rangeEndRef.current
            : pointPositionRef.current;

      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowDown':
          e.preventDefault();
          newPercentage = freeSelectionOnTrackClick
            ? currentPosition - step
            : snapToClosestStep(currentPosition - step, scaleUnitsPercentags);
          break;
        case 'ArrowRight':
        case 'ArrowUp':
          e.preventDefault();
          newPercentage = freeSelectionOnTrackClick
            ? currentPosition + step
            : snapToClosestStep(currentPosition + step, scaleUnitsPercentags);
          break;
        case 'Home':
          e.preventDefault();
          newPercentage = 0;
          break;
        case 'End':
          e.preventDefault();
          newPercentage = 99.9999;
          break;
      }

      if (newPercentage !== undefined) {
        setLastInteractionType('keyboard');
        updateHandlePosition(handle, newPercentage);
      }
    },
    [
      totalScaleUnits,
      startDate,
      endDate,
      timeUnit,
      rangeStartRef,
      rangeEndRef,
      pointPositionRef,
      freeSelectionOnTrackClick,
      setLastInteractionType,
      updateHandlePosition,
    ],
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

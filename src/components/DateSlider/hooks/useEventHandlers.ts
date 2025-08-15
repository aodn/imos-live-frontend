import { useCallback, useEffect } from 'react';
import { DragHandle, ViewMode } from '../type';
import {
  getAllScaleUnitsPercentage,
  getPercentageFromMouseEvent,
  getPercentageFromTouchEvent,
} from '../utils';
import { clampToLowerBound, snapToClosestStep } from '@/utils';

export function useEventHanlders(
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

  // Mouse event handlers
  const handleMouseDown = useCallback(
    (handle: DragHandle) => (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsDragging(handle);
      setDragStarted(false);
      setLastInteractionType('mouse');
    },
    [setIsDragging, setDragStarted, setLastInteractionType],
  );

  // Touch event handlers
  const handleTouchStart = useCallback(
    (handle: DragHandle) => (e: React.TouchEvent) => {
      e.stopPropagation();
      setIsDragging(handle);
      setDragStarted(false);
      setLastInteractionType('mouse'); // Treat touch as mouse interaction for UI purposes
    },
    [setIsDragging, setDragStarted, setLastInteractionType],
  );

  const handleMouseMove = useCallback(
    (e: globalThis.MouseEvent) => {
      if (!isDragging) return;
      requestAnimationFrame(() => {
        const percentage = getPercentageFromMouseEvent(e, trackRef);
        updateHandlePosition(isDragging, percentage);
      });
    },
    [isDragging, trackRef, updateHandlePosition],
  );

  const handleTouchMove = useCallback(
    (e: globalThis.TouchEvent) => {
      if (!isDragging) return;
      e.preventDefault(); // Prevent scrolling while dragging
      requestAnimationFrame(() => {
        const percentage = getPercentageFromTouchEvent(e, trackRef);
        updateHandlePosition(isDragging, percentage);
      });
    },
    [isDragging, trackRef, updateHandlePosition],
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      handleDragComplete();
    }
  }, [isDragging, handleDragComplete]);

  const handleTouchEnd = useCallback(() => {
    if (isDragging) {
      handleDragComplete();
    }
  }, [isDragging, handleDragComplete]);

  const handleTrackClick = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging || dragStarted || isContainerDragging || !sliderRef.current) {
        return;
      }

      const percentage = getPercentageFromMouseEvent(e, trackRef);
      const clampedPercentage = clampToLowerBound(
        percentage,
        getAllScaleUnitsPercentage(totalScaleUnits),
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
      trackRef,
      totalScaleUnits,
      viewMode,
      handleRangeClick,
      freeSelectionOnTrackClick,
      updateHandlePosition,
      requestHandleFocus,
      findClosestHandle,
    ],
  );

  const handleTrackTouch = useCallback(
    (e: React.TouchEvent) => {
      if (isDragging || dragStarted || isContainerDragging || !sliderRef.current) {
        return;
      }

      const percentage = getPercentageFromTouchEvent(e, trackRef);

      switch (viewMode) {
        case 'range':
          handleRangeClick(percentage);
          break;
        case 'point':
          updateHandlePosition('point', percentage);
          requestHandleFocus('point', 'mouse');
          break;
        case 'combined': {
          const closestHandle = findClosestHandle(percentage);
          updateHandlePosition(closestHandle, percentage);
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
      trackRef,
      viewMode,
      handleRangeClick,
      updateHandlePosition,
      requestHandleFocus,
      findClosestHandle,
    ],
  );

  const handleHandleKeyDown = useCallback(
    (handle: DragHandle) => (e: React.KeyboardEvent) => {
      const step = (1 / totalScaleUnits) * 100;
      let newPercentage: number | undefined;

      const scaleUnitsPercentags = getAllScaleUnitsPercentage(totalScaleUnits);

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
          newPercentage = snapToClosestStep(currentPosition - step, scaleUnitsPercentags);
          break;
        case 'ArrowRight':
        case 'ArrowUp':
          e.preventDefault();
          newPercentage = snapToClosestStep(currentPosition + step, scaleUnitsPercentags);
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
      rangeStartRef,
      rangeEndRef,
      pointPositionRef,
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

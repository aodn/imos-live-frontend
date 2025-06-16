import { useCallback } from 'react';
import { DragHandle, ViewMode } from '../type';
import { getPercentageFromMouseEvent } from '../utils';

export function useEventHanldeMethods(
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

  const handleMouseDown = useCallback(
    (handle: DragHandle) => (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsDragging(handle);
      setDragStarted(false);
      setLastInteractionType('mouse');
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

  const handleMouseUp = useCallback(() => {
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
      const largeStep = step * 5;
      let newPercentage: number | undefined;

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
          newPercentage = currentPosition - step;
          break;
        case 'ArrowRight':
        case 'ArrowUp':
          e.preventDefault();
          newPercentage = currentPosition + step;
          break;
        case 'PageDown':
          e.preventDefault();
          newPercentage = currentPosition - largeStep;
          break;
        case 'PageUp':
          e.preventDefault();
          newPercentage = currentPosition + largeStep;
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
  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTrackClick,
    handleHandleKeyDown,
  };
}

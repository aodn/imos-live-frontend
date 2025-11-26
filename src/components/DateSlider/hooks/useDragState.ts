import { useState, useCallback } from 'react';
import { DragHandle } from '../type';
import { TIMING } from '../constants';

/**
 * Custom hook to manage drag state for slider handles.
 *
 * Tracks which handle (if any) is currently being dragged and
 * whether a drag operation has started (to distinguish from clicks).
 *
 * @returns Drag state and control functions
 */
export function useDragState() {
  const [isDragging, setIsDragging] = useState<DragHandle>(null);
  const [dragStarted, setDragStarted] = useState(false);

  const handleDragComplete = useCallback(() => {
    setTimeout(() => setDragStarted(false), TIMING.DRAG_COMPLETE_DELAY);
    setIsDragging(null);
  }, []);

  return {
    isDragging,
    dragStarted,
    setIsDragging,
    setDragStarted,
    handleDragComplete,
  };
}

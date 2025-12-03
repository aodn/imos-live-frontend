import { useCallback, useState } from 'react';
import { TIMING } from '../constants';
import { DragHandle } from '../type';

/**
 * Custom hook to manage drag state for slider handles.
 *
 * Tracks which handle (if any) is currently being dragged and
 * whether a drag operation has started (to distinguish from clicks).
 *
 * @returns Drag state and control functions
 */
export function useHandleDragState() {
  const [isHandleDragging, setIsHandleDragging] = useState<DragHandle>(null);
  const [handleDragStarted, setHandleDragStarted] = useState(false);

  const handleDragComplete = useCallback(() => {
    setTimeout(() => setHandleDragStarted(false), TIMING.DRAG_COMPLETE_DELAY);
    setIsHandleDragging(null);
  }, []);

  return {
    isHandleDragging,
    handleDragStarted,
    setIsHandleDragging,
    setHandleDragStarted,
    handleDragComplete,
  };
}

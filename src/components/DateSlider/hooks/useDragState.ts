import { useState, useCallback } from 'react';
import { DragHandle } from '../type';

export function useDragState() {
  const [isDragging, setIsDragging] = useState<DragHandle>(null);
  const [dragStarted, setDragStarted] = useState(false);

  const handleDragComplete = useCallback(() => {
    setTimeout(() => setDragStarted(false), 50);
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

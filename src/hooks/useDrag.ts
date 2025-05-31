import { clamp } from '@/utils';
import React, { useState, useRef, useCallback, useEffect } from 'react';

type UseDragProps = {
  targetRef?: React.RefObject<HTMLElement | null>;
  initialPosition?: { x: number; y: number };
  constrainToAxis?: 'x' | 'y' | 'both';
  bounds?: {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
  };
  disabled?: boolean;
  onDrag?: (position: { x: number; y: number }, delta: { x: number; y: number }) => void;
  onDragStart?: (position: { x: number; y: number }) => void;
  onDragStarted?: (position: { x: number; y: number }) => void;
  onDragEnd?: (position: { x: number; y: number }) => void;
};

type DragState = {
  isDragging: boolean;
  startX: number;
  startY: number;
  deltaX: number;
  deltaY: number;
  position: { x: number; y: number };
};

export const useDrag = ({
  targetRef,
  initialPosition = { x: 0, y: 0 },
  constrainToAxis = 'both',
  bounds,
  disabled = false,
  onDrag,
  onDragStart,
  onDragStarted,
  onDragEnd,
}: UseDragProps = {}) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPositionRef = useRef(initialPosition);
  const hasStartedDraggingRef = useRef(false);

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    deltaX: 0,
    deltaY: 0,
    position: initialPosition,
  });

  // Apply bounds constraints
  const applyBounds = useCallback(
    (pos: { x: number; y: number }) => {
      if (!bounds) return pos;

      return {
        x: clamp(pos.x, bounds.left ?? -Infinity, bounds.right ?? Infinity),
        y: clamp(pos.y, bounds.top ?? -Infinity, bounds.bottom ?? Infinity),
      };
    },
    [bounds],
  );

  // Apply transform to element
  const applyTransform = useCallback(
    (pos: { x: number; y: number }) => {
      if (targetRef?.current) {
        targetRef.current.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
      }
    },
    [targetRef],
  );

  const updatePosition = useCallback(
    (deltaX: number, deltaY: number) => {
      // Fire onDragStarted only once when drag actually begins
      if (!hasStartedDraggingRef.current && onDragStarted) {
        hasStartedDraggingRef.current = true;
        onDragStarted(dragStartPositionRef.current);
      }

      const rawPosition = {
        x:
          constrainToAxis === 'y'
            ? dragStartPositionRef.current.x
            : dragStartPositionRef.current.x + deltaX,
        y:
          constrainToAxis === 'x'
            ? dragStartPositionRef.current.y
            : dragStartPositionRef.current.y + deltaY,
      };

      const boundedPosition = applyBounds(rawPosition);
      setPosition(boundedPosition);
      setDragState(prev => ({
        ...prev,
        deltaX,
        deltaY,
        position: boundedPosition,
      }));

      applyTransform(boundedPosition);
      onDrag?.(boundedPosition, { x: deltaX, y: deltaY });
    },
    [constrainToAxis, applyBounds, applyTransform, onDrag, onDragStarted],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (disabled || !targetRef?.current) return;

      e.preventDefault();
      const startX = e.clientX;
      const startY = e.clientY;

      setIsDragging(true);
      dragStartPositionRef.current = { ...position };
      hasStartedDraggingRef.current = false; // Reset the flag

      setDragState({
        isDragging: true,
        startX,
        startY,
        deltaX: 0,
        deltaY: 0,
        position,
      });

      onDragStart?.(position);

      const handleMouseMove = (e: MouseEvent) => {
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        updatePosition(deltaX, deltaY);
      };

      const handleMouseUp = () => {
        if (!targetRef?.current) return;
        setIsDragging(false);
        hasStartedDraggingRef.current = false; // Reset the flag
        setDragState(prev => ({
          ...prev,
          isDragging: false,
        }));

        onDragEnd?.(position);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [disabled, position, onDragStart, targetRef, updatePosition, onDragEnd],
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;

      const touch = e.touches[0];
      const startX = touch.clientX;
      const startY = touch.clientY;

      setIsDragging(true);
      dragStartPositionRef.current = { ...position };
      hasStartedDraggingRef.current = false; // Reset the flag

      setDragState({
        isDragging: true,
        startX,
        startY,
        deltaX: 0,
        deltaY: 0,
        position,
      });

      onDragStart?.(position);

      const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        const touch = e.touches[0];
        const deltaX = touch.clientX - startX;
        const deltaY = touch.clientY - startY;
        updatePosition(deltaX, deltaY);
      };

      const handleTouchEnd = () => {
        setIsDragging(false);
        hasStartedDraggingRef.current = false; // Reset the flag
        setDragState(prev => ({
          ...prev,
          isDragging: false,
        }));

        onDragEnd?.(position);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };

      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    },
    [disabled, position, onDragStart, onDragEnd, updatePosition],
  );

  const resetPosition = useCallback(
    (newPosition = initialPosition) => {
      const boundedPosition = applyBounds(newPosition);
      setPosition(boundedPosition);
      setDragState(prev => ({
        ...prev,
        position: boundedPosition,
        deltaX: 0,
        deltaY: 0,
      }));
      applyTransform(boundedPosition);
    },
    [initialPosition, applyBounds, applyTransform],
  );

  // Initialize transform on mount and when position changes
  useEffect(() => {
    applyTransform(position);
  }, [applyTransform, position]);

  return {
    position,
    isDragging,
    dragState,
    resetPosition,
    dragHandlers: {
      onMouseDown: handleMouseDown,
      onTouchStart: handleTouchStart,
    },
  };
};

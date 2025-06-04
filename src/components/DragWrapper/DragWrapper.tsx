import { useDidMountEffect, useDrag, useResizeObserver } from '@/hooks';
import { cn } from '@/lib/utils';
import { clamp, queryIncludingSelf } from '@/utils';
import { ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 when in parent bounday its parent container needs to have position: relative
 */

type PositionType = {
  x: number;
  y: number;
};
type RelativeType = 'topLeft' | 'topRight';

export type DragWrapperProps = {
  boundary?: 'window' | 'parent';
  dragHandleClassName?: string;
  children: ReactNode;
  initialPosition?: PositionType;
  disableDragging?: boolean;
  isPositionReset?: boolean;
  className?: string;
  relative?: RelativeType;
};

export const DragWrapper = ({
  boundary,
  dragHandleClassName,
  children,
  initialPosition,
  disableDragging,
  isPositionReset,
  className,
  relative = 'topLeft',
}: DragWrapperProps) => {
  const dragTargetElementRef = useRef<HTMLDivElement>(null);
  const [parentDimesion, setParentDimesion] = useState({ width: 0, height: 0 });
  const [targetDimesion, setTargetDimesion] = useState({ width: 0, height: 0 });
  const [isDimensionsReady, setIsDimensionsReady] = useState(false);
  const previousBoundsRef = useRef({ width: 0, height: 0 });

  //convert initial position of the draggable element relative to topRight or topLeft.
  const preocessInitialPosition = useCallback(
    (relative: RelativeType, initialPosition?: PositionType): PositionType => {
      if (!initialPosition) initialPosition = { x: 0, y: 0 };
      if (relative === 'topRight') {
        const x = parentDimesion.width - targetDimesion.width - initialPosition.x;
        const y = initialPosition.y;
        return { x, y };
      }
      return initialPosition;
    },
    [parentDimesion.width, targetDimesion.width],
  );

  // Calculate bounds for the draggable element, the starting position is left:0 and top:0 when implement translateX and translateY.
  const calculateBounds = useCallback(() => {
    return {
      left: 0,
      right: Math.max(0, parentDimesion.width - targetDimesion.width),
      top: 0,
      bottom: Math.max(0, parentDimesion.height - targetDimesion.height),
    };
  }, [parentDimesion.width, parentDimesion.height, targetDimesion.width, targetDimesion.height]);

  const updateDimesion = useCallback(() => {
    if (!dragTargetElementRef.current) return;

    let parentWidth = 0;
    let parentHeight = 0;

    if (boundary === 'parent') {
      const parentElement = dragTargetElementRef.current.parentElement;
      if (!parentElement) return;
      const rect = parentElement.getBoundingClientRect();
      parentWidth = rect.width;
      parentHeight = rect.height;
    } else {
      parentWidth = window.innerWidth;
      parentHeight = window.innerHeight;
    }

    const { width: targetWidth, height: targetHeight } =
      dragTargetElementRef.current.getBoundingClientRect();

    // Store previous dimensions to detect changes
    const previousBounds = previousBoundsRef.current;
    const dimensionsChanged =
      previousBounds.width !== parentWidth || previousBounds.height !== parentHeight;

    setParentDimesion({ width: parentWidth, height: parentHeight });
    setTargetDimesion({ width: targetWidth, height: targetHeight });

    // Update previous bounds reference
    previousBoundsRef.current = { width: parentWidth, height: parentHeight };

    // Set dimensions ready when both parent and target have valid dimensions
    if (parentWidth > 0 && targetWidth > 0 && !isDimensionsReady) {
      setIsDimensionsReady(true);
    }

    // Return whether dimensions changed for use in effect
    return { dimensionsChanged, parentWidth, parentHeight, targetWidth, targetHeight };
  }, [boundary, isDimensionsReady]);

  useResizeObserver(dragTargetElementRef, updateDimesion);
  useResizeObserver(
    boundary === 'parent' ? (dragTargetElementRef.current?.parentElement ?? null) : 'window',
    updateDimesion,
  );

  useLayoutEffect(() => {
    updateDimesion();
  }, [updateDimesion]);

  // Only initialize useDrag when dimensions are ready
  const dragConfig = isDimensionsReady
    ? {
        targetRef: dragTargetElementRef,
        initialPosition: preocessInitialPosition(relative, initialPosition),
        constrainToAxis: 'both' as const,
        bounds: calculateBounds(),
      }
    : {
        targetRef: dragTargetElementRef,
        initialPosition: { x: 0, y: 0 },
        constrainToAxis: 'both' as const,
        bounds: { left: 0, right: 0, top: 0, bottom: 0 },
        disabled: true, // Disable dragging until dimensions are ready
      };

  const { dragHandlers, resetPosition, position: currentPosition } = useDrag(dragConfig);

  // Handle dimension changes and reposition element if needed
  useEffect(() => {
    if (!isDimensionsReady) return;

    const bounds = calculateBounds();

    // Check if current position is outside new bounds
    const isOutOfBounds =
      currentPosition.x > bounds.right ||
      currentPosition.y > bounds.bottom ||
      currentPosition.x < bounds.left ||
      currentPosition.y < bounds.top;

    if (isOutOfBounds) {
      // Constrain current position to new bounds
      const constrainedPosition = {
        x: clamp(currentPosition.x, bounds.left, bounds.right),
        y: clamp(currentPosition.y, bounds.top, bounds.bottom),
      };

      resetPosition(constrainedPosition);
    }
  }, [
    parentDimesion.width,
    parentDimesion.height,
    targetDimesion.width,
    targetDimesion.height,
    isDimensionsReady,
    calculateBounds,
    currentPosition,
    resetPosition,
  ]);

  useDidMountEffect(() => {
    if (isDimensionsReady) {
      resetPosition();
    }
  }, [isPositionReset, isDimensionsReady]);

  //add dragHandlers to element with dragHandleClassName
  useEffect(() => {
    if (!dragTargetElementRef.current || disableDragging || !isDimensionsReady) return;

    const container = dragTargetElementRef.current;
    if (!container) return;
    let handleElements: Element[] = [container];

    if (
      dragHandleClassName &&
      queryIncludingSelf(container, `.${dragHandleClassName}`).length !== 0
    ) {
      handleElements = queryIncludingSelf(container, `.${dragHandleClassName}`);
    }

    const eventHandlers = Object.entries(dragHandlers).map(([key, handler]) => {
      const eventName = key.toLowerCase().replace('on', '');
      return { eventName, handler: handler as unknown as EventListener };
    });

    handleElements.forEach(element => {
      eventHandlers.forEach(({ eventName, handler }) => {
        element.addEventListener(eventName, handler);
      });
    });

    return () => {
      handleElements.forEach(element => {
        eventHandlers.forEach(({ eventName, handler }) => {
          element.removeEventListener(eventName, handler);
        });
      });
    };
  }, [dragHandlers, dragHandleClassName, disableDragging, isDimensionsReady]);

  return (
    <div
      ref={dragTargetElementRef}
      className={cn(
        'w-fit h-fit',
        {
          'absolute top-0 left-0': boundary == 'parent',
          'fixed top-0 left-0': boundary == 'window',
        },
        className,
      )}
    >
      {children}
    </div>
  );
};

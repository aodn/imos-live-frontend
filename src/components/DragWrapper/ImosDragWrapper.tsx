import { useDidMountEffect, useDrag, useResizeObserver } from '@/hooks';
import { cn } from '@/lib/utils';
import { queryIncludingSelf } from '@/utils';
import { ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 when in parent bounday its parent container needs to have position: relative
 */

type PositionType = {
  x: number;
  y: number;
};
type RelativeType = 'topLeft' | 'topRight';

type Props = {
  boundary?: 'window' | 'parent';
  dragHandleClassName?: string;
  children: ReactNode;
  initialPosition?: PositionType;
  disableDragging?: boolean;
  isPositionReset?: boolean;
  className?: string;
  relative?: RelativeType;
};

export const ImosDragWrapper = ({
  boundary,
  dragHandleClassName,
  children,
  initialPosition,
  disableDragging,
  isPositionReset,
  className,
  relative = 'topLeft',
}: Props) => {
  const dragTargetElementRef = useRef<HTMLDivElement>(null);
  const [parentDimesion, setParentDimesion] = useState({ width: 0, height: 0 });
  const [targetDimesion, setTargetDimesion] = useState({ width: 0, height: 0 });
  const [isDimensionsReady, setIsDimensionsReady] = useState(false);

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

    setParentDimesion({ width: parentWidth, height: parentHeight });
    setTargetDimesion({ width: targetWidth, height: targetHeight });

    // Set dimensions ready when both parent and target have valid dimensions
    if (parentWidth > 0 && targetWidth > 0 && !isDimensionsReady) {
      setIsDimensionsReady(true);
    }
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
        bounds: {
          left: 0,
          right: parentDimesion.width - targetDimesion.width,
          top: 0,
          bottom: parentDimesion.height - targetDimesion.height,
        },
        onDragEnd: () => console.log('drag end'),
        onDragStarted: () => console.log('drag started'),
      }
    : {
        targetRef: dragTargetElementRef,
        initialPosition: { x: 0, y: 0 },
        constrainToAxis: 'both' as const,
        bounds: { left: 0, right: 0, top: 0, bottom: 0 },
        disabled: true, // Disable dragging until dimensions are ready
      };

  const { dragHandlers, resetPosition } = useDrag(dragConfig);

  useDidMountEffect(() => {
    if (isDimensionsReady) {
      resetPosition();
    }
  }, [isPositionReset, isDimensionsReady]);

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

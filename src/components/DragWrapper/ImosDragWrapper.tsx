import { useDidMountEffect, useDrag, useResizeObserver } from '@/hooks';
import { cn } from '@/lib/utils';
import { queryIncludingSelf } from '@/utils';
import { ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

type PositionType = {
  x: number;
  y: number;
};
type Props = {
  boundary?: 'window' | 'parent';
  dragHandleClassName?: string;
  children: ReactNode;
  initialPosition?: PositionType;
  disableDragging?: boolean;
  isPositionReset?: boolean;
  className?: string;
};

export const ImosDragWrapper = ({
  boundary,
  dragHandleClassName,
  children,
  initialPosition,
  disableDragging,
  isPositionReset,
  className,
}: Props) => {
  const dragTargetElementRef = useRef<HTMLDivElement>(null);
  const [parentDimesion, setParentDimesion] = useState({ width: 0, height: 0 });
  const [targetDimesion, setTargetDimesion] = useState({ width: 0, height: 0 });
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
  }, [boundary]);

  useResizeObserver(dragTargetElementRef, updateDimesion);
  useResizeObserver(
    boundary === 'parent' ? (dragTargetElementRef.current?.parentElement ?? null) : 'window',
    updateDimesion,
  );

  useLayoutEffect(() => {
    updateDimesion();
  }, [updateDimesion]);

  const { dragHandlers, resetPosition } = useDrag({
    targetRef: dragTargetElementRef,
    initialPosition: initialPosition,
    constrainToAxis: 'both',
    bounds: {
      left: 0,
      right: parentDimesion.width - targetDimesion.width,
      top: 0,
      bottom: parentDimesion.height - targetDimesion.height,
    },
    onDragEnd: () => console.log('drag end'),
    onDragStarted: () => console.log('drag started'),
  });

  useDidMountEffect(() => {
    resetPosition();
  }, [isPositionReset]);

  useEffect(() => {
    if (!dragTargetElementRef.current || disableDragging) return;

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

    // Add event listeners to each handle element
    handleElements.forEach(element => {
      eventHandlers.forEach(({ eventName, handler }) => {
        element.addEventListener(eventName, handler);
      });
    });

    // Cleanup function
    return () => {
      handleElements.forEach(element => {
        eventHandlers.forEach(({ eventName, handler }) => {
          element.removeEventListener(eventName, handler);
        });
      });
    };
  }, [dragHandlers, dragHandleClassName, disableDragging]);

  return (
    <div ref={dragTargetElementRef} className={cn('w-fit h-fit ', className)}>
      {children}
    </div>
  );
};

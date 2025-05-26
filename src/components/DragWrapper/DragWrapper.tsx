import { ReactNode, useEffect, useRef, useState } from 'react';
import { Rnd } from 'react-rnd';
import { useResizeObserver } from '@/hooks';

type SizeType = {
  width: number;
  height: number;
};

type PositionType = {
  x: number;
  y: number;
};

export type DragWrapperProps = {
  children: ReactNode;
  dragHandleClassName?: string;
  bounds?: 'window' | 'parent';
  initialPosition?: PositionType;
  disableDragging?: boolean;
};

export const DragWrapper = ({
  children,
  dragHandleClassName,
  bounds = 'parent',
  initialPosition = { x: 10, y: 10 },
  disableDragging = false,
}: DragWrapperProps) => {
  const [size, setSize] = useState<SizeType>();
  const [position, setPosition] = useState<PositionType>({ x: 0, y: 0 });
  const [key, setKey] = useState(0); // Force re-render of Rnd component
  const tempWrapperRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLDivElement>(null);
  const parentSizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
  const inititalPositionMeasured = useRef(false);

  // Helper function to get container dimensions
  const getContainerDimensions = () => {
    if (bounds === 'window') {
      return { width: window.innerWidth, height: window.innerHeight };
    } else if (bounds === 'parent' && ref.current?.parentElement) {
      const parentElement = ref.current.parentElement.parentElement;

      const parentRect = parentElement?.getBoundingClientRect();
      return { width: parentRect?.width ?? 0, height: parentRect?.height ?? 0 };
    }
    return { width: 0, height: 0 };
  };

  // Helper function to adjust position to keep element within bounds
  const adjustPositionToBounds = (currentPos: PositionType, currentSize: SizeType) => {
    const container = getContainerDimensions();
    if (container.width === 0 || container.height === 0) return currentPos;

    const maxX = container.width - currentSize.width;
    const maxY = container.height - currentSize.height;

    return {
      x: Math.max(0, Math.min(currentPos.x, maxX)),
      y: Math.max(0, Math.min(currentPos.y, maxY)),
    };
  };

  // Get the size of the draggable element
  useEffect(() => {
    if (!tempWrapperRef.current) return;
    const { width, height } = tempWrapperRef.current.getBoundingClientRect();
    setSize({ width, height });
  }, []);

  // Update element size when it changes (like collapsible toggle)
  useResizeObserver(ref, entry => {
    const { width, height } = entry.contentRect;
    const newSize = { width, height };

    // Only update if size actually changed
    if (size?.width !== width || size?.height !== height) {
      setSize(newSize);

      // Adjust position if size changed and element is positioned
      if (size && inititalPositionMeasured.current) {
        const adjustedPosition = adjustPositionToBounds(position, newSize);

        // Only update position if it needs adjustment
        if (adjustedPosition.x !== position.x || adjustedPosition.y !== position.y) {
          setPosition(adjustedPosition);
          setKey(k => k + 1); // Force re-render to apply new position
        }
      }
    }
  });

  // Watch parent size changes and adjust position
  useEffect(() => {
    if (
      bounds !== 'parent' ||
      !ref.current?.parentElement ||
      !size ||
      !inititalPositionMeasured.current
    )
      return;

    const parentElement = ref.current.parentElement.parentElement;
    if (!parentElement) return;

    const handleParentResize = () => {
      const parentRect = parentElement.getBoundingClientRect();
      const newParentWidth = parentRect.width;
      const newParentHeight = parentRect.height;
      const oldParentWidth = parentSizeRef.current.width;
      const oldParentHeight = parentSizeRef.current.height;

      if (
        oldParentWidth > 0 &&
        (newParentWidth !== oldParentWidth || newParentHeight !== oldParentHeight)
      ) {
        // Calculate distance from right and top edges
        const distanceFromRight = oldParentWidth - (position.x + size.width);
        const distanceFromTop = position.y;

        // Calculate new position to maintain same distance from right and top
        const newX = newParentWidth - size.width - distanceFromRight;
        const newY = distanceFromTop;

        // Ensure within bounds
        const clampedX = Math.max(0, Math.min(newX, newParentWidth - size.width));
        const clampedY = Math.max(0, Math.min(newY, newParentHeight - size.height));

        // Update position and force Rnd to re-render with new position
        setPosition({
          x: clampedX,
          y: clampedY,
        });

        // Force Rnd component to re-render with new position
        setKey(k => k + 1);
      }

      parentSizeRef.current = { width: newParentWidth, height: newParentHeight };
    };

    // Set initial parent size
    const parentRect = parentElement.getBoundingClientRect();
    parentSizeRef.current = { width: parentRect.width, height: parentRect.height };

    // Listen for parent size changes
    const resizeObserver = new ResizeObserver(handleParentResize);
    resizeObserver.observe(parentElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [bounds, size, position.x, position.y]);

  // Set element's initial position
  useEffect(() => {
    if (!size || inititalPositionMeasured.current) return;

    const container = getContainerDimensions();
    if (container.width === 0 || container.height === 0) return;

    const initialPos = {
      x: container.width - size.width - initialPosition.x,
      y: initialPosition.y,
    };

    // Ensure initial position is within bounds
    const adjustedPos = adjustPositionToBounds(initialPos, size);
    setPosition(adjustedPos);

    parentSizeRef.current = { width: container.width, height: container.height };
    inititalPositionMeasured.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, bounds, initialPosition.x, initialPosition.y]);

  if (!size) {
    return (
      <div ref={tempWrapperRef} className="absolute -left-9999 -top-9999">
        {children}
      </div>
    );
  }

  return (
    <Rnd
      disableDragging={disableDragging}
      key={key}
      dragHandleClassName={dragHandleClassName}
      size={{ width: size.width, height: size.height }}
      position={position}
      onDragStop={(_e, d) => {
        setPosition({ x: d.x, y: d.y });
      }}
      bounds={bounds}
    >
      <div ref={ref}>{children}</div>
    </Rnd>
  );
};

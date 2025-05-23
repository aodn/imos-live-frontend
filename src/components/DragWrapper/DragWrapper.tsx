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
//initialPosition is the distance to the top right corner of the bounds.
export type DragWrapperProps = {
  children: ReactNode;
  dragHandleClassName?: string;
  bounds?: 'window' | 'parent';
  initialPosition?: PositionType;
};

export const DragWrapper = ({
  children,
  dragHandleClassName,
  bounds = 'parent',
  initialPosition = { x: 10, y: 10 },
}: DragWrapperProps) => {
  const [size, setSize] = useState<SizeType>();
  const [position, setPosition] = useState<PositionType>({ x: 0, y: 0 });
  const tempWrapperRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLDivElement>(null);
  const inititalPositionMeasured = useRef(false);

  //get the size of the draggable element
  useEffect(() => {
    if (!tempWrapperRef.current) return;
    const { width, height } = tempWrapperRef.current.getBoundingClientRect();
    setSize({ width, height });
  }, []);

  //update its size when size cahnges like collapsible toggle.
  useResizeObserver(ref, entry => {
    const { width, height } = entry.contentRect;
    setSize(prev => (prev?.width !== width || prev?.height !== height ? { width, height } : prev));
  });

  //set element's initial position
  useEffect(() => {
    if (!size || inititalPositionMeasured.current) return;

    let containerWidth = 0;

    if (bounds === 'window') {
      containerWidth = window.innerWidth;
      console.log(containerWidth);
    } else if (bounds === 'parent' && ref.current?.parentElement) {
      containerWidth = ref.current.parentElement.parentElement?.getBoundingClientRect().width ?? 0;
    }

    if (containerWidth === 0) return;

    setPosition(prev =>
      prev.x !== containerWidth - size.width
        ? {
            x: containerWidth - size.width - initialPosition.x,
            y: 0 + initialPosition.y,
          }
        : prev,
    );
    inititalPositionMeasured.current = true;
  }, [size, bounds, position, initialPosition.x, initialPosition.y]);

  if (!size || !position) {
    return (
      <div ref={tempWrapperRef} className="absolute -left-9999 -top-9999">
        {children}
      </div>
    );
  }

  return (
    <Rnd
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

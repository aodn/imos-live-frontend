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
};

export const DragWrapper = ({
  children,
  dragHandleClassName,
  bounds = 'parent',
}: DragWrapperProps) => {
  const [size, setSize] = useState<SizeType>();
  const [position, setPostion] = useState<PositionType>({ x: 10, y: 10 });
  const tempWrapperRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLDivElement>(null);

  useResizeObserver(ref, entry => {
    const { width, height } = entry.contentRect;
    setSize(prev => (prev?.width !== width || prev?.height !== height ? { width, height } : prev));
  });

  useEffect(() => {
    if (!tempWrapperRef.current) return;
    const { width, height } = tempWrapperRef.current.getBoundingClientRect();
    setSize({ width, height });
  }, []);

  if (!size) {
    return (
      <div ref={tempWrapperRef} className="absolute -left-9999 -top-9999">
        {children}
      </div>
    );
  }

  return (
    <Rnd
      className="overflow-hidden w-full h-full"
      dragHandleClassName={dragHandleClassName}
      size={{ width: size.width, height: size.height }}
      position={{ x: position.x, y: position.y }}
      onDragStop={(_e, d) => {
        setPostion({ x: d.x, y: d.y });
      }}
      bounds={bounds}
    >
      <div ref={ref}>{children}</div>
    </Rnd>
  );
};

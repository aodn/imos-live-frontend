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

export const DragWrapper = ({
  children,
  ref,
  dragHandleClassName,
  bounds = 'parent',
}: {
  children: ReactNode;
  ref?: React.RefObject<HTMLDivElement | null>;
  dragHandleClassName?: string;
  bounds?: 'window' | 'parent';
}) => {
  const [size, setSize] = useState<SizeType>();
  const [position, setPostion] = useState<PositionType>({ x: 10, y: 10 });
  const tempWrapperRef = useRef<HTMLDivElement>(null);

  //doing nothing, just satisfy ts.
  if (!ref) ref = tempWrapperRef;

  useResizeObserver(ref, () => {
    if (ref?.current) {
      const rect = ref.current.getBoundingClientRect();
      console.log(rect);

      setSize(prev =>
        prev?.width !== rect.width || prev?.height !== rect.height
          ? { width: rect.width, height: rect.height }
          : prev,
      );
    }
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
      className="overflow-hidden"
      dragHandleClassName={dragHandleClassName}
      size={{ width: size.width, height: size.height }}
      position={{ x: position.x, y: position.y }}
      onDragStop={(_e, d) => {
        setPostion({ x: d.x, y: d.y });
      }}
      bounds={bounds}
    >
      <div>{children}</div>
    </Rnd>
  );
};

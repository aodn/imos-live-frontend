import { ReactNode, useEffect, useRef, useState } from 'react';
import { Rnd } from 'react-rnd';

export const DragWrapper = ({ children }: { children: ReactNode }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  const clampPosition = (x, y, width, height, parent) => {
    const parentRect = parent.getBoundingClientRect();
    console.log(parentRect);
    return {
      x: Math.max(0, Math.min(x, parentRect.width - width)),
      y: Math.max(0, Math.min(y, parentRect.height - height)),
    };
  };

  useEffect(() => {
    if (contentRef.current && !size) {
      const rect = contentRef.current.getBoundingClientRect();
      console.log(rect);
      setSize({
        width: rect.width > 0 ? rect.width : 0,
        height: rect.height > 0 ? rect.height : 0,
      });
    }
  }, [size]);

  if (!size) {
    return (
      <div
        className="absolute -left-9999 -top-9999"
        ref={contentRef}
        style={{
          opacity: 0,
          pointerEvents: 'none',
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <Rnd
      dragHandleClassName="imos-drag-handle"
      position={position}
      size={size}
      onDragStop={(e, d) => {
        const parent = (e.target as HTMLElement).parentNode;
        const clamped = clampPosition(d.x, d.y, size.width, size.height, parent);
        setPosition(clamped);
      }}
      bounds="parent"
    >
      <div className="absolute  z-10 bg-[rgba(35,55,75,0.9)]">{children}</div>
    </Rnd>
  );
};

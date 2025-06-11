import { cn } from '@/utils';
import { Button } from '../Button';
import { SliderHandleProps } from './type';
import { RefObject, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export const SliderHandle = ({
  onDragging,
  position,
  label,
  icon,
  onMouseDown,
  className,
  labelClassName,
}: SliderHandleProps) => {
  const ref = useRef<HTMLButtonElement>(null);

  return (
    <Button
      ref={ref}
      size={'icon'}
      variant={'ghost'}
      className={cn(
        'absolute z-20 transform  -translate-x-1/2 transition-all duration-50 hover:scale-110 hover:bg-transparent active:bg-transparent focus-visible:ring-0',
        className,
        { 'scale-110': onDragging },
      )}
      style={{ left: `${position}%` }}
      onMouseDown={onMouseDown}
    >
      <HandleLabel
        ref={ref}
        label={label}
        labelClassName={labelClassName}
        position={position}
        isDragging={onDragging}
      />
      {icon}
    </Button>
  );
};

const HandleLabel = ({
  labelClassName,
  label,
  ref,
  position,
  isDragging,
}: {
  labelClassName?: string;
  label: string;
  ref: RefObject<HTMLButtonElement | null>;
  position: number;
  isDragging?: boolean;
}) => {
  const [portalContent, setPortalContent] = useState<React.ReactNode>(null);

  useLayoutEffect(() => {
    const updatePosition = () => {
      if (!ref.current) {
        setPortalContent(null);
        return;
      }

      const parent = ref.current.offsetParent;
      if (!parent) return;

      const parentRect = parent.getBoundingClientRect();
      const handleWidth = ref.current.offsetWidth;

      const actualLeft = parentRect.left + (parentRect.width * position) / 100 - handleWidth / 2;
      const top = parentRect.top;

      setPortalContent(
        <div
          className={cn(
            'transform -translate-x-1/4 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none',
            { 'invisible opacity-0': !isDragging },
            labelClassName,
          )}
          style={{
            position: 'fixed',
            top: top - 40,
            left: actualLeft,
            zIndex: 999,
          }}
        >
          {label}
        </div>,
      );
    };

    if (isDragging) {
      updatePosition();
    } else {
      requestAnimationFrame(updatePosition);
    }
  }, [position, label, labelClassName, ref, isDragging]);

  return portalContent ? createPortal(portalContent, document.body) : null;
};

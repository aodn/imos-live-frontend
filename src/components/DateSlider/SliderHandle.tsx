import { cn } from '@/utils';
import { Button } from '../Button';
import { SliderHandleProps } from './type';
import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export const SliderHandle = ({
  onDragging,
  position,
  label,
  icon,
  onMouseDown,
  className,
  labelClassName,
  trackRef,
}: SliderHandleProps) => {
  const [portalContent, setPortalContent] = useState<React.ReactNode>(null);
  const handleRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    const updatePosition = () => {
      if (!trackRef.current) {
        setPortalContent(null);
        return;
      }

      const containerRect = trackRef.current.getBoundingClientRect();
      const handleWidth = handleRef.current?.offsetWidth || 40;

      // Calculate the actual position based on the container and percentage
      const actualLeft =
        containerRect.left + (containerRect.width * position) / 100 - handleWidth / 2;
      const top = containerRect.top;

      setPortalContent(
        <Button
          ref={handleRef}
          size={'icon'}
          variant={'ghost'}
          className={cn(
            'absolute z-20 transform transition-all duration-50 hover:scale-110 hover:bg-transparent active:bg-transparent focus-visible:ring-0',
            className,
            { 'scale-110': onDragging },
          )}
          style={{
            position: 'fixed',
            left: actualLeft,
            top: top,
            zIndex: 999,
          }}
          onMouseDown={onMouseDown}
        >
          <HandleLabel label={label} labelClassName={labelClassName} isDragging={onDragging} />
          {icon}
        </Button>,
      );
    };

    updatePosition();

    // Update position on scroll/resize
    const handleUpdate = () => requestAnimationFrame(updatePosition);
    window.addEventListener('scroll', handleUpdate);
    window.addEventListener('resize', handleUpdate);

    return () => {
      window.removeEventListener('scroll', handleUpdate);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [position, label, labelClassName, trackRef, onDragging, onMouseDown, className, icon]);

  return portalContent ? createPortal(portalContent, document.body) : null;
};

const HandleLabel = ({
  labelClassName,
  label,
  isDragging,
}: {
  labelClassName?: string;
  label: string;
  isDragging?: boolean;
}) => {
  return (
    <div
      className={cn(
        'absolute transform  -translate-y-full mb-2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none transition-opacity duration-200',
        { 'invisible opacity-0': !isDragging },
        labelClassName,
      )}
    >
      {label}
    </div>
  );
};

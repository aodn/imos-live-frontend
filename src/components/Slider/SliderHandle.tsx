import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { Button } from '../Button';

type SliderHandleProps = {
  className?: string;
  labelClassName?: string;
  onDragging: boolean;
  position: number;
  label: string; // Changed from number to string
  icon: ReactNode;
  onMouseDown: (e: React.MouseEvent) => void;
};

export const SliderHandle = ({
  onDragging,
  position,
  label,
  icon,
  onMouseDown,
  className,
  labelClassName,
}: SliderHandleProps) => {
  return (
    <Button
      size={'icon'}
      variant={'ghost'}
      className={cn(
        'absolute transform -translate-y-1/2 -translate-x-1/2 transition-all duration-200 hover:scale-110 hover:bg-transparent active:bg-transparent focus-visible:ring-0',
        className,
        { 'scale-110': onDragging },
      )}
      style={{ left: `${position}%` }}
      onMouseDown={onMouseDown}
    >
      {onDragging && (
        <div
          className={cn(
            'absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap',
            labelClassName,
          )}
        >
          {label}
        </div>
      )}
      {icon}
    </Button>
  );
};

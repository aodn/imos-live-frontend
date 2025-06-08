import { cn } from '@/utils';
import { Button } from '../Button';
import { SliderHandleProps } from './type';

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
        'absolute z-20 transform  -translate-x-1/2 transition-all duration-50 hover:scale-110 hover:bg-transparent active:bg-transparent focus-visible:ring-0',
        className,
        { 'scale-110': onDragging },
      )}
      style={{ left: `${position}%` }}
      onMouseDown={onMouseDown}
    >
      {onDragging && (
        <div
          className={cn(
            'absolute top-0 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap',
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

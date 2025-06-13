import { cn } from '@/utils';

export const Spacer = ({
  height,
  width,
  className,
}: {
  height?: number;
  width?: number;
  className?: string;
}) => {
  return (
    <div
      style={{ width, height }}
      className={cn('h-10 pointer-events-none', className)}
      aria-hidden="true"
    />
  );
};

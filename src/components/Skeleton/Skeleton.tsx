import { cn } from '@/utils';

type SkeletonProps = {
  className?: string;
  width?: string | number;
  height?: string | number;
  fill?: boolean;
  style?: React.CSSProperties;
};

export const Skeleton = ({ className, width, height, fill = false, style }: SkeletonProps) => {
  return (
    <div
      className={cn('bg-gray-300 animate-pulse rounded', className)}
      style={{
        ...(typeof height === 'number' ? { height } : {}),
        ...(typeof width === 'number' ? { width } : {}),
        ...(fill ? { height: '100%', width: '100%' } : {}),
        ...style,
      }}
    />
  );
};

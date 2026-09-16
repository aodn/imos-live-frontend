import { cn } from '@/utils';

type SkeletonProps = {
  className?: string;
  width?: string | number;
  height?: string | number;
  fill?: boolean;
  style?: React.CSSProperties;
};

export function Skeleton({ className, width, height, fill = false, style }: SkeletonProps) {
  return (
    <div
      className={cn('relative overflow-hidden bg-gray-300 rounded', className)}
      style={{
        ...(typeof height === 'number' ? { height } : {}),
        ...(typeof width === 'number' ? { width } : {}),
        ...(fill ? { height: '100%', width: '100%' } : {}),
        ...style,
      }}
    >
      <div className="absolute inset-0 animate-[shimmer_1.6s_ease-in-out_infinite] bg-linear-to-r from-transparent via-white/50 to-transparent" />
    </div>
  );
}

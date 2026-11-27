import type React from 'react';
import { forwardRef } from 'react';
import { cn } from '@/utils';

type IconSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | 'xxl';
type Color = 'white' | 'ink' | 'danger' | 'ink-muted';

export type IconProps = React.SVGProps<SVGSVGElement> & {
  size?: IconSize;
  color?: Color;
  className?: string;
};

const SIZE_MAP: Record<IconSize, string> = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  base: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
  xxl: 'w-10 h-10',
};

const COLOR_MAP: Record<Color, string> = {
  white: 'text-white',
  ink: 'text-black',
  danger: 'text-danger',
  'ink-muted': 'text-ink-muted',
};

export function withIcon(
  IconComponent: React.ComponentType<React.SVGProps<SVGSVGElement>>,
): React.FC<IconProps> {
  const WrappedIcon = forwardRef<SVGSVGElement, IconProps>(
    ({ size = 'base', color = 'ink', className, ...rest }, ref) => {
      //size-X is to override shadcn/ui button's behavior to force all direct SVG children to have a consistent size.
      const defaultClass = 'size-X';
      const sizeClass = `${SIZE_MAP[size as IconSize]}`;
      const colorClass = `${COLOR_MAP[color as Color]}`;

      return (
        <IconComponent
          ref={ref}
          className={cn(defaultClass, sizeClass, colorClass, className)}
          {...rest}
        />
      );
    },
  );

  return WrappedIcon;
}

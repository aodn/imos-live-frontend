import React, { forwardRef } from 'react';
import cn from 'classnames';

type IconSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: IconSize;
  color?: string;
  className?: string;
  [key: string]: any;
}

const SIZE_MAP: Record<IconSize, number> = {
  xs: 3,
  sm: 4,
  base: 5,
  lg: 6,
  xl: 8,
};

export function withIcon(
  IconComponent: React.ComponentType<React.SVGProps<SVGSVGElement>>,
): React.FC<IconProps> {
  const WrappedIcon = forwardRef<SVGSVGElement, IconProps>(
    ({ size = 'base', color, className, ...rest }, ref) => {
      const sizeClass = `w-${SIZE_MAP[size as IconSize]} h-${SIZE_MAP[size as IconSize]}`;

      const colorClass = color ? `text-${color}` : '';

      return <IconComponent ref={ref} className={cn(sizeClass, colorClass, className)} {...rest} />;
    },
  );

  return WrappedIcon;
}

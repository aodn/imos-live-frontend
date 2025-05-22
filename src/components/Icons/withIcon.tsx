import React, { forwardRef } from 'react';
import clsx from 'clsx';

type IconSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl';
type Color = 'imos-white' | 'imos-black' | 'imos-red' | 'imos-grey';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: IconSize;
  color?: Color;
  className?: string;
  [key: string]: any;
}

const SIZE_MAP: Record<IconSize, string> = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  base: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

const COLOR_MAP: Record<Color, string> = {
  'imos-white': 'text-white',
  'imos-black': 'text-black',
  'imos-red': 'text-imos-red',
  'imos-grey': 'text-imos-grey',
};

export function withIcon(
  IconComponent: React.ComponentType<React.SVGProps<SVGSVGElement>>,
): React.FC<IconProps> {
  const WrappedIcon = forwardRef<SVGSVGElement, IconProps>(
    ({ size = 'base', color = 'imos-black', className, ...rest }, ref) => {
      //size-X is to override shadcn/ui button's behavior to force all direct SVG children to have a consistent size.
      const defaultClass = 'size-X';
      const sizeClass = `${SIZE_MAP[size as IconSize]}`;
      const colorClass = `${COLOR_MAP[color as Color]}`;

      return (
        <IconComponent
          ref={ref}
          className={clsx(defaultClass, sizeClass, colorClass, className)}
          {...rest}
        />
      );
    },
  );

  return WrappedIcon;
}

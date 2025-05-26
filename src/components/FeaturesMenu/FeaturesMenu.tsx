import { useState } from 'react';
import { IconProps } from '../Icons';
import { Button } from '../Button';
import { cn } from '@/lib/utils';

export type Label = 'Layers' | 'Maps' | 'Measurement';

export type MenuItem = {
  icon: React.FC<IconProps>;
  label: Label;
  fn?: () => void;
};

export type MenuItemProps = {
  features: MenuItem[];
  className?: string;
  selectionClassName?: string;
  iconSize?: IconProps['size'];
  activeStye?: string;
  inactiveStye?: string;
};

export function FeaturesMenu({ features, className, selectionClassName, iconSize }: MenuItemProps) {
  const [activeItem, setActiveItem] = useState<Label>();
  const isActive = (label: Label) => activeItem === label;
  const handleItemClick = (label: Label, fn?: () => void) => () => {
    setActiveItem(prev => (prev === label ? undefined : label));
    if (fn) {
      fn();
    }
  };
  return (
    <aside
      className={cn('bg-white rounded-b-xl shadow-lg py-2 w-40', className)}
      aria-label="Map features configuration menu"
    >
      <ul className="outline-none" role="menu" tabIndex={0}>
        {features.map(({ icon: Icon, label, fn }) => (
          <li key={label} role="none">
            <Button
              variant="ghost"
              onClick={handleItemClick(label, fn)}
              role="menuitem"
              aria-current={isActive(label) ? 'true' : undefined}
              isActive={isActive(label)}
              className={cn(
                'flex justify-start items-center gap-x-3 w-full py-4 text-sm rounded-xs transition',
                selectionClassName,
              )}
            >
              <Icon size={iconSize} aria-hidden="true" />
              <span>{label}</span>
            </Button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

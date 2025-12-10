import { useState } from 'react';
import type { IconProps } from '../Icons';
import { Button } from '../Button';
import { cn } from '@/utils';
import { OptionsSection } from './OptionsSection';
import { MapsSection } from './MapsSection';

export type Label = 'Options' | 'Maps';

export type MenuItem = {
  icon: React.FC<IconProps>;
  label: Label;
  fn?: () => void;
};

export type FeaturesMenuProps = {
  features: MenuItem[];
  className?: string;
  selectionClassName?: string;
  iconSize?: IconProps['size'];
};

export function FeaturesMenu({
  features,
  className,
  selectionClassName,
  iconSize,
}: FeaturesMenuProps) {
  const [activeItem, setActiveItem] = useState<Label>();

  const isActive = (label: Label) => activeItem === label;

  const handleItemClick = (label: Label, fn?: () => void) => () => {
    setActiveItem(label);
    if (fn) {
      fn();
    }
  };

  return (
    <aside
      className={cn('bg-white shadow-lg py-2 w-72 md:w-full', className)}
      aria-label="Map features configuration menu"
    >
      <div className="w-full">
        <ul className="outline-none flex justify-between gap-x-1" role="menu" tabIndex={0}>
          {features.map(({ icon: Icon, label, fn }) => (
            <li key={label} role="none" className="flex-1">
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
                aria-label={label}
              >
                <Icon size={iconSize} aria-hidden="true" />
                <span className="hidden md:block">{label}</span>
              </Button>
            </li>
          ))}
        </ul>
      </div>

      {!!activeItem && (
        <div className="md:mt-2 px-4 py-2 w-full">
          {activeItem === 'Options' && <OptionsSection />}
          {activeItem === 'Maps' && <MapsSection />}
        </div>
      )}
    </aside>
  );
}

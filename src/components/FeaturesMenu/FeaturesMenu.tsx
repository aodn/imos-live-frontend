import { useState } from 'react';
import { IconProps } from '../Icons';
import { Button } from '../Button';
import { cn } from '@/utils';
import { Dropdown } from '../Dropdown';
import { styles, StyleTitle } from '@/styles';
import { NumParticles, useMapUIStore } from '@/store';
import { useShallow } from 'zustand/shallow';
import { Switch } from '../Switch';

export type Label = 'Layers' | 'Maps' | 'Measurement';

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
  activeStye?: string;
  inactiveStye?: string;
};

const styleDropdownSelections = styles.map(s => ({
  label: s.title,
  value: s.title,
}));
const NUM_PARTICLES: NumParticles[] = [1000, 10000, 100000];
const numParticlesDropdownSelections = NUM_PARTICLES.map(num => ({
  label: num,
  value: num,
}));

export function FeaturesMenu({
  features,
  className,
  selectionClassName,
  iconSize,
}: FeaturesMenuProps) {
  const [activeItem, setActiveItem] = useState<Label>();
  const {
    style,
    numParticles,
    distanceMeasurement,
    setStyle,
    setNumParticles,
    setDistanceMeasurement,
  } = useMapUIStore(
    useShallow(s => ({
      style: s.style,
      numParticles: s.numParticles,
      distanceMeasurement: s.distanceMeasurement,
      setStyle: s.setStyle,
      setNumParticles: s.setNumParticles,
      setDistanceMeasurement: s.setDistanceMeasurement,
    })),
  );
  const isActive = (label: Label) => activeItem === label;

  const handleItemClick = (label: Label, fn?: () => void) => () => {
    setActiveItem(label);
    if (fn) {
      fn();
    }
  };
  const handleStyleSelect = (style: StyleTitle) => {
    setStyle(style);
  };
  const handleNumParticlesSelect = (numParticles: NumParticles) => {
    setNumParticles(numParticles);
  };
  const handleDistanceMeasurementSelect = (distanceMeasurement: boolean) => {
    setDistanceMeasurement(distanceMeasurement);
  };
  return (
    <aside
      className={cn('bg-white shadow-lg py-2 w-40 md:w-fit', className)}
      aria-label="Map features configuration menu"
    >
      <div>
        <ul className="outline-none flex justify-between" role="menu" tabIndex={0}>
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
                <span className="hidden md:block">{label}</span>
              </Button>
            </li>
          ))}
        </ul>
      </div>
      {!!activeItem && (
        <div className="mt-2 p-2">
          {activeItem === 'Layers' && (
            <div>
              <Dropdown
                label="number of particles"
                onChange={
                  handleNumParticlesSelect as (value: string | number | (string | number)[]) => void
                }
                options={numParticlesDropdownSelections}
                initialValue={numParticles || numParticlesDropdownSelections[0].value}
                position="auto"
                usePortal
              />
            </div>
          )}
          {activeItem === 'Maps' && (
            <div>
              <Dropdown
                label="map style"
                onChange={
                  handleStyleSelect as (value: string | number | (string | number)[]) => void
                }
                options={styleDropdownSelections}
                initialValue={style || styleDropdownSelections[0].value}
                position="auto"
                usePortal
              />
            </div>
          )}
          {activeItem === 'Measurement' && (
            <div>
              <Switch
                label="Distance Measurement"
                labelPosition="top"
                initialValue={distanceMeasurement}
                onChange={handleDistanceMeasurementSelect}
              />
            </div>
          )}
        </div>
      )}
    </aside>
  );
}

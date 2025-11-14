import { useState } from 'react';
import { IconProps } from '../Icons';
import { Button } from '../Button';
import { cn } from '@/utils';
import { Dropdown } from '../Dropdown';
import { styles, StyleTitle } from '@/styles';
import {
  NumParticles,
  useMapUIStore,
  setStyle,
  setNumParticles,
  setDistanceMeasurement,
  setWorldBoundaries,
} from '@/store';
import { useShallow } from 'zustand/shallow';
import { Switch } from '../Switch';

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
  activeStye?: string;
  inactiveStye?: string;
};

const styleDropdownSelections = styles.map(s => ({
  label: s.title,
  value: s.title,
}));
const NUM_PARTICLES: NumParticles[] = [10000, 30000, 60000, 100000];
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
  const { style, numParticles, distanceMeasurement, worldBoundaries } = useMapUIStore(
    useShallow(s => ({
      style: s.style,
      numParticles: s.numParticles,
      distanceMeasurement: s.distanceMeasurement,
      worldBoundaries: s.worldBoundaries,
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
  const handleWorldBoundariesSelect = (worldBoundaries: boolean) => {
    setWorldBoundaries(worldBoundaries);
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
        <div className="mt-2 p-2">
          {activeItem === 'Options' && (
            <>
              <div className="pr-2 pl-2 pb-2">
                <Dropdown
                  label="number of particles"
                  onChange={
                    handleNumParticlesSelect as (
                      value: string | number | (string | number)[],
                    ) => void
                  }
                  options={numParticlesDropdownSelections}
                  initialValue={numParticles || numParticlesDropdownSelections[0].value}
                  position="auto"
                  usePortal
                />
              </div>
              <div className="pt-2">
                <Switch
                  label="Measure distance"
                  labelPosition="left"
                  initialValue={distanceMeasurement}
                  onChange={handleDistanceMeasurementSelect}
                  dataTestId="switch-distancemeasurement"
                />
              </div>
              <div className="pt-2">
                <Switch
                  label="World boundaries"
                  labelPosition="left"
                  initialValue={worldBoundaries}
                  onChange={handleWorldBoundariesSelect}
                />
              </div>
            </>
          )}
          {activeItem === 'Maps' && (
            <div className="pl-2 pr-2">
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
        </div>
      )}
    </aside>
  );
}

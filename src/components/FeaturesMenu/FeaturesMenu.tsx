import { useState } from 'react';
import { IconProps } from '../Icons';
import { Button } from '../Button';
import { cn } from '@/utils';
import { Dropdown } from '../Dropdown';
import { styles, StyleTitle } from '@/styles';
import {
  useMapUIStore,
  setStyle,
  setDistanceMeasurement,
  setWorldBoundaries,
  setParticleConfig,
} from '@/store';
import { useShallow } from 'zustand/shallow';
import { Switch } from '../Switch';
import { CustomizableParticleConfig } from '@/config';

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

const NUM_PARTICLES = [10000, 30000, 60000, 100000];
const numParticlesDropdownSelections = NUM_PARTICLES.map(num => ({
  label: num,
  value: num,
}));

// test
const pointSizeSelections = [
  {
    label: 1.5,
    value: 1.5,
  },
  {
    label: 3,
    value: 3,
  },
];

export function FeaturesMenu({
  features,
  className,
  selectionClassName,
  iconSize,
}: FeaturesMenuProps) {
  const [activeItem, setActiveItem] = useState<Label>();
  const {
    style,
    distanceMeasurement,
    worldBoundaries,
    nParticles,
    // adeOpacity,
    // speedFactor,
    // dropRate,
    pointSize,
  } = useMapUIStore(
    useShallow(s => ({
      style: s.style,
      nParticles: s.particleConfig.nParticles,
      distanceMeasurement: s.distanceMeasurement,
      worldBoundaries: s.worldBoundaries,
      fadeOpacity: s.particleConfig.fadeOpacity,
      speedFactor: s.particleConfig.speedFactor,
      dropRate: s.particleConfig.dropRate,
      dropRateBump: s.particleConfig.dropRateBump,
      pointSize: s.particleConfig.pointSize,
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

  const handleDistanceMeasurementSelect = (distanceMeasurement: boolean) => {
    setDistanceMeasurement(distanceMeasurement);
  };
  const handleWorldBoundariesSelect = (worldBoundaries: boolean) => {
    setWorldBoundaries(worldBoundaries);
  };

  //TEST
  const handleSetParticleConfig =
    (key: keyof CustomizableParticleConfig) => (value: string | number) => {
      console.log(key, value);
      setParticleConfig({ [key]: value });
    };

  return (
    <aside
      className={cn('bg-white shadow-lg py-2 w-40 md:w-full', className)}
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
        // OPTIONS SECTION
        <div className="md:mt-2 px-4 py-2 w-full">
          {activeItem === 'Options' && (
            <div className="w-full flex flex-col gap-y-2 items-start">
              <Dropdown
                label="number of particles"
                className="w-full"
                onChange={
                  handleSetParticleConfig('nParticles') as (
                    value: string | number | (string | number)[],
                  ) => void
                }
                options={numParticlesDropdownSelections}
                initialValue={nParticles}
                position="auto"
                usePortal
              />

              <Dropdown
                label="point size"
                className="w-full"
                onChange={
                  handleSetParticleConfig('pointSize') as (
                    value: string | number | (string | number)[],
                  ) => void
                }
                options={pointSizeSelections}
                initialValue={pointSize}
                position="auto"
                usePortal
              />

              <Switch
                label="Measure distance"
                labelPosition="left"
                initialValue={distanceMeasurement}
                onChange={handleDistanceMeasurementSelect}
                dataTestId="switch-distancemeasurement"
              />

              <Switch
                label="World boundaries"
                labelPosition="left"
                initialValue={worldBoundaries}
                onChange={handleWorldBoundariesSelect}
              />
            </div>
          )}

          {activeItem === 'Maps' && (
            //MAPS SECTION
            <div className="w-full">
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

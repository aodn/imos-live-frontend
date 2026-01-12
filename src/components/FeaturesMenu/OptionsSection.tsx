import { Dropdown } from '../Dropdown';
import { Switch } from '../Switch';
import { LabeledSlider } from '../Slider';
import {
  useMapUIStore,
  setWorldBoundariesEnabled,
  setParticleConfig,
  setDistanceMeasurementEnabled,
} from '@/store';
import { useShallow } from 'zustand/shallow';
import type { CustomizableParticleConfig } from '@/config';
import { FADE_OPACITY_RANGE, POINT_SIZE_RANGE, SPEED_FACTOR_RANGE } from '@/config';

// Particle configuration options
const NUM_PARTICLES_OPTIONS = [10000, 30000, 60000, 100000].map(num => ({
  label: num,
  value: num,
}));

const POINT_SIZE_OPTIONS = {
  label: 'Size',
  ...POINT_SIZE_RANGE,
};

const FADE_OPACITY_OPTIONS = {
  label: 'Length',
  ...FADE_OPACITY_RANGE,
};

const SPEED_FACTOR_OPTIONS = {
  label: 'Speed',
  ...SPEED_FACTOR_RANGE,
};

export function OptionsSection() {
  const { distanceMeasurementEnabled, worldBoundariesEnabled, particleConfig } = useMapUIStore(
    useShallow(s => ({
      distanceMeasurementEnabled: s.distanceMeasurementEnabled,
      worldBoundariesEnabled: s.worldBoundariesEnabled,
      particleConfig: s.particleConfig,
    })),
  );

  const handleParticleConfigChange =
    (key: keyof CustomizableParticleConfig) => (value: string | number | (string | number)[]) => {
      setParticleConfig({ [key]: value as number });
    };

  return (
    <div className="w-full flex flex-col gap-y-2 items-start">
      {/* Particle Controls */}
      <div className="w-full">
        <h3 className="text-xs font-semibold text-imos-grey uppercase mb-2">Particle Settings</h3>

        <div className="flex flex-col gap-y-2">
          <Dropdown
            label="Number of particles"
            className="w-full"
            onChange={handleParticleConfigChange('nParticles')}
            options={NUM_PARTICLES_OPTIONS}
            initialValue={particleConfig.nParticles}
            position="auto"
            usePortal
          />

          <LabeledSlider
            onChange={handleParticleConfigChange('pointSize')}
            label={POINT_SIZE_OPTIONS.label}
            value={particleConfig.pointSize}
            min={POINT_SIZE_OPTIONS.min}
            max={POINT_SIZE_OPTIONS.max}
            labelClassName="w-12"
          />

          <LabeledSlider
            onChange={handleParticleConfigChange('fadeOpacity')}
            label={FADE_OPACITY_OPTIONS.label}
            value={particleConfig.fadeOpacity}
            min={FADE_OPACITY_OPTIONS.min}
            max={FADE_OPACITY_OPTIONS.max}
            step={0.005}
            decimals={3}
            labelClassName="w-12"
          />

          <LabeledSlider
            onChange={handleParticleConfigChange('speedFactor')}
            label={SPEED_FACTOR_OPTIONS.label}
            value={particleConfig.speedFactor}
            min={SPEED_FACTOR_OPTIONS.min}
            max={SPEED_FACTOR_OPTIONS.max}
            labelClassName="w-12"
          />
        </div>
      </div>

      {/* Map Controls */}
      <div className="w-full mt-2">
        <h3 className="text-xs font-semibold text-imos-grey uppercase mb-2">Map Tools</h3>

        <div className="flex flex-col justify-self-start gap-y-2">
          <Switch
            label="Measure distance"
            labelPosition="left"
            initialValue={distanceMeasurementEnabled}
            onChange={setDistanceMeasurementEnabled}
            dataTestId="switch-distancemeasurementEnabled"
          />

          <Switch
            label="World boundaries"
            labelPosition="left"
            initialValue={worldBoundariesEnabled}
            onChange={setWorldBoundariesEnabled}
          />
        </div>
      </div>
    </div>
  );
}

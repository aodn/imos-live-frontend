import { Dropdown } from '../Dropdown';
import { Switch } from '../Switch';
import { LabeledSlider } from '../Slider';
import {
  useMapUIStore,
  setDistanceMeasurement,
  setWorldBoundaries,
  setParticleConfig,
} from '@/store';
import { useShallow } from 'zustand/shallow';
import {
  CustomizableParticleConfig,
  DROP_RATE_BUMP_RANGE,
  DROP_RATE_RANGE,
  FADE_OPACITY_RANGE,
  POINT_SIZE_RANGE,
  SPEED_FACTOR_RANGE,
} from '@/config';

// Particle configuration options
const NUM_PARTICLES_OPTIONS = [10000, 30000, 60000, 100000].map(num => ({
  label: num,
  value: num,
}));

const POINT_SIZE_OPTIONS = {
  label: 'Point size',
  ...POINT_SIZE_RANGE,
};

const FADE_OPACITY_OPTIONS = {
  label: 'Fade opacity',
  ...FADE_OPACITY_RANGE,
};

const SPEED_FACTOR_OPTIONS = {
  label: 'Speed factor',
  ...SPEED_FACTOR_RANGE,
};

const DROP_RATE_OPTIONS = {
  label: 'Drop rate',
  ...DROP_RATE_RANGE,
};

const DROP_RATE_BUMP_OPTIONS = {
  label: 'Drop rate bump',
  ...DROP_RATE_BUMP_RANGE,
};

export function OptionsSection() {
  const { distanceMeasurement, worldBoundaries, particleConfig } = useMapUIStore(
    useShallow(s => ({
      distanceMeasurement: s.distanceMeasurement,
      worldBoundaries: s.worldBoundaries,
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
            labelClassName="w-26"
            valueClassName="w-10"
          />

          <LabeledSlider
            onChange={handleParticleConfigChange('fadeOpacity')}
            label={FADE_OPACITY_OPTIONS.label}
            value={particleConfig.fadeOpacity}
            min={FADE_OPACITY_OPTIONS.min}
            max={FADE_OPACITY_OPTIONS.max}
            step={0.005}
            decimals={3}
            labelClassName="w-26"
            valueClassName="w-10"
          />

          <LabeledSlider
            onChange={handleParticleConfigChange('speedFactor')}
            label={SPEED_FACTOR_OPTIONS.label}
            value={particleConfig.speedFactor}
            min={SPEED_FACTOR_OPTIONS.min}
            max={SPEED_FACTOR_OPTIONS.max}
            labelClassName="w-26"
            valueClassName="w-10"
          />

          <LabeledSlider
            onChange={handleParticleConfigChange('dropRate')}
            label={DROP_RATE_OPTIONS.label}
            value={particleConfig.dropRate}
            min={DROP_RATE_OPTIONS.min}
            max={DROP_RATE_OPTIONS.max}
            step={0.0001}
            decimals={3}
            labelClassName="w-26"
            valueClassName="w-10"
          />

          <LabeledSlider
            onChange={handleParticleConfigChange('dropRateBump')}
            label={DROP_RATE_BUMP_OPTIONS.label}
            value={particleConfig.dropRateBump}
            min={DROP_RATE_BUMP_OPTIONS.min}
            max={DROP_RATE_BUMP_OPTIONS.max}
            labelClassName="w-26"
            valueClassName="w-10"
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
            initialValue={distanceMeasurement}
            onChange={setDistanceMeasurement}
            dataTestId="switch-distancemeasurement"
          />

          <Switch
            label="World boundaries"
            labelPosition="left"
            initialValue={worldBoundaries}
            onChange={setWorldBoundaries}
          />
        </div>
      </div>
    </div>
  );
}

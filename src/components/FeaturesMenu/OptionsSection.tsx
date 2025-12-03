import { Dropdown } from '../Dropdown';
import { Switch } from '../Switch';
import {
  useMapUIStore,
  setDistanceMeasurement,
  setWorldBoundaries,
  setParticleConfig,
} from '@/store';
import { useShallow } from 'zustand/shallow';
import { CustomizableParticleConfig } from '@/config';

// Particle configuration options
const NUM_PARTICLES_OPTIONS = [10000, 30000, 60000, 100000].map(num => ({
  label: num,
  value: num,
}));

const POINT_SIZE_OPTIONS = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0].map(size => ({
  label: size,
  value: size,
}));

const FADE_OPACITY_OPTIONS = [0.97, 0.975, 0.98, 0.985, 0.99, 0.995].map(opacity => ({
  label: opacity.toFixed(3),
  value: opacity,
}));

const SPEED_FACTOR_OPTIONS = [2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0].map(speed => ({
  label: speed.toFixed(1),
  value: speed,
}));

const DROP_RATE_OPTIONS = [0.001, 0.002, 0.003, 0.005, 0.007, 0.01].map(rate => ({
  label: rate.toFixed(3),
  value: rate,
}));

const DROP_RATE_BUMP_OPTIONS = [0.01, 0.03, 0.05, 0.07, 0.09, 0.1].map(bump => ({
  label: bump.toFixed(2),
  value: bump,
}));

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
        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Particle Settings</h3>

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

          <Dropdown
            label="Point size"
            className="w-full"
            onChange={handleParticleConfigChange('pointSize')}
            options={POINT_SIZE_OPTIONS}
            initialValue={particleConfig.pointSize}
            position="auto"
            usePortal
          />

          <Dropdown
            label="Fade opacity"
            className="w-full"
            onChange={handleParticleConfigChange('fadeOpacity')}
            options={FADE_OPACITY_OPTIONS}
            initialValue={particleConfig.fadeOpacity}
            position="auto"
            usePortal
          />

          <Dropdown
            label="Speed factor"
            className="w-full"
            onChange={handleParticleConfigChange('speedFactor')}
            options={SPEED_FACTOR_OPTIONS}
            initialValue={particleConfig.speedFactor}
            position="auto"
            usePortal
          />

          <Dropdown
            label="Drop rate"
            className="w-full"
            onChange={handleParticleConfigChange('dropRate')}
            options={DROP_RATE_OPTIONS}
            initialValue={particleConfig.dropRate}
            position="auto"
            usePortal
          />

          <Dropdown
            label="Drop rate bump"
            className="w-full"
            onChange={handleParticleConfigChange('dropRateBump')}
            options={DROP_RATE_BUMP_OPTIONS}
            initialValue={particleConfig.dropRateBump}
            position="auto"
            usePortal
          />
        </div>
      </div>

      {/* Map Controls */}
      <div className="w-full mt-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Map Tools</h3>

        <div className="flex flex-col gap-y-2">
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

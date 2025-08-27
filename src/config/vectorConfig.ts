import { convertLogColorScaleToRamp } from '@/components';
import speedColors from './speed_colormap.json';

const MAX_SPEED = 7.0;

export const gslaOceanCurrentColorsLegendConfig = {
  title: 'ocean current speed (m/s)',
  numStops: 256,
  colors: speedColors as [number, number, number][],
  min: 0.01,
  max: MAX_SPEED,
};

const colors = convertLogColorScaleToRamp(gslaOceanCurrentColorsLegendConfig);

export const vectorConfig = {
  // this is to set all dataset in the same maxSpeed. the maxSpeed determines how particles speed normilized in [0,1] then visualized corresponding color in graident colors ramp.
  // This should be the same to the maxSpeed of color legend (ColorScaleBar).
  maxSpeed: MAX_SPEED, //this has to be a float number and if maxSpeed is not larger than 0, it will use dataset's own max speed to visualize the particles.

  // Number of particles
  nParticles: 10000,

  // Opacity of background screen, leading to fading of trails.
  // If 1, trails will never fade. If 0, there will be no trails.
  // As the fade happens every frame, a high number (>0.9)
  // is required to see any appreciable trails at all.
  fadeOpacity: 0.985,

  // A dial to adjust the speed of the particles
  // If the speed is too high, eventually particle trails will no longer be smooth
  speedFactor: 5.0,

  // Chance per frame that a particle will be deleted and moved to a new position
  dropRate: 0.003,

  // Increase in the drop rate for particles that are moving faster
  // Effectively, this number is multiplied by the fraction of the maximum velocity in the
  // vector field, and then added to the drop rate.
  // This prevents faster moving regions from visually dominating
  dropRateBump: 0.05,

  // Size of the particles in pixels
  pointSize: 1.2,

  // Colour gradient, the colours object is a pair of normilised speed with values (0-1) and hex colour strings. This has to be the same as the LogColorScaleBar component.
  colours: colors,
};

import { BuoyDataVariants } from '@/types';

export const colors = [
  '#e17055',
  '#0984e3',
  '#00b894',
  '#6c5ce7',
  '#fdcb6e',
  '#d63031',
  '#74b9ff',
  '#55efc4',
];

export const noneDirectionVariants: BuoyDataVariants[] = [
  //   'WPPE',
  //sea_surface_wave_period_at_variance_spectral_density_maximum
  //   'WPDS',
  //sea_surface_wave_directional_spread_at_variance_spectral_density_maximum
  //   'WPDI',
  //sea_surface_wave_from_direction_at_variance_spectral_density_maximum
  //'SSWMD',
  //sea_surface_wave_from_direction
  // 'WAVE_quality_control',
  //   'WMDS',
  //sea_surface_wave_directional_spread
  // 'WPFM',
  //sea_surface_wave_mean_period_from_variance_spectral_density_first_frequency_moment
  'WSSH',
  //sea_surface_wave_significant_height
];

export const buoyDataDirectionVariant = 'SSWMD';
export const buoyDataInfoVariant: BuoyDataVariants[] = ['WSSH', 'SSWMD', 'WPFM'];
export const obseravtionVariants = ['WSSH', 'SSWMD', 'WPFM'];

export const directionColors = {
  direction: '#FF5722',
  speed: '#2196F3',
};

import type { BuoyDataVariants } from '@/types';

export const colors = [
  '#3b6e8f',
  '#0984e3',
  '#00b894',
  '#6c5ce7',
  '#fdcb6e',
  '#d63031',
  '#74b9ff',
  '#55efc4',
];

export const noneDirectionVariants: BuoyDataVariants[] = ['WSSH', 'WHTH'];

export const buoyDataDirectionVariant = 'SSWMD';
export const buoyDataInfoVariant: BuoyDataVariants[] = ['WSSH', 'SSWMD', 'WPFM', 'WPMH', 'WHTH'];
export const obseravtionVariants = buoyDataInfoVariant;

export const VariantReadableName = {
  WSSH: 'wave height',
  WHTH: 'wave height',
  SSWMD: 'wave direction',
  WPFM: 'wave pertiod',
};

export const directionColors = {
  direction: '#3b6e8f',
  speed: '#3b6e8f',
};

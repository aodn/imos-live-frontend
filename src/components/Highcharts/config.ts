import type { BuoyDataVariants } from '@/types';

export const PRIMARY_COLOR = '#3b6e8f';

export const colors = [
  PRIMARY_COLOR,
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
  WPFM: 'wave period',
};

// Map a buoy variant code (e.g. 'SSWMD') to a human-readable name for legends and tooltips.
// Falls back to the raw variant if not in VariantReadableName.
export function readableVariantName(variant: string): string {
  return variant in VariantReadableName
    ? VariantReadableName[variant as keyof typeof VariantReadableName]
    : variant;
}

export const directionColors = {
  direction: PRIMARY_COLOR,
  speed: PRIMARY_COLOR,
};

// Function to convert RGB (0-1) to hex
export function rgbToHex(r: number, g: number, b: number) {
  const toHex = (component: number) => {
    const hex = Math.round(component * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return '#' + toHex(r) + toHex(g) + toHex(b);
}

export function hexToRgbArray(hex: string): [number, number, number] {
  // Remove leading #
  const normalized = hex.replace(/^#/, '');

  // Support shorthand hex (#fff)
  const fullHex =
    normalized.length === 3
      ? normalized
          .split('')
          .map(c => c + c)
          .join('')
      : normalized;

  if (fullHex.length !== 6) {
    throw new Error('Invalid hex color');
  }

  const r = parseInt(fullHex.slice(0, 2), 16) / 255;
  const g = parseInt(fullHex.slice(2, 4), 16) / 255;
  const b = parseInt(fullHex.slice(4, 6), 16) / 255;

  return [r, g, b];
}

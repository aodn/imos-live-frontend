/**
 *
 * @param {Record<string, string>} colors an object with a normalized(0-1) values as keys and color values as values.
 * @returns  a 1D color gradient texture based on the colors, where each of the 256 pixels represents a color along the gradient.
 * This is then uploaded as a texture to the GPU so shaders can sample colors based on speed.
 */
export function getColorRamp(colors: Record<string, string>): Uint8Array {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context for color ramp');
  }

  canvas.width = 256;
  canvas.height = 1;

  const gradient = ctx.createLinearGradient(0, 0, 256, 0);
  for (const stop in colors) {
    gradient.addColorStop(+stop, colors[stop]);
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 1);
  return new Uint8Array(ctx.getImageData(0, 0, 256, 1).data);
}

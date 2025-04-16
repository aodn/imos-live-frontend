type Bounds = [number, number, number, number];
type Range = [number, number];

export type Velocity = { u: number; v: number };

/**
 * Converts geographic coordinates to pixel coordinates in the image.
 *
 * @param lng - Longitude to convert.
 * @param lat - Latitude to convert.
 * @param bounds - Data bounds in format [minX, maxY, maxX, minY].
 * @param width - Image width in pixels.
 * @param height - Image height in pixels.
 * @returns Pixel coordinates [x, y].
 */
export function lngLatToImagePixel(
  lng: number,
  lat: number,
  bounds: Bounds,
  width: number,
  height: number,
): [number, number] {
  const [minX, maxY, maxX, minY] = bounds;

  const x = ((lng - minX) / (maxX - minX)) * width;
  const y = ((maxY - lat) / (maxY - minY)) * height;

  return [Math.floor(x), Math.floor(y)];
}

/**
 * Maps a color channel value (0-255) to a velocity range.
 *
 * @param value - Value from R or G channel (0–255).
 * @param range - Range of the vector component.
 * @returns Scaled velocity value.
 */
export function decodeChannel(value: number, range: Range): number {
  return (value / 255) * (range[1] - range[0]) + range[0];
}

/**
 * Retrieves velocity vector from RG channels in an ImageData object.
 *
 * @param x - X coordinate in the image.
 * @param y - Y coordinate in the image.
 * @param imageData - The ImageData object.
 * @param width - Width of the image.
 * @param uRange - Min/max of U vector component.
 * @param vRange - Min/max of V vector component.
 * @returns Decoded velocity vector { u, v }.
 */
export function getVelocityAtPixel(
  x: number,
  y: number,
  imageData: Uint8ClampedArray,
  width: number,
  uRange: Range,
  vRange: Range,
): Velocity {
  const idx = (y * width + x) * 4; // 4 channels per pixel: RGBA
  const r = imageData[idx];
  const g = imageData[idx + 1];

  const u = decodeChannel(r, uRange);
  const v = decodeChannel(g, vRange);

  return { u, v };
}

export function degreesToCompass(u: number, v: number): string {
  let direction = (Math.atan2(v, u) * 180) / Math.PI;
  if (direction < 0) direction += 360;
  const directions = ["E", "NE", "N", "NW", "W", "SW", "S", "SE"];
  const index = Math.round(direction / 45) % 8;
  return directions[index];
}

/**
 *
 * @param u
 * @param v
 * @returns unit m/s
 */
export function generateSpeed(u: number, v: number) {
  return Math.sqrt(u * u + v * v);
}

export function velocityToReadable(u: number, v: number) {
  return {
    speed: generateSpeed(u, v),
    direction: degreesToCompass(u, v),
  };
}

/**
 * Extract image data from ImageBitmap using an offscreen canvas
 * @param imageBitmap
 * @param width
 * @param height
 * @returns
 */
export function extractImageData(
  imageBitmap: ImageBitmap,
  width: number,
  height: number,
): Uint8ClampedArray {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d")!;
  context.drawImage(imageBitmap, 0, 0);
  return context.getImageData(0, 0, width, height).data;
}

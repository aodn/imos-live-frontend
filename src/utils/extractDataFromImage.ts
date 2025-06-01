type Bounds = [number, number, number, number];
type Range = [number, number];

type Velocity = { u: number; v: number; visible: boolean };

type DirectionType = {
  direction: string;
  degree: number;
};

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
  const visible = imageData[idx + 2] !== 0; //if alpha is 0, v and u are nan, this point could be land.

  const u = decodeChannel(r, uRange);
  const v = decodeChannel(g, vRange);
  return { u, v, visible };
}

/**
 * standard mathematical (Cartesian) polar coordinates: 0°=east   90°=north   180°=west   270°=south
 * compass bearings: 0°=north   90°=east  180°=south  270°=west
 * current degree version is standard mathematical (Cartesian) polar coordinates.
 * degree = (450 - degree) % 360 this can adjust to compass bearing: 0° is north, increases clockwise
 * @param u
 * @param v
 * @returns direction and degree
 */
export function degreesToCompass(u: number, v: number): DirectionType {
  let degree = (Math.atan2(v, u) * 180) / Math.PI;
  if (degree < 0) degree += 360;
  const directions = ['E', 'NE', 'N', 'NW', 'W', 'SW', 'S', 'SE'];
  const index = Math.round(degree / 45) % 8;
  return { direction: directions[index], degree };
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

/**
 * generate readable data in speed(m/s), direction and degree.
 * @param u
 * @param v
 * @returns
 */
export function velocityToReadable(u: number, v: number) {
  const compass = degreesToCompass(u, v);
  return {
    speed: generateSpeed(u, v),
    direction: compass.direction,
    degree: compass.degree,
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
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d')!;
  context.drawImage(imageBitmap, 0, 0);
  return context.getImageData(0, 0, width, height).data;
}

/**
 * why the u,v are not same to the script.
 *
 * debug:
 * 1. the width and height of png image are correct which means pixels.
 */

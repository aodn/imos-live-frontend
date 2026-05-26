type DirectionType = {
  direction: string;
  degree: number;
};

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

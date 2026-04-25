type Coordinates = {
  lat: number;
  lng: number;
};

type DataJsonBase = {
  width: number;
  height: number;
  latRange: [number, number]; // [min, max]
  lonRange: [number, number]; // [min, max]
};

// ocean_current_gsla_ucur_vcur/data.json  — data[row][col] = [speed (m/s), direction (0–360°)]
export type OceanCurrentData = DataJsonBase & { data: [number, number][][] };

// ocean_current_gsla_gsla and austemp_sst_anomaly_sst_anom_mosaic/data.json
// data[row][col] = scalar value, or null for masked/cloud-covered pixels
export type ScalarData = DataJsonBase & { data: (number | null)[][] };

export function processScalarDetails<T>(
  { lat, lng }: Coordinates,
  rawData: DataJsonBase & { data: T[][] },
): T | null {
  const [minLon, maxLng] = rawData.lonRange;
  const [minLat, maxLat] = rawData.latRange;

  if (lng < minLon || lng > maxLng || lat < minLat || lat > maxLat) return null;

  const colIndex = Math.floor(((lng - minLon) / (maxLng - minLon)) * rawData.width);
  const rowIndex = Math.floor(((maxLat - lat) / (maxLat - minLat)) * rawData.height);
  return rawData.data[rowIndex]?.[colIndex] ?? null;
}

const compassDirections = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;
type CompassDirection = (typeof compassDirections)[number];

/**
 * Converts from standard mathematical (Cartesian) polar coordinates to compass bearings.
 * Input:  0°=east  90°=north  180°=west  270°=south
 * Output: 0°=north 90°=east  180°=south  270°=west
 */
export function toCompassDegree(degree: number): number {
  return (450 - degree + 360) % 360;
}

export function toCompassDirection(degree: number): CompassDirection {
  const compassDegree = toCompassDegree(degree);
  const index = Math.round(compassDegree / 45) % 8;
  return compassDirections[index];
}

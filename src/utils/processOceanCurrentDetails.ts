import type { OceanCurrentDataResponse } from '@/api';

type Coordinates = {
  lat: number;
  lng: number;
};

type OceanCurrentDetails = {
  speed: number;
  speedUnit: string;
  degree: number;
  direction: string;
  gslaUnit: string;
};

export const processOceanCurrentDetails = (
  { lat, lng }: Coordinates,
  gslaData: OceanCurrentDataResponse,
): OceanCurrentDetails | null => {
  const [minLon, maxLng] = gslaData.lonRange;
  const [minLat, maxLat] = gslaData.latRange;

  if (lng < minLon || lng > maxLng || lat < minLat || lat > maxLat) {
    return null;
  }

  const colIndex = Math.floor(((lng - minLon) / (maxLng - minLon)) * gslaData.width);
  const rowIndex = Math.floor(((maxLat - lat) / (maxLat - minLat)) * gslaData.height);
  //degree from gslaData is in standard mathematical (Cartesian) polar coordinates
  const [speed, degree, gsla] = gslaData.data[rowIndex][colIndex];
  if (!speed && !degree && !gsla) return null;

  return {
    speed,
    speedUnit: 'm/s',
    degree: toCompassStandard(degree),
    direction: compassDirectionFrom(degree),
    gslaUnit: 'm/s',
  };
};

const compassDirections = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;
type CompassDirection = (typeof compassDirections)[number];

/**
 * convert degree from standard mathematical (Cartesian) polar coordinates to compass bearings.
 * @param degree standard mathematical (Cartesian) polar coordinates: 0°=east   90°=north   180°=west   270°=south
 * @returns degree in compass bearings: 0°=north   90°=east  180°=south  270°=west
 */
function toCompassStandard(degree: number) {
  return (450 - degree + 360) % 360;
}

function compassDirectionFrom(degree: number): CompassDirection {
  const compassDegree = toCompassStandard(degree);
  const index = Math.round(compassDegree / 45) % 8;
  return compassDirections[index];
}

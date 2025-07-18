import { OceanCurrentDataResponse } from '@/api';

type Coordinates = {
  lat: number;
  lng: number;
};

type OceanCurrentDetails = {
  speed: number;
  speedUnit: string;
  degree: number;
  direction: string;
  gsla: number;
  gslaUnit: string;
};

export const processOceanCurrentDetails = (
  { lat, lng }: Coordinates,
  gslaData: OceanCurrentDataResponse,
): OceanCurrentDetails | null => {
  const [minLon, maxLng] = gslaData.lonRange;
  const [minLat, maxLat] = gslaData.latRange;

  if (lng < minLon || lng > maxLng || lat < minLat || lat > maxLat) {
    throw new Error('Coordinates out of range');
  }

  const colIndex = Math.floor(((lng - minLon) / (maxLng - minLon)) * gslaData.width);
  const rowIndex = Math.floor(((maxLat - lat) / (maxLat - minLat)) * gslaData.height);
  const [speed, degree, gsla] = gslaData.data[rowIndex][colIndex];
  if (!speed && !degree && !gsla) return null;

  return {
    speed,
    speedUnit: 'm/s',
    degree,
    direction: compassDirectionFrom(degree),
    gsla,
    gslaUnit: 'm/s',
  };
};

const compassDirections = ['E', 'NE', 'N', 'NW', 'W', 'SW', 'S', 'SE'] as const;
type CompassDirection = (typeof compassDirections)[number];

function compassDirectionFrom(degree: number): CompassDirection {
  const normalizedDegree = ((degree % 360) + 360) % 360;

  return compassDirections[Math.round(normalizedDegree / 45) % 8];
}

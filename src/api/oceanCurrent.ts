import { GSLA_DATA_NAME } from '@/constants';
import { buildGSLADatasetPath } from '@/utils';
import { s3Api } from './instance';

type OceanCurrentDetails = {
  u: number;
  v: number;
  speed: number;
  speedUnit: string;
  degree: number;
  direction: string;
  gsla: number;
  gslaUnit: string;
};

type DataPoint = [number, number, number];

type OceanCurrentDataResponse = {
  width: number;
  height: number;
  latRange: [number, number];
  lonRange: [number, number];
  data: DataPoint[][];
};

export const getOceanCurrentData = async (date: string): Promise<OceanCurrentDataResponse> => {
  const response = await s3Api.get<OceanCurrentDataResponse>(
    buildGSLADatasetPath(date, GSLA_DATA_NAME),
  );
  return response.data;
};

type Coordinates = {
  lat: number;
  lng: number;
};

export const getOceanCurrentDetails = (
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
  const [u, v, gsla] = gslaData.data[rowIndex][colIndex];
  if (!u && !v && !gsla) return null;

  const speed = Math.sqrt(u ** 2 + v ** 2);
  let degree = Math.atan2(v, u) * (180 / Math.PI);
  if (degree < 0) {
    degree += 360;
  }

  return {
    u,
    v,
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

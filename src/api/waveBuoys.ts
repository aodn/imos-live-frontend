import { WaveBuoyDetailsFeatureCollection } from '@/types';
import { s3Api } from './instance';

export const getWaveBuoyDetails = async (
  date: string,
  buoy: string,
): Promise<WaveBuoyDetailsFeatureCollection> => {
  const response = await s3Api.get<WaveBuoyDetailsFeatureCollection>(
    '/BUOY/buoy_details/' + `${buoy}_${date}.geojson`,
  );
  return response.data;
};

export const getWaveBuoyLocations = async (
  date: string,
): Promise<GeoJSON.FeatureCollection | GeoJSON.Feature> => {
  const response = await s3Api.get<GeoJSON.FeatureCollection | GeoJSON.Feature>(
    '/BUOY/buoy_locations/' + `buoy_locations_${date}.geojson`,
  );
  return response.data;
};

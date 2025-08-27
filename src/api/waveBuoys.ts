import { WaveBuoyDetailsFeatureCollection } from '@/types';
import { s3Api } from './instance';
import { appendCacheBuster } from '@/utils';
import axios from 'axios';

export const getWaveBuoyDetails = async (
  date: string,
  buoy: string,
): Promise<WaveBuoyDetailsFeatureCollection> => {
  const path = '/BUOY/buoy_details/' + `${buoy}_${date}.geojson`;
  const response = await s3Api.get<WaveBuoyDetailsFeatureCollection>(appendCacheBuster(path));
  return response.data;
};

export const getWaveBuoyLocations = async (
  date: string,
): Promise<GeoJSON.FeatureCollection | GeoJSON.Feature> => {
  const wavebuoysLocations = await axios.get<GeoJSON.FeatureCollection>(
    '/api/v1/ogc/collections/aaa/items/realtime?datetime=' + date,
  );
  return wavebuoysLocations.data;
};

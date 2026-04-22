import type { WaveBuoyDetailsFeature, WaveBuoyPositionFeatureCollection } from '@/types';
import axios from 'axios';

const WAVE_BUOY_COLLECTION_URL =
  '/api/v1/ogc/collections/b299cdcd-3dee-48aa-abdd-e0fcdbb9cadc/items';

export const getWaveBuoyDetails = async (
  from: string,
  to: string,
  buoy: string,
): Promise<WaveBuoyDetailsFeature> => {
  const searchParams = new URLSearchParams();
  searchParams.append('datetime', `${from}/${to}`);
  searchParams.append('waveBuoy', buoy);
  const waveDetails = await axios.get<WaveBuoyDetailsFeature>(
    `${WAVE_BUOY_COLLECTION_URL}/wave_buoy_timeseries?${searchParams.toString()}`,
  );
  return waveDetails.data;
};

export const getWaveBuoyLocations = async (
  date: string,
): Promise<WaveBuoyPositionFeatureCollection> => {
  const wavebuoysLocations = await axios.get<WaveBuoyPositionFeatureCollection>(
    `${WAVE_BUOY_COLLECTION_URL}/wave_buoy_first_data_available?datetime=${date}`,
  );
  return wavebuoysLocations.data;
};

export const getWaveBuoyLatestDate = async (): Promise<string> => {
  const latestDate = await axios.get(`${WAVE_BUOY_COLLECTION_URL}/wave_buoy_latest_date`);
  console.log({ latestDate });
  return latestDate.data;
};

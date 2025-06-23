import { fakeApi } from './instance';
import { SeriesData } from '@/components';

export type WaveBuoyDetails = SeriesData[];

export const getWaveBuoyDetails = async (
  date: string,
  lat: number,
  lon: number,
): Promise<WaveBuoyDetails> => {
  const response = await fakeApi.get<WaveBuoyDetails>('/apollo-bay-series-data.json', {
    params: { lat, lon, date },
  });
  return response.data;
};

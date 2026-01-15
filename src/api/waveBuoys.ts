import type { WaveBuoyDetailsFeature, WaveBuoyPositionFeatureCollection } from '@/types';
import axios from 'axios';

export const getWaveBuoyDetails = async (
  from: string,
  to: string,
  buoy: string,
): Promise<WaveBuoyDetailsFeature> => {
  const searchParams = new URLSearchParams();
  searchParams.append('datetime', `${from}/${to}`);
  searchParams.append('waveBuoy', buoy);
  const waveDetails = await axios.get<WaveBuoyDetailsFeature>(
    '/api/v1/ogc/collections/b299cdcd-3dee-48aa-abdd-e0fcdbb9cadc/items/timeseries?' +
      searchParams.toString(),
  );
  return waveDetails.data;
};

export const getWaveBuoyLocations = async (
  date: string,
): Promise<WaveBuoyPositionFeatureCollection> => {
  const wavebuoysLocations = await axios.get<WaveBuoyPositionFeatureCollection>(
    '/api/v1/ogc/collections/b299cdcd-3dee-48aa-abdd-e0fcdbb9cadc/items/first_data_available?datetime=' +
      date,
  );
  return wavebuoysLocations.data;
};

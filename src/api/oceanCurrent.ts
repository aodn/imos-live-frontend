import { GSLA_DATA_NAME } from '@/constants';
import { buildGSLADatasetPath } from '@/utils';
import axios from 'axios';

type DataPoint = [number, number, number];

export type OceanCurrentDataResponse = {
  width: number;
  height: number;
  latRange: [number, number];
  lonRange: [number, number];
  data: DataPoint[][];
};

export const getOceanCurrentData = async (date: string): Promise<OceanCurrentDataResponse> => {
  const response = await axios.get<OceanCurrentDataResponse>(
    buildGSLADatasetPath(date, GSLA_DATA_NAME),
  );
  return response.data;
};

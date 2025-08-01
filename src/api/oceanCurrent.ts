import { GSLA_DATA_NAME } from '@/constants';
import { buildGSLADatasetPath } from '@/utils';
import { s3Api } from './instance';

type DataPoint = [number, number, number];

export type OceanCurrentDataResponse = {
  width: number;
  height: number;
  latRange: [number, number];
  lonRange: [number, number];
  data: DataPoint[][];
};

export const getOceanCurrentData = async (date: string): Promise<OceanCurrentDataResponse> => {
  console.log(buildGSLADatasetPath(date, GSLA_DATA_NAME));
  const response = await s3Api.get<OceanCurrentDataResponse>(
    buildGSLADatasetPath(date, GSLA_DATA_NAME),
  );
  return response.data;
};

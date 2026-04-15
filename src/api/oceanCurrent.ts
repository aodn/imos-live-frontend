import { GSLA_DATA_NAME } from '@/constants';
import { buildGSLADatasetPath } from '@/utils';
import axios from 'axios';
import type { LodEntry } from './scalarAtlas';

type DataPoint = [number, number, number];

export type OceanCurrentDataResponse = {
  width: number;
  height: number;
  latRange: [number, number];
  lonRange: [number, number];
  data: DataPoint[][];
};

export type OceanCurrentManifest = {
  bounds: { lonMin: number; lonMax: number; latMin: number; latMax: number };
  uRange: [number, number];
  vRange: [number, number];
  /** Keyed by LOD level ('1', '2', ...). The renderer currently uses LODs '1' and '2'. */
  lods: Record<string, LodEntry>;
};

export const getOceanCurrentData = async (date: string): Promise<OceanCurrentDataResponse> => {
  const response = await axios.get<OceanCurrentDataResponse>(
    buildGSLADatasetPath(date, GSLA_DATA_NAME),
  );
  return response.data;
};

export const getOceanCurrentManifest = async (baseUrl: string): Promise<OceanCurrentManifest> => {
  const response = await axios.get<OceanCurrentManifest>(`${baseUrl}/manifest.json`);
  return response.data;
};

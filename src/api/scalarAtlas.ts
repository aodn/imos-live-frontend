import axios from 'axios';

/**
 * Shared manifest type for all scalar atlas overlay products
 * (sea level anomaly, SST anomaly mosaic, etc.).
 */
export type HeatmapAtlasManifest = {
  bounds: { lonMin: number; lonMax: number; latMin: number; latMax: number };
  valueRange: [number, number];
  lods: {
    '1': { grid: [number, number] };
    '2': { grid: [number, number] };
  };
};

export const getHeatmapAtlasManifest = async (baseUrl: string): Promise<HeatmapAtlasManifest> => {
  const response = await axios.get<HeatmapAtlasManifest>(`${baseUrl}/manifest.json`);
  return response.data;
};

import axios from 'axios';

/**
 * Shared manifest type for all scalar atlas overlay products
 * (sea level anomaly, SST anomaly mosaic, etc.).
 */
export type LodEntry = {
  grid: [number, number];
  storedPx: [number, number];
};

export type HeatmapAtlasManifest = {
  bounds: { lonMin: number; lonMax: number; latMin: number; latMax: number };
  valueRange: [number, number];
  /** Keyed by LOD level ('1', '2', ...). The renderer currently uses LODs '1' and '2'. */
  lods: Record<string, LodEntry>;
};

export const getHeatmapAtlasManifest = async (baseUrl: string): Promise<HeatmapAtlasManifest> => {
  const response = await axios.get<HeatmapAtlasManifest>(`${baseUrl}/manifest.json`);
  return response.data;
};

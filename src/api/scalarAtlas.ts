import axios from 'axios';

/**
 * Shared manifest type for all scalar atlas overlay products
 * (sea level anomaly, SST anomaly mosaic, etc.).
 */
export type LodEntry = {
  grid: [number, number];
  /** Physical pixel dimensions of each stored chunk PNG [width, height] */
  storedPx: [number, number];
  /** Inner data pixels [width, height] — excludes padding on both sides */
  chunkPx: [number, number];
  /** Padding pixels on each side (total = 2 × padding per axis) */
  padding: number;
  /**
   * Minimum map zoom at which this LOD's scheduler activates.
   * Omit to use the system default (6). Only meaningful for LOD2 and finer.
   */
  zoomThreshold?: number;
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

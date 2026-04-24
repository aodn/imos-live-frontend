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
  products: {
    austemp_sst_anomaly_sst_anom_mosaic: {
      available_dates: string[];
      latest_date: string;
    };
    ocean_current_gsla_ucur_vcur: {
      available_dates: string[];
      latest_date: string;
    };
    ocean_current_gsla_gsla: {
      available_dates: string[];
      latest_date: string;
    };
  };
  updated_at: string;
};

export type HeatmapAtlasProductManifest = {
  bounds: { lonMin: number; lonMax: number; latMin: number; latMax: number };
  valueRange?: [number, number];
  uRange?: [number, number];
  vRange?: [number, number];
  /** Keyed by LOD level ('1', '2', ...). The renderer currently uses LODs '1' and '2'. */
  lods: Record<string, LodEntry>;
};

export const S3_BASE_URL =
  'https://imos-live-test-leslie.s3.ap-southeast-2.amazonaws.com/imos-live-data';

export const getHeatmapAtlasManifest = async (): Promise<HeatmapAtlasManifest> => {
  const response = await axios.get<HeatmapAtlasManifest>(`${S3_BASE_URL}/manifest.json`);
  return response.data;
};

export const getHeatmapAtlasProductManifest = async (args: {
  product: string;
  date: string;
}): Promise<HeatmapAtlasProductManifest> => {
  const response = await axios.get<HeatmapAtlasProductManifest>(
    `${S3_BASE_URL}/${args.product}/${args.date}/manifest.json`,
  );
  return response.data;
};

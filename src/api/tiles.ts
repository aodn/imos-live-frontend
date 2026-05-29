import type { ProductManifest } from '@/AtlasRenderingSystem';
import type { PRODUCTS, TilesProduct } from '@/constants';
import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

export type Products = Record<
  TilesProduct,
  { available_dates: string[]; full_date_range: { start: string; end: string } }
>;

export type MetaDataManifest = {
  products: Products;
  cache_version: string;
};

/**
 * Base URL for the tile/manifest origin. Configured via `VITE_TILE_BASE_URL`
 * in `.env` (or `.env.local`). Production should point at the TLS-terminated
 * CloudFront distribution; the bare-IP HTTP default is only retained as a
 * fallback for engineers running against a raw origin during local tile
 * pipeline work.
 */
export const TILE_BASE_URL: string =
  import.meta.env.VITE_TILE_BASE_URL || 'http://3.106.121.209/data_tiles';

export const getMetaDataManifest = async (): Promise<MetaDataManifest> => {
  const response = await axios.get<MetaDataManifest>(`${TILE_BASE_URL}/manifest`);
  return response.data;
};

export const getProductManifest = async (args: {
  product: TilesProduct;
  date: string;
}): Promise<ProductManifest> => {
  const response = await axios.get<ProductManifest>(
    `${TILE_BASE_URL}/${args.product}/${args.date}/manifest.json`,
  );
  return response.data;
};

// staleTime: Infinity because a product's tile manifest for a given date is immutable.
export const productManifestQueryOptions = (product: TilesProduct, date: string) =>
  queryOptions({
    queryKey: ['productManifest', product, date] as const,
    queryFn: () => getProductManifest({ product, date }),
    staleTime: Infinity,
  });

export type PointVariable = {
  value: number | null;
  units: string;
};

export type PointData<T extends TilesProduct> = {
  lat: number;
  lon: number;
  variables: Record<
    (typeof PRODUCTS)[T]['variables'] extends string[]
      ? (typeof PRODUCTS)[T]['variables'][number]
      : string,
    PointVariable
  >;
};

export const getPointData = async <T extends TilesProduct>(args: {
  product: T;
  date: string;
  lat: number;
  lon: number;
}): Promise<PointData<T>> => {
  const response = await axios.get<PointData<T>>(
    `${TILE_BASE_URL}/${args.product}/${args.date}/point?lon=${args.lon}&lat=${args.lat}`,
  );
  return response.data;
};

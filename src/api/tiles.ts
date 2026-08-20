import type { ProductManifest } from '@/AtlasRenderingSystem';
import type { PRODUCTS, TilesProduct } from '@/constants';
import { extractProductVariables, getCollectionIdForProduct } from '@/constants';
import type { TIMEZONE } from '@/store';
import { utcDateOnly, utcToLocalDateTime } from '@/utils';
import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

type Product = {
  id: TilesProduct;
  available_dates: string[];
  full_date_range: { start: string; end: string };
  tile_types: 'visual' | 'data'[];
  data_tile_url_template: string;
  visual_tile_url_template: string;
  data_manifest_url_template: string;
  legend_url: string;
  variable: string;
};
export type Products = Product[];

export type MetaDataManifest = {
  products: Products;
};

export type NormalisedDate = {
  date: string;
  utc_date: string;
  local_date: string;
};
export type NormalisedProduct = Omit<Product, 'available_dates' | 'full_date_range'> & {
  available_dates: NormalisedDate[];
  full_date_range: { start: NormalisedDate; end: NormalisedDate };
};
export type NormalisedProducts = NormalisedProduct[];

// normalisedDate has the preprocessed date in UTC and local.
export function pickDateByTimezone(normalisedDate: NormalisedDate, timezone: TIMEZONE): string {
  return timezone === 'UTC' ? normalisedDate.utc_date : normalisedDate.local_date;
}

// The manifest's dates are UTC instants; normalise each into its raw form
// plus the UTC/local calendar-day readings so consumers can pick the one
// that matches the app's `timezone` (UTC/LOCAL) setting without re-deriving it.
function normaliseDate(date: string): NormalisedDate {
  return {
    date,
    utc_date: utcDateOnly(date, 'YYYY-MM-DD'),
    local_date: utcToLocalDateTime(date, 'YYYY-MM-DD'),
  };
}

function normaliseProduct(product: Product): NormalisedProduct {
  return {
    ...product,
    available_dates: product.available_dates.map(normaliseDate),
    full_date_range: {
      start: normaliseDate(product.full_date_range.start),
      end: normaliseDate(product.full_date_range.end),
    },
  };
}

export const TILE_BASE_PATH = '/api/v1/ogc/ext/tiles/collections';

// ---------- Meta Data Manifest - product availability ----------
export const getMetaDataManifest = async (args: {
  collectionId: string;
}): Promise<MetaDataManifest> => {
  const response = await axios.get<MetaDataManifest>(
    `${TILE_BASE_PATH}/${args.collectionId}/products`,
  );
  return response.data;
};

// Shared key/fn for the top-level manifest so every consumer hits one cache
// entry (and one network request). Per-observer `select`/`enabled` are layered
// on at the call site.
export const metaDataManifestQueryOptions = () =>
  queryOptions({
    queryKey: ['tiles_product_latest_date'] as const,
    queryFn: () => {
      const collectionIDS = [
        '0c9eb39c-9cbe-4c6a-8a10-5867087e703a',
        '2ffccdad-1197-4e41-b412-a9033517cfb2',
      ];
      const promises = collectionIDS.map(collectionId => getMetaDataManifest({ collectionId }));
      return Promise.all(promises).then(results => {
        const mergedProducts: Products = results.reduce((acc, manifest) => {
          return [...acc, ...manifest.products];
        }, [] as Products);
        const normalisedProducts: NormalisedProducts = mergedProducts.map(normaliseProduct);
        return { products: normalisedProducts };
      });
    },
  });

// ---------- Product Manifest - product contract----------
export const getProductManifest = async (args: {
  product: TilesProduct;
  date: string;
}): Promise<ProductManifest> => {
  const { dataset, variable } = extractProductVariables(args.product);
  const response = await axios.get<ProductManifest>(
    `${TILE_BASE_PATH}/${getCollectionIdForProduct(args.product)}/data_tiles/manifest`,
    { params: { dataset, variable, datetime: args.date } },
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

// ---------- Point Data ----------
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
  const { dataset, variable } = extractProductVariables(args.product);
  const response = await axios.get<PointData<T>>(
    `${TILE_BASE_PATH}/${getCollectionIdForProduct(args.product)}/data_tiles/point`,
    { params: { dataset, variable, datetime: args.date, lat: args.lat, lon: args.lon } },
  );
  return response.data;
};

import type { ProductManifest } from '@/AtlasRenderingSystem';
import type { PRODUCTS, TilesProduct } from '@/constants';
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

export const TILE_BASE_PATH = '/api/v1/ogc/ext/tiles/collections';

export function extractProductVariables(product: TilesProduct): {
  dataset: string;
  variable: string;
} {
  const [dataset, variable] = product.split(':');
  return { dataset, variable };
}

// ---------- Meta Data Manifest ----------
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

        return { products: mergedProducts };
      });
    },
  });

// ---------- Product Manifest ----------
export const getProductManifest = async (args: {
  collectionId: string;
  product: TilesProduct;
  date: string;
}): Promise<ProductManifest> => {
  const { dataset, variable } = extractProductVariables(args.product);
  const response = await axios.get<ProductManifest>(
    `${TILE_BASE_PATH}/${args.collectionId}/data_tiles/manifest`,
    { params: { dataset, variable, datetime: args.date } },
  );
  return response.data;
};

// staleTime: Infinity because a product's tile manifest for a given date is immutable.
export const productManifestQueryOptions = (
  collectionId: string,
  product: TilesProduct,
  date: string,
) =>
  queryOptions({
    queryKey: ['productManifest', product, date] as const,
    queryFn: () => getProductManifest({ collectionId, product, date }),
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
  const response = await axios.get<PointData<T>>(
    `${TILE_BASE_PATH}/${args.product}/${args.date}/point`,
    { params: { lon: args.lon, lat: args.lat } },
  );
  return response.data;
};

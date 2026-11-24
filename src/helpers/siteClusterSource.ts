import { SITE_CLUSTER_SOURCE_ID, SITE_GROUP, type SiteProduct } from '@/constants';
import type { RawSiteFeatureCollection } from '@/types';
import { addOrUpdateGeoJsonSource } from './addOrUpdateGeoJsonSource';

type SiteFeatures = RawSiteFeatureCollection['features'];

// Latest features of each enabled site product. Kept outside React so every product's
// hook can write to the one shared clustered source.
const featuresByProduct = new Map<SiteProduct, SiteFeatures>();

// Tags each feature with its product and merges all products in a stable order.
export function combineSiteFeatures(byProduct: ReadonlyMap<SiteProduct, SiteFeatures>) {
  return SITE_GROUP.flatMap(product =>
    (byProduct.get(product) ?? []).map(f => ({
      ...f,
      properties: { ...f.properties, product },
    })),
  );
}

// Writes the combined features of all products to the shared clustered source.
export function updateSiteClusterSource(map: mapboxgl.Map) {
  addOrUpdateGeoJsonSource({
    map,
    id: SITE_CLUSTER_SOURCE_ID,
    data: { type: 'FeatureCollection', features: combineSiteFeatures(featuresByProduct) },
    enableCluster: true,
    clusterRadius: 40,
  });
}

// Sets (or clears, when `features` is empty) one product's sites in the shared source.
export function setSiteProductFeatures(
  map: mapboxgl.Map,
  product: SiteProduct,
  features: SiteFeatures,
) {
  if (features.length) featuresByProduct.set(product, features);
  else featuresByProduct.delete(product);
  updateSiteClusterSource(map);
}

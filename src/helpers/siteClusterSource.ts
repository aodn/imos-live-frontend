import { SITE_CLUSTER_SOURCE_ID, SITE_GROUP, type SiteProduct } from '@/constants';
import type { RawSiteFeatureCollection } from '@/types';
import { addOrUpdateGeoJsonSource } from './addOrUpdateGeoJsonSource';

type SiteFeatures = RawSiteFeatureCollection['features'];

// Latest features of each enabled site product. Kept outside React so every product's
// hook can write to the one shared clustered source.
const featuresByProduct = new Map<SiteProduct, SiteFeatures>();

// Stable per-site id, so feature state (selection) survives other products loading or unloading.
function siteId(product: SiteProduct, feature: SiteFeatures[number]) {
  const [lng, lat] = feature.geometry.coordinates;
  return `${product}:${feature.properties.site ?? `${lng},${lat}`}`;
}

// Tags each feature with its product and a stable `_id`, and merges all products in a stable order.
export function combineSiteFeatures(byProduct: ReadonlyMap<SiteProduct, SiteFeatures>) {
  return SITE_GROUP.flatMap(product =>
    (byProduct.get(product) ?? []).map(f => {
      const _id = siteId(product, f);
      return { ...f, id: _id, properties: { ...f.properties, product, _id } };
    }),
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
    assignIds: false,
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

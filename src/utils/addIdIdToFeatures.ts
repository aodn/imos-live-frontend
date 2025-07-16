import { Point } from 'geojson';

export function addIdToFeatures(features: GeoJSON.FeatureCollection['features']) {
  features.forEach((feature, index) => {
    const coords = (feature.geometry as Point).coordinates;
    const id = `${coords[0].toFixed(2)}-${coords[1].toFixed(2)}-${index}`;
    if (!feature.properties) feature.properties = {};

    // Set the _id property which will be promoted to feature ID by Mapbox
    feature.properties._id = id;

    // You can still set feature.id for non-clustered use cases
    // but it won't persist through clustering
    feature.id = id;
  });
}

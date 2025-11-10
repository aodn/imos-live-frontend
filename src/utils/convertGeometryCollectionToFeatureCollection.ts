export type GeometryCollection = {
  type: 'GeometryCollection';
  geometries: GeoJSON.Geometry[];
};

export function convertGeometryCollectionToFeatureCollection(
  data: GeometryCollection | GeoJSON.FeatureCollection,
): GeoJSON.FeatureCollection {
  if (data.type === 'GeometryCollection' && 'geometries' in data) {
    return {
      type: 'FeatureCollection',
      features: data.geometries.map((geometry, index) => ({
        type: 'Feature',
        id: index,
        properties: {},
        geometry: geometry,
      })),
    };
  }
  return data;
}

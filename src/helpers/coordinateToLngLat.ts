import mapboxgl from 'mapbox-gl';

export function coordinateToLngLat(coordinates: [number, number]) {
  const [lng, lat] = coordinates;
  return new mapboxgl.LngLat(lng, lat);
}

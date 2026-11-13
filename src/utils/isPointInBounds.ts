export type LonLatBounds = { lonMin: number; lonMax: number; latMin: number; latMax: number };

/**
 * Whether (lng, lat) falls inside `bounds`, inclusive.
 *
 * `lng` is expected wrapped to [-180, 180] (e.g. from `LngLat.wrap()`), while bounds may
 * cross the antimeridian (e.g. lonMin 57, lonMax 185). A lng west of lonMin is unwrapped
 * by +360 before comparing. Only for this check — callers querying the backend should
 * keep sending the wrapped lng.
 */
export function isPointInBounds(bounds: LonLatBounds, lng: number, lat: number): boolean {
  const unwrappedLng = lng < bounds.lonMin ? lng + 360 : lng;
  return (
    unwrappedLng >= bounds.lonMin &&
    unwrappedLng <= bounds.lonMax &&
    lat >= bounds.latMin &&
    lat <= bounds.latMax
  );
}

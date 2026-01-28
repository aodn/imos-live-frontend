/**
 * Formats latitude and longitude numbers into a directional string commonly used
 * in maritime, meteorological, and Australian coastal contexts (e.g. wave buoy data).
 *
 * @example
 * formatLatLngToDirectional(-38.38, 142.29)
 * // → "38.38S, 142.29E"
 *
 * @example
 * formatLatLngToDirectional(-33.867, 151.207, 3)
 * // → "33.867S, 151.207E"
 *
 * @example
 * formatLatLngToDirectional(0, 0)
 * // → "0.00, 0.00"  (no direction for equator/prime meridian)
 *
 * @param lat - Latitude in decimal degrees (-90 to 90)
 * @param lng - Longitude in decimal degrees (-180 to 180)
 * @param decimals - Number of decimal places to show (default: 2)
 * @returns A string in the format "DD.DD[NS], DD.DD[EW]" or empty string if inputs are invalid.
 *          Uses 'S'/'N' for latitude and 'E'/'W' for longitude.
 *          At exactly 0°, no direction letter is added.
 */
export function formatLatLngToDirectional(lat: number, lng: number, decimals: number = 2): string {
  if (isNaN(lat) || isNaN(lng)) return '';

  const latAbs = Math.abs(lat);
  const latDir = lat < 0 ? 'S' : lat > 0 ? 'N' : '';
  const lngAbs = Math.abs(lng);
  const lngDir = lng < 0 ? 'W' : lng > 0 ? 'E' : '';

  return `${latAbs.toFixed(decimals)}${latDir}, ${lngAbs.toFixed(decimals)}${lngDir}`;
}

// const OGC_BASE_URL = import.meta.env.VITE_OGC_BASE_URL;
/**
 * Builds a URL for fetching buoys geojson.
 *
 * Currently, it is to call the proxy server setup in vite.config.ts to bypass CORS issues.
 * /api/aodn is the proxy address setup in vite.config.ts, when calling the /api/aodn, it will be replaced with the actual address.
 * as cors is not allowed in the server, so the proxy is used to bypass the CORS issue.
 *
 * @returns {string} URL path to the resource.
 * @param id
 *
 */
export function buildOgcBuoysUrl(id: string): string {
  return `/api/aodn/api/v1/ogc/collections/${id}/items/summary`;
  //return 'wave_buoys.geojson';
}

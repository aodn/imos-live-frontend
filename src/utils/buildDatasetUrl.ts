const VITE_S3_BASE_URL = import.meta.env.VITE_S3_BASE_URL;
/**
 * Builds a dataset URL for fetching assets.
 *
 * @returns {string} URL path to the resource.
 * @param date
 * @param type
 */
export function buildDatasetUrl(date: string, type: string): string {
  return `${VITE_S3_BASE_URL}/${date}/${type}`;
  //return `${date}/${type}`;
}

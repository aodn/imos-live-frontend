const datasetBaseUrl = import.meta.env.VITE_DATASET_BASE_URL;

/**
 * Builds a dataset URL for fetching assets.
 *
 * @returns {string} URL path to the resource.
 * @param date
 * @param type
 */
export function buildDatasetUrl(date: string, type: string): string {
  return `${datasetBaseUrl}/images/${date}/${type}`;
  //return `${date}/${type}`
}

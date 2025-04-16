const datasetBaseUrl = import.meta.env.VITE_DATASET_BASE_URL;

/**
 * Builds a dataset URL for fetching assets.
 *
 * @param {string} dataset - Dataset folder name (e.g. "2025-04-01").
 * @param {string} filename - File inside the dataset folder (e.g. "gsla_input.png").
 * @returns {string} URL path to the resource.
 */
export function buildDatasetUrl(date: string, type: string) {
  return `${datasetBaseUrl}images/${date}/${type}`;
}

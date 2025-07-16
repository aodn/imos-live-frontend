const VITE_S3_BASE_URL = import.meta.env.VITE_S3_BASE_URL;

export function buildGSLADatasetFullPath(date: string, type: string): string {
  return `${VITE_S3_BASE_URL}/${buildGSLADatasetPath(date, type)}`;
}

export function buildGSLADatasetPath(date: string, type: string): string {
  return `GSLA/${date}/${type}`;
}

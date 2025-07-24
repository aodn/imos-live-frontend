const s3_base_url = import.meta.env.VITE_S3_BASE_URL;
export function buildGSLADatasetFullPath(date: string, type: string): string {
  return `${s3_base_url}/${buildGSLADatasetPath(date, type)}`;
}

export function buildGSLADatasetPath(date: string, type: string): string {
  return `GSLA/${date}/${type}`;
}

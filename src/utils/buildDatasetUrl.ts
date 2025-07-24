//VITE_EDGE_BASE_URL=/proxy-edge, this should be defined in env for development.
import { getS3BaseUrl } from '@/utils';

export function buildGSLADatasetFullPath(date: string, type: string): string {
  const s3_base_url = getS3BaseUrl();
  return `${s3_base_url}/${buildGSLADatasetPath(date, type)}`;
}

export function buildGSLADatasetPath(date: string, type: string): string {
  return `GSLA/${date}/${type}`;
}

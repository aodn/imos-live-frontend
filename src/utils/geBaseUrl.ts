//VITE_EDGE_BASE_URL=/proxy-edge, this should be defined in env for development.
const MODE = import.meta.env.MODE;
export function getS3BaseUrl() {
  const VITE_S3_BASE_URL = import.meta.env.VITE_S3_BASE_URL;
  const VITE_EDGE_BASE_URL =
    MODE === 'development' ? (import.meta.env.VITE_EDGE_BASE_URL ?? '') : undefined;

  return MODE === 'development' ? VITE_EDGE_BASE_URL : VITE_S3_BASE_URL;
}

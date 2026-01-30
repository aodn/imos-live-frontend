import axios, { type AxiosInstance } from 'axios';

const s3_base_url = import.meta.env.VITE_S3_BASE_URL;

export const s3Api: AxiosInstance = axios.create({
  baseURL: `${s3_base_url}`,
  timeout: 10000,
});

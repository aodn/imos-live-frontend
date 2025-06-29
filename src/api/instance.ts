import axios from 'axios';

const datasetBaseUrl = import.meta.env.VITE_DATASET_BASE_URL;
const s3_base_url = import.meta.env.VITE_S3_BASE_URL;

export const api: Axios.AxiosInstance = axios.create({
  baseURL: `${datasetBaseUrl}/api/v1`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

export const s3Api: Axios.AxiosInstance = axios.create({
  baseURL: `${s3_base_url}`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.request.use(
  config => {
    // const token = localStorage.getItem("token");
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  error => Promise.reject(error),
);

api.interceptors.response.use(
  response => response,
  error => {
    console.error('API error:', error);
    return Promise.reject(error);
  },
);

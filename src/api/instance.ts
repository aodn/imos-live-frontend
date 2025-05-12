import axios from 'axios';

const datasetBaseUrl = import.meta.env.VITE_DATASET_BASE_URL;

const api: Axios.AxiosInstance = axios.create({
  baseURL: `${datasetBaseUrl}/api/v1`,
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

export default api;

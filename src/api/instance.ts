import axios from 'axios';
import { getS3BaseUrl } from '@/utils';

const s3_base_url = getS3BaseUrl();

export const s3Api: Axios.AxiosInstance = axios.create({
  baseURL: `${s3_base_url}`,
  timeout: 10000,
});

import axios from 'axios';
import { queryClient } from '@/config/reactQueryConfig';

export const getThreddsCatalog = async (path: string, date: Date): Promise<string> => {
  const year = date.getFullYear();
  const catalogUrl = `/thredds/catalog/${path}/${year}/catalog.html`;

  // Cache catalog fetches to avoid redundant HTTP requests
  return queryClient.fetchQuery({
    queryKey: ['thredds-catalog', path, year],
    queryFn: async () => {
      const catalog = await axios.get<string>(catalogUrl);
      return catalog.data;
    },
  });
};
//TODO: Fix CloudFront Cache Behavior. Add caching at the CloudFront distribution level: Cache-Control: public, max-age=86400  (24 hours)

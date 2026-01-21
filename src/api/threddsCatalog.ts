import axios from 'axios';
import { queryClient } from '@/config/reactQueryConfig';

export const getThreddsCatalog = async (path: string, date: Date): Promise<string> => {
  const year = date.getFullYear();
  const catalogUrl = `/thredds/catalog/${path}/${year}/catalog.html`;

  return queryClient.fetchQuery({
    queryKey: ['thredds-catalog', path, year],
    queryFn: async () => {
      const catalog = await axios.get<string>(catalogUrl);
      return catalog.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

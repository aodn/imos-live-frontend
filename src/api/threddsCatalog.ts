import axios from 'axios';
export const getThreddsCatalog = async (path: string, date: Date): Promise<string> => {
  const catalog = await axios.get<string>(
    `/thredds/catalog/${path}/${date.getFullYear()}/catalog.html`,
  );
  return catalog.data;
};

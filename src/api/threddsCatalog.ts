import axios from 'axios';
export const getThreddsCatalog = async (date: Date): Promise<string> => {
  const catalog = await axios.get<string>(
    `/thredds/catalog/IMOS/OceanCurrent/GSLA/NRT/${date.getFullYear()}/catalog.html`,
  );
  return catalog.data;
};

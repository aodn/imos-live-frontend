import { fakeApi } from './instance';

export type RangeType = [number, number];

export type MetaType = {
  latRange: RangeType;
  lonRange: RangeType;
  uRange: RangeType;
  vRange: RangeType;
};

export const getMetaData = async (url: string): Promise<MetaType> => {
  const response = await fakeApi.get<MetaType>(url);
  return response.data;
};

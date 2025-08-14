import { s3Api } from './instance';

export type RangeType = [number, number];

//latRange, lonRange are adjusted with offset. raw_latRange and raw_lonRange without offest adjustment.
//latRange, lonRange used for map, and particle layer bounds.
//raw_latRange and raw_lonRange are used for overlay layer bounds. It is because the overlay.png image generated based on raw_latRange and raw_lonRange.
export type MetaType = {
  latRange: RangeType;
  lonRange: RangeType;
  rawLatRange?: RangeType;
  rawLonRange?: RangeType;
  uRange: RangeType;
  vRange: RangeType;
  speedRange: RangeType;
  gslaRange: RangeType;
};

export const getMetaData = async (url: string): Promise<MetaType> => {
  const response = await s3Api.get<MetaType>(url);
  return response.data;
};

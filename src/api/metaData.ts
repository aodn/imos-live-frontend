import axios from 'axios';

export type RangeType = [number, number];

//latRange, lonRange are adjusted with offset. raw_latRange and raw_lonRange without offest adjustment.
//latRange, lonRange used for map, and particle layer bounds.
//raw_latRange and raw_lonRange are used for raster layer bounds. It is because the raster.png image generated based on raw_latRange and raw_lonRange.
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
  const response = await axios.get<MetaType>(url);
  return response.data;
};

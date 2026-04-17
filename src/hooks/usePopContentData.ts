import { getOceanCurrentData } from '@/api';
import {
  GSLA_DATA_NAME,
  PRODUCT,
  GSLA_RASTER_SOURCE_ID,
  AUSTEMP_SSTA_MOSAIC_RASTER_SOURCE_ID,
  AUSTEMP_DHD_MOSAIC_RASTER_SOURCE_ID,
} from '@/constants';
import {
  fetchDhdAnomalyMosaic,
  fetchGslaAnomalySeaLevelsData,
  fetchSstAnomalyMosaic,
} from '@/helpers';
import { processOceanCurrentDetails } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import type { LngLat, Point } from 'mapbox-gl';

type UseClickedMapPopupContentData = {
  oceanCurrentEnabled: boolean;
  sstAnomMosaicEnabled: boolean;
  dhdAnomalMosaicEnabled: boolean;
  gslaAnomalySeaLevelsEnabled: boolean;
  date: string;
  lngLat: LngLat;
  point: Point;
  mapSize: {
    width: number;
    height: number;
  };
  mapBounds: [number, number, number, number];
};

export function useClickedMapPopupContentData({
  mapBounds,
  mapSize,
  oceanCurrentEnabled,
  gslaAnomalySeaLevelsEnabled,
  sstAnomMosaicEnabled,
  dhdAnomalMosaicEnabled,
  date,
  lngLat,
  point,
}: UseClickedMapPopupContentData) {
  const { data: gslaOceanCurrent, isLoading: isGslaOceanCurrentLoading } = useQuery({
    queryKey: [GSLA_DATA_NAME, date],
    queryFn: () => getOceanCurrentData(date),
    enabled: !!date && oceanCurrentEnabled,
    select: raw => {
      const oceanCurrentDetails = processOceanCurrentDetails(lngLat, raw);
      return {
        [PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT]: {
          speed: oceanCurrentDetails?.speed,
          direction: oceanCurrentDetails?.direction,
          degree: oceanCurrentDetails?.degree,
        },
      };
    },
  });

  const { data: gslaAnomalySeaLevels, isLoading: isGslaAnomalySeaLevelsLoading } = useQuery({
    queryKey: [GSLA_RASTER_SOURCE_ID, date, mapBounds, mapSize, point],
    queryFn: () => fetchGslaAnomalySeaLevelsData(date, mapBounds, mapSize, point),
    enabled: !!date && gslaAnomalySeaLevelsEnabled,
  });

  const { data: sstAnomalyMosatic, isLoading: isSstAnomalyMosaticLoading } = useQuery({
    queryKey: [AUSTEMP_SSTA_MOSAIC_RASTER_SOURCE_ID, date, mapBounds, mapSize, point],
    queryFn: () => fetchSstAnomalyMosaic(date, mapBounds, mapSize, point),
    enabled: !!date && sstAnomMosaicEnabled,
  });

  const { data: dhdAnomalyMosaic, isLoading: isDhdAnomalyMosaicLoading } = useQuery({
    queryKey: [AUSTEMP_DHD_MOSAIC_RASTER_SOURCE_ID, date, mapBounds, mapSize, point],
    queryFn: () => fetchDhdAnomalyMosaic(date, mapBounds, mapSize, point),
    enabled: !!date && dhdAnomalMosaicEnabled,
  });

  const data = {
    [PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT]:
      gslaOceanCurrent?.[PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT],
    [PRODUCT.GSLA_ANOMALY_SEA_LEVELS]: gslaAnomalySeaLevels?.[PRODUCT.GSLA_ANOMALY_SEA_LEVELS],
    [PRODUCT.AUSTEMP_SSTA_MOSAIC]: sstAnomalyMosatic?.[PRODUCT.AUSTEMP_SSTA_MOSAIC],
    [PRODUCT.AUSTEMP_DHD_MOSAIC]: dhdAnomalyMosaic?.[PRODUCT.AUSTEMP_DHD_MOSAIC],
  };

  return {
    data,
    isLoading:
      isGslaAnomalySeaLevelsLoading ||
      isGslaOceanCurrentLoading ||
      isSstAnomalyMosaticLoading ||
      isDhdAnomalyMosaicLoading,
  };
}

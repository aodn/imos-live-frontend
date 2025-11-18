import { getOceanCurrentData } from '@/api';
import {
  GSLA_DATA_NAME,
  Product,
  GSLA_OVERLAY_SOURCE_ID,
  SST_ANOMALY_MOSAIC_OVERLAY_SOURCE_ID,
  OverlaySource,
} from '@/constants';
import { fetchGslaAnomalySeaLevelsData, fetchSstAnomalyMosaic } from '@/helpers';
import { processOceanCurrentDetails } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { LngLat, Point } from 'mapbox-gl';

type UsePopupContentData = {
  particles: boolean;
  overlay: boolean;
  overlaySource: OverlaySource;
  date: string;
  lngLat: LngLat;
  point: Point;
  mapSize: {
    width: number;
    height: number;
  };
  mapBounds: [number, number, number, number];
};

export const usePopupContentData = ({
  mapBounds,
  mapSize,
  particles,
  overlay,
  overlaySource,
  date,
  lngLat,
  point,
}: UsePopupContentData) => {
  const { data: gslaOceanCurrent, isLoading: isGslaOceanCurrentLoading } = useQuery({
    queryKey: [GSLA_DATA_NAME, date],
    queryFn: () => getOceanCurrentData(date),
    enabled: !!date && particles,
    select: raw => {
      const oceanCurrentDetails = processOceanCurrentDetails(lngLat, raw);
      return {
        [Product.GSLA_OCEAN_GEOSTROPHIC_CURRENT]: {
          speed: oceanCurrentDetails?.speed,
          direction: oceanCurrentDetails?.direction,
          degree: oceanCurrentDetails?.degree,
        },
      };
    },
  });

  const { data: gslaAnomalySeaLevels, isLoading: isGslaAnomalySeaLevelsLoading } = useQuery({
    queryKey: [GSLA_OVERLAY_SOURCE_ID, date, mapBounds, mapSize, point],
    queryFn: () => fetchGslaAnomalySeaLevelsData(date, mapBounds, mapSize, point),
    enabled: !!date && overlay && overlaySource === GSLA_OVERLAY_SOURCE_ID,
  });

  const { data: sstAnomalyMosatic, isLoading: isSstAnomalyMosaticLoading } = useQuery({
    queryKey: [SST_ANOMALY_MOSAIC_OVERLAY_SOURCE_ID, date, mapBounds, mapSize, point],
    queryFn: () => fetchSstAnomalyMosaic(date, mapBounds, mapSize, point),
    enabled: !!date && overlay && overlaySource === SST_ANOMALY_MOSAIC_OVERLAY_SOURCE_ID,
  });

  const data = {
    [Product.GSLA_OCEAN_GEOSTROPHIC_CURRENT]: gslaOceanCurrent?.['gsla-ocean-geostrophic-current'],
    [Product.GSLA_ANOMALY_SEA_LEVELS]: gslaAnomalySeaLevels?.['gsla-anomaly-sea-levels'],
    [Product.SST_ANOMALY_MOSAIC]: sstAnomalyMosatic?.['sst-anom-mosaic'],
  };

  return {
    data,
    isLoading:
      isGslaAnomalySeaLevelsLoading || isGslaOceanCurrentLoading || isSstAnomalyMosaticLoading,
  };
};

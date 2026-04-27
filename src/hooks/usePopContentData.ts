import { getProductData } from '@/api';
import { PRODUCT, PRODUCTS } from '@/constants';
import {
  processScalarDetails,
  toCompassDegree,
  toCompassDirection,
  type OceanCurrentData,
  type ScalarData,
} from '@/utils';
import { useQuery } from '@tanstack/react-query';
import type { LngLat } from 'mapbox-gl';

type UseClickedMapPopupContentData = {
  oceanCurrentEnabled: boolean;
  gslaAnomalySeaLevelsEnabled: boolean;
  sstAnomMosaicEnabled: boolean;
  marineHeatwaveDhdEnabled: boolean;
  marineHeatwaveSstaEnabled: boolean;
  date: string;
  lngLat: LngLat;
};

export function useClickedMapPopupContentData({
  oceanCurrentEnabled,
  gslaAnomalySeaLevelsEnabled,
  sstAnomMosaicEnabled,
  marineHeatwaveDhdEnabled,
  marineHeatwaveSstaEnabled,
  date,
  lngLat,
}: UseClickedMapPopupContentData) {
  const { data: gslaOceanCurrent, isLoading: isOceanCurrentLoading } = useQuery({
    queryKey: [PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT, 'getProductData', date],
    queryFn: () =>
      getProductData({
        product: PRODUCTS[PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT].bucketPath,
        date,
      }),
    enabled: !!date && oceanCurrentEnabled,
    select: (raw: OceanCurrentData) => {
      const tuple = processScalarDetails(lngLat, raw);
      if (!tuple) return null;
      const [speed, cartesianDegree] = tuple;
      return {
        speed,
        degree: toCompassDegree(cartesianDegree),
        direction: toCompassDirection(cartesianDegree),
      };
    },
  });

  const { data: gslaAnomaly, isLoading: isGslaAnomalyLoading } = useQuery({
    queryKey: [PRODUCT.GSLA_ANOMALY_SEA_LEVELS, 'getProductData', date],
    queryFn: () =>
      getProductData({
        product: PRODUCTS[PRODUCT.GSLA_ANOMALY_SEA_LEVELS].bucketPath,
        date,
      }),
    enabled: !!date && gslaAnomalySeaLevelsEnabled,
    select: (raw: ScalarData) => processScalarDetails(lngLat, raw),
  });

  const { data: sstAnomaly, isLoading: isSstAnomalyLoading } = useQuery({
    queryKey: [PRODUCT.SST_ANOMALY_MOSAIC, 'getProductData', date],
    queryFn: () =>
      getProductData({
        product: PRODUCTS[PRODUCT.SST_ANOMALY_MOSAIC].bucketPath,
        date,
      }),
    enabled: !!date && sstAnomMosaicEnabled,
    select: (raw: ScalarData) => processScalarDetails(lngLat, raw),
  });

  const { data: marineHeatwaveDhd, isLoading: isMarineHeatwaveDhdLoading } = useQuery({
    queryKey: [PRODUCT.MARINE_HEATWAVE_DHD_MOSAIC, 'getProductData', date],
    queryFn: () =>
      getProductData({
        product: PRODUCTS[PRODUCT.MARINE_HEATWAVE_DHD_MOSAIC].bucketPath,
        date,
      }),
    enabled: !!date && marineHeatwaveDhdEnabled,
    select: (raw: ScalarData) => processScalarDetails(lngLat, raw),
  });

  const { data: marineHeatwaveSsta, isLoading: isMarineHeatwaveSstaLoading } = useQuery({
    queryKey: [PRODUCT.MARINE_HEATWAVE_SSTA_MOSAIC, 'getProductData', date],
    queryFn: () =>
      getProductData({
        product: PRODUCTS[PRODUCT.MARINE_HEATWAVE_SSTA_MOSAIC].bucketPath,
        date,
      }),
    enabled: !!date && marineHeatwaveSstaEnabled,
    select: (raw: ScalarData) => processScalarDetails(lngLat, raw),
  });

  return {
    data: {
      [PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT]: gslaOceanCurrent ?? null,
      [PRODUCT.GSLA_ANOMALY_SEA_LEVELS]: gslaAnomaly ?? null,
      [PRODUCT.SST_ANOMALY_MOSAIC]: sstAnomaly ?? null,
      [PRODUCT.MARINE_HEATWAVE_DHD_MOSAIC]: marineHeatwaveDhd ?? null,
      [PRODUCT.MARINE_HEATWAVE_SSTA_MOSAIC]: marineHeatwaveSsta ?? null,
    },
    isLoading:
      isOceanCurrentLoading ||
      isGslaAnomalyLoading ||
      isSstAnomalyLoading ||
      isMarineHeatwaveDhdLoading ||
      isMarineHeatwaveSstaLoading,
  };
}

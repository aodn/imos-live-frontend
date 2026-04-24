import { getProductData } from '@/api';
import { PRODUCT, PRODUCTS } from '@/constants';
import { processOceanCurrentDetails } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import type { LngLat } from 'mapbox-gl';

type UseClickedMapPopupContentData = {
  oceanCurrentEnabled: boolean;
  date: string;
  lngLat: LngLat;
};

export function useClickedMapPopupContentData({
  oceanCurrentEnabled,
  date,
  lngLat,
}: UseClickedMapPopupContentData) {
  const { data: gslaOceanCurrent, isLoading } = useQuery({
    queryKey: [PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT, 'getProductData', date],
    queryFn: () =>
      getProductData({
        product: PRODUCTS[PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT].bucketPath,
        date,
      }),
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

  return {
    data: {
      [PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT]:
        gslaOceanCurrent?.['gsla-ocean-geostrophic-current'],
    },
    isLoading,
  };
}

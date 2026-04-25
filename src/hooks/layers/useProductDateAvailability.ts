import type { WebGlLayerProduct } from '@/constants';
import { PRODUCTS } from '@/constants';
import { getMetaDataManifest } from '@/api';
import type { MetaDataManifest } from '@/api';
import { useQuery } from '@tanstack/react-query';

export function useProductDateAvailability(product: WebGlLayerProduct, date: string) {
  const bucketPath = PRODUCTS[product].bucketPath as keyof MetaDataManifest['products'];

  const { data, isSuccess } = useQuery({
    queryKey: ['webgl_product_latest_date'],
    queryFn: getMetaDataManifest,
  });

  const isDateAvailable = isSuccess
    ? data.products[bucketPath].available_dates.includes(date)
    : true;

  return { isDateAvailable, isMetaManifestLoaded: isSuccess };
}

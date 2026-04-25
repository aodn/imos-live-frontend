import type { WebGlLayerProduct } from '@/constants';
import { PRODUCTS } from '@/constants';
import { getMetaDataManifest } from '@/api';
import type { MetaDataManifest } from '@/api';
import { setProductErrorByProduct } from '@/store';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

export function useProductDateAvailabilitySync(product: WebGlLayerProduct, date: string) {
  const bucketPath = PRODUCTS[product].bucketPath as keyof MetaDataManifest['products'];

  const { data, isSuccess } = useQuery({
    queryKey: ['webgl_product_latest_date'],
    queryFn: getMetaDataManifest,
  });

  // Optimistically true while the manifest is loading — avoids blocking downstream
  // requests before we know whether the date is actually unavailable.
  const isDateAvailable = isSuccess
    ? data.products[bucketPath].available_dates.includes(date)
    : true;

  useEffect(() => {
    if (!isSuccess) return;
    setProductErrorByProduct(product, !isDateAvailable);
  }, [isSuccess, isDateAvailable, product, date]);

  return { isDateAvailable };
}

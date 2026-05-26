import type { TilesProduct } from '@/constants';
import { getMetaDataManifest } from '@/api';
import { setProductErrorByProduct } from '@/store';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

export function useProductDateAvailabilitySync(product: TilesProduct, date: string) {
  const { data, isSuccess } = useQuery({
    queryKey: ['tiles_product_latest_date'],
    queryFn: getMetaDataManifest,
  });
  // Optimistically true while the manifest is loading — avoids blocking downstream
  // requests before we know whether the date is actually unavailable.
  const isDateAvailable = isSuccess ? data.products[product].available_dates.includes(date) : true;

  useEffect(() => {
    if (!isSuccess) return;
    setProductErrorByProduct(product, !isDateAvailable);
  }, [isSuccess, isDateAvailable, product, date]);

  return { isDateAvailable };
}

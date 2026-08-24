import type { TilesProduct } from '@/constants';
import { metaDataManifestQueryOptions, pickDateByTimezone } from '@/api';
import { setProductErrorByProduct, useMapUIStore } from '@/store';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

export function useProductDateAvailabilitySync(product: TilesProduct, date: string) {
  const { data, isSuccess, isError } = useQuery(metaDataManifestQueryOptions());
  const timezone = useMapUIStore(s => s.timezone);
  // Optimistically true while the manifest is loading — avoids blocking downstream
  // requests before we know whether the date is actually unavailable.
  const p = data?.products.find(p => p.id === product);
  // find the matching date in the manifest's available_dates, based on the preprocessed UTC/local date strings depending on the timezone.
  // If timezone is UTC, we use the pregenerated UTC date compared to the selected date;
  // if timezone is LOCAL, we use the pregenerated LOCAL date compared to the selected date.
  const matchedDate = p?.available_dates.find(d => pickDateByTimezone(d, timezone) === date);
  const isDateAvailable = isSuccess && p ? !!matchedDate : true;

  const requestDate = matchedDate?.date;

  useEffect(() => {
    if (isError) {
      setProductErrorByProduct(product, true);
      return;
    }
    if (!isSuccess) return;
    setProductErrorByProduct(product, !isDateAvailable);
  }, [isError, isSuccess, isDateAvailable, product, date]);

  return { isDateAvailable, manifestLoaded: isSuccess, requestDate };
}

import { PRODUCTLEGENDS, type TilesProduct } from '@/constants';
import {
  metaDataManifestQueryOptions,
  pickDateByTimezone,
  productManifestQueryOptions,
} from '@/api';
import { useMapUIStore } from '@/store';
import { useQuery } from '@tanstack/react-query';
import { useShallow } from 'zustand/shallow';

/**
 * Category labels for a categorical tiles product, read from the CF
 * `flag_meanings` on its product manifest (the single source of truth).
 *
 * Uses the manifest for the selected date, falling back to the product's
 * latest date when the selected date has no data — flag meanings don't vary
 * by date, and the legend should stay labelled even while the layer is off.
 * Shares the React Query cache entry with the layer and the click popup.
 * Returns `undefined` for no/non-categorical products or until the manifest loads.
 */
export function useProductFlagMeanings(product: TilesProduct | undefined): string[] | undefined {
  const isCategory = !!product && PRODUCTLEGENDS[product].scale === 'category';
  const { date, timezone } = useMapUIStore(
    useShallow(s => ({ date: s.date, timezone: s.timezone })),
  );

  const { data: requestDate } = useQuery({
    ...metaDataManifestQueryOptions(),
    select: ({ products }) => {
      const p = products.find(p => p.id === product);
      const matched = p?.available_dates.find(d => pickDateByTimezone(d, timezone) === date);
      return (matched ?? p?.full_date_range.end)?.date;
    },
    enabled: isCategory,
  });

  const { data: flagMeanings } = useQuery({
    ...productManifestQueryOptions(product!, requestDate ?? ''),
    select: manifest => manifest.flagMeanings,
    enabled: isCategory && !!requestDate,
  });

  return flagMeanings;
}

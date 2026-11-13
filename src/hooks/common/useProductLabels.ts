import type { TilesProduct } from '@/constants';
import {
  metaDataManifestQueryOptions,
  pickDateByTimezone,
  productManifestQueryOptions,
} from '@/api';
import { getManifestUnit } from '@/helpers';
import { useMapUIStore } from '@/store';
import { useQuery } from '@tanstack/react-query';
import { useShallow } from 'zustand/shallow';

export type ProductLabels = {
  /** Categorical products: CF `flag_meanings`, one label per flag value. */
  flagMeanings?: string[];
  /** Unit of the rendered quantity (`valueUnit`, or the shared `uUnit`/`vUnit`). */
  unit?: string;
};

/**
 * Display labels a tiles product's manifest publishes (the single source of
 * truth): category names (`flag_meanings`) and the value unit.
 *
 * Uses the manifest for the selected date, falling back to the product's
 * latest date when the selected date has no data — these fields don't vary by
 * date, and the legend should stay labelled even while the layer is off.
 * Shares the React Query cache entry with the layer and the click popup.
 * Fields are `undefined` until the manifest loads (or when it omits them).
 */
export function useProductLabels(product: TilesProduct | undefined): ProductLabels {
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
    enabled: !!product,
  });

  const { data } = useQuery({
    ...productManifestQueryOptions(product!, requestDate ?? ''),
    select: (manifest): ProductLabels => ({
      flagMeanings: manifest.flagMeanings,
      unit: getManifestUnit(manifest),
    }),
    enabled: !!product && !!requestDate,
  });

  return data ?? {};
}

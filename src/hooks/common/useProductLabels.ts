import type { TilesProduct } from '@/constants';
import { metaDataManifestQueryOptions, productManifestQueryOptions } from '@/api';
import { getManifestUnit } from '@/helpers';
import { useQuery } from '@tanstack/react-query';

export type ProductLabels = {
  /** Categorical products: CF `flag_meanings`, one label per flag value. */
  flagMeanings?: string[];
  /** Unit of the rendered quantity (`valueUnit`, or the shared `uUnit`/`vUnit`). */
  unit?: string;
};

/**
 * Category names and value unit from a product's manifest. They don't vary by
 * date, so this reads the latest date's manifest once instead of refetching on
 * date change.
 */
export function useProductLabels(product: TilesProduct | undefined): ProductLabels {
  const { data: latestDate } = useQuery({
    ...metaDataManifestQueryOptions(),
    select: ({ products }) => products.find(p => p.id === product)?.full_date_range.end.date,
    enabled: !!product,
  });

  const { data } = useQuery({
    ...productManifestQueryOptions(product!, latestDate ?? ''),
    select: (manifest): ProductLabels => ({
      flagMeanings: manifest.flagMeanings,
      unit: getManifestUnit(manifest),
    }),
    enabled: !!product && !!latestDate,
  });

  return data ?? {};
}

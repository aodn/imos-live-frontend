import { useMapUIStore } from '@/store';
import { useShallow } from 'zustand/shallow';
import type { LngLat } from 'mapbox-gl';
import type { ClosePopupFn } from '@/helpers';
import type { TilesProduct } from '@/constants';
import { HW_CATEGORY_LOOKUP, PRODUCT, PRODUCTLEGENDS } from '@/constants';
import { useQueries } from '@tanstack/react-query';
import type { ProductManifest } from '@/AtlasRenderingSystem';
import { getPointData, productManifestQueryOptions } from '@/api/tiles';
import { LoaderIcon } from '@/components/Icons';
import { roundToTwo, velocityToReadable } from '@/utils';

export type ClickedMapPopupContentProps = {
  onClose?: ClosePopupFn;
  lngLat: LngLat;
};

function isPointInBounds(bounds: ProductManifest['bounds'], lng: number, lat: number): boolean {
  return (
    lng >= bounds.lonMin && lng <= bounds.lonMax && lat >= bounds.latMin && lat <= bounds.latMax
  );
}

export function ClickedMapPopupContent({ onClose, lngLat }: ClickedMapPopupContentProps) {
  const enabledProducts = useMapUIStore(
    useShallow(s => {
      const products = s.productEnabled;
      return Object.keys(products)
        .filter(p => products[p as keyof typeof products] === true)
        .filter(
          p => p !== PRODUCT.WAVE_BUOYS && p !== PRODUCT.MOORING_TIMESERIES_REALTIME,
        ) as TilesProduct[];
    }),
  );
  const date = useMapUIStore(s => s.date);

  const { lat, lng } = {
    lat: roundToTwo(lngLat?.lat),
    lng: roundToTwo(lngLat?.lng),
  };
  const hasCoords = lat != null && lng != null;

  // Each product's manifest carries its data bounds. Fetch them first so we can
  // skip the per-point fetch for any product whose bounds don't cover the click.
  const manifestResults = useQueries({
    queries: enabledProducts.map(product => ({
      ...productManifestQueryOptions(product, date),
      enabled: !!date,
    })),
  });

  const mcsCategoryManifest =
    manifestResults[enabledProducts.indexOf(PRODUCT.AUSTEMP_HEATWAVE_MCS_CATEGORY)]?.data;

  // A product is in-bounds only once its manifest has loaded; until then we hold
  // off on the point fetch rather than guessing.
  const inBounds = enabledProducts.map((_, i) => {
    const bounds = manifestResults[i].data?.bounds;
    return bounds != null && hasCoords && isPointInBounds(bounds, lng as number, lat as number);
  });

  const results = useQueries({
    queries: enabledProducts.map((product, i) => ({
      queryKey: [product, 'getPointData', date, lng, lat],
      queryFn: () => getPointData({ product, date, lon: lng as number, lat: lat as number }),
      enabled: !!date && hasCoords && inBounds[i],
    })),
  });

  const isLoading = manifestResults.some(r => r.isLoading) || results.some(r => r.isLoading);

  // Flatten each product's point response into display rows.
  const rows = enabledProducts.flatMap((product, i) => {
    const variables = results[i].data?.variables;
    if (!variables) return [];
    const label = PRODUCTLEGENDS[product]?.label ?? product;

    // The geostrophic current returns u/v components; derive speed + compass
    // direction client-side via the shared velocity helper.
    if (product === PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT) {
      const u = variables.UCUR?.value;
      const v = variables.VCUR?.value;
      if (u == null || v == null) return [];
      const { speed, degree, direction } = velocityToReadable(u, v);
      return [
        {
          key: product,
          label,
          display: `${Math.round(degree)}° (${direction}) @ ${roundToTwo(speed)?.toFixed(2)} m/s`,
        },
      ];
    }

    return Object.entries(variables)
      .filter(([, v]) => v.value !== null)
      .map(([varKey, v]) => {
        if (product === PRODUCT.AUSTEMP_HEATWAVE_MCS_CATEGORY) {
          const category = v.value as number;
          // Prefer the data-driven mapping from the manifest's flag_values /
          // flag_meanings; fall back to the static constant only when the
          // manifest hasn't loaded yet.
          const flagValues = mcsCategoryManifest?.flagValues;
          const flagMeanings = mcsCategoryManifest?.flagMeanings;
          const idx = flagValues?.indexOf(category) ?? -1;
          const meaning =
            idx >= 0 && flagMeanings
              ? flagMeanings[idx]
              : HW_CATEGORY_LOOKUP[category as keyof typeof HW_CATEGORY_LOOKUP];
          return {
            key: `${product}:${varKey}`,
            label,
            display: category + (meaning ? ' ' + meaning : ''),
          };
        }
        return {
          key: `${product}:${varKey}`,
          label,
          display: `${roundToTwo(v.value as number)?.toFixed(2)} ${v.units ? v.units : ''}`,
        };
      });
  });

  return (
    <div
      className="w-50 md:w-90 min-h-25 flex flex-col bg-white rounded-lg shadow-lg overflow-hidden"
      aria-label="Current value from coordinates"
    >
      <div className="relative bg-imos-light text-black p-2 flex justify-between items-center">
        <h4 className="text-base text-center w-full">
          ({lat}, {lng})
        </h4>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close popup"
            className="absolute top-1 right-1 text-black hover:text-gray-200 text-xl w-6 h-6 flex items-center justify-center cursor-pointer"
          >
            ×
          </button>
        )}
      </div>

      <div className="p-2 space-y-2 flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex justify-center items-center flex-1">
            <LoaderIcon className="animate-spin" color="imos-grey" size="lg" />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex justify-center items-center flex-1 text-gray-500 text-sm">
            No data at this location
          </div>
        ) : (
          <div className="space-y-1">
            {rows.map(row => (
              <div
                key={row.key}
                className="flex-col md:flex-row flex justify-between md:items-center"
                aria-label={`${row.label} details`}
              >
                <span className="text-gray-600 text-left">{row.label}:</span>
                <span className="text-gray-900 text-left">{row.display}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

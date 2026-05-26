import { useMapUIStore } from '@/store';
import { useShallow } from 'zustand/shallow';
import type { LngLat } from 'mapbox-gl';
import type { ClosePopupFn } from '@/helpers';
import type { TilesProduct } from '@/constants';
import { PRODUCT, PRODUCTLEGENDS } from '@/constants';
import { useQueries } from '@tanstack/react-query';
import { getPointData } from '@/api/tiles';
import { LoaderIcon } from '@/components/Icons';
import { velocityToReadable } from '@/utils';

export type ClickedMapPopupContentProps = {
  onClose?: ClosePopupFn;
  lngLat: LngLat;
};

export function ClickedMapPopupContent({ onClose, lngLat }: ClickedMapPopupContentProps) {
  const enabledProducts = useMapUIStore(
    useShallow(s => {
      const products = s.productEnabled;
      return Object.keys(products)
        .filter(p => products[p as keyof typeof products] === true)
        .filter(p => p !== PRODUCT.WAVE_BUOYS) as TilesProduct[];
    }),
  );
  const date = useMapUIStore(s => s.date);

  const { lat, lng } = lngLat || {};

  const results = useQueries({
    queries: enabledProducts.map(product => ({
      queryKey: [product, 'getPointData', date, lng, lat],
      queryFn: () => getPointData({ product, date, lon: lng, lat }),
      enabled: !!date && lat != null && lng != null,
    })),
  });

  const isLoading = results.some(r => r.isLoading);

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
          display: `${Math.round(degree)}° (${direction}) @ ${speed.toFixed(2)} m/s`,
        },
      ];
    }

    return Object.entries(variables)
      .filter(([, v]) => v.value !== null)
      .map(([varKey, v]) => ({
        key: `${product}:${varKey}`,
        label,
        display: `${(v.value as number).toFixed(2)} ${v.units}`,
      }));
  });

  return (
    <div
      className="w-50 md:w-90 min-h-25 flex flex-col bg-white rounded-lg shadow-lg overflow-hidden"
      aria-label="Current value from coordinates"
    >
      <div className="relative bg-imos-light text-black p-2 flex justify-between items-center">
        <h4 className="text-base text-center w-full">
          ({lat?.toFixed(2)}, {lng?.toFixed(2)})
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

import { siteLatestDateQueryOptions } from '@/api';
import type { SiteLayerConfig, SiteProduct } from '@/constants';
import { SITE_CLUSTER_SOURCE_ID, UNCLUSTERED_WAVE_BUOYS_LAYER_CONFIG } from '@/constants';
import {
  addLayerInOrder,
  mergeAndFilterSiteFeatures,
  setSiteProductFeatures,
  updateSiteClusterSource,
} from '@/helpers';
import { createLayer } from '@/layers';
import { useMapUIStore, setProductErrorByProduct, type TIMEZONE } from '@/store';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/shallow';
import { useDidMountEffect } from '../common';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';
import { useMapboxLayerVisibility } from './useMapboxLayerVisibility';
import type { RawSiteFeatureCollection } from '@/types';
import type {
  CircleLayerSpecification,
  ExpressionSpecification,
  SymbolLayerSpecification,
} from 'mapbox-gl';

type SiteLayerSpecification = CircleLayerSpecification | SymbolLayerSpecification;

type UseUnclusteredSiteLayer = {
  map: React.RefObject<mapboxgl.Map | null>;
  product: SiteProduct;
  // The on-the-fly layer ID for this product's unclustered points. Clusters are drawn
  // by the shared `useSiteClusterLayer`, so sites of all products group together.
  unclusteredLayerId: string;
  // Returns the sites active for the selected date (interpreted per `timezone`, marks hasDataForDate).
  getSitesByDate: (date: string, timezone: TIMEZONE) => Promise<RawSiteFeatureCollection>;
  // Returns all sites with their latest observation (the base set the date merge fills in).
  getLatestSites: (timezone: TIMEZONE) => Promise<RawSiteFeatureCollection>;
  // Per-product paint/layout so unclustered sites are visually distinguishable.
  // Defaults to the wave-buoy styling. The config's `type` decides circle vs symbol.
  unclusteredConfig?: SiteLayerConfig;
};

const EMPTY_COLLECTION: RawSiteFeatureCollection = {
  type: 'FeatureCollection',
  features: [],
};

/**
 * Generic layer for site products (wave buoys, moorings, …).
 * Fetches the product's sites and writes them to the shared clustered source, then
 * draws its unclustered points. Re-fetches on date change.
 */
export function useUnclusteredSiteLayer({
  map,
  product,
  unclusteredLayerId,
  getSitesByDate,
  getLatestSites,
  unclusteredConfig = UNCLUSTERED_WAVE_BUOYS_LAYER_CONFIG,
}: UseUnclusteredSiteLayer) {
  const { enabled, date, timezone, isError } = useMapUIStore(
    useShallow(s => ({
      enabled: s.productEnabled[product],
      date: s.date,
      timezone: s.timezone,
      isError: s.productError[product],
    })),
  );

  const { data: latestDate, isLoading: isLatestDateLoading } = useQuery(
    siteLatestDateQueryOptions(product, timezone),
  );

  const shouldFetchByDate =
    enabled && !!date && !isLatestDateLoading && !!latestDate && date <= latestDate;

  const sitesByDateQuery = useQuery({
    queryKey: ['site_sites_by_date', product, date, timezone],
    queryFn: () => getSitesByDate(date, timezone),
    enabled: shouldFetchByDate,
  });

  const allSitesQuery = useQuery({
    queryKey: ['site_sites_all', product, timezone],
    queryFn: () => getLatestSites(timezone),
    enabled: enabled,
  });

  // Only this product's unclustered points: the shared source holds every product.
  const unclusteredLayer = useMemo(
    () =>
      createLayer<SiteLayerSpecification>(unclusteredConfig.type)(
        {
          id: unclusteredLayerId,
          source: SITE_CLUSTER_SOURCE_ID,
          ...unclusteredConfig,
          filter: [
            'all',
            ...(unclusteredConfig.filter ? [unclusteredConfig.filter] : []),
            ['==', ['get', 'product'], product],
          ] as ExpressionSpecification,
        },
        enabled,
      ),
    [enabled, product, unclusteredLayerId, unclusteredConfig],
  );
  const layers = useMemo(() => [unclusteredLayer], [unclusteredLayer]);

  const setDataByDataset = useCallback(async () => {
    setProductErrorByProduct(product, false);
    // when error thrown no break code but set fallback to empty collection.
    // this can fix the bug that when style changes, or switching from
    // date no data to date owning data sites displaying or hiding unexpectedly.
    const allSitesPromise = allSitesQuery.promise.catch(() => {
      setProductErrorByProduct(product, true);
      return EMPTY_COLLECTION;
    });
    // A disabled by-date query never settles its promise, so
    // short-circuit to an empty collection instead of awaiting it.
    const sitesByDatePromise = shouldFetchByDate
      ? sitesByDateQuery.promise.catch(() => {
          setProductErrorByProduct(product, true);
          return EMPTY_COLLECTION;
        })
      : Promise.resolve(EMPTY_COLLECTION);

    const [allSites, sitesByDate] = await Promise.all([allSitesPromise, sitesByDatePromise]);

    setSiteProductFeatures(
      map.current!,
      product,
      mergeAndFilterSiteFeatures(allSites, sitesByDate, date),
    );
  }, [allSitesQuery.promise, sitesByDateQuery.promise, shouldFetchByDate, date, map, product]);

  const setupLayer = useCallback(async () => {
    if (layers.some(layer => !layer)) return;
    // Make sure the shared source exists, then add the layer immediately so it is registered
    // without blocking on API responses. Data is filled in asynchronously by setDataByDataset.
    updateSiteClusterSource(map.current!);
    layers.forEach(layer => addLayerInOrder(map, layer));
    if (enabled) {
      void setDataByDataset();
    }
  }, [layers, enabled, map, setDataByDataset]);

  const { loadComplete } = useMapboxLayerSetup(map, setupLayer, [setupLayer]);

  useMapboxLayerVisibility(map, loadComplete, layers, enabled && !isError);

  useDidMountEffect(() => {
    if (!map.current || !loadComplete || !enabled) return;
    void setDataByDataset();
  }, [loadComplete, date, enabled, shouldFetchByDate, timezone]);

  // Drop this product's sites from the shared source (and its clusters) when disabled.
  useEffect(() => {
    if (!map.current || !loadComplete || enabled) return;
    setSiteProductFeatures(map.current, product, []);
  }, [map, loadComplete, enabled, product]);
}

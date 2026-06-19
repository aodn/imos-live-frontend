import type { ProductType } from '@/constants';
import {
  PRODUCTS,
  UNCLUSTERED_WAVE_BUOYS_LAYER_CONFIG,
  WAVE_BUOY_CLUSTER_LABEL_LAYER_CONFIG,
  WAVE_BUOYS_LAYER_CONFIG,
} from '@/constants';
import { addLayerInOrder, addOrUpdateGeoJsonSource, mergeAndFilterBuoyFeatures } from '@/helpers';
import { circleLayer, symbolLayer } from '@/layers';
import { useMapUIStore, setProductErrorByProduct } from '@/store';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/shallow';
import { useDidMountEffect } from '../common';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';
import { useMapboxLayerVisibility } from './useMapboxLayerVisibility';
import type { RawSiteFeatureCollection } from '@/types';
import type { CircleLayerSpecification, SymbolLayerSpecification } from 'mapbox-gl';

type UseSiteLayer = {
  map: React.RefObject<mapboxgl.Map | null>;
  product: ProductType;
  // The intermediate, on-the-fly layer IDs for this product's unclustered points
  // and cluster count label (the clustered layer + source IDs come from PRODUCTS).
  unclusteredLayerId: string;
  clusterLabelLayerId: string;
  // Returns the sites active for the selected local date (marks hasDataForDate).
  getSitesByDate: (localDate: string) => Promise<RawSiteFeatureCollection>;
  // Returns all sites with their latest observation (the base set the date merge fills in).
  getLatestSites: () => Promise<RawSiteFeatureCollection>;
  // Per-product paint/layout so site products are visually distinguishable.
  // Default to the wave-buoy styling.
  clusterConfig?: Partial<CircleLayerSpecification>;
  unclusteredConfig?: Partial<CircleLayerSpecification>;
  clusterLabelConfig?: Partial<SymbolLayerSpecification>;
};

const EMPTY_COLLECTION: RawSiteFeatureCollection = {
  type: 'FeatureCollection',
  features: [],
};

/**
 * Generic clustered-circle layer for site products (wave buoys, moorings, …).
 * Registers the clustered, unclustered and cluster-label layers immediately with
 * an empty source, then fills in data asynchronously and re-fetches on date change.
 */
export function useSiteLayer({
  map,
  product,
  unclusteredLayerId,
  clusterLabelLayerId,
  getSitesByDate,
  getLatestSites,
  clusterConfig = WAVE_BUOYS_LAYER_CONFIG,
  unclusteredConfig = UNCLUSTERED_WAVE_BUOYS_LAYER_CONFIG,
  clusterLabelConfig = WAVE_BUOY_CLUSTER_LABEL_LAYER_CONFIG,
}: UseSiteLayer) {
  const { layerId, sourceId } = PRODUCTS[product];
  const { enabled, date, isError } = useMapUIStore(
    useShallow(s => ({
      enabled: s.productEnabled[product],
      date: s.date,
      isError: s.productError[product],
    })),
  );

  const sitesByDateQuery = useQuery({
    queryKey: ['site_sites_by_date', product, date],
    queryFn: () => getSitesByDate(date),
    enabled: enabled && !!date,
  });

  const allSitesQuery = useQuery({
    queryKey: ['site_sites_all', product],
    queryFn: getLatestSites,
    enabled: enabled,
  });

  const clusterLayer = useMemo(
    () =>
      circleLayer(
        {
          id: layerId,
          source: sourceId,
          ...clusterConfig,
        },
        enabled,
      ),
    [enabled, layerId, sourceId, clusterConfig],
  );
  const unclusteredLayer = useMemo(
    () =>
      circleLayer(
        {
          id: unclusteredLayerId,
          source: sourceId,
          ...unclusteredConfig,
        },
        enabled,
      ),
    [enabled, sourceId, unclusteredLayerId, unclusteredConfig],
  );
  const clusterLabelLayer = useMemo(
    () =>
      symbolLayer(
        {
          id: clusterLabelLayerId,
          source: sourceId,
          ...clusterLabelConfig,
        },
        enabled,
      ),
    [enabled, sourceId, clusterLabelLayerId, clusterLabelConfig],
  );
  const layers = useMemo(
    () => [clusterLayer, unclusteredLayer, clusterLabelLayer],
    [clusterLayer, unclusteredLayer, clusterLabelLayer],
  );

  const setDataByDataset = useCallback(async () => {
    setProductErrorByProduct(product, false);
    // when error thrown no break code but set fallback to empty collection.
    // this can fix the bug that when style changes, or switching from
    // date no data to date owning data sites displaying or hiding unexpectedly.
    const allSitesPromise = allSitesQuery.promise.catch(() => {
      setProductErrorByProduct(product, true);
      return EMPTY_COLLECTION;
    });
    const sitesByDatePromise = sitesByDateQuery.promise.catch(() => {
      setProductErrorByProduct(product, true);
      return EMPTY_COLLECTION;
    });

    const [allSites, sitesByDate] = await Promise.all([allSitesPromise, sitesByDatePromise]);

    addOrUpdateGeoJsonSource({
      map: map.current!,
      id: sourceId,
      data: {
        ...allSites,
        features: mergeAndFilterBuoyFeatures(allSites, sitesByDate, date),
      },
      enableCluster: true,
      clusterRadius: 40,
    });
  }, [allSitesQuery.promise, sitesByDateQuery.promise, date, map, sourceId, product]);

  const setupLayer = useCallback(async () => {
    if (layers.some(layer => !layer)) return;
    // Always add layers immediately with an empty source so the layer is registered on the
    // map without blocking on API responses. Data is filled in asynchronously by setDataByDataset.
    addOrUpdateGeoJsonSource({
      map: map.current!,
      id: sourceId,
      data: { type: 'FeatureCollection', features: [] },
      enableCluster: true,
      clusterRadius: 40,
    });
    layers.forEach(layer => addLayerInOrder(map, layer));
    if (enabled) {
      void setDataByDataset();
    }
  }, [layers, enabled, map, setDataByDataset, sourceId]);

  const { loadComplete } = useMapboxLayerSetup(map, setupLayer, [setupLayer]);

  useMapboxLayerVisibility(map, loadComplete, layers, enabled && !isError);

  useDidMountEffect(() => {
    if (!map.current || !loadComplete || !enabled) return;
    void setDataByDataset();
  }, [loadComplete, date, enabled]);
}

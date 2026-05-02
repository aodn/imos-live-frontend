import type { WebGlLayerProduct } from '@/constants';
import { PRODUCTLEGENDS, PRODUCTS } from '@/constants';
import { COLOR_OPTIONS, LAYERS_ORDER } from '@/config';
import { S3_BASE_URL, getProductManifest } from '@/api';
import { buildProductPalette } from '@/helpers';
import { createParticleAtlasLayer } from '@/AtlasRenderingSystem';
import type { ParticleAtlasLayerHandle } from '@/AtlasRenderingSystem';
import {
  useMapUIStore,
  setProductErrorByProduct,
  setProductLoadingByProduct,
  getProductLegend,
} from '@/store';
import { useCallback, useEffect, useRef } from 'react';
import { useShallow } from 'zustand/shallow';
import { useDidMountEffect } from '../useDidMountEffect';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';
import { useProductDateAvailabilitySync } from './useProductDateAvailabilitySync';

type UseParticleAtlasLayer = {
  map: React.RefObject<mapboxgl.Map | null>;
  layerId: string;
  product: WebGlLayerProduct;
};

export function useParticleAtlasLayer({ map, layerId, product }: UseParticleAtlasLayer) {
  const {
    date,
    enabled,
    isError,
    isLoading,
    colorKey,
    legendScale,
    nParticles,
    fadeOpacity,
    speedFactor,
    dropRate,
    pointSize,
  } = useMapUIStore(
    useShallow(s => ({
      date: s.date,
      enabled: s.productEnabled[product],
      isError: s.productError[product],
      isLoading: s.productLoading[product],
      colorKey: s.productLegends[product].colorKey,
      legendScale: s.productLegends[product].scale,
      nParticles: s.particleConfig.nParticles,
      fadeOpacity: s.particleConfig.fadeOpacity,
      speedFactor: s.particleConfig.speedFactor,
      dropRate: s.particleConfig.dropRate,
      pointSize: s.particleConfig.pointSize,
    })),
  );

  const { isDateAvailable } = useProductDateAvailabilitySync(product, date);

  const legendRange = PRODUCTLEGENDS[product].range as [number, number];
  const filePrefix = PRODUCTS[product].bucketPath!;

  const handleRef = useRef<ParticleAtlasLayerHandle | null>(null);

  const loadData = useCallback(async () => {
    if (!handleRef.current) return;
    if (!isDateAvailable) {
      setProductErrorByProduct(product, true);
      return;
    }
    setProductLoadingByProduct(product, true);
    await handleRef.current.setSource(date).catch(() => {
      setProductErrorByProduct(product, true);
    });
    setProductLoadingByProduct(product, false);
  }, [date, isDateAvailable, product]);

  const setupLayer = useCallback(async () => {
    handleRef.current?.destroy();

    handleRef.current = createParticleAtlasLayer({
      map: map.current!,
      layerId,
      fetchManifest: d => getProductManifest({ product: filePrefix, date: d }),
      tileBaseUrl: `${S3_BASE_URL}/${filePrefix}`,
      colorPalette: buildProductPalette(getProductLegend(product)),
      legendRange,
    });

    LAYERS_ORDER.forEach(id => {
      if (map.current?.getLayer(id)) map.current.moveLayer(id);
    });

    if (enabled) await loadData();
  }, [map, layerId, filePrefix, legendRange, product, enabled, loadData]);

  const { loadComplete } = useMapboxLayerSetup(map, setupLayer, [setupLayer]);

  // Visibility
  useEffect(() => {
    if (!loadComplete) return;
    handleRef.current?.setVisible(enabled && !isError && !isLoading);
  }, [loadComplete, enabled, isError, isLoading]);

  // Date change
  useDidMountEffect(() => {
    if (!loadComplete || !enabled) return;
    loadData();
  }, [loadComplete, enabled, date]);

  // Particle config changes
  useEffect(() => {
    if (!loadComplete) return;
    handleRef.current?.updateConfig({ nParticles, fadeOpacity, speedFactor, dropRate, pointSize });
  }, [loadComplete, nParticles, fadeOpacity, speedFactor, dropRate, pointSize]);

  // Colour key change
  useDidMountEffect(() => {
    if (!loadComplete) return;
    handleRef.current?.updatePalette({ rawColors: COLOR_OPTIONS[colorKey] });
  }, [colorKey, loadComplete]);

  // Scale change
  useDidMountEffect(() => {
    if (!loadComplete) return;
    handleRef.current?.updatePalette({ scale: legendScale });
  }, [legendScale, loadComplete]);
}

/**
 * @vitest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRasterLayer } from './useRasterLayer';
import { useMapUIStore } from '@/store';
import { addLayerInOrder, addOrUpdateWMSSource, rasterUrl } from '@/helpers';
import { imageLayer } from '@/layers';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';
import { useMapboxLayerVisibility } from './useMapboxLayerVisibility';
import type { RasterLayer, RasterSource, ProductType } from '@/constants';

const mockMap = {
  current: {
    addLayer: vi.fn(),
    removeLayer: vi.fn(),
    addSource: vi.fn(),
    removeSource: vi.fn(),
    getSource: vi.fn(),
    getLayer: vi.fn(),
  },
};

vi.mock('@/store', () => ({
  useMapUIStore: vi.fn(),
}));

vi.mock('@/helpers', () => ({
  addLayerInOrder: vi.fn(),
  addOrUpdateWMSSource: vi.fn(),
  rasterUrl: vi.fn(),
}));

vi.mock('@/layers', () => ({
  imageLayer: vi.fn(),
}));

vi.mock('@/config', () => ({
  RASTER_LAYER_CONFIG: { paint: {} },
}));

vi.mock('./useMapboxLayerSetup', () => ({
  useMapboxLayerSetup: vi.fn(),
}));

vi.mock('./useMapboxLayerVisibility', () => ({
  useMapboxLayerVisibility: vi.fn(),
}));

vi.mock('zustand/shallow', () => ({
  useShallow: vi.fn(fn => fn),
}));

vi.mock('@/constants', () => ({
  RasterLayer: {
    GSLA: 'gsla-raster-layer',
  },
  RasterSource: {
    GSLA: 'gsla-raster-source',
  },
  Product: {
    GSLA: 'gsla',
  },
}));

describe('useRasterLayer', () => {
  let mockStoreState: any;

  const defaultProps = {
    map: mockMap as any,
    layerId: 'gsla-raster-layer' as RasterLayer,
    sourceId: 'gsla-raster-source' as RasterSource,
    product: 'gsla' as ProductType,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockStoreState = {
      date: '2024-01-01',
      productEnabled: {
        gsla: true,
      },
      productError: {
        gsla: false,
      },
    };

    (useMapUIStore as unknown as Mock).mockImplementation(selector => selector(mockStoreState));

    (imageLayer as Mock).mockReturnValue({
      id: 'gsla-raster-layer',
      source: 'gsla-raster-source',
    });

    (useMapboxLayerSetup as Mock).mockReturnValue({
      loadComplete: true,
    });

    (rasterUrl as Mock).mockResolvedValue('http://example.com/tile/{z}/{x}/{y}.png');
    (addOrUpdateWMSSource as Mock).mockResolvedValue(undefined);
  });

  it('should initialize with raster enabled and setup layer on load', () => {
    renderHook(() => useRasterLayer(defaultProps));

    // setupLayer is now passed as dependency instead of RasterLayer
    expect(useMapboxLayerSetup).toHaveBeenCalledWith(mockMap, expect.any(Function), [
      expect.any(Function),
    ]);

    expect(useMapboxLayerVisibility).toHaveBeenCalledWith(
      mockMap,
      true,
      [{ id: 'gsla-raster-layer', source: 'gsla-raster-source' }],
      true,
    );
  });

  it('should disable layer visibility when raster is disabled', () => {
    mockStoreState.productEnabled.gsla = false;

    renderHook(() => useRasterLayer(defaultProps));

    expect(useMapboxLayerVisibility).toHaveBeenCalledWith(
      mockMap,
      true,
      [{ id: 'gsla-raster-layer', source: 'gsla-raster-source' }],
      false,
    );
  });

  it('should disable layer visibility when product has error', () => {
    mockStoreState.productError.gsla = true;

    renderHook(() => useRasterLayer(defaultProps));

    expect(useMapboxLayerVisibility).toHaveBeenCalledWith(
      mockMap,
      true,
      [{ id: 'gsla-raster-layer', source: 'gsla-raster-source' }],
      false,
    );
  });

  it('should call addOrUpdateWMSSource and addLayerInOrder during setup', async () => {
    renderHook(() => useRasterLayer(defaultProps));

    const setupLayerCall = (useMapboxLayerSetup as Mock).mock.calls[0];
    const setupLayerFn = setupLayerCall[1];

    await act(async () => {
      await setupLayerFn();
    });

    expect(rasterUrl).toHaveBeenCalledWith('gsla-raster-source', expect.any(Date));

    expect(addOrUpdateWMSSource).toHaveBeenCalledWith({
      map: mockMap.current,
      url: 'http://example.com/tile/{z}/{x}/{y}.png',
      sourceId: 'gsla-raster-source',
    });

    expect(addLayerInOrder).toHaveBeenCalledWith(mockMap, {
      id: 'gsla-raster-layer',
      source: 'gsla-raster-source',
    });
  });

  it('should reset error and add source even when rasterUrl returns invalid URL', async () => {
    // In the new approach, rasterUrl returns an invalid URL instead of throwing
    (rasterUrl as Mock).mockResolvedValue('invalid-url');

    renderHook(() => useRasterLayer(defaultProps));

    const setupLayerCall = (useMapboxLayerSetup as Mock).mock.calls[0];
    const setupLayerFn = setupLayerCall[1];

    await act(async () => {
      await setupLayerFn();
    });

    // Source is always added (even with invalid URL)
    expect(addOrUpdateWMSSource).toHaveBeenCalledWith({
      map: mockMap.current,
      url: 'invalid-url',
      sourceId: 'gsla-raster-source',
    });
  });

  it('should update data source when date changes', async () => {
    const { rerender } = renderHook(() => useRasterLayer(defaultProps));

    mockStoreState.date = '2024-01-02';
    (rasterUrl as Mock).mockResolvedValue('http://example.com/tile/new-date.png');

    rerender();

    // Wait for the effect to run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // rasterUrl should be called with the new date
    expect(rasterUrl).toHaveBeenCalledWith('gsla-raster-source', expect.any(Date));
  });

  it('should toggle raster layer visibility correctly', () => {
    const { rerender } = renderHook(() => useRasterLayer(defaultProps));

    expect(useMapboxLayerVisibility).toHaveBeenCalledWith(
      mockMap,
      true,
      [{ id: 'gsla-raster-layer', source: 'gsla-raster-source' }],
      true,
    );

    mockStoreState.productEnabled.gsla = false;
    rerender();

    expect(useMapboxLayerVisibility).toHaveBeenCalledWith(
      mockMap,
      true,
      [{ id: 'gsla-raster-layer', source: 'gsla-raster-source' }],
      false,
    );

    mockStoreState.productEnabled.gsla = true;
    rerender();

    expect(useMapboxLayerVisibility).toHaveBeenCalledWith(
      mockMap,
      true,
      [{ id: 'gsla-raster-layer', source: 'gsla-raster-source' }],
      true,
    );
  });
});

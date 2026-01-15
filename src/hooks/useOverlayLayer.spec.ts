/**
 * @vitest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useOverlayLayer } from './useOverlayLayer';
import { useMapUIStore } from '@/store';
import { addLayerInOrder, addOrUpdateWMSSource } from '@/helpers';
import { imageLayer } from '@/layers';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';
import { useMapboxLayerVisibility } from './useMapboxLayerVisibility';
import { useQuery } from '@tanstack/react-query';
import type { OverlayLayer, OverlaySource, ProductType } from '@/constants';

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
}));

vi.mock('@/layers', () => ({
  imageLayer: vi.fn(),
}));

vi.mock('@/config', () => ({
  OVERLAY_LAYER_CONFIG: { paint: {} },
}));

vi.mock('./useMapboxLayerSetup', () => ({
  useMapboxLayerSetup: vi.fn(),
}));

vi.mock('./useMapboxLayerVisibility', () => ({
  useMapboxLayerVisibility: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

vi.mock('zustand/shallow', () => ({
  useShallow: vi.fn(fn => fn),
}));

vi.mock('@/constants', () => ({
  OverlayLayer: {
    GSLA: 'gsla-overlay-layer',
  },
  OverlaySource: {
    GSLA: 'gsla-overlay-source',
  },
  Product: {
    GSLA: 'gsla',
  },
}));

describe('useOverlayLayer', () => {
  let mockStoreState: any;

  const defaultProps = {
    map: mockMap as any,
    layerId: 'gsla-overlay-layer' as OverlayLayer,
    sourceId: 'gsla-overlay-source' as OverlaySource,
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
      id: 'gsla-overlay-layer',
      source: 'gsla-overlay-source',
    });

    (useMapboxLayerSetup as Mock).mockReturnValue({
      loadComplete: true,
    });

    (useQuery as Mock).mockReturnValue({
      data: 'http://example.com/tile/{z}/{x}/{y}.png',
      isLoading: false,
      promise: Promise.resolve('http://example.com/tile/{z}/{x}/{y}.png'),
    });
    (addOrUpdateWMSSource as Mock).mockResolvedValue(undefined);
  });

  it('should initialize with overlay enabled and setup layer on load', () => {
    renderHook(() => useOverlayLayer(defaultProps));

    // setupLayer is now passed as dependency instead of overlayLayer
    expect(useMapboxLayerSetup).toHaveBeenCalledWith(mockMap, expect.any(Function), [
      expect.any(Function),
    ]);

    expect(useMapboxLayerVisibility).toHaveBeenCalledWith(
      mockMap,
      true,
      [{ id: 'gsla-overlay-layer', source: 'gsla-overlay-source' }],
      true,
    );
  });

  it('should disable layer visibility when overlay is disabled', () => {
    mockStoreState.productEnabled.gsla = false;

    renderHook(() => useOverlayLayer(defaultProps));

    expect(useMapboxLayerVisibility).toHaveBeenCalledWith(
      mockMap,
      true,
      [{ id: 'gsla-overlay-layer', source: 'gsla-overlay-source' }],
      false,
    );
  });

  it('should disable layer visibility when product has error', () => {
    mockStoreState.productError.gsla = true;

    renderHook(() => useOverlayLayer(defaultProps));

    expect(useMapboxLayerVisibility).toHaveBeenCalledWith(
      mockMap,
      true,
      [{ id: 'gsla-overlay-layer', source: 'gsla-overlay-source' }],
      false,
    );
  });

  it('should call addOrUpdateWMSSource and addLayerInOrder during setup', async () => {
    renderHook(() => useOverlayLayer(defaultProps));

    const setupLayerCall = (useMapboxLayerSetup as Mock).mock.calls[0];
    const setupLayerFn = setupLayerCall[1];

    await act(async () => {
      await setupLayerFn();
    });

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['rasterUrl', 'gsla-overlay-source', '2024-01-01'],
        enabled: true,
      }),
    );

    expect(addOrUpdateWMSSource).toHaveBeenCalledWith({
      map: mockMap.current,
      url: 'http://example.com/tile/{z}/{x}/{y}.png',
      sourceId: 'gsla-overlay-source',
    });

    expect(addLayerInOrder).toHaveBeenCalledWith(mockMap, {
      id: 'gsla-overlay-layer',
      source: 'gsla-overlay-source',
    });
  });

  it('should reset error and add source even when useQuery returns invalid URL', async () => {
    // In the new approach, useQuery returns an invalid URL instead of throwing
    (useQuery as Mock).mockReturnValue({
      data: 'invalid-url',
      isLoading: false,
      promise: Promise.resolve('invalid-url'),
    });

    renderHook(() => useOverlayLayer(defaultProps));

    const setupLayerCall = (useMapboxLayerSetup as Mock).mock.calls[0];
    const setupLayerFn = setupLayerCall[1];

    await act(async () => {
      await setupLayerFn();
    });

    // Source is always added (even with invalid URL)
    // Error detection happens later via useOverlayProductErrorDetect listening to sourcedata events
    expect(addOrUpdateWMSSource).toHaveBeenCalledWith({
      map: mockMap.current,
      url: 'invalid-url',
      sourceId: 'gsla-overlay-source',
    });
  });

  it('should update data source when date changes', () => {
    const { rerender } = renderHook(() => useOverlayLayer(defaultProps));

    mockStoreState.date = '2024-01-02';
    (useQuery as Mock).mockReturnValue({
      data: 'http://example.com/tile/new-date.png',
      isLoading: false,
      promise: Promise.resolve('http://example.com/tile/new-date.png'),
    });

    rerender();

    // useQuery should be called with the new date
    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['rasterUrl', 'gsla-overlay-source', '2024-01-02'],
        enabled: true,
      }),
    );
  });

  it('should toggle overlay layer visibility correctly', () => {
    const { rerender } = renderHook(() => useOverlayLayer(defaultProps));

    expect(useMapboxLayerVisibility).toHaveBeenCalledWith(
      mockMap,
      true,
      [{ id: 'gsla-overlay-layer', source: 'gsla-overlay-source' }],
      true,
    );

    mockStoreState.productEnabled.gsla = false;
    rerender();

    expect(useMapboxLayerVisibility).toHaveBeenCalledWith(
      mockMap,
      true,
      [{ id: 'gsla-overlay-layer', source: 'gsla-overlay-source' }],
      false,
    );

    mockStoreState.productEnabled.gsla = true;
    rerender();

    expect(useMapboxLayerVisibility).toHaveBeenCalledWith(
      mockMap,
      true,
      [{ id: 'gsla-overlay-layer', source: 'gsla-overlay-source' }],
      true,
    );
  });
});

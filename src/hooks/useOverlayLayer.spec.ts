/**
 * @vitest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi, Mock } from 'vitest';
import { useOverlayLayer } from './useOverlayLayer';
import { useMapUIStore } from '@/store';
import { addLayerInOrder, addOrUpdateWMSSource, rasterUrl } from '@/helpers';
import { imageLayer } from '@/layers';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';
import { useMapboxLayerVisibility } from './useMapboxLayerVisibility';
import { useDidMountEffect } from './useDidMountEffect';
import { OverlayLayer, OverlaySource, Product } from '@/constants';

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

vi.mock('@/helpers', () => ({
  addLayerInOrder: vi.fn(),
  addOrUpdateWMSSource: vi.fn(),
  rasterUrl: vi.fn(),
}));

vi.mock('@/layers', () => ({
  imageLayer: vi.fn(),
}));

vi.mock('@/config', () => ({
  overlayLayerConfig: { paint: {} },
}));

vi.mock('./useMapboxLayerSetup', () => ({
  useMapboxLayerSetup: vi.fn(),
}));

vi.mock('./useMapboxLayerVisibility', () => ({
  useMapboxLayerVisibility: vi.fn(),
}));

vi.mock('./useDidMountEffect', () => ({
  useDidMountEffect: vi.fn(),
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
    product: 'gsla' as Product,
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

    (rasterUrl as Mock).mockResolvedValue('http://example.com/tile/{z}/{x}/{y}.png');
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

    expect(rasterUrl).toHaveBeenCalledWith('gsla-overlay-source', new Date('2024-01-01'));

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

  it('should reset error and add source even when rasterUrl returns invalid URL', async () => {
    // In the new approach, rasterUrl returns an invalid URL instead of throwing
    (rasterUrl as Mock).mockResolvedValue('invalid-url');

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

    rerender();

    const didMountEffectCall = (useDidMountEffect as Mock).mock.calls.find(
      call => call[1] && call[1].includes(mockStoreState.date),
    );

    expect(didMountEffectCall).toBeDefined();
    expect(didMountEffectCall![1]).toContain('2024-01-02');
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

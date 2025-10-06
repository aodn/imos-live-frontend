/**
 * @vitest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi, Mock } from 'vitest';
import { useOverlayLayer } from './useOverlayLayer';
import { useMapUIStore } from '@/store';
import { getMetaData } from '@/api';
import { useToast } from '@/components';
import { addLayerInOrder, addOrUpdateWMSSource } from '@/helpers';
import { imageLayer } from '@/layers';
import { buildGSLADatasetFullPath, buildGSLADatasetPath, processMetaData } from '@/utils';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';
import { useMapboxLayerVisibility } from './useMapboxLayerVisibility';
import { useDidMountEffect } from './useDidMountEffect';
import { useQuery } from '@tanstack/react-query';

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

const mockShowToast = vi.fn();
const mockMetaData = {
  lon_min: 110,
  lon_max: 160,
  lat_min: -45,
  lat_max: -10,
};

vi.mock('@/store', () => ({
  useMapUIStore: vi.fn(),
}));

vi.mock('@/api', () => ({
  getMetaData: vi.fn(),
}));

vi.mock('@/components', () => ({
  useToast: vi.fn(),
}));

vi.mock('@/helpers', () => ({
  addLayerInOrder: vi.fn(),
  addOrUpdateImageSource: vi.fn(),
  addOrUpdateWMSSource: vi.fn(),
}));

vi.mock('@/layers', () => ({
  imageLayer: vi.fn(),
}));

vi.mock('@/utils', () => ({
  buildGSLADatasetFullPath: vi.fn(),
  buildGSLADatasetPath: vi.fn(),
  processMetaData: vi.fn(),
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

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

describe('useOverlayLayer', () => {
  let mockStoreState: any;
  let mockQueryResult: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockStoreState = {
      overlay: true,
      dataset: '2024-01-01',
    };

    mockQueryResult = {
      promise: Promise.resolve(mockMetaData),
    };

    (useMapUIStore as unknown as Mock).mockImplementation(selector => selector(mockStoreState));

    (useToast as Mock).mockReturnValue({
      showToast: mockShowToast,
    });

    (getMetaData as Mock).mockResolvedValue(mockMetaData);

    (buildGSLADatasetPath as Mock).mockReturnValue('path/to/meta.json');
    (buildGSLADatasetFullPath as Mock).mockReturnValue('path/to/data.png');
    (processMetaData as Mock).mockReturnValue({
      lonRange: [110, 160],
      latRange: [-45, -10],
    });

    (imageLayer as Mock).mockReturnValue({
      id: 'gsla-overlay-layer',
      source: 'gsla-overlay-source',
    });

    (useMapboxLayerSetup as Mock).mockReturnValue({
      loadComplete: true,
    });

    (useQuery as Mock).mockReturnValue(mockQueryResult);
  });

  it('should initialize with overlay enabled and setup layer on load', () => {
    renderHook(() => useOverlayLayer(mockMap as any));

    expect(useMapboxLayerSetup).toHaveBeenCalledWith(mockMap, expect.any(Function), [
      {
        id: 'gsla-overlay-layer',
        source: 'gsla-overlay-source',
      },
    ]);

    expect(useMapboxLayerVisibility).toHaveBeenCalledWith(
      mockMap,
      true,
      [{ id: 'gsla-overlay-layer', source: 'gsla-overlay-source' }],
      true,
    );
  });

  it('should disable layer visibility when overlay is false', () => {
    mockStoreState.overlay = false;

    renderHook(() => useOverlayLayer(mockMap as any));

    expect(useMapboxLayerVisibility).toHaveBeenCalledWith(
      mockMap,
      true,
      [{ id: 'gsla-overlay-layer', source: 'gsla-overlay-source' }],
      false,
    );
  });

  it('should call addOrUpdateWaveBuoyWMSSource and addLayerInOrder during setup', async () => {
    renderHook(() => useOverlayLayer(mockMap as any));

    const setupLayerCall = (useMapboxLayerSetup as Mock).mock.calls[0];
    const setupLayerFn = setupLayerCall[1];

    await act(async () => {
      await setupLayerFn();
    });

    expect(addOrUpdateWMSSource).toHaveBeenCalledWith(mockMap.current, undefined, '2024-01-01');

    expect(addLayerInOrder).toHaveBeenCalledWith(mockMap, {
      id: 'gsla-overlay-layer',
      source: 'gsla-overlay-source',
    });
  });

  it('should update data source when dataset changes', () => {
    const { rerender } = renderHook(() => useOverlayLayer(mockMap as any));

    mockStoreState.dataset = '2024-01-02';

    rerender();

    const didMountEffectCall = (useDidMountEffect as Mock).mock.calls.find(
      call => call[1] && call[1].includes(mockStoreState.dataset),
    );

    expect(didMountEffectCall).toBeDefined();
    expect(didMountEffectCall![1]).toContain('2024-01-02');
  });

  it('should toggle overlay layer visibility correctly', () => {
    const { rerender } = renderHook(() => useOverlayLayer(mockMap as any));

    expect(useMapboxLayerVisibility).toHaveBeenCalledWith(
      mockMap,
      true,
      [{ id: 'gsla-overlay-layer', source: 'gsla-overlay-source' }],
      true,
    );

    mockStoreState.overlay = false;
    rerender();

    expect(useMapboxLayerVisibility).toHaveBeenCalledWith(
      mockMap,
      true,
      [{ id: 'gsla-overlay-layer', source: 'gsla-overlay-source' }],
      false,
    );

    mockStoreState.overlay = true;
    rerender();

    expect(useMapboxLayerVisibility).toHaveBeenCalledWith(
      mockMap,
      true,
      [{ id: 'gsla-overlay-layer', source: 'gsla-overlay-source' }],
      true,
    );
  });
});

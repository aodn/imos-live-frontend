import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi, Mock } from 'vitest';
import { useMapInitialization } from './useMapInitialization';
import { useMapUIStore } from '@/store';
import mapboxgl from 'mapbox-gl';

const mockMap = {
  setZoom: vi.fn(),
  setCenter: vi.fn(),
  getCenter: vi.fn(),
  getZoom: vi.fn(),
  on: vi.fn(),
  remove: vi.fn(),
  addLayer: vi.fn(),
  removeLayer: vi.fn(),
  addSource: vi.fn(),
  removeSource: vi.fn(),
  getSource: vi.fn(),
  getLayer: vi.fn(),
};

vi.mock('mapbox-gl', () => ({
  default: {
    Map: vi.fn(() => mockMap),
  },
  __esModule: true,
}));

vi.mock('@/store', () => ({
  useMapUIStore: vi.fn(),
}));

vi.mock('@/config', () => ({
  maxZoom: 18,
}));

describe('useMapInitialization', () => {
  let mockSetCenter: Mock;
  let mockSetZoom: Mock;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSetCenter = vi.fn();
    mockSetZoom = vi.fn();

    (useMapUIStore as unknown as Mock).mockReturnValue({
      center: { lng: 133.7751, lat: -25.2744 },
      zoom: 3,
      setCenter: mockSetCenter,
      setZoom: mockSetZoom,
    });

    mockMap.getCenter.mockReturnValue({ lng: 133.7751, lat: -25.2744 });
    mockMap.getZoom.mockReturnValue(3);
  });

  it('should initialize map with correct initial values from store', () => {
    renderHook(() => useMapInitialization());

    expect(mapboxgl.Map).toHaveBeenCalledWith(
      expect.objectContaining({
        minZoom: 1,
        maxZoom: 18,
        antialias: true,
        projection: 'mercator',
        touchPitch: false,
        pitchWithRotate: false,
        attributionControl: false,
        dragRotate: false,
        touchZoomRotate: false,
        maxBounds: [
          [89.90022172949003, -60.0997150997151],
          [180.09977827050997, 10.0997150997151],
        ],
        bounds: [
          [89.90022172949003, -60.0997150997151],
          [180.09977827050997, 10.0997150997151],
        ],
      }),
    );

    expect(mockMap.setZoom).toHaveBeenCalledWith(3);
    expect(mockMap.setCenter).toHaveBeenCalledWith({ lng: 133.7751, lat: -25.2744 });
  });

  it('should register moveend and zoomend event handlers', () => {
    renderHook(() => useMapInitialization());

    expect(mockMap.on).toHaveBeenCalledWith('moveend', expect.any(Function));
    expect(mockMap.on).toHaveBeenCalledWith('zoomend', expect.any(Function));
  });

  it('should update global state when map moves', () => {
    renderHook(() => useMapInitialization());

    const moveendHandler = mockMap.on.mock.calls.find((call: any[]) => call[0] === 'moveend')?.[1];

    expect(moveendHandler).toBeDefined();

    const newCenter = { lng: 140.0, lat: -30.0 };
    const newZoom = 5;
    mockMap.getCenter.mockReturnValue(newCenter);
    mockMap.getZoom.mockReturnValue(newZoom);

    act(() => {
      moveendHandler();
    });

    expect(mockSetCenter).toHaveBeenCalledWith(newCenter);
    expect(mockSetZoom).toHaveBeenCalledWith(newZoom);
  });

  it('should update global state when map zooms', () => {
    renderHook(() => useMapInitialization());

    const zoomendHandler = mockMap.on.mock.calls.find((call: any[]) => call[0] === 'zoomend')?.[1];

    expect(zoomendHandler).toBeDefined();

    const newCenter = { lng: 150.0, lat: -35.0 };
    const newZoom = 8;
    mockMap.getCenter.mockReturnValue(newCenter);
    mockMap.getZoom.mockReturnValue(newZoom);

    act(() => {
      zoomendHandler();
    });

    expect(mockSetCenter).toHaveBeenCalledWith(newCenter);
    expect(mockSetZoom).toHaveBeenCalledWith(newZoom);
  });

  it('should update global state when both zoom and move happen', () => {
    renderHook(() => useMapInitialization());

    const moveendHandler = mockMap.on.mock.calls.find((call: any[]) => call[0] === 'moveend')?.[1];
    const zoomendHandler = mockMap.on.mock.calls.find((call: any[]) => call[0] === 'zoomend')?.[1];

    const newCenter = { lng: 145.0, lat: -40.0 };
    const newZoom = 10;
    mockMap.getCenter.mockReturnValue(newCenter);
    mockMap.getZoom.mockReturnValue(newZoom);

    act(() => {
      moveendHandler();
    });

    expect(mockSetCenter).toHaveBeenCalledWith(newCenter);
    expect(mockSetZoom).toHaveBeenCalledWith(newZoom);

    mockSetCenter.mockClear();
    mockSetZoom.mockClear();

    const newerCenter = { lng: 155.0, lat: -45.0 };
    const newerZoom = 12;
    mockMap.getCenter.mockReturnValue(newerCenter);
    mockMap.getZoom.mockReturnValue(newerZoom);

    act(() => {
      zoomendHandler();
    });

    expect(mockSetCenter).toHaveBeenCalledWith(newerCenter);
    expect(mockSetZoom).toHaveBeenCalledWith(newerZoom);
  });

  it('should return map and mapContainer refs', () => {
    const { result } = renderHook(() => useMapInitialization());

    expect(result.current.map).toBeDefined();
    expect(result.current.mapContainer).toBeDefined();
    expect(result.current.map.current).toBe(mockMap);
  });

  it('should clean up map instance on unmount', () => {
    const { unmount } = renderHook(() => useMapInitialization());
    unmount();
    expect(mockMap.remove).toHaveBeenCalled();
  });

  it('should set window.map in test mode', () => {
    vi.stubEnv('VITE_AUTOMATED_TEST_RUNNING', 'true');
    renderHook(() => useMapInitialization());
    expect((window as any).map).toBe(mockMap);
    vi.unstubAllEnvs();
  });

  it('should handle multiple rapid state changes correctly', () => {
    renderHook(() => useMapInitialization());

    const moveendHandler = mockMap.on.mock.calls.find((call: any[]) => call[0] === 'moveend')?.[1];

    const positions = [
      { center: { lng: 140.0, lat: -30.0 }, zoom: 5 },
      { center: { lng: 145.0, lat: -32.0 }, zoom: 6 },
      { center: { lng: 150.0, lat: -35.0 }, zoom: 7 },
    ];

    positions.forEach(({ center, zoom }) => {
      mockMap.getCenter.mockReturnValue(center);
      mockMap.getZoom.mockReturnValue(zoom);

      act(() => {
        moveendHandler();
      });

      expect(mockSetCenter).toHaveBeenCalledWith(center);
      expect(mockSetZoom).toHaveBeenCalledWith(zoom);
    });

    expect(mockSetCenter).toHaveBeenCalledTimes(positions.length);
    expect(mockSetZoom).toHaveBeenCalledTimes(positions.length);
  });
});

// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import {
  ISOBATH_LABEL_LAYER_ID,
  ISOBATH_LABEL_SOURCE_ID,
  ISOBATH_LINE_LAYER_ID,
  ISOBATH_SOURCE_ID,
} from '@/constants';
import { setIsobathsEnabled } from '@/store';
import { useIsobathLayer } from './useIsobathLayer';

type Listener = () => void;
type FakeSource = { type: string; setData: ReturnType<typeof vi.fn> };

// Minimal stand-in for mapboxgl.Map: identity projection on a 400x400 canvas.
function createFakeMap() {
  const listeners = new Map<string, Set<Listener>>();
  const sources = new Map<string, FakeSource>();
  const layers = new Map<string, { id: string; layout?: Record<string, unknown> }>();
  const visibility = new Map<string, unknown>();

  const map = {
    on: vi.fn((event: string, fn: Listener) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(fn);
    }),
    off: vi.fn((event: string, fn: Listener) => listeners.get(event)?.delete(fn)),
    getSource: (id: string) => sources.get(id),
    addSource: vi.fn((id: string, spec: { type: string }) =>
      sources.set(id, { type: spec.type, setData: vi.fn() }),
    ),
    removeSource: (id: string) => sources.delete(id),
    getLayer: (id: string) => layers.get(id),
    addLayer: vi.fn((layer: { id: string; layout?: Record<string, unknown> }) => {
      layers.set(layer.id, layer);
      visibility.set(layer.id, layer.layout?.visibility);
    }),
    moveLayer: vi.fn(),
    setLayoutProperty: vi.fn((id: string, _prop: string, value: unknown) =>
      visibility.set(id, value),
    ),
    queryRenderedFeatures: vi.fn((): GeoJSON.Feature[] => []),
    getCanvas: () => ({ clientWidth: 400, clientHeight: 400 }),
    project: ([x, y]: [number, number]) => ({ x, y }),
    unproject: ([x, y]: [number, number]) => ({ toArray: () => [x, y] }),
  };

  return {
    map,
    sources,
    visibility,
    listenerCount: (event: string) => listeners.get(event)?.size ?? 0,
    // Fires an event and lets the async layer setup settle.
    emit: async (event: string) => {
      await act(async () => {
        listeners.get(event)?.forEach(fn => fn());
      });
    },
    // `setStyle` drops every source and layer before `style.load` fires again.
    switchStyle: async function () {
      sources.clear();
      layers.clear();
      await this.emit('style.load');
    },
  };
}

function contour(depth: number, y: number): GeoJSON.Feature {
  return {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [
        [50, y],
        [350, y + 0.5],
      ],
    },
    properties: { min_depth: depth },
  };
}

function labelData(source: FakeSource | undefined) {
  return source?.setData.mock.calls.at(-1)?.[0] as GeoJSON.FeatureCollection | undefined;
}

describe('useIsobathLayer', () => {
  let fake: ReturnType<typeof createFakeMap>;

  beforeEach(() => {
    fake = createFakeMap();
    act(() => setIsobathsEnabled(false));
  });

  afterEach(() => {
    act(() => setIsobathsEnabled(false));
  });

  async function renderLayer() {
    const ref = { current: fake.map as unknown as mapboxgl.Map };
    const hook = renderHook(() => useIsobathLayer(ref));
    await fake.emit('style.load');
    return hook;
  }

  it('adds hidden line and label layers on style load while switched off', async () => {
    await renderLayer();

    expect(fake.sources.get(ISOBATH_SOURCE_ID)?.type).toBe('vector');
    expect(fake.sources.get(ISOBATH_LABEL_SOURCE_ID)?.type).toBe('geojson');
    expect(fake.visibility.get(ISOBATH_LINE_LAYER_ID)).toBe('none');
    expect(fake.visibility.get(ISOBATH_LABEL_LAYER_ID)).toBe('none');
    expect(fake.listenerCount('idle')).toBe(0);
  });

  it('toggling shows/hides both layers and attaches/detaches the idle listener', async () => {
    await renderLayer();

    act(() => setIsobathsEnabled(true));
    expect(fake.visibility.get(ISOBATH_LINE_LAYER_ID)).toBe('visible');
    expect(fake.visibility.get(ISOBATH_LABEL_LAYER_ID)).toBe('visible');
    expect(fake.listenerCount('idle')).toBe(1);

    act(() => setIsobathsEnabled(false));
    expect(fake.visibility.get(ISOBATH_LINE_LAYER_ID)).toBe('none');
    expect(fake.visibility.get(ISOBATH_LABEL_LAYER_ID)).toBe('none');
    expect(fake.listenerCount('idle')).toBe(0);
  });

  it('writes labels on idle and skips identical updates', async () => {
    await renderLayer();
    act(() => setIsobathsEnabled(true));

    fake.map.queryRenderedFeatures.mockReturnValue([contour(200, 200)]);
    await fake.emit('idle');

    const labelSource = fake.sources.get(ISOBATH_LABEL_SOURCE_ID);
    expect(fake.map.queryRenderedFeatures).toHaveBeenCalledWith({
      layers: [ISOBATH_LINE_LAYER_ID],
    });
    expect(labelData(labelSource)?.features.map(f => f.properties?.depth)).toEqual([200]);
    const writes = labelSource!.setData.mock.calls.length;

    // Same view: no write, so `idle` can't loop.
    await fake.emit('idle');
    expect(labelSource!.setData).toHaveBeenCalledTimes(writes);

    // View changed: labels are re-placed.
    fake.map.queryRenderedFeatures.mockReturnValue([contour(200, 200), contour(600, 300)]);
    await fake.emit('idle');
    expect(labelSource!.setData).toHaveBeenCalledTimes(writes + 1);
    expect(labelData(labelSource)?.features.map(f => f.properties?.depth)).toEqual([200, 600]);
  });

  it('re-writes labels after a style switch even when the view is unchanged', async () => {
    await renderLayer();
    act(() => setIsobathsEnabled(true));
    fake.map.queryRenderedFeatures.mockReturnValue([contour(200, 200)]);
    await fake.emit('idle');

    await fake.switchStyle();

    // The new style starts with an empty label source and visible layers.
    const freshSource = fake.sources.get(ISOBATH_LABEL_SOURCE_ID);
    expect(fake.map.addSource).toHaveBeenLastCalledWith(
      ISOBATH_LABEL_SOURCE_ID,
      expect.objectContaining({ data: { type: 'FeatureCollection', features: [] } }),
    );
    expect(fake.visibility.get(ISOBATH_LINE_LAYER_ID)).toBe('visible');
    expect(freshSource!.setData).not.toHaveBeenCalled();

    await fake.emit('idle');
    expect(labelData(freshSource)?.features.map(f => f.properties?.depth)).toEqual([200]);
  });
});

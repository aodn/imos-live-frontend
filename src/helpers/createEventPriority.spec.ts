import { describe, expect, it, vi } from 'vitest';
import type { Map, MapMouseEvent } from 'mapbox-gl';
import { createMapEventPriority } from './createEventPriority';

function mapStub(opts: { layers?: Set<string>; queryRenderedFeaturesReturn?: unknown[] }): {
  current: Map | null;
} {
  const layers = opts.layers ?? new Set<string>();
  const queryRenderedFeatures = vi.fn(() => opts.queryRenderedFeaturesReturn ?? []);
  return {
    current: {
      getLayer: (id: string) => (layers.has(id) ? ({} as never) : undefined),
      queryRenderedFeatures,
    } as unknown as Map,
  };
}

const fakeEvent = { point: { x: 10, y: 10 } } as unknown as MapMouseEvent;

describe('createMapEventPriority.shouldHandleMapClick', () => {
  it('returns false when there is no map yet', () => {
    const { shouldHandleMapClick } = createMapEventPriority({
      map: { current: null },
      distanceMeasurementEnabled: false,
    });
    expect(shouldHandleMapClick(fakeEvent)).toBe(false);
  });

  it('returns false when distance measurement is active', () => {
    const { shouldHandleMapClick } = createMapEventPriority({
      map: mapStub({}),
      distanceMeasurementEnabled: true,
    });
    expect(shouldHandleMapClick(fakeEvent)).toBe(false);
  });

  it('returns true when no higher-priority layers are configured', () => {
    const { shouldHandleMapClick } = createMapEventPriority({
      map: mapStub({}),
      distanceMeasurementEnabled: false,
    });
    expect(shouldHandleMapClick(fakeEvent)).toBe(true);
  });

  it('returns false when a higher-priority layer was clicked', () => {
    const { shouldHandleMapClick } = createMapEventPriority({
      map: mapStub({
        layers: new Set(['wave-buoys-layer']),
        queryRenderedFeaturesReturn: [{ id: 'buoy-feature' }],
      }),
      distanceMeasurementEnabled: false,
      higherPriorityLayers: ['wave-buoys-layer'],
    });
    expect(shouldHandleMapClick(fakeEvent)).toBe(false);
  });

  it('returns true when higher-priority layers exist but were not hit', () => {
    const { shouldHandleMapClick } = createMapEventPriority({
      map: mapStub({
        layers: new Set(['wave-buoys-layer']),
        queryRenderedFeaturesReturn: [],
      }),
      distanceMeasurementEnabled: false,
      higherPriorityLayers: ['wave-buoys-layer'],
    });
    expect(shouldHandleMapClick(fakeEvent)).toBe(true);
  });

  it('skips layers that do not exist on the map (handles dynamic layers gracefully)', () => {
    // The handler filters to existing layers before querying — so a missing layer
    // means the query never runs and we fall through to "handle the click".
    const { shouldHandleMapClick } = createMapEventPriority({
      map: mapStub({ layers: new Set() }),
      distanceMeasurementEnabled: false,
      higherPriorityLayers: ['not-yet-registered'],
    });
    expect(shouldHandleMapClick(fakeEvent)).toBe(true);
  });
});

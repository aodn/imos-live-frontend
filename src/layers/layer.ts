import type { LayerSpecification } from 'mapbox-gl';

export function createLayer<
  T extends {
    id: string;
    source: string;
    type: LayerSpecification['type'];
    paint?: unknown;
    layout?: unknown;
    filter?: unknown;
  },
>(type: T['type']) {
  return ({ id, source, paint, layout, filter, ...args }: Omit<T, 'type'>, visible = false): T =>
    ({
      id,
      source,
      type,
      layout: { visibility: visible ? 'visible' : 'none', ...(layout || {}) },
      ...(paint ? { paint } : {}),
      ...(filter ? { filter } : {}),
      ...args,
    }) as unknown as T;
}

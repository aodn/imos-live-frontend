import { Layer } from 'mapbox-gl';

export function createLayer<
  T extends { id: string; source: string; paint?: any; layout?: any; filter?: any },
>(type: Layer['type']) {
  return (
    { id, source, paint, layout, filter, ...args }: Omit<T, 'type'>,
    visible: boolean,
  ): Layer => ({
    id,
    source,
    type,
    layout: {
      visibility: visible ? 'visible' : 'none',
      ...(layout || {}),
    },
    ...(paint ? { paint } : {}),
    ...(filter ? { filter } : {}),
    ...args,
  });
}

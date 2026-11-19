import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import type { Map } from 'mapbox-gl';

type LayerWrapper = Record<string, unknown> & { implementation?: Record<string, unknown> };

type LayerSnapshot = {
  id: string;
  type: string;
  visible: boolean;
  hasField: boolean;
  hasRender: boolean;
  hasOnAdd: boolean;
  hasOnRemove: boolean;
};

/** Read the live snapshot of an atlas layer through `window.map`. */
export function snapshotLayer(page: Page, layerId: string) {
  return page.evaluate(id => {
    const map = (window as unknown as { map?: Map }).map;
    if (!map) throw new Error('Map not found');
    const layer = map.getLayer(id) as unknown as LayerWrapper | undefined;
    if (!layer) return null;
    // Mapbox wraps CustomLayerInterface in an internal class that exposes the
    // original object via `.implementation`. Fall back to the layer directly
    // for older / patched versions.
    const target = (layer.implementation ?? layer) as Record<string, unknown> & {
      field?: unknown;
      render?: unknown;
      onAdd?: unknown;
      onRemove?: unknown;
    };
    return {
      id: target['id'] as string,
      type: target['type'] as string,
      visible: target['visible'] as boolean,
      hasField: target.field !== undefined,
      hasRender: typeof target.render === 'function',
      hasOnAdd: typeof target.onAdd === 'function',
      hasOnRemove: typeof target.onRemove === 'function',
    } satisfies LayerSnapshot;
  }, layerId);
}

/** Drive any methods exposed on the wrapped custom layer (setVisible, updatePalette…). */
export function invokeLayerMethod(
  page: Page,
  layerId: string,
  method: string,
  args: unknown[] = [],
) {
  return page.evaluate(
    ({ id, method, args }) => {
      const map = (window as unknown as { map?: Map }).map;
      if (!map) throw new Error('Map not found');
      const layer = map.getLayer(id) as unknown as LayerWrapper | undefined;
      if (!layer) throw new Error(`Layer ${id} not found`);
      const target = (layer.implementation ?? layer) as Record<string, unknown>;
      const fn = target[method] as ((...a: unknown[]) => unknown) | undefined;
      if (typeof fn !== 'function') {
        throw new Error(`Method ${method} not found on ${id}`);
      }
      try {
        fn.apply(target, args);
        return { ok: true as const };
      } catch (err) {
        return { ok: false as const, error: (err as Error).message };
      }
    },
    { id: layerId, method, args },
  );
}

/** Remove a layer straight from the map to exercise the onRemove cleanup path. */
export function removeLayer(page: Page, layerId: string) {
  return page.evaluate(id => {
    const map = (window as unknown as { map?: Map }).map;
    if (!map) throw new Error('Map not found');
    if (map.getLayer(id)) map.removeLayer(id);
  }, layerId);
}

async function layerRegistered(page: Page, layerId: string) {
  return page.evaluate(id => !!(window as unknown as { map?: Map }).map?.getLayer(id), layerId);
}

export async function waitForLayer(page: Page, layerId: string) {
  await expect.poll(() => layerRegistered(page, layerId), { timeout: 10_000 }).toBe(true);
}

export async function waitForLayerGone(page: Page, layerId: string) {
  await expect.poll(() => layerRegistered(page, layerId), { timeout: 10_000 }).toBe(false);
}

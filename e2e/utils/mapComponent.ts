import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import type { Map } from 'mapbox-gl';

type LngLat = [number, number];
type MapWindow = Window & { map?: Map };

// Atlas custom layers expose `visible` directly or on the `.implementation` Mapbox
// attaches; Mapbox's own layers use `layout.visibility`.
type AnyLayer = {
  visible?: boolean;
  implementation?: { visible?: boolean };
  layout?: { visibility?: string };
};

type OceanCurrentPopupContent = {
  speed: string;
  direction: string;
  degree: string;
};

type SeaLevelAnomalyPopupContent = {
  gsla: string;
};

type PopupContent =
  | OceanCurrentPopupContent
  | SeaLevelAnomalyPopupContent
  | (OceanCurrentPopupContent & SeaLevelAnomalyPopupContent);

// aria-labels emitted by ClickedMapPopupContent are derived from PRODUCTLEGENDS[product].label
// (quantity name only; units come from the manifest) — keep these in sync if the labels change.
const OCEAN_CURRENT_POPUP_LABEL = 'ocean current speed details';
const SEA_LEVEL_ANOMALY_POPUP_LABEL = 'sea level anomaly details';

export const mapComponent = {
  waitUntilIdle: async (page: Page) => {
    await page.waitForFunction(() => {
      const map = (window as MapWindow).map;
      return map?.idle();
    });
  },
  waitUntilLayerLoaded: async (page: Page, layerID: string) => {
    await expect
      .poll(() =>
        page.waitForFunction(layerID => {
          const map = (window as MapWindow).map;
          const layer = map?.getLayer(layerID);
          return layer;
        }, layerID),
      )
      .toBeDefined();
  },
  waitUntilLayerNotLoaded: async (page: Page, layerID: string) => {
    await expect
      .poll(() =>
        page.waitForFunction(layerID => {
          const map = (window as MapWindow).map;
          const layer = map?.getLayer(layerID);
          if (!layer) return true;

          const { visible, implementation, layout } = layer as unknown as AnyLayer;
          if (visible !== undefined) return visible === false;
          if (implementation?.visible !== undefined) return implementation.visible === false;
          if (layout?.visibility !== undefined) return layout.visibility === 'none';

          throw new Error('Unknown layer type');
        }, layerID),
      )
      .toBeTruthy();
  },
  // Waits until a Mapbox style layer exists and is shown.
  waitUntilLayerVisible: async (page: Page, layerID: string) => {
    await page.waitForFunction(layerID => {
      const map = (window as MapWindow).map;
      return !!map?.getLayer(layerID) && map.getLayoutProperty(layerID, 'visibility') === 'visible';
    }, layerID);
  },
  openPopup: async (page: Page, coordinates?: LngLat) => {
    await expect(async () => {
      const point = await page.evaluate(coords => {
        const map = (window as MapWindow).map;
        if (!map) throw new Error('Map not found');

        // Temporarily remove the world-land-fill-layer to allow clicks for testing
        // This layer is used in production to prevent clicks on land
        const landLayerId = 'world-land-fill-layer';
        if (map.getLayer(landLayerId)) {
          map.removeLayer(landLayerId);
        }

        // Use provided coordinates or find a point in the center of the data bounds
        const targetCoords = coords ?? [150.0, -30.0];
        return map.project(targetCoords as [number, number]);
      }, coordinates);

      await page
        .getByRole('region', { name: 'Map' })
        .click({ position: { x: point.x, y: point.y } });
      await expect(page.getByLabel('Current value from coordinates')).toBeVisible();
    }).toPass();
  },
  // Waits until a source holds a feature for `siteName` (sources load slowly on a busy runner).
  waitUntilSiteInSource: async (page: Page, sourceId: string, siteName: string) => {
    await expect
      .poll(
        () =>
          page.evaluate(sourceId => {
            const map = (window as MapWindow).map;
            return map?.querySourceFeatures(sourceId).map(f => f.properties?.site) ?? [];
          }, sourceId),
        { timeout: 15_000 },
      )
      .toContain(siteName);
  },
  // Clicks the map at a lng/lat, e.g. on a site point.
  clickAtCoordinates: async (page: Page, coordinates: LngLat) => {
    const point = await page.evaluate(coords => {
      const map = (window as MapWindow).map;
      if (!map) throw new Error('Map not found');
      return map.project(coords);
    }, coordinates);
    await page.getByRole('region', { name: 'Map' }).click({ position: { x: point.x, y: point.y } });
  },
  closePopup: async (page: Page) => {
    await page.getByRole('button', { name: 'Close popup' }).click();
    await expect(page.getByLabel('Current value from coordinates')).not.toBeVisible();
  },
  expectPopupToHaveContent: async (page: Page, content: PopupContent) => {
    await mapComponent.openPopup(page);
    if ('speed' in content) {
      const oceanCurrent = page.getByLabel(OCEAN_CURRENT_POPUP_LABEL);
      await expect(oceanCurrent).toBeVisible();
      await expect(oceanCurrent).toContainText(
        `${content.degree}° (${content.direction}) @ ${content.speed} m/s`,
      );
    }
    if ('gsla' in content) {
      const seaLevel = page.getByLabel(SEA_LEVEL_ANOMALY_POPUP_LABEL);
      await expect(seaLevel).toBeVisible();
      await expect(seaLevel).toContainText(`${content.gsla} m`);
    }

    await mapComponent.closePopup(page);
  },
};

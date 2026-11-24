import { PRODUCT, SITE_CLUSTER_SOURCE_ID } from '@/constants';
import { expect, test } from './fixtures';
import { productEnabledURL } from './utils/constants';
import { mapComponent } from './utils/mapComponent';
import { ESTUARINE_MOORING_SITE, MOORING_SITE, WAVE_BUOYS } from './utils/mockSiteApi';

const SITE_PRODUCTS = [
  { product: PRODUCT.WAVE_BUOYS, site: WAVE_BUOYS.HOBARITO },
  { product: PRODUCT.MOORING_TIMESERIES_REALTIME, site: MOORING_SITE },
  {
    product: PRODUCT.MOORING_ESTUARINE_COASTAL_WATER_QUALITY_MONITORING_REALTIME_QC,
    site: ESTUARINE_MOORING_SITE,
  },
];

test.describe('Site products', () => {
  for (const { product, site } of SITE_PRODUCTS) {
    test(`${product} loads its sites from the mocked API`, async ({ page }) => {
      await page.goto(productEnabledURL([product]));

      await mapComponent.waitUntilSiteInSource(page, SITE_CLUSTER_SOURCE_ID, site.name);
    });
  }
});

test.describe('Site clusters', () => {
  // One clustered source for all site products, so nearby sites of any product group together.
  test('puts sites of every enabled product into the shared cluster source', async ({ page }) => {
    await page.goto(productEnabledURL(SITE_PRODUCTS.map(({ product }) => product)));

    for (const { site } of SITE_PRODUCTS) {
      await mapComponent.waitUntilSiteInSource(page, SITE_CLUSTER_SOURCE_ID, site.name);
    }
  });
});

test.describe('Site details panel', () => {
  for (const { product, site } of SITE_PRODUCTS) {
    test(`${product} opens its chart and latest observations when a site is clicked`, async ({
      page,
    }) => {
      await page.goto(productEnabledURL([product]));

      await mapComponent.waitUntilSiteInSource(page, SITE_CLUSTER_SOURCE_ID, site.name);
      await mapComponent.waitUntilIdle(page);

      // Retry the click: the layer's click handler can attach just after the source loads.
      await expect(async () => {
        await mapComponent.clickAtCoordinates(page, site.coordinates);
        await expect(page.getByText('Latest Observations')).toBeVisible({ timeout: 2000 });
      }).toPass();
      await expect(
        page.getByTestId('latest-observation-value').filter({ hasText: site.latestValue }),
      ).toBeVisible();
      await expect(page.locator('.highcharts-title').filter({ hasText: site.name })).toBeVisible();
    });
  }
});

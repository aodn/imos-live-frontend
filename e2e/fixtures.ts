import { test as base } from '@playwright/test';
import { CURRENT_DATE, DEFAULT_DAY } from './utils/constants';
import { mockSiteApi } from './utils/mockSiteApi';
import { mockTilesApi } from './utils/mockTilesApi';

export { expect } from '@playwright/test';

// Every test runs against mocked APIs.
export const test = base.extend<{ mockApi: void }>({
  mockApi: [
    async ({ page }, use) => {
      await mockSiteApi(page, DEFAULT_DAY);
      await mockTilesApi(page);
      await page.clock.install({ time: CURRENT_DATE });
      await use();
    },
    { auto: true },
  ],
});

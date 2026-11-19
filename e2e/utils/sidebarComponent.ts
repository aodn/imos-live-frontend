import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export type SidebarProduct =
  | 'GSLA Ocean geostrophic current product'
  | 'GSLA sea level anomaly product'
  | 'Wave buoys product';

export const sidebarComponent = {
  selectProduct: async (page: Page, productName: SidebarProduct) => {
    await page.getByLabel(productName).getByRole('button', { name: 'Add to map' }).click();
    await expect(
      page.getByLabel(productName).getByRole('button', { name: 'Add to map' }),
    ).not.toBeVisible();
    await expect(
      page.getByLabel(productName).getByRole('button', { name: 'Remove from map' }),
    ).toBeVisible();
  },
  deselectProduct: async (page: Page, productName: SidebarProduct) => {
    await page.getByLabel(productName).getByRole('button', { name: 'Remove from map' }).click();
    await expect(
      page.getByLabel(productName).getByRole('button', { name: 'Remove from map' }),
    ).not.toBeVisible();
    await expect(
      page.getByLabel(productName).getByRole('button', { name: 'Add to map' }),
    ).toBeVisible();
  },
};

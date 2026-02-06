import { test, expect } from '@playwright/test';
import { submitApiKey } from './helpers.js';

test.describe('Validation & dialogs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('query button disabled with empty textarea', async ({ page }) => {
    await submitApiKey(page, 'test-community-key');
    await expect(page.getByRole('button', { name: 'Query IPs' })).toBeDisabled();
  });

  test('cancel confirm dialog returns to IP input', async ({ page }) => {
    await submitApiKey(page, 'test-community-key');
    await page.fill('#ips', '1.2.3.4');
    await page.getByRole('button', { name: 'Query IPs' }).click();

    await expect(page.getByText('Confirm Query')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Still on IP input
    await expect(page.locator('#ips')).toBeVisible();
  });
});
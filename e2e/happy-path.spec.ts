import { test, expect } from '@playwright/test';
import { submitApiKey, submitIPs } from './helpers.js';

test.describe('Happy path', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows API key form on initial load', async ({ page }) => {
    await expect(page.locator('#apiKey')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save & Continue' })).toBeDisabled();
  });

  test('submit button enables when key is entered', async ({ page }) => {
    await page.fill('#apiKey', 'test-community-key');
    await expect(page.getByRole('button', { name: 'Save & Continue' })).toBeEnabled();
  });

  test('full community key flow', async ({ page }) => {
    await submitApiKey(page, 'test-community-key');

    await page.fill('#ips', '1.2.3.4\n5.6.7.8');
    await page.getByRole('button', { name: 'Query IPs' }).click();

    // Confirm dialog
    await expect(page.getByText('Confirm Query')).toBeVisible();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Results view
    await expect(page.getByText('CTI Report')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('Total IPs')).toBeVisible();
  });

  test('full PoV key flow uses batch endpoint', async ({ page }) => {
    await submitApiKey(page, 'test-pov-key', true);
    await submitIPs(page, '1.2.3.4\n5.6.7.8\n9.10.11.12');

    await expect(page.getByText('CTI Report')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('General Information')).toBeVisible();
  });
});
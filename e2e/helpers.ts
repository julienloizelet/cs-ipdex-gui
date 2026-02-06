import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// Helper: navigate through API key step
export async function submitApiKey(page: Page, key: string, isPov = false) {
  await page.fill('#apiKey', key);
  if (isPov) {
    await page.getByLabel('Using a PoV Key').check();
  }
  await page.getByRole('button', { name: 'Save & Continue' }).click();
  await expect(page.locator('#ips')).toBeVisible();
}

// Helper: submit IPs and confirm
export async function submitIPs(page: Page, ips: string) {
  await page.fill('#ips', ips);
  await page.getByRole('button', { name: 'Query IPs' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
}

// Helper: full flow to results
export async function flowToResults(page: Page, key: string, ips: string, isPov = false) {
  await submitApiKey(page, key, isPov);
  await submitIPs(page, ips);
  // The exit event and step transition are batched by React, so
  // "Report complete" is never rendered — wait for the results view directly.
  await expect(page.getByText('CTI Report')).toBeVisible({ timeout: 30_000 });
}
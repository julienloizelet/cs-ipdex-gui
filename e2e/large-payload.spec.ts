import { test, expect } from '@playwright/test';
import { submitApiKey } from './helpers.js';

test.describe('Large IP payload', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('handles 100k IP list without getting stuck', async ({ page }) => {
    await submitApiKey(page, 'test-pov-key', true);

    // Generate 100k IPs and set textarea value directly
    // to avoid slow Playwright fill. This tests both the client-side processing
    // and the Socket.IO payload size (100k IPs ≈ 1.5MB serialized).
    const ipCount = 100_000;
    await page.evaluate((count) => {
      const lines: string[] = [];
      for (let i = 0; i < count; i++) {
        const a = (i >> 16) & 255;
        const b = (i >> 8) & 255;
        const c = i & 255;
        lines.push(`100.${a}.${b}.${c}`);
      }
      const textarea = document.querySelector('#ips') as HTMLTextAreaElement;
      // Trigger React's synthetic onChange via native input setter
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value'
      )!.set!;
      nativeInputValueSetter.call(textarea, lines.join('\n'));
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }, ipCount);

    // Verify the IP count is displayed
    await expect(page.getByText(`${ipCount} IPs`)).toBeVisible();

    // Submit
    await page.getByRole('button', { name: 'Query IPs' }).click();
    await expect(page.getByText('Confirm Query')).toBeVisible();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Should reach executing state and get server output (not stuck)
    await expect(page.getByText(/Querying.*IPs against CrowdSec CTI/)).toBeVisible({ timeout: 10_000 });

    // Should eventually complete (all IPs are unknown to mock server, but it should still finish)
    await expect(page.getByText('CTI Report')).toBeVisible({ timeout: 60_000 });
  });
});
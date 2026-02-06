import { test, expect } from '@playwright/test';
import { submitApiKey } from './helpers.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

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

  test('rejects invalid content pasted in textarea', async ({ page }) => {
    await submitApiKey(page, 'test-community-key');

    // Paste invalid content
    await page.fill('#ips', 'not an ip\n{"json": true}\nhello world');
    await page.getByRole('button', { name: 'Query IPs' }).click();

    // Check error message is shown
    await expect(page.getByText('Invalid format. Expected one IP per line')).toBeVisible();
    // Dialog should not appear
    await expect(page.getByText('Confirm Query')).not.toBeVisible();
  });

  test('error clears when user edits textarea', async ({ page }) => {
    await submitApiKey(page, 'test-community-key');

    // Trigger error
    await page.fill('#ips', 'invalid content');
    await page.getByRole('button', { name: 'Query IPs' }).click();
    await expect(page.getByText('Invalid format')).toBeVisible();

    // Edit textarea
    await page.fill('#ips', '1.2.3.4');
    // Error should be cleared
    await expect(page.getByText('Invalid format')).not.toBeVisible();
  });
});

test.describe('File upload', () => {
  let tempDir: string;

  test.beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-upload-'));
  });

  test.afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('valid txt file populates textarea', async ({ page }) => {
    await submitApiKey(page, 'test-community-key');

    // Create a temp file with .txt extension
    const filePath = path.join(tempDir, 'ips.txt');
    fs.writeFileSync(filePath, '1.2.3.4\n5.6.7.8\n9.10.11.12');

    // Upload the file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);

    // Check textarea is populated
    await expect(page.locator('#ips')).toHaveValue('1.2.3.4\n5.6.7.8\n9.10.11.12');
    await expect(page.getByText('3 IPs')).toBeVisible();
  });

  test('text file without .txt extension is accepted', async ({ page }) => {
    await submitApiKey(page, 'test-community-key');

    // Create a text file without extension
    const filePath = path.join(tempDir, 'ip-list');
    fs.writeFileSync(filePath, '1.2.3.4\n5.6.7.8');

    // Upload the file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);

    // Check textarea is populated (no error)
    await expect(page.locator('#ips')).toHaveValue('1.2.3.4\n5.6.7.8');
    await expect(page.getByText('2 IPs')).toBeVisible();
  });

  test('rejects binary files even with .txt extension', async ({ page }) => {
    await submitApiKey(page, 'test-community-key');

    // Create a file with PNG magic bytes but .txt extension
    const filePath = path.join(tempDir, 'fake.txt');
    // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
    const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    fs.writeFileSync(filePath, pngHeader);

    // Upload the file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);

    // Check error message
    await expect(page.getByText('File appears to be binary, not a text file')).toBeVisible();
    // Textarea should remain empty
    await expect(page.locator('#ips')).toHaveValue('');
  });

  test('rejects files with null bytes', async ({ page }) => {
    await submitApiKey(page, 'test-community-key');

    // Create a file with null bytes (binary content)
    const filePath = path.join(tempDir, 'binary.txt');
    const contentWithNull = Buffer.from('1.2.3.4\x00\x005.6.7.8');
    fs.writeFileSync(filePath, contentWithNull);

    // Upload the file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);

    // Check error message
    await expect(page.getByText('File appears to be binary, not a text file')).toBeVisible();
    // Textarea should remain empty
    await expect(page.locator('#ips')).toHaveValue('');
  });

  test('rejects files larger than 2MB', async ({ page }) => {
    await submitApiKey(page, 'test-community-key');

    // Create a temp file larger than 2MB
    const filePath = path.join(tempDir, 'large.txt');
    const largeContent = '1.2.3.4\n'.repeat(300000); // ~2.4MB
    fs.writeFileSync(filePath, largeContent);

    // Upload the file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);

    // Check error message
    await expect(page.getByText('File size must be less than 2MB')).toBeVisible();
    // Textarea should remain empty
    await expect(page.locator('#ips')).toHaveValue('');
  });

  test('rejects files with invalid format (JSON)', async ({ page }) => {
    await submitApiKey(page, 'test-community-key');

    // Create a JSON file
    const filePath = path.join(tempDir, 'data.json');
    fs.writeFileSync(filePath, '{"ips": ["1.2.3.4", "5.6.7.8"]}');

    // Upload the file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);

    // Check error message
    await expect(page.getByText('Invalid format. Expected one IP per line')).toBeVisible();
    // Textarea should remain empty
    await expect(page.locator('#ips')).toHaveValue('');
  });

  test('rejects files with non-IP content', async ({ page }) => {
    await submitApiKey(page, 'test-community-key');

    // Create a file with random text
    const filePath = path.join(tempDir, 'random.txt');
    fs.writeFileSync(filePath, 'hello world\nthis is not an IP\nneither is this');

    // Upload the file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);

    // Check error message
    await expect(page.getByText('Invalid format. Expected one IP per line')).toBeVisible();
    // Textarea should remain empty
    await expect(page.locator('#ips')).toHaveValue('');
  });
});

test.describe('Duplicate detection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows duplicate warning in confirm dialog', async ({ page }) => {
    await submitApiKey(page, 'test-community-key');

    // Enter IPs with duplicates
    await page.fill('#ips', '1.2.3.4\n5.6.7.8\n1.2.3.4\n1.2.3.4\n5.6.7.8');
    await page.getByRole('button', { name: 'Query IPs' }).click();

    // Check confirm dialog shows duplicate warning
    await expect(page.getByText('Confirm Query')).toBeVisible();
    await expect(page.getByText('2 IPs')).toBeVisible();
    await expect(page.getByText('3 duplicates removed')).toBeVisible();
    // Check the duplicate list items (with count suffix)
    await expect(page.getByText('1.2.3.4 (3x)')).toBeVisible();
    await expect(page.getByText('5.6.7.8 (2x)')).toBeVisible();
  });

  test('no duplicate warning when all IPs are unique', async ({ page }) => {
    await submitApiKey(page, 'test-community-key');

    // Enter unique IPs only
    await page.fill('#ips', '1.2.3.4\n5.6.7.8\n9.10.11.12');
    await page.getByRole('button', { name: 'Query IPs' }).click();

    // Check confirm dialog shows count but no duplicate warning
    await expect(page.getByText('Confirm Query')).toBeVisible();
    // Check the dialog text mentions handling 3 IPs
    await expect(page.getByText('Your API key needs to handle')).toBeVisible();
    await expect(page.getByText('duplicates removed')).not.toBeVisible();
  });

  test('queries only unique IPs after duplicate removal', async ({ page }) => {
    await submitApiKey(page, 'test-pov-key', true);

    // Enter IPs with duplicates (1.2.3.4 appears 3 times)
    await page.fill('#ips', '1.2.3.4\n1.2.3.4\n1.2.3.4');
    await page.getByRole('button', { name: 'Query IPs' }).click();

    // Confirm
    await page.getByRole('button', { name: 'Continue' }).click();

    // Wait for results - should show only 1 IP
    await expect(page.getByText('CTI Report')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('Total IPs')).toBeVisible();
    // The "1" under Total IPs
    await expect(page.locator('text=1').first()).toBeVisible();
  });
});
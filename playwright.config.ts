import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'tsx e2e/mock-cti-server.ts',
      port: 4444,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'CTI_BASE_URL=http://localhost:4444 npm run dev',
      port: 5173,
      reuseExistingServer: !process.env.CI,
    },
  ],
});

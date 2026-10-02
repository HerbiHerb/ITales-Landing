import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  retries: 0,
  reporter: 'list',
  use: {
    browserName: 'chromium',
    trace: 'retain-on-failure',
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined },
  },
  projects: [
    { name: 'root', use: { baseURL: 'http://127.0.0.1:4173' } },
    { name: 'github-pages', use: { baseURL: 'http://127.0.0.1:4174/ITales-Landing/' } },
  ],
  webServer: [
    { command: 'node scripts/test-server.mjs root 4173', url: 'http://127.0.0.1:4173', timeout: 60000, reuseExistingServer: false },
    { command: 'node scripts/test-server.mjs nested 4174', url: 'http://127.0.0.1:4174/ITales-Landing/', timeout: 60000, reuseExistingServer: false },
  ],
});

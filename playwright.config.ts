import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  use: {
    baseURL: 'http://localhost:4321',
    channel: 'chromium',
    reducedMotion: 'reduce',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run preview -- --host localhost',
    port: 4321,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});

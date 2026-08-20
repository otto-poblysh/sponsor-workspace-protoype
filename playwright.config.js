// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright Test Configuration for Trilingual Portal E2E Tests
 */
module.exports = defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 4,
  reporter: 'list',
  use: {
    headless: true,
    browserName: 'chromium',
    viewport: { width: 1920, height: 1080 },
    trace: 'off'
  }
});

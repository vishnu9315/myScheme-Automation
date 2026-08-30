import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import { AUTH_STATE_PATH } from './global-setup';

dotenv.config();

const BASE_URL = process.env.BASE_URL ?? 'https://dev.myscheme.gov.in';
const HEADLESS = process.env.HEADLESS !== 'false';
const CI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  globalSetup: require.resolve('./global-setup'),
  timeout: 45_000,
  expect: {
    timeout: 8_000,
  },
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  workers: CI ? 4 : undefined,
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['list'],
    ...(CI ? [['github'] as const] : []),
  ],
  outputDir: 'test-results',

  use: {
    baseURL: BASE_URL,
    headless: HEADLESS,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    ignoreHTTPSErrors: true,
    // Bypasses the AWS Cognito environment gate (see BLOCKED_SCENARIOS.md
    // -> ENV-01) via a session captured once in global-setup.ts, instead of
    // every test repeating that login.
    storageState: AUTH_STATE_PATH,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});

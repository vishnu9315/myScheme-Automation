import { chromium, type FullConfig } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

export const AUTH_STATE_PATH = path.join(__dirname, '.auth', 'state.json');

/**
 * dev.myscheme.gov.in currently sits behind an environment-wide AWS Cognito
 * Hosted UI login gate (see BLOCKED_SCENARIOS.md -> ENV-01) — every route
 * redirects to it before the MyScheme application itself ever renders.
 *
 * This is unrelated to the in-app "Sign In" button, which separately hands
 * off to DigiLocker (see pages/LoginPage.ts) — that flow remains blocked.
 *
 * When ENV_GATE_USERNAME/ENV_GATE_PASSWORD are set, this logs in once and
 * persists the resulting session via storageState, so individual tests
 * never need to perform this login themselves. When they aren't set (e.g.
 * a contributor without access, or CI without the secret configured), this
 * writes an empty storage state instead of failing — tests will then fail
 * at the gate with a clear, debuggable screenshot rather than this setup
 * step failing obscurely.
 */
export default async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0]?.use?.baseURL ?? process.env.BASE_URL;
  const username = process.env.ENV_GATE_USERNAME;
  const password = process.env.ENV_GATE_PASSWORD;

  fs.mkdirSync(path.dirname(AUTH_STATE_PATH), { recursive: true });

  if (!username || !password || !baseURL) {
    fs.writeFileSync(AUTH_STATE_PATH, JSON.stringify({ cookies: [], origins: [] }));
    return;
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(baseURL);

  // AWS Cognito's default Hosted UI template renders this exact id twice
  // in the DOM (confirmed live: two identical, duplicate-id
  // #signInFormUsername inputs) — only one is actually visible, so every
  // field here is scoped with the :visible pseudo-class rather than
  // relying on id/role uniqueness alone.
  const usernameField = page.locator('#signInFormUsername:visible');
  await usernameField.waitFor({ state: 'visible', timeout: 20_000 });
  await usernameField.fill(username);

  const passwordField = page.locator('#signInFormPassword:visible');
  await passwordField.fill(password);

  await page
    .locator('button:visible:has-text("Sign in"), input[type="submit"][value="Sign in" i]:visible')
    .first()
    .click();

  // Wait until we've left the Cognito domain and landed back on the app.
  await page.waitForURL((url) => !/amazoncognito\.com/i.test(url.hostname), { timeout: 30_000 });

  await page.context().storageState({ path: AUTH_STATE_PATH });
  await browser.close();
}

import { test as base } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { SearchPage } from '../pages/SearchPage';
import { SchemeListingPage } from '../pages/SchemeListingPage';
import { SchemeDetailsPage } from '../pages/SchemeDetailsPage';
import { FindSchemeWizardPage } from '../pages/FindSchemeWizardPage';
import { ConsoleWatcher } from '../utils/helpers';

interface Fixtures {
  homePage: HomePage;
  loginPage: LoginPage;
  searchPage: SearchPage;
  schemeListingPage: SchemeListingPage;
  schemeDetailsPage: SchemeDetailsPage;
  findSchemeWizardPage: FindSchemeWizardPage;
  consoleWatcher: ConsoleWatcher;
}

/**
 * Extends Playwright's base test with pre-wired Page Objects and a console
 * error watcher, so specs depend on fixtures instead of constructing Page
 * Objects (and attaching listeners) by hand.
 */
export const test = base.extend<Fixtures>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  searchPage: async ({ page }, use) => {
    await use(new SearchPage(page));
  },
  schemeListingPage: async ({ page }, use) => {
    await use(new SchemeListingPage(page));
  },
  schemeDetailsPage: async ({ page }, use) => {
    await use(new SchemeDetailsPage(page));
  },
  findSchemeWizardPage: async ({ page }, use) => {
    await use(new FindSchemeWizardPage(page));
  },
  // Registered before navigation happens in the test body, so it captures
  // errors from the very first navigation onward.
  consoleWatcher: async ({ page }, use) => {
    await use(new ConsoleWatcher(page));
  },
});

export { expect } from '@playwright/test';

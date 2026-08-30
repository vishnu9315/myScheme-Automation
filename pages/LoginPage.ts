import type { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { HomePage } from './HomePage';

/**
 * MyScheme does not host its own login form. "Sign In" hands off to an
 * external DigiLocker (meripehchaan.gov.in) OAuth consent screen requiring
 * a real Aadhaar-linked account and OTP/PIN. Completing an actual login is
 * BLOCKED in this framework (see BLOCKED_SCENARIOS.md) — this page object
 * only models what is verifiable without credentials: that Sign In performs
 * the expected external handoff.
 */
export class LoginPage extends BasePage {
  private readonly home: HomePage;

  constructor(page: Page) {
    super(page);
    this.home = new HomePage(page);
  }

  async clickSignIn(): Promise<void> {
    await this.home.header.clickSignIn();
  }

  /** URL host once redirected to the DigiLocker/meriPehchaan consent screen. */
  isOnIdentityProvider(url: string): boolean {
    return /digilocker|meripehchaan/i.test(url);
  }
}

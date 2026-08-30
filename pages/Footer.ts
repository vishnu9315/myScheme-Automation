import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

const PARTNER_LOGO_ALT_TEXT = ['di', 'digilocker', 'umang', 'indiaGov', 'myGov', 'dataGov', 'igod'];

/**
 * The "Quick Links" / "Useful Links" block at the bottom of the page.
 *
 * Confirmed live: this is NOT wrapped in a semantic `<footer>` element —
 * the page's actual `<footer>` (`contentinfo` role) contains only a
 * "Last Updated On" build stamp. Links here are matched by their real,
 * unique accessible names instead (each name below was confirmed against
 * the live accessibility tree).
 *
 * The "Useful Links" partner icons are a known, documented defect (all 7
 * stuck on a 1x1 placeholder GIF — see BLOCKED_SCENARIOS.md / the
 * static-resources migration check), so this page object exposes a
 * locator to inspect them rather than asserting they render.
 */
export class Footer extends BasePage {
  readonly aboutLink: Locator;
  readonly faqsLink: Locator;
  readonly contactLink: Locator;
  readonly dashboardLink: Locator;
  readonly usefulLinksIcons: Locator;

  constructor(page: Page) {
    super(page);
    this.aboutLink = page.getByRole('link', { name: 'About Us', exact: true });
    this.faqsLink = page.getByRole('link', { name: 'Frequently Asked Questions', exact: true });
    this.contactLink = page.getByRole('link', { name: 'Contact Us', exact: true });
    this.dashboardLink = page.getByRole('link', { name: 'Dashboard', exact: true });
    this.usefulLinksIcons = page.locator(
      PARTNER_LOGO_ALT_TEXT.map((alt) => `img[alt="${alt}"]`).join(', '),
    );
  }

  linkByRoute(route: string): Locator {
    return this.page.locator(`a[href="${route}"]`).first();
  }
}

import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * The site header: logo, search entry point, language switcher, theme
 * toggle, and Sign In. Locators are built on `getByRole`/`getByLabel`
 * against the aria-labels observed on the live SSR markup — the app does
 * not ship `data-testid` attributes (documented in ARCHITECTURE.md).
 */
export class Header extends BasePage {
  readonly logo: Locator;
  readonly signInButton: Locator;
  readonly languageSelect: Locator;
  readonly themeToggle: Locator;
  readonly searchBar: Locator;

  constructor(page: Page) {
    super(page);
    // The header/logo markup exposes no unique accessible name (its
    // aria-label is the generic, reused "Action Button" — see README
    // "Known Locator Limitations"), so the home-link href is the most
    // reliable stable attribute available.
    this.logo = page.locator('a[href="/"]').first();
    this.signInButton = page.getByRole('button', { name: 'Sign In' });
    // Confirmed live: the app renders two separate language-switcher
    // implementations — a react-select widget (used inside the mobile
    // drawer; its only accessible name, "Select language", sits on a
    // permanently invisible helper input, confirmed hidden at every
    // viewport tested) and, separately, the plain visible desktop control
    // actually used here: a clickable list item containing an
    // `alt="Change language"` icon plus the current language's text.
    this.languageSelect = page
      .locator('img[alt="Change language"]:visible')
      .locator('xpath=ancestor::li[1]');
    this.themeToggle = page.getByRole('button', { name: /Light Mode|Dark Mode/ });
    // Confirmed live: on the homepage this is static text ("Enter scheme
    // name to search...") next to an icon button — not a fillable input.
    // It only navigates to /search; the real, fillable query box lives on
    // SearchPage. The markup renders this text twice (a responsive
    // desktop/mobile duplicate, confirmed live via a strict-mode
    // violation) — scoped to the currently-visible one.
    this.searchBar = page.locator('p:visible', { hasText: /enter scheme name to search/i });
  }

  async clickLogo(): Promise<void> {
    await this.logo.click();
  }

  async clickSignIn(): Promise<void> {
    await this.signInButton.click();
  }

  async toggleTheme(): Promise<void> {
    // The third-party UserWay accessibility widget (z-index 99999) covers
    // ~71% of this control at ~1280px viewports, so a coordinate-based
    // click — including `click({ force: true })`, which still dispatches at
    // real screen coordinates — lands on the widget instead and silently
    // does nothing. That is a genuine user-facing defect, tracked by its
    // own test in tests/regression/navigation.spec.ts rather than papered
    // over here. `dispatchEvent` targets the element directly, so this
    // method exercises the toggle's own behavior independent of the
    // obstruction.
    await this.themeToggle.dispatchEvent('click');
  }

  /**
   * The element that would actually receive a real click at the theme
   * toggle's centre point. Used to detect the obstruction described in
   * `toggleTheme()`; returns a `TAG.className` string.
   */
  async elementAtThemeTogglePoint(): Promise<string> {
    return this.themeToggle.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return top ? `${top.tagName}.${(top.className || '').toString()}` : 'none';
    });
  }

  async isDarkMode(): Promise<boolean> {
    const html = this.page.locator('html');
    const cls = (await html.getAttribute('class')) ?? '';
    return cls.includes('dark');
  }

  /**
   * Selects a language from the dropdown by its English label (e.g.
   * "Hindi", "Odia"). Confirmed live: each option's accessible name is
   * only its native-script name (e.g. "हिन्दी"), but its rendered text
   * combines both ("हिन्दी - Hindi") — matched here as a substring rather
   * than an exact/accessible-name match for that reason.
   */
  async selectLanguage(label: string): Promise<void> {
    await this.languageSelect.click();
    await this.page.getByText(label, { exact: false }).click();
  }
}

import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export type SchemeSection =
  | 'Details'
  | 'Benefits'
  | 'Eligibility'
  | 'Exclusions'
  | 'Application Process'
  | 'Documents Required'
  | 'Frequently Asked Questions'
  | 'Sources And References';

/**
 * A scheme detail page (/schemes/[slug]), e.g. /schemes/ay ("Agnipath Yojana").
 *
 * Confirmed live: this is NOT a tabbed interface (no ARIA `tab`/`tabpanel`
 * roles anywhere on the page) — Details/Benefits/Eligibility/Exclusions/
 * Application Process/Documents Required/FAQs/Sources are `<h3>` section
 * headings on one continuous, fully server-rendered page, each followed
 * immediately by that section's content with no interaction required to
 * reveal it. This replaces this framework's original tab-based assumption
 * (built from the source QA material's tab *terminology*, before this
 * page's actual markup could be verified live).
 *
 * Known limitation (DT-04, High): the "Check Eligibility" *slide-in
 * drawer* feature described in the source QA material is a separate
 * concern from the "Check Eligibility" heading visible near the top of
 * this page — the drawer itself still has no confirmed reachable trigger.
 * See BLOCKED_SCENARIOS.md.
 */
export class SchemeDetailsPage extends BasePage {
  readonly schemeTitle: Locator;
  readonly bookmarkButton: Locator;
  readonly shareRow: Locator;
  readonly starRating: Locator;

  constructor(page: Page) {
    super(page);
    // The shared header renders its own (empty-text, icon-only) <h1> on
    // every page — confirmed live via a strict-mode violation resolving
    // getByRole('heading', { level: 1 }) to both it and the real scheme
    // title. Filtering to non-empty text excludes the decorative one.
    this.schemeTitle = page.getByRole('heading', { level: 1 }).filter({ hasText: /.+/ });
    this.bookmarkButton = page.getByRole('button', { name: /bookmark/i });
    // Confirmed live: these render as <button>s (e.g. `button "whatsapp"`),
    // not links.
    this.shareRow = page.getByRole('button', {
      name: /whatsapp|facebook|telegram|twitter|linkedin/i,
    });
    this.starRating = page.getByRole('button', { name: /star/i });
  }

  async open(slug: string): Promise<void> {
    await this.goto(`/schemes/${slug}`);
    // Confirmed live and necessary under any concurrent load: content
    // loads asynchronously after the shell renders. Without waiting here,
    // callers that read state immediately (e.g. `.count()`, which — unlike
    // `expect(...).toBeVisible()` — does not auto-retry) can race a
    // still-loading page and observe an empty <main>.
    await this.schemeTitle.waitFor({ state: 'visible' });
  }

  sectionHeading(name: SchemeSection): Locator {
    return this.page.getByRole('heading', { level: 3, name, exact: true });
  }

  /**
   * The element immediately following a section's heading in document
   * order (via the XPath `following::` axis, which crosses sibling/
   * nesting boundaries) — that section's body content, without assuming a
   * specific wrapper structure around it.
   */
  sectionContent(name: SchemeSection): Locator {
    return this.sectionHeading(name).locator('xpath=following::*[1]');
  }
}

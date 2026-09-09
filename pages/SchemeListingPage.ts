import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { waitForSearchResponse, waitForTextToSettle } from '../utils/helpers';

/**
 * The scrollable list of scheme result `<article>` cards on /search, plus
 * pagination controls.
 *
 * Confirmed live: each result renders as a semantic `<article>` containing
 * an `<h2>` with the scheme name link, a ministry/state "Filter by ..."
 * button, a description, and several "Filter by tag: ..." buttons.
 *
 * Pagination is a `<ul>` containing both the numbered page `listitem`s
 * (plain text, no link/button role) and the Previous/Next controls as
 * unlabeled icon-only `<svg>` elements (no accessible name at all) — Next
 * is the last icon in that list, Previous (when present, i.e. not on page
 * 1) is the first. Confirmed live: this `<ul>` is NOT a direct sibling of
 * the last result card — result cards live inside a grid `<div>`, and the
 * `<ul>` is nested one level inside *that grid's own* next sibling `<div>`
 * (`.locator('xpath=../following-sibling::*[1]')` steps up to the grid
 * before looking for the next sibling, then `.locator('ul')` finds the
 * pagination list nested inside it). Located structurally rather than by
 * a fixed page-count anchor, since the total page count varies by
 * search/filter.
 */
export class SchemeListingPage extends BasePage {
  readonly resultCards: Locator;

  constructor(page: Page) {
    super(page);
    this.resultCards = page.getByRole('article');
  }

  private paginationList(): Locator {
    return this.resultCards.last().locator('xpath=../following-sibling::*[1]').locator('ul');
  }

  get nextPageButton(): Locator {
    return this.paginationList().locator('svg').last();
  }

  get previousPageButton(): Locator {
    return this.paginationList().locator('svg').first();
  }

  get pageNumbers(): Locator {
    return this.paginationList().getByRole('listitem');
  }

  async resultCount(): Promise<number> {
    return this.resultCards.count();
  }

  async schemeNameAt(index: number): Promise<string> {
    return (
      await this.resultCards.nth(index).getByRole('heading', { level: 2 }).innerText()
    ).trim();
  }

  async openSchemeAt(index: number): Promise<void> {
    await this.resultCards.nth(index).getByRole('heading', { level: 2 }).getByRole('link').click();
  }

  /** The heading the pagination waits on — changing pages always changes it. */
  private firstResultHeading(): Locator {
    return this.resultCards.first().getByRole('heading', { level: 2 });
  }

  private async firstResultTextOrNull(): Promise<string | null> {
    return this.firstResultHeading()
      .innerText()
      .then((t) => t.trim())
      .catch(() => null);
  }

  /**
   * Every pagination method captures the current first result, performs the
   * click, then waits for that text to actually change — waiting on the
   * network response alone returns before React re-renders, so callers
   * would read the previous page's results.
   *
   * Unlike search and filtering (where an unchanged result set is a
   * legitimate outcome, so `waitForTextToSettle` tolerates a timeout),
   * changing pages must always change the first result. This wait is
   * therefore strict: if the content has not changed, that is a real
   * failure and should surface as a clear timeout here rather than as a
   * confusing wrong-value assertion further down the test.
   */
  private async paginate(action: () => Promise<void>): Promise<void> {
    const before = await this.firstResultTextOrNull();
    await waitForSearchResponse(this.page, action);
    await waitForTextToSettle(this.firstResultHeading(), before, { strict: true });
  }

  async goToNextPage(): Promise<void> {
    await this.paginate(() => this.nextPageButton.click());
  }

  async goToPreviousPage(): Promise<void> {
    await this.paginate(() => this.previousPageButton.click());
  }

  async goToPage(pageNumber: number): Promise<void> {
    const target = this.pageNumbers.filter({ hasText: new RegExp(`^${pageNumber}$`) });
    await this.paginate(() => target.click());
  }
}

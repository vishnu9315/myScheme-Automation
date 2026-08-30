import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { waitForSearchResponse } from '../utils/helpers';

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

  async goToNextPage(): Promise<void> {
    await waitForSearchResponse(this.page, () => this.nextPageButton.click());
  }

  async goToPreviousPage(): Promise<void> {
    await waitForSearchResponse(this.page, () => this.previousPageButton.click());
  }

  async goToPage(pageNumber: number): Promise<void> {
    const target = this.pageNumbers.filter({ hasText: new RegExp(`^${pageNumber}$`) });
    await waitForSearchResponse(this.page, () => target.click());
  }
}

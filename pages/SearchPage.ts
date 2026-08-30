import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { FilterPanel } from './FilterPanel';
import { parseSchemeCount, waitForSearchResponse } from '../utils/helpers';

/**
 * The /search page's query box and result-count header.
 *
 * Known limitation (DT-13/MIG-01, High): the app has no query-string
 * contract at all. Typing a search here never updates the URL, and a
 * manually-added `?q=` is silently ignored on load. Tests that verify this
 * (tests/migration/query-params.spec.ts) intentionally assert the current,
 * documented-broken behavior via `test.fail()` so they flip green the day
 * it's fixed.
 */
export class SearchPage extends BasePage {
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly totalCountText: Locator;
  readonly noResultsMessage: Locator;
  readonly resetFiltersButton: Locator;
  readonly filters: FilterPanel;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.getByPlaceholder(/search/i);
    // Confirmed live: this form does not submit on Enter — a distinct
    // "Search" button next to the input must be clicked.
    this.searchButton = page.getByRole('button', { name: 'Search', exact: true });
    // Confirmed live: the header text has two distinct forms depending on
    // how the current result set was produced — "Total N schemes
    // available" for the unfiltered list and a keyword search, but "We
    // found N schemes based on your preferences" once a checkbox filter
    // (e.g. Gender) is applied. Both are matched here.
    this.totalCountText = page.getByText(/total .*schemes available|we found \d+ schemes/i);
    this.noResultsMessage = page.getByText(/no schemes found/i);
    this.resetFiltersButton = page.getByRole('button', { name: /reset filters/i });
    this.filters = new FilterPanel(page);
  }

  async open(query?: string): Promise<void> {
    // Confirmed live and necessary under any concurrent load: the initial
    // result list loads asynchronously after the shell renders. Without
    // waiting for that response here, callers that read result state
    // immediately (e.g. `.count()`, which — unlike `expect(...).toBeVisible()`
    // — does not auto-retry) can race a still-loading page.
    await waitForSearchResponse(this.page, () =>
      this.goto(query ? `/search?q=${encodeURIComponent(query)}` : '/search'),
    );
  }

  async search(term: string): Promise<void> {
    await this.searchInput.fill(term);
    await waitForSearchResponse(this.page, () => this.searchButton.click());
  }

  async getTotalCount(): Promise<number | null> {
    const text = await this.totalCountText.innerText();
    return parseSchemeCount(text);
  }

  async hasNoResults(): Promise<boolean> {
    return this.noResultsMessage.isVisible();
  }
}

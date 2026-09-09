import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { FilterPanel } from './FilterPanel';
import { parseSchemeCount, waitForSearchResponse, waitForTextToSettle } from '../utils/helpers';

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
  /** First result card, or the empty state — whichever the page settles on. */
  private readonly resultsSettled: Locator;

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
    this.resultsSettled = page.getByRole('article').first().or(this.noResultsMessage);
    this.filters = new FilterPanel(page);
  }

  async open(query?: string): Promise<void> {
    // Two distinct waits, both required. The response wait alone is not
    // enough: it resolves ~200ms before React renders the results, so a
    // caller that immediately reads result state gets an empty page. That
    // silently broke pagination — `paginate()` captured a null "before"
    // value and skipped its own change-wait entirely, letting the test
    // read the previous page's content.
    await waitForSearchResponse(this.page, () =>
      this.goto(query ? `/search?q=${encodeURIComponent(query)}` : '/search'),
    );
    // Either results rendered, or the app rendered its empty state — both
    // are valid "the page has settled" outcomes.
    await expect(this.resultsSettled).toBeVisible({ timeout: 20_000 });
  }

  async search(term: string): Promise<void> {
    // The result-count header is captured before searching and waited on
    // after, because the network response resolves ~200ms before React
    // re-renders — reading in that gap returns the previous result count.
    // See `waitForTextToSettle`.
    const before = await this.totalCountText
      .innerText()
      .then((t) => t.trim())
      .catch(() => null);
    await this.searchInput.fill(term);
    await waitForSearchResponse(this.page, () => this.searchButton.click());
    await waitForTextToSettle(this.totalCountText, before);
  }

  async getTotalCount(): Promise<number | null> {
    const text = await this.totalCountText.innerText();
    return parseSchemeCount(text);
  }

  async hasNoResults(): Promise<boolean> {
    return this.noResultsMessage.isVisible();
  }
}

import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { waitForSearchResponse } from '../utils/helpers';

/**
 * The /search left-hand filter panel.
 *
 * Confirmed live, which differs from the source QA material in two ways
 * worth flagging explicitly:
 *
 * 1. Checkbox-based filter groups (Scheme Category, Gender, Caste, ...)
 *    render every option already expanded by default — no accordion
 *    expand/collapse interaction was found live. The previously-logged
 *    DEF-05 ("the accordion re-collapses on every filter change") does
 *    not appear to apply to this build's markup; either it no longer uses
 *    an accordion at all, or this framework's `--workers` concurrency
 *    happened not to hit the case it described. Kept as a documented
 *    observation, not asserted against either way.
 * 2. Not every filter is a checkbox list: State/UT and Age are instead
 *    free-text/typeahead "Select" boxes, out of scope for this class
 *    (only the checkbox-list groups are modeled here).
 *
 * Each checkbox option row has no ARIA role/name of its own — confirmed
 * live via direct DOM inspection (`outerHTML`), not just the accessibility
 * tree (which is an unreliable guide here: it *displays* a "generic"
 * role and name for these rows that a real `getByRole('generic', {name})`
 * query does not actually match, likely a snapshot-serializer heuristic
 * rather than a true accessible name). Each row instead carries a plain
 * `title="<Label>"` HTML attribute (e.g. `title="Female"`), and its count
 * badge is a sibling `<span title="Scheme count 816">`. Both are matched
 * via `getByTitle`/an attribute selector rather than by role.
 */
export class FilterPanel extends BasePage {
  readonly resetFiltersButton: Locator;

  constructor(page: Page) {
    super(page);
    this.resetFiltersButton = page.getByRole('button', { name: /reset filters/i });
  }

  // `groupName` is kept as a parameter for call-site clarity and in case
  // scoping becomes necessary if an option label ever collides across
  // groups — in practice, each option's `title` (e.g. "Female", "Women
  // and Child") has proven unique sitewide. The markup renders each row
  // twice (a responsive desktop/mobile duplicate, confirmed live via a
  // strict-mode violation) — scoped to the visible one.
  private optionLocator(_groupName: string, optionLabel: string): Locator {
    return this.page.locator(`[title="${optionLabel}"]:visible`);
  }

  async getOptionCount(groupName: string, optionLabel: string): Promise<number | null> {
    const title = await this.optionLocator(groupName, optionLabel)
      .locator('[title^="Scheme count"]')
      .getAttribute('title');
    const match = title?.match(/\d+/);
    return match ? Number(match[0]) : null;
  }

  async selectOption(groupName: string, optionLabel: string): Promise<void> {
    // Confirmed live: a mouse click on this row (with or without `force`)
    // is unreliable — the filter panel appears to have its own scroll
    // context with a sticky group-header label, which real hit-testing
    // can land on instead of the row beneath it even when Playwright's
    // own interception check is bypassed via `force: true` (force still
    // dispatches at real screen coordinates, so it can hit the same
    // overlapping element a normal click does). Toggling via keyboard
    // (focus the checkbox, press Space) sidesteps coordinate-based
    // hit-testing entirely and was confirmed live to reliably register.
    const checkbox = this.optionLocator(groupName, optionLabel).locator('input[type="checkbox"]');
    await checkbox.focus();
    await waitForSearchResponse(this.page, () => this.page.keyboard.press('Space'));
  }

  async isOptionChecked(groupName: string, optionLabel: string): Promise<boolean> {
    return this.optionLocator(groupName, optionLabel).locator('input[type="checkbox"]').isChecked();
  }

  async clearAll(): Promise<void> {
    await waitForSearchResponse(this.page, () => this.resetFiltersButton.click());
  }
}

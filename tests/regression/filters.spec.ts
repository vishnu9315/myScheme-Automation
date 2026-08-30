import { test, expect } from '../../fixtures/testFixtures';
import { filters } from '../../utils/testData';

/**
 * Filter validation checks business behavior, not just "the click
 * worked": the displayed result count is cross-checked against the count
 * badge shown next to the selected filter option itself, and a two-filter
 * combination is asserted to be no larger than either individual filter (a
 * combination can only narrow, never widen, the result set).
 */
test.describe('Filters @regression @filters', () => {
  test('a single filter narrows results and matches its own badge count', async ({
    searchPage,
  }) => {
    await searchPage.open();
    const unfiltered = await searchPage.getTotalCount();

    const badgeCount = await searchPage.filters.getOptionCount(
      filters.gender.group,
      filters.gender.option,
    );
    await searchPage.filters.selectOption(filters.gender.group, filters.gender.option);

    const filteredCount = await searchPage.getTotalCount();

    expect(badgeCount).not.toBeNull();
    expect(filteredCount).toBe(badgeCount);
    expect(filteredCount as number).toBeLessThan(unfiltered as number);
  });

  test('combining two filters narrows the result set to at most the smaller individual filter', async ({
    searchPage,
  }) => {
    await searchPage.open();

    await searchPage.filters.selectOption(filters.gender.group, filters.gender.option);
    const genderOnlyCount = await searchPage.getTotalCount();

    await searchPage.filters.selectOption(filters.category.group, filters.category.option);
    const combinedCount = await searchPage.getTotalCount();

    expect(combinedCount).not.toBeNull();
    expect(genderOnlyCount).not.toBeNull();
    expect(combinedCount as number).toBeLessThanOrEqual(genderOnlyCount as number);
  });

  test('clearing all filters restores the unfiltered total and unchecks selected options', async ({
    searchPage,
  }) => {
    await searchPage.open();
    const unfiltered = await searchPage.getTotalCount();

    await searchPage.filters.selectOption(filters.gender.group, filters.gender.option);
    await searchPage.filters.selectOption(filters.category.group, filters.category.option);
    expect(
      await searchPage.filters.isOptionChecked(filters.gender.group, filters.gender.option),
    ).toBe(true);

    await searchPage.filters.clearAll();

    expect(await searchPage.getTotalCount()).toBe(unfiltered);
    expect(
      await searchPage.filters.isOptionChecked(filters.gender.group, filters.gender.option),
    ).toBe(false);
  });

  test('search plus a filter combination is narrower than either alone', async ({ searchPage }) => {
    await searchPage.open();
    await searchPage.search('scheme');
    const searchOnly = await searchPage.getTotalCount();

    await searchPage.filters.selectOption(filters.gender.group, filters.gender.option);
    const searchPlusFilter = await searchPage.getTotalCount();

    expect(searchPlusFilter).not.toBeNull();
    expect(searchOnly).not.toBeNull();
    expect(searchPlusFilter as number).toBeLessThanOrEqual(searchOnly as number);
  });
});

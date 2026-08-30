import { test, expect } from '../../fixtures/testFixtures';
import { knownSchemes } from '../../utils/testData';

test.describe('Scheme details @regression', () => {
  test('Eligibility section renders non-empty criteria', async ({ schemeDetailsPage }) => {
    await schemeDetailsPage.open(knownSchemes.agnipath.slug);

    await expect(schemeDetailsPage.sectionHeading('Eligibility')).toBeVisible();
    await expect(schemeDetailsPage.sectionContent('Eligibility')).not.toBeEmpty();
  });

  test('Benefits section renders non-empty benefit details', async ({ schemeDetailsPage }) => {
    await schemeDetailsPage.open(knownSchemes.agnipath.slug);

    await expect(schemeDetailsPage.sectionHeading('Benefits')).toBeVisible();
    await expect(schemeDetailsPage.sectionContent('Benefits')).not.toBeEmpty();
  });

  test('Documents Required section renders non-empty document list', async ({
    schemeDetailsPage,
  }) => {
    await schemeDetailsPage.open(knownSchemes.agnipath.slug);

    await expect(schemeDetailsPage.sectionHeading('Documents Required')).toBeVisible();
    await expect(schemeDetailsPage.sectionContent('Documents Required')).not.toBeEmpty();
  });

  test('Application Process section renders non-empty steps', async ({ schemeDetailsPage }) => {
    await schemeDetailsPage.open(knownSchemes.agnipath.slug);

    await expect(schemeDetailsPage.sectionHeading('Application Process')).toBeVisible();
    await expect(schemeDetailsPage.sectionContent('Application Process')).not.toBeEmpty();
  });

  test('the Share row exposes at least one social/link sharing option', async ({
    schemeDetailsPage,
  }) => {
    await schemeDetailsPage.open(knownSchemes.agnipath.slug);

    expect(await schemeDetailsPage.shareRow.count()).toBeGreaterThan(0);
  });

  test('the Bookmark control is present and toggleable', async ({ schemeDetailsPage }) => {
    await schemeDetailsPage.open(knownSchemes.agnipath.slug);

    await expect(schemeDetailsPage.bookmarkButton).toBeVisible();
    await expect(schemeDetailsPage.bookmarkButton).toBeEnabled();
  });
});

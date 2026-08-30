import { test, expect } from '../../fixtures/testFixtures';
import { locales } from '../../utils/testData';

/**
 * i18n routing risk area for the migration: locale detection/redirection
 * for the Pages Router is typically wired through Next.js's built-in i18n
 * config or a custom middleware matcher — both common casualties of a
 * major-version upgrade if the matcher patterns or config shape changed.
 */
test.describe('Locale routing @migration', () => {
  test('selecting a language updates the URL to carry the locale prefix', async ({
    page,
    homePage,
  }) => {
    await homePage.open();

    await homePage.header.selectLanguage(locales.odia.label);

    await expect(page).toHaveURL(new RegExp(`^.*${locales.odia.prefix}(/|$)`));
  });

  test('a bare, locale-neutral URL should render English, not a previously-selected language (MIG-04/DT-19)', async ({
    page,
    homePage,
  }) => {
    // Known, currently-open issue: after selecting Odia, navigating
    // directly to the bare (non-prefixed) URL renders fully in Odia while
    // window.location.href stays un-prefixed — URL and rendered locale
    // disagree. This test encodes the desired behavior (English by
    // default, or a redirect to the locale-prefixed URL) and is expected
    // to fail until MIG-04/DT-19 is fixed; see BLOCKED_SCENARIOS.md.
    test.fail(true, 'Tracks open defect MIG-04 / DT-19 — see BLOCKED_SCENARIOS.md');

    await homePage.open();
    await homePage.header.selectLanguage(locales.odia.label);
    await expect(page).toHaveURL(new RegExp(`^.*${locales.odia.prefix}(/|$)`));

    await page.goto('/search');

    // Desired: either the URL is redirected to /or/search, or the content
    // renders in English to match the un-prefixed URL. Checking the
    // english "Total ... schemes available" wording (not the Hindi/Odia
    // variant) as a proxy for "rendered in English".
    await expect(page.getByText(/^total \d/i)).toBeVisible();
  });
});

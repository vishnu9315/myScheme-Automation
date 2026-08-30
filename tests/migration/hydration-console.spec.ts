import { test, expect } from '../../fixtures/testFixtures';

/**
 * Hydration errors fire within the first second after `load`, asynchronously
 * with respect to Playwright's navigation lifecycle events — there is no
 * locator to wait on for "hydration has finished attempting". A short,
 * explicit settle window (rather than the flaky `networkidle` state) is the
 * deliberate, documented exception to this framework's no-arbitrary-waits
 * rule; see AUTOMATION_STRATEGY.md.
 */
const HYDRATION_SETTLE_MS = 1_500;

/**
 * Console/hydration monitoring for cold (full network) page loads — the
 * scenario a Next.js major-version bump is most likely to regress, since
 * newer React is measurably stricter about hydration mismatches.
 *
 * Known, root-caused issue (MIG-03/DT-17, Medium, intermittent): the
 * homepage hero carousel uses Swiper's native Custom Elements
 * (<swiper-container>/<swiper-slide>) rendered server-side with
 * init="false"; on the client, the browser's Custom Element upgrade
 * attaches a Shadow DOM as part of Swiper's own connectedCallback — a
 * mutation that races React's hydration pass independently of it. This
 * produces minified React errors #418/#423 on some, not all, cold loads.
 *
 * Per framework policy: harmless/known warnings do not fail the suite.
 * These tests report hydration noise for visibility but only fail on
 * errors outside that documented, tracked category.
 */
test.describe('Console & hydration monitoring @migration', () => {
  test('homepage cold load produces no unexpected (non-hydration) console/page errors', async ({
    page,
    consoleWatcher,
  }, testInfo) => {
    await page.goto('/');
    // eslint-disable-next-line playwright/no-wait-for-timeout -- deliberate hydration-settle window, see comment above
    await page.waitForTimeout(HYDRATION_SETTLE_MS);

    const hydrationErrors = consoleWatcher.getHydrationErrors();
    const unexpectedErrors = consoleWatcher.getUnexpectedErrors();

    await testInfo.attach('console-errors.json', {
      body: JSON.stringify(
        { hydrationErrors, unexpectedErrors, all: consoleWatcher.getErrors() },
        null,
        2,
      ),
      contentType: 'application/json',
    });

    console.warn(
      `[known issue MIG-03] ${hydrationErrors.length} hydration error(s) observed on cold load — see BLOCKED_SCENARIOS.md`,
    );

    expect(unexpectedErrors, JSON.stringify(unexpectedErrors, null, 2)).toHaveLength(0);
  });

  test('a scheme detail page cold load produces no unexpected console/page errors', async ({
    page,
    consoleWatcher,
  }, testInfo) => {
    await page.goto('/schemes/ay');
    // eslint-disable-next-line playwright/no-wait-for-timeout -- deliberate hydration-settle window, see comment above
    await page.waitForTimeout(HYDRATION_SETTLE_MS);

    const unexpectedErrors = consoleWatcher.getUnexpectedErrors();

    await testInfo.attach('console-errors.json', {
      body: JSON.stringify(consoleWatcher.getErrors(), null, 2),
      contentType: 'application/json',
    });

    expect(unexpectedErrors, JSON.stringify(unexpectedErrors, null, 2)).toHaveLength(0);
  });
});

import { test, expect } from '../../fixtures/testFixtures';

test.describe('Static resources @migration', () => {
  test('no critical (script/document/stylesheet) request fails on homepage load', async ({
    page,
  }) => {
    const failedCritical: string[] = [];
    page.on('response', (response) => {
      const type = response.request().resourceType();
      const isKnownInfraNoise = /manifest\.json|cognito/i.test(response.url());
      if (
        response.status() >= 400 &&
        ['document', 'script', 'stylesheet'].includes(type) &&
        !isKnownInfraNoise
      ) {
        failedCritical.push(`${response.status()} ${type} ${response.url()}`);
      }
    });

    await page.goto('/');
    await expect(page.getByRole('contentinfo')).toBeVisible();

    expect(failedCritical, failedCritical.join('\n')).toHaveLength(0);
  });

  test('the myScheme logo and hero carousel images render (non-zero natural width)', async ({
    homePage,
  }) => {
    await homePage.open();

    const heroImages = homePage.heroCarousel.locator('img');
    const count = await heroImages.count();
    expect(count).toBeGreaterThan(0);

    const firstNaturalWidth = await heroImages
      .first()
      .evaluate((img: HTMLImageElement) => img.naturalWidth);
    expect(firstNaturalWidth).toBeGreaterThan(0);
  });

  test('footer "Useful Links" partner icons should render, not stay stuck on a placeholder (DT-14)', async ({
    homePage,
  }) => {
    // Known, currently-open issue: all 7 partner-logo icons in the
    // footer's Useful Links row are permanently stuck on a 1x1 transparent
    // placeholder GIF (naturalWidth: 1) — the real asset never swaps in.
    // This test encodes the desired behavior and is expected to fail
    // until DT-14 is fixed; see BLOCKED_SCENARIOS.md.
    test.fail(true, 'Tracks open defect DT-14 — see BLOCKED_SCENARIOS.md');

    await homePage.open();

    const icons = homePage.footer.usefulLinksIcons;
    const iconCount = await icons.count();
    expect(iconCount).toBeGreaterThan(0);

    for (let i = 0; i < iconCount; i += 1) {
      const naturalWidth = await icons.nth(i).evaluate((img: HTMLImageElement) => img.naturalWidth);
      expect(naturalWidth).toBeGreaterThan(1);
    }
  });
});

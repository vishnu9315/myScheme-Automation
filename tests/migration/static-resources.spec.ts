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

  test('footer "Useful Links" partner icons render (DT-14 — fixed, now a guard)', async ({
    homePage,
  }) => {
    // DT-14 history: all 7 partner-logo icons were previously stuck on a
    // 1x1 transparent placeholder GIF (naturalWidth: 1) and this test
    // carried `test.fail()` to track that open defect. Confirmed FIXED on
    // 2026-09-09 — the icons now load real assets via the Next.js image
    // optimizer (naturalWidth 55–133). The `test.fail()` annotation was
    // removed accordingly (an unexpected pass is exactly the signal that
    // pattern exists to produce); this now stands as a normal regression
    // guard against the placeholder behavior returning.
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

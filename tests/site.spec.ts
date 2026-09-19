import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const routes = [
  '/',
  '/fly-yoga-souplesse',
  '/sophrologie-neuroatypie',
  '/a-propos',
  '/reserver',
  '/mentions-legales',
] as const;

for (const route of routes) {
  test(`${route} répond, possède un titre principal et reste accessible`, async ({
    page,
  }) => {
    const response = await page.goto(route);

    expect(response?.status()).toBe(200);
    await expect(page.locator('main h1')).toHaveCount(1);
    await expect(page).toHaveTitle(/Gao Mata/);

    const results = await new AxeBuilder({ page })
      .disableRules(['frame-tested'])
      .analyze();
    const blockingViolations = results.violations.filter((violation) =>
      ['critical', 'serious'].includes(violation.impact ?? ''),
    );

    expect(blockingViolations).toEqual([]);
  });
}

test('le CTA principal mène au choix de réservation', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Trouver ma séance' }).click();

  await expect(page).toHaveURL(/\/reserver$/);
  await expect(
    page.getByRole('heading', { name: 'Que souhaites-tu explorer ?' }),
  ).toBeVisible();
});

test('le menu mobile est utilisable au clavier et se ferme avec Échap', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const toggle = page.locator('[data-menu-toggle]');

  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(
    page.locator('#mobile-menu').getByRole('link', { name: /Sophrologie/ }),
  ).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});

for (const viewport of [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 900 },
]) {
  test(`la page d’accueil ne déborde pas en ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');

    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));

    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  });
}

test('Aurarios reste déchargé avant le consentement puis reçoit son URL', async ({
  page,
}) => {
  await page.goto('/reserver');
  const iframe = page.locator('[data-switcher-iframe]');

  await expect(iframe).not.toHaveAttribute('src', /aurarios/);
  await page.getByRole('button', { name: /Cours collectifs/ }).click();
  await expect(iframe).toHaveAttribute(
    'src',
    'https://www.aurarios.fr/embed/gao-mata',
  );
});

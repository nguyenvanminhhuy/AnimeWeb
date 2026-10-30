import assert from 'node:assert/strict';
import { logoutFromMenu } from './helpers/account-menu.mjs';

export async function verifyAccountMenu(browser, baseURL) {
  const context = await browser.newContext();
  const errors = [];
  await context.route('**/*', (route) => {
    assert.equal(new URL(route.request().url()).origin, baseURL);
    return route.continue();
  });
  try {
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`${baseURL}/profile`);
    await page
      .getByRole('heading', { name: 'Đăng nhập để xem trang cá nhân', exact: true })
      .waitFor();
    await page.locator('main').getByRole('link', { name: 'Đăng nhập', exact: true }).click();
    assert.equal(new URL(page.url()).searchParams.get('returnTo'), '/profile');
    await page.getByRole('button', { name: 'Dùng tài khoản có lịch sử mẫu', exact: true }).click();
    await page.getByRole('link', { name: 'Tiếp tục về trang đã yêu cầu', exact: true }).click();
    await page.getByRole('heading', { name: 'Trang cá nhân', exact: true }).waitFor();
    assert.ok(
      await page
        .getByRole('heading', { name: 'Tài khoản có lịch sử mẫu', exact: true })
        .isVisible(),
    );
    const trigger = page.getByRole('button', { name: /^Tài khoản của / });
    const panel = page.getByRole('navigation', { name: 'Tài khoản', exact: true });
    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await trigger.focus();
      await page.keyboard.press('Enter');
      await panel.waitFor();
      assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
      assert.equal(
        await panel.getByRole('link', { name: 'Dashboard quản trị', exact: true }).count(),
        0,
      );
      assert.equal(
        await panel
          .getByRole('link', { name: 'Trang cá nhân', exact: true })
          .evaluate((e) => document.activeElement === e),
        true,
      );
      const box = await panel.boundingBox();
      assert.ok(box.x >= 0 && box.x + box.width <= width);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({
        path: `../Anime-Web/FE/test-results/account-menu-${width}.png`,
        fullPage: true,
      });
      await page.keyboard.press('Escape');
      assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
      assert.equal(await trigger.evaluate((e) => document.activeElement === e), true);
    }
    await trigger.click();
    await page.locator('h1').click();
    assert.equal(await panel.count(), 0);
    await trigger.click();
    await panel.getByRole('link', { name: 'Thư viện của tôi', exact: true }).click();
    await page.locator('.aw-library').waitFor();
    await page.waitForFunction(() => {
      const collection = document.querySelector('.aw-library-collection');
      return (
        collection?.getAttribute('aria-busy') === 'false' &&
        collection.dataset.query === new URLSearchParams(location.search).toString()
      );
    });
    assert.equal(await panel.count(), 0);
    await trigger.click();
    await panel.getByRole('link', { name: 'Trang cá nhân', exact: true }).click();
    await page.getByRole('heading', { name: 'Trang cá nhân', exact: true }).waitFor();
    await page.reload();
    await page.getByRole('heading', { name: 'Trang cá nhân', exact: true }).waitFor();
    await logoutFromMenu(page);
    await page
      .getByRole('heading', { name: 'Đăng nhập để xem trang cá nhân', exact: true })
      .waitFor();
    assert.equal(await trigger.count(), 0);
    assert.equal(
      await page.getByRole('heading', { name: 'Tài khoản có lịch sử mẫu', exact: true }).count(),
      0,
    );
    assert.deepEqual(errors, []);
    console.log(
      'PASS Account menu/Profile: guest guard/returnTo, initials and responsive dropdown, keyboard/focus/Escape/outside close, profile/library navigation, member has no admin link, reload and logout isolation.',
    );
  } finally {
    await context.close();
  }
}

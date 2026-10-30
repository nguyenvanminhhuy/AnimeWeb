import { logoutFromMenu } from './helpers/account-menu.mjs';
import assert from 'node:assert/strict';

export async function verifyAdminDashboard(browser, baseURL) {
  const context = await browser.newContext();
  const errors = [];
  const external = [];
  const writes = [];
  await context.route('**/*', (route) => {
    const request = route.request();
    if (new URL(request.url()).origin !== baseURL) {
      external.push(request.url());
      return route.abort();
    }
    if (request.method() !== 'GET') writes.push(request.url());
    return route.continue();
  });
  try {
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    const ready = () => page.locator('[data-admin-dashboard="ready"]').waitFor();
    const enterPreview = async (waitReady = true) => {
      await page.getByRole('button', { name: 'Dùng phiên quản trị mẫu', exact: true }).click();
      await page.getByRole('link', { name: 'Tiếp tục về trang đã yêu cầu', exact: true }).click();
      if (waitReady) await ready();
    };
    const openScenario = async (path) => {
      // Reload intentionally clears the in-memory preview, so opt in again.
      await page.goto(baseURL + path);
      await page.getByRole('heading', { name: 'Đăng nhập để mở trang quản trị' }).waitFor();
      await page.getByRole('link', { name: 'Đăng nhập', exact: true }).click();
      await enterPreview(false);
    };
    await page.goto(`${baseURL}/admin`);
    await page.getByRole('heading', { name: 'Đăng nhập để mở trang quản trị' }).waitFor();
    assert.equal(await page.locator('[data-admin-dashboard]').count(), 0);
    await page.getByRole('link', { name: 'Đăng nhập', exact: true }).click();
    assert.equal(new URL(page.url()).searchParams.get('returnTo'), '/admin');
    await page.getByRole('button', { name: 'Dùng tài khoản mới', exact: true }).click();
    await page.getByRole('link', { name: 'Tiếp tục về trang đã yêu cầu', exact: true }).click();
    await page.getByRole('heading', { name: 'Bạn chưa có quyền quản trị' }).waitFor();
    assert.equal(await page.locator('[data-admin-dashboard]').count(), 0);
    await page.getByRole('button', { name: 'Đổi phiên đăng nhập', exact: true }).click();
    await enterPreview();
    assert.equal(await page.locator('[data-metric="anime"]').textContent(), '24');
    const episodes = Number(await page.locator('[data-metric="episodes"]').textContent());
    assert.equal(episodes, 155);
    assert.equal(await page.locator('[data-metric="upcoming"]').textContent(), '3');
    assert.equal(
      Number(await page.locator('[data-metric="missing-video"]').textContent()),
      episodes,
    );
    assert.equal(await page.locator('tbody tr').count(), 6);
    assert.equal(
      await page
        .locator('progress')
        .evaluateAll((items) => items.reduce((sum, item) => sum + item.value, 0)),
      24,
    );
    assert.equal(await page.getByRole('navigation', { name: 'Điều hướng chính' }).count(), 0);
    assert.equal(
      await page.getByRole('navigation', { name: 'Điều hướng quản trị' }).locator('a').count(),
      1,
    );
    assert.equal(await page.evaluate(() => localStorage.getItem('aw:session:v1')), null);
    await page.evaluate(() => {
      window.__adminSpa = 'same';
    });

    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `overflow ${width}`,
      );
      if (width <= 1000) {
        const open = page.getByRole('button', { name: 'Mở menu', exact: true });
        assert.equal(
          await page.getByRole('navigation', { name: 'Điều hướng quản trị' }).isVisible(),
          false,
        );
        await open.click();
        await page.getByRole('navigation', { name: 'Điều hướng quản trị' }).waitFor();
        assert.equal(
          await page
            .getByRole('link', { name: 'Dashboard', exact: true })
            .evaluate((link) => document.activeElement === link),
          true,
        );
        await page.keyboard.press('Escape');
        assert.equal(await open.getAttribute('aria-expanded'), 'false');
        assert.equal(await open.evaluate((element) => document.activeElement === element), true);
      }
      await page.screenshot({
        path: `../Anime-Web/FE/test-results/admin-dashboard-${width}.png`,
        fullPage: true,
      });
    }
    assert.equal(
      await page.getByRole('link', { name: 'Dashboard', exact: true }).getAttribute('aria-current'),
      'page',
    );
    await page.getByRole('button', { name: 'Làm mới', exact: true }).click();
    await page.getByRole('status', { name: 'Đang tải Dashboard' }).waitFor();
    await ready();
    await openScenario('/admin?mock=error');
    await page.getByRole('heading', { name: 'Chưa tải được Dashboard' }).waitFor();
    await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
    await ready();
    assert.equal(new URL(page.url()).searchParams.has('mock'), false);
    await openScenario('/admin?mock=empty');
    await page.getByRole('heading', { name: 'Chưa có dữ liệu tổng quan' }).waitFor();
    await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
    await ready();
    await openScenario('/admin/not-implemented');
    await page.getByRole('heading', { name: 'Không tìm thấy trang quản trị' }).waitFor();
    await page.getByRole('link', { name: 'Về Dashboard', exact: true }).click();
    await ready();
    await page.evaluate(() => {
      window.__adminSpa = 'same';
    });
    const detail = page
      .getByRole('region', { name: 'Bảng phim gần đây' })
      .locator('tbody a')
      .first();
    const href = await detail.getAttribute('href');
    await detail.click();
    await page.waitForURL('**' + href);
    await page.locator('.aw-detail').waitFor();
    await page.goBack();
    await ready();
    assert.equal(await page.evaluate(() => window.__adminSpa), 'same');
    // The preview does not masquerade as a member session on public login.
    await page.getByRole('link', { name: 'Trang xem phim', exact: true }).click();
    await page.locator('.aw-hero h1').waitFor();
    await page.getByRole('button', { name: /^Tài khoản của / }).click();
    await page
      .getByRole('navigation', { name: 'Tài khoản', exact: true })
      .getByRole('link', { name: 'Đổi tài khoản', exact: true })
      .click();
    await page.locator('form.aw-auth-form').waitFor();
    await page.getByRole('button', { name: 'Dùng tài khoản mới', exact: true }).click();
    await page.getByRole('link', { name: 'Tiếp tục về trang đã yêu cầu', exact: true }).click();
    await page.goto(`${baseURL}/admin`);
    await page.getByRole('heading', { name: 'Bạn chưa có quyền quản trị' }).waitFor();
    await page.getByRole('button', { name: 'Đổi phiên đăng nhập', exact: true }).click();
    await enterPreview();
    await page.reload();
    await page.getByRole('heading', { name: 'Đăng nhập để mở trang quản trị' }).waitFor();
    assert.equal(await page.locator('[data-admin-dashboard]').count(), 0);

    // Persisted client claims do not turn an existing member into an admin.
    await page.evaluate(() =>
      localStorage.setItem(
        'aw:session:v1',
        JSON.stringify({
          version: 1,
          user: 'viewer',
          permissions: ['admin:dashboard:read'],
          adminPreview: true,
        }),
      ),
    );
    await page.reload();
    await page.getByRole('heading', { name: 'Bạn chưa có quyền quản trị' }).waitFor();
    await page.getByRole('button', { name: 'Đổi phiên đăng nhập', exact: true }).click();
    await enterPreview();
    await openScenario('/admin?mock=loading');
    await page.getByRole('status', { name: 'Đang tải Dashboard' }).waitFor();
    await logoutFromMenu(page);
    await page.getByRole('heading', { name: 'Chào mừng đến Anime Web', exact: true }).waitFor();
    assert.equal(await page.locator('[data-admin-dashboard]').count(), 0);
    await page.goBack();
    assert.equal(await page.locator('[data-admin-dashboard]').count(), 0);
    await openScenario('/admin');
    await ready();
    await page.getByRole('button', { name: 'Làm mới', exact: true }).click();
    await page.getByRole('status', { name: 'Đang tải Dashboard' }).waitFor();
    await logoutFromMenu(page);
    await page.getByRole('heading', { name: 'Chào mừng đến Anime Web', exact: true }).waitFor();
    await page.waitForTimeout(350);
    assert.equal(await page.locator('[data-admin-dashboard]').count(), 0);
    assert.deepEqual(errors, []);
    assert.deepEqual(external, []);
    assert.deepEqual(writes, []);
    console.log(
      'PASS Admin Dashboard: guest/member denied, explicit read-only preview, computed metrics, refresh/error/empty/loading, 375/768/1440 and menu focus/Escape, route history/detail links, reload clears preview, forged claims ignored, logout clears data; no external/mutation requests or page errors.',
    );
  } finally {
    await context.close();
  }
}

export async function verifyAdminProduction(browser, baseURL) {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.goto(`${baseURL}/admin`);
    await page.getByRole('heading', { name: 'Đăng nhập để mở trang quản trị' }).waitFor();
    await page.getByRole('link', { name: 'Đăng nhập', exact: true }).click();
    assert.equal(
      await page.getByRole('button', { name: 'Dùng phiên quản trị mẫu', exact: true }).count(),
      0,
    );
    await page.getByRole('button', { name: 'Dùng tài khoản mới', exact: true }).click();
    await page.getByRole('link', { name: 'Tiếp tục về trang đã yêu cầu', exact: true }).click();
    await page.getByRole('heading', { name: 'Bạn chưa có quyền quản trị' }).waitFor();
    assert.equal(await page.locator('[data-admin-dashboard]').count(), 0);
    console.log(
      'PASS production Admin: guest/member denied, no preview activation button, no private overview.',
    );
  } finally {
    await context.close();
  }
}

import { verifyAdminPagination } from './helpers/admin-pagination.mjs';
import assert from 'node:assert/strict';
import { logoutFromMenu } from './helpers/account-menu.mjs';

export async function verifyAdminUsers(browser, baseURL) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
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
    page.setDefaultTimeout(10000);
    page.on('pageerror', (error) => errors.push(error.message));
    const ready = () =>
      page.waitForFunction(() => {
        const element = document.querySelector('[data-admin-users]');
        const params = new URLSearchParams(location.search);
        params.delete('mock');
        params.delete('userId');
        return (
          element?.dataset.adminUsers === 'ready' && element.dataset.query === params.toString()
        );
      });
    const profileReady = () => page.locator('[data-user-profile="ready"]').waitFor();
    const search = page.getByLabel('Tìm kiếm người dùng', { exact: true });
    const enter = async (path, writable = false) => {
      await page.goto(baseURL + path);
      await page.getByRole('heading', { name: 'Đăng nhập để mở trang quản trị' }).waitFor();
      await page.getByRole('link', { name: 'Đăng nhập', exact: true }).click();
      assert.equal(new URL(page.url()).searchParams.get('returnTo'), path);
      await page
        .getByRole('button', {
          name: writable ? 'Dùng phiên quản trị có quyền chỉnh sửa' : 'Dùng phiên quản trị mẫu',
          exact: true,
        })
        .click();
      await page.getByRole('link', { name: 'Tiếp tục về trang đã yêu cầu', exact: true }).click();
    };
    await page.goto(baseURL + '/admin/users');
    await page.getByRole('heading', { name: 'Đăng nhập để mở trang quản trị' }).waitFor();
    assert.equal(await page.locator('tbody tr').count(), 0);
    await page.getByRole('link', { name: 'Đăng nhập', exact: true }).click();
    await page.getByRole('button', { name: 'Dùng tài khoản có lịch sử mẫu', exact: true }).click();
    await page.getByRole('link', { name: 'Tiếp tục về trang đã yêu cầu', exact: true }).click();
    await page.getByRole('heading', { name: 'Bạn chưa có quyền quản trị' }).waitFor();
    await page.getByRole('button', { name: 'Đổi phiên đăng nhập', exact: true }).click();
    await page.getByRole('button', { name: 'Dùng phiên quản trị mẫu', exact: true }).click();
    await page.getByRole('link', { name: 'Tiếp tục về trang đã yêu cầu', exact: true }).click();
    await ready();
    const storageBefore = await page.evaluate(() =>
      JSON.stringify(Object.entries(localStorage).sort()),
    );
    assert.equal(await page.locator('tbody tr').count(), 10);
    assert.equal(await page.locator('[data-user-metric="total"]').innerText(), '24');
    assert.equal(await page.locator('[data-user-metric="active"]').innerText(), '18');
    assert.equal(await page.locator('[data-user-metric="blocked"]').innerText(), '6');
    assert.equal(
      await page.locator('tbody tr').first().getAttribute('data-user-id'),
      'admin-user-024',
    );
    assert.equal(
      await page
        .getByRole('button', {
          name: /Thêm người dùng|Khoá tài khoản|Mở khoá|Xoá|Cấp quyền|Đặt lại mật khẩu/,
        })
        .count(),
      0,
    );
    const documents = [];
    page.on('request', (request) => {
      if (request.isNavigationRequest() && request.frame() === page.mainFrame())
        documents.push(request.url());
    });
    const firstIds = await page
      .locator('tbody tr')
      .evaluateAll((rows) => rows.map((row) => row.dataset.userId));
    await page
      .getByRole('navigation', { name: 'Phân trang người dùng', exact: true })
      .getByRole('link', { name: 'Trang 2', exact: true })
      .click();
    await ready();
    assert.ok(
      (
        await page.locator('tbody tr').evaluateAll((rows) => rows.map((row) => row.dataset.userId))
      ).every((id) => !firstIds.includes(id)),
    );
    await page.goBack();
    await ready();
    assert.deepEqual(
      await page.locator('tbody tr').evaluateAll((rows) => rows.map((row) => row.dataset.userId)),
      firstIds,
    );
    await page.goForward();
    await ready();
    await search.fill('minh an');
    await page.waitForURL((url) => url.searchParams.get('q') === 'minh an');
    await ready();
    assert.equal(await page.locator('tbody tr').count(), 1);
    assert.equal(new URL(page.url()).searchParams.get('page'), '1');
    await search.fill('khong-co-user');
    await search.press('Enter');
    await ready();
    await page.getByRole('heading', { name: 'Không có người dùng phù hợp' }).waitFor();
    await page.goBack();
    await ready();
    assert.equal(await search.inputValue(), 'minh an');
    await page.getByRole('link', { name: 'Đặt lại bộ lọc', exact: true }).click();
    await ready();
    await search.dispatchEvent('compositionstart');
    await search.fill('nhat minh');
    await page.waitForTimeout(450);
    assert.equal(new URL(page.url()).searchParams.has('q'), false);
    await search.dispatchEvent('compositionend');
    await page.waitForURL((url) => url.searchParams.get('q') === 'nhat minh');
    await ready();
    assert.equal(await page.locator('tbody tr').count(), 1);
    await page.getByRole('link', { name: 'Đặt lại bộ lọc', exact: true }).click();
    await ready();
    await page.getByLabel('Trạng thái', { exact: true }).selectOption('blocked');
    await ready();
    assert.equal(await page.locator('tbody tr').count(), 6);
    assert.ok(
      (await page.locator('tbody td:first-of-type').allTextContents()).every(
        (value) => value === 'Đã khoá',
      ),
    );
    await page.getByRole('link', { name: 'Đặt lại bộ lọc', exact: true }).click();
    await ready();
    await page.getByLabel('Sắp xếp', { exact: true }).selectOption('name');
    await ready();
    const names = await page.locator('tbody th p:first-child').allTextContents();
    assert.deepEqual(
      names,
      [...names].sort((a, b) => a.localeCompare(b, 'vi')),
    );
    await page.getByLabel('Mỗi trang', { exact: true }).selectOption('50');
    await ready();
    assert.equal(await page.locator('tbody tr').count(), 24);
    await verifyAdminPagination(page, 'Phân trang người dùng', 'Mỗi trang');
    assert.equal(
      await page.getByRole('navigation', { name: 'Phân trang người dùng', exact: true }).count(),
      1,
    );
    await page.getByLabel('Mỗi trang', { exact: true }).selectOption('10');
    await ready();
    const selected = page.locator('tbody tr').first();
    const selectedId = await selected.getAttribute('data-user-id');
    const selectedName = await selected.locator('th p').first().innerText();
    await selected.getByRole('link', { name: /^Xem hồ sơ / }).click();
    await profileReady();
    assert.equal(new URL(page.url()).searchParams.get('userId'), selectedId);
    const profile = page.getByRole('region', { name: 'Hồ sơ người dùng', exact: true });
    assert.equal(await profile.getByRole('heading', { level: 3 }).innerText(), selectedName);
    assert.equal(
      await page
        .locator('#user-profile-title')
        .evaluate((element) => document.activeElement === element),
      true,
    );
    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `overflow ${width}`,
      );
      await page.screenshot({
        path: `../Anime-Web/FE/test-results/admin-users-${width}.png`,
        fullPage: true,
      });
    }
    await page.getByRole('link', { name: 'Đóng hồ sơ người dùng', exact: true }).click();
    await profile.waitFor({ state: 'hidden' });
    assert.equal(await profile.count(), 0);
    assert.equal(
      await page
        .locator(`#user-profile-${selectedId}`)
        .evaluate((element) => document.activeElement === element),
      true,
    );
    await page.goBack();
    await profileReady();
    assert.equal(new URL(page.url()).searchParams.get('userId'), selectedId);
    assert.deepEqual(documents, [], 'search/filter/history/profile remain in SPA');
    await page.reload();
    await page.getByRole('heading', { name: 'Đăng nhập để mở trang quản trị' }).waitFor();
    assert.equal(await page.locator('[data-user-profile]').count(), 0);
    await enter('/admin/users?page=999&sort=invalid&status=invalid&pageSize=invalid', true);
    await ready();
    assert.equal(new URL(page.url()).searchParams.get('page'), '3');
    assert.equal(await page.getByLabel('Trạng thái', { exact: true }).inputValue(), '');
    assert.equal(
      await page
        .getByRole('button', { name: /Thêm người dùng|Khoá tài khoản|Mở khoá|Xoá|Cấp quyền/ })
        .count(),
      0,
    );
    await enter('/admin/users?userId=admin-user-001&mock=detail-error');
    await ready();
    await page.getByRole('button', { name: 'Thử lại hồ sơ', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Thử lại hồ sơ', exact: true }).click();
    await profileReady();
    assert.equal(new URL(page.url()).searchParams.get('userId'), 'admin-user-001');
    assert.equal(await profile.getByRole('heading', { level: 3 }).innerText(), 'Minh An');
    await enter('/admin/users?userId=missing-user');
    await ready();
    await page.getByRole('heading', { name: 'Không tìm thấy người dùng' }).waitFor();
    assert.equal(await profile.getByRole('heading', { name: 'Minh An', exact: true }).count(), 0);
    await enter('/admin/users?mock=error');
    await page.getByRole('heading', { name: 'Chưa tải được người dùng' }).waitFor();
    await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
    await ready();
    await enter('/admin/users?mock=empty');
    await ready();
    await page.getByRole('heading', { name: 'Không có người dùng phù hợp' }).waitFor();
    assert.equal(await page.locator('[data-user-metric="total"]').innerText(), '0');
    await enter('/admin/users?mock=forbidden');
    await page.getByRole('heading', { name: 'Bạn chưa có quyền xem người dùng' }).waitFor();
    assert.equal(await page.locator('tbody tr').count(), 0);
    await enter('/admin/users?userId=admin-user-001&mock=detail-loading');
    await ready();
    await page.getByRole('status', { name: 'Đang tải hồ sơ người dùng', exact: true }).waitFor();
    await logoutFromMenu(page);
    await page.getByRole('heading', { name: 'Chào mừng đến Anime Web', exact: true }).waitFor();
    assert.equal(await page.locator('[data-user-profile]').count(), 0);
    assert.equal(
      await page.evaluate(() => JSON.stringify(Object.entries(localStorage).sort())),
      storageBefore,
    );
    assert.deepEqual(errors, []);
    assert.deepEqual(external, []);
    assert.deepEqual(writes, []);
    console.log(
      'PASS Admin Users: guest/member/read guard, readonly across preview modes, 24/18/6 fixtures, debounce/IME/Enter/status/sort/pageSize, pagination/SPA/history, profile URL/focus/close/reload, query clamp, detail error/retry/not found/loading/logout, list error/retry/empty/forbidden, 375/768/1440 and no personal storage/HTTP writes.',
    );
  } finally {
    await context.close();
  }
}

export async function verifyAdminUsersProduction(browser, baseURL) {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.goto(baseURL + '/admin/users?userId=admin-user-001');
    await page.getByRole('heading', { name: 'Đăng nhập để mở trang quản trị' }).waitFor();
    await page.getByRole('link', { name: 'Đăng nhập', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: /^Dùng phiên quản trị/ }).count(), 0);
    await page.getByRole('button', { name: 'Dùng tài khoản có lịch sử mẫu', exact: true }).click();
    await page.getByRole('link', { name: 'Tiếp tục về trang đã yêu cầu', exact: true }).click();
    await page.getByRole('heading', { name: 'Bạn chưa có quyền quản trị' }).waitFor();
    assert.equal(await page.locator('tbody tr').count(), 0);
    assert.equal(await page.locator('[data-user-profile]').count(), 0);
    console.log(
      'PASS production Admin Users: guest/member denied, no preview activation, no user list/profile.',
    );
  } finally {
    await context.close();
  }
}

import { verifyAdminPagination } from './helpers/admin-pagination.mjs';
import assert from 'node:assert/strict';
import { logoutFromMenu } from './helpers/account-menu.mjs';

export async function verifyAdminAnime(browser, baseURL) {
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
    page.setDefaultTimeout(10000);
    page.on('pageerror', (error) => errors.push(error.message));
    const ready = () =>
      page.waitForFunction(() => {
        const results = document.querySelector('[data-admin-anime]');
        const params = new URLSearchParams(location.search);
        params.delete('mock');
        return (
          results?.getAttribute('aria-busy') === 'false' &&
          results.dataset.adminAnime === 'ready' &&
          results.dataset.query === params.toString()
        );
      });
    const openScenario = async (path, waitReady = true) => {
      await page.goto(baseURL + path);
      await page.getByRole('heading', { name: 'Đăng nhập để mở trang quản trị' }).waitFor();
      await page.getByRole('link', { name: 'Đăng nhập', exact: true }).click();
      assert.equal(new URL(page.url()).searchParams.get('returnTo'), path);
      await page.getByRole('button', { name: 'Dùng phiên quản trị mẫu', exact: true }).click();
      await page.getByRole('link', { name: 'Tiếp tục về trang đã yêu cầu', exact: true }).click();
      if (waitReady) await ready();
    };
    await page.goto(baseURL + '/admin/anime');
    await page.getByRole('heading', { name: 'Đăng nhập để mở trang quản trị' }).waitFor();
    assert.equal(await page.locator('tbody tr').count(), 0);
    await page.getByRole('link', { name: 'Đăng nhập', exact: true }).click();
    await page.getByRole('button', { name: 'Dùng tài khoản có lịch sử mẫu', exact: true }).click();
    await page.getByRole('link', { name: 'Tiếp tục về trang đã yêu cầu', exact: true }).click();
    await page.getByRole('heading', { name: 'Bạn chưa có quyền quản trị' }).waitFor();
    assert.equal(await page.locator('tbody tr').count(), 0);
    await page.getByRole('button', { name: 'Đổi phiên đăng nhập', exact: true }).click();
    await page.getByRole('button', { name: 'Dùng phiên quản trị mẫu', exact: true }).click();
    await page.getByRole('link', { name: 'Tiếp tục về trang đã yêu cầu', exact: true }).click();
    await ready();
    const storageBefore = await page.evaluate(() =>
      JSON.stringify(Object.entries(localStorage).filter(([key]) => key.startsWith('aw:account:'))),
    );
    assert.equal(await page.locator('tbody tr').count(), 12);
    await verifyAdminPagination(page, 'Phân trang phim quản trị', 'Mỗi trang');
    assert.match(await page.locator('#admin-anime-results + p').innerText(), /^24 phim/);
    assert.equal(await page.locator('[data-anime-id="anime-01"] td').nth(3).innerText(), '10');
    assert.equal(
      await page.getByRole('button', { name: /Thêm phim|Sửa phim|Xoá phim/ }).count(),
      0,
    );
    const rows = () =>
      page.locator('tbody tr').evaluateAll((items) => items.map((item) => item.dataset.animeId));
    const firstIds = await rows();
    const documents = [];
    page.on('request', (request) => {
      if (request.isNavigationRequest() && request.frame() === page.mainFrame())
        documents.push(request.url());
    });
    await page
      .getByRole('navigation', { name: 'Phân trang phim quản trị phía trên', exact: true })
      .getByRole('link', { name: 'Trang 2', exact: true })
      .click();
    await ready();
    assert.equal(new URL(page.url()).searchParams.get('page'), '2');
    assert.equal(await page.locator('tbody tr').count(), 12);
    assert.ok((await rows()).every((id) => !firstIds.includes(id)));
    await page.goBack();
    await ready();
    assert.deepEqual(await rows(), firstIds);
    await page.goForward();
    await ready();
    const search = page.getByLabel('Tìm kiếm phim', { exact: true });
    await search.fill('hanh trinh anh sao');
    await page.waitForURL((url) => url.searchParams.get('q') === 'hanh trinh anh sao');
    await ready();
    assert.equal(new URL(page.url()).searchParams.get('page'), '1');
    assert.equal(await page.locator('tbody tr').count(), 1);
    assert.deepEqual(await rows(), ['anime-01']);
    await search.fill('no-such-anime-xyz');
    await search.press('Enter');
    await ready();
    await page.getByRole('heading', { name: 'Không có phim phù hợp' }).waitFor();
    await page.goBack();
    await ready();
    assert.equal(await search.inputValue(), 'hanh trinh anh sao');
    await page.getByRole('link', { name: 'Đặt lại bộ lọc', exact: true }).click();
    await ready();
    await page.getByLabel('Trạng thái', { exact: true }).selectOption('upcoming');
    await ready();
    assert.equal(await page.locator('tbody tr').count(), 3);
    for (const value of await page.locator('tbody tr td:nth-child(5)').allTextContents())
      assert.equal(value, '0');
    await page.getByLabel('Thể loại', { exact: true }).selectOption('fantasy');
    await ready();
    assert.equal(new URL(page.url()).searchParams.get('status'), 'upcoming');
    await page.getByRole('link', { name: 'Đặt lại bộ lọc', exact: true }).click();
    await ready();
    await page.getByLabel('Định dạng', { exact: true }).selectOption('movie');
    await ready();
    assert.ok(
      (await page.locator('tbody tr td:nth-child(3)').allTextContents()).every((text) =>
        text.startsWith('Điện ảnh'),
      ),
    );
    await page.getByLabel('Năm phát hành', { exact: true }).selectOption('2025');
    await ready();
    assert.ok(
      (await page.locator('tbody tr td:nth-child(3)').allTextContents()).every((text) =>
        text.endsWith('2025'),
      ),
    );
    await page.getByRole('link', { name: 'Đặt lại bộ lọc', exact: true }).click();
    await ready();
    await page.getByLabel('Sắp xếp', { exact: true }).selectOption('title');
    await ready();
    const titles = await page.locator('tbody th a').allTextContents();
    assert.deepEqual(
      titles,
      [...titles].sort((a, b) => a.localeCompare(b, 'vi')),
    );
    await page.getByLabel('Mỗi trang', { exact: true }).selectOption('24');
    await ready();
    assert.equal(await page.locator('tbody tr').count(), 24);
    assert.equal(
      await page.getByRole('navigation', { name: 'Phân trang phim quản trị', exact: true }).count(),
      1,
    );
    assert.deepEqual(documents, [], 'filter, pagination and history remain SPA');
    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `overflow ${width}`,
      );
      const table = page.getByRole('region', { name: 'Bảng quản lý phim' });
      await table.focus();
      assert.equal(await table.evaluate((element) => document.activeElement === element), true);
      if (width <= 1000) {
        await page.getByRole('button', { name: 'Mở menu', exact: true }).click();
        await page.getByRole('navigation', { name: 'Điều hướng quản trị', exact: true }).waitFor();
        await page.keyboard.press('Escape');
      }
      await page.screenshot({
        path: `../Anime-Web/FE/test-results/admin-anime-${width}.png`,
        fullPage: true,
      });
    }
    const menu = page.getByRole('navigation', { name: 'Điều hướng quản trị', exact: true });
    assert.equal(
      await menu
        .getByRole('link', { name: 'Quản lý anime', exact: true })
        .getAttribute('aria-current'),
      'page',
    );
    assert.equal(
      await menu.getByRole('link', { name: 'Dashboard', exact: true }).getAttribute('aria-current'),
      null,
    );
    await page
      .getByRole('link', { name: /^Xem chi tiết / })
      .first()
      .click();
    await page.locator('.aw-detail').waitFor();
    await page.goBack();
    await ready();
    await page.reload();
    await page.getByRole('heading', { name: 'Đăng nhập để mở trang quản trị' }).waitFor();
    assert.equal(await page.locator('tbody tr').count(), 0);
    await openScenario('/admin/anime?page=999&sort=invalid&year=bad&status=bad&pageSize=bad');
    assert.equal(new URL(page.url()).searchParams.get('page'), '2');
    assert.equal(await page.getByLabel('Sắp xếp', { exact: true }).inputValue(), 'newest');
    assert.equal(await page.getByLabel('Trạng thái', { exact: true }).inputValue(), '');
    await openScenario('/admin/anime?mock=error', false);
    await page.getByRole('heading', { name: 'Chưa tải được danh sách phim' }).waitFor();
    await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
    await ready();
    assert.equal(new URL(page.url()).searchParams.has('mock'), false);
    await openScenario('/admin/anime?mock=empty');
    await page.getByRole('heading', { name: 'Không có phim phù hợp' }).waitFor();
    await openScenario('/admin/anime?mock=forbidden', false);
    await page.getByRole('heading', { name: 'Bạn chưa có quyền xem danh sách phim' }).waitFor();
    assert.equal(await page.locator('tbody tr').count(), 0);
    await openScenario('/admin/anime?mock=loading', false);
    await page.getByRole('status', { name: 'Đang tải danh sách phim' }).waitFor();
    await logoutFromMenu(page);
    await page.getByRole('heading', { name: 'Chào mừng đến Anime Web', exact: true }).waitFor();
    assert.equal(await page.locator('tbody tr').count(), 0);
    assert.equal(
      await page.evaluate(() =>
        JSON.stringify(
          Object.entries(localStorage).filter(([key]) => key.startsWith('aw:account:')),
        ),
      ),
      storageBefore,
    );
    assert.deepEqual(errors, []);
    assert.deepEqual(external, []);
    assert.deepEqual(writes, []);
    console.log(
      'PASS Admin Anime: guest/member guard, explicit read-only preview, 24 fixture rows and episode counts, debounce/Enter/filter/sort/pageSize, SPA Back/Forward/query clamp, 375/768/1440, detail links, reload/logout, loading/error/retry/empty/forbidden, no external requests or writes.',
    );
  } finally {
    await context.close();
  }
}

export async function verifyAdminAnimeProduction(browser, baseURL) {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.goto(baseURL + '/admin/anime');
    await page.getByRole('heading', { name: 'Đăng nhập để mở trang quản trị' }).waitFor();
    await page.getByRole('link', { name: 'Đăng nhập', exact: true }).click();
    assert.equal(
      await page.getByRole('button', { name: 'Dùng phiên quản trị mẫu', exact: true }).count(),
      0,
    );
    await page.getByRole('button', { name: 'Dùng tài khoản có lịch sử mẫu', exact: true }).click();
    await page.getByRole('link', { name: 'Tiếp tục về trang đã yêu cầu', exact: true }).click();
    await page.getByRole('heading', { name: 'Bạn chưa có quyền quản trị' }).waitFor();
    assert.equal(await page.locator('tbody tr').count(), 0);
    for (const path of ['/admin/anime/new', '/admin/anime/anime-01/edit']) {
      await page.goto(baseURL + path);
      await page.getByRole('heading', { name: 'Bạn chưa có quyền quản trị' }).waitFor();
      assert.equal(await page.locator('form').count(), 0);
      await page.getByRole('button', { name: 'Đổi phiên đăng nhập', exact: true }).click();
      assert.equal(
        await page
          .getByRole('button', { name: 'Dùng phiên quản trị có quyền chỉnh sửa', exact: true })
          .count(),
        0,
      );
      await page
        .getByRole('button', { name: 'Dùng tài khoản có lịch sử mẫu', exact: true })
        .click();
      await page.getByRole('link', { name: 'Tiếp tục về trang đã yêu cầu', exact: true }).click();
      await page.getByRole('heading', { name: 'Bạn chưa có quyền quản trị' }).waitFor();
    }
    console.log(
      'PASS production Admin Anime: guest/member denied on list/new/edit, no preview activation, no private rows.',
    );
  } finally {
    await context.close();
  }
}

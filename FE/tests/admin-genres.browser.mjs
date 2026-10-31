import { verifyAdminPagination } from './helpers/admin-pagination.mjs';
import assert from 'node:assert/strict';
import { logoutFromMenu } from './helpers/account-menu.mjs';

export async function verifyAdminGenres(browser, baseURL) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  const outside = [];
  const writes = [];
  await context.route('**/*', (route) => {
    const request = route.request();
    if (new URL(request.url()).origin !== baseURL) {
      outside.push(request.url());
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
        const element = document.querySelector('[data-admin-genres]');
        const params = new URLSearchParams(location.search);
        params.delete('mock');
        return (
          element?.dataset.adminGenres === 'ready' && element.dataset.query === params.toString()
        );
      });
    const animeReady = () => page.locator('[data-admin-anime="ready"]').waitFor();
    const search = page.getByLabel('Tìm kiếm thể loại', { exact: true });
    const name = page.getByLabel('Tên thể loại *', { exact: true });
    const slug = page.getByLabel('Slug *', { exact: true });
    const save = () => page.getByRole('button', { name: 'Lưu thể loại', exact: true }).click();
    const fill = async (label, value) => {
      await name.fill(label);
      await slug.fill(value);
    };
    const enter = async (path, writable = true) => {
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
    await page.goto(baseURL + '/admin/genres');
    await page.getByRole('heading', { name: 'Đăng nhập để mở trang quản trị' }).waitFor();
    await page.getByRole('link', { name: 'Đăng nhập', exact: true }).click();
    await page.getByRole('button', { name: 'Dùng tài khoản có lịch sử mẫu', exact: true }).click();
    await page.getByRole('link', { name: 'Tiếp tục về trang đã yêu cầu', exact: true }).click();
    await page.getByRole('heading', { name: 'Bạn chưa có quyền quản trị' }).waitFor();
    assert.equal(await page.locator('tbody tr').count(), 0);
    await page.getByRole('button', { name: 'Đổi phiên đăng nhập', exact: true }).click();
    await page.getByRole('button', { name: 'Dùng phiên quản trị mẫu', exact: true }).click();
    await page.getByRole('link', { name: 'Tiếp tục về trang đã yêu cầu', exact: true }).click();
    await ready();
    assert.equal(await page.locator('tbody tr').count(), 5);
    assert.equal(await page.getByRole('form').count(), 0);
    assert.equal(
      await page.getByRole('button', { name: /^Sửa |^Xoá |^Thêm thể loại$/ }).count(),
      0,
    );
    await search.fill('gia tuong');
    await page.waitForURL((url) => url.searchParams.get('q') === 'gia tuong');
    await ready();
    assert.equal(await page.locator('tbody tr').count(), 1);
    await page.locator('tbody').getByRole('link').click();
    await animeReady();
    assert.equal(new URL(page.url()).searchParams.get('genre'), 'fantasy');
    assert.ok((await page.locator('tbody tr').count()) > 0);
    await page.goBack();
    await ready();
    assert.equal(await search.inputValue(), 'gia tuong');

    await enter('/admin/genres');
    await ready();
    const storage = await page.evaluate(() => JSON.stringify(Object.entries(localStorage).sort()));
    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `overflow ${width}`,
      );
      if (width <= 1000) {
        const open = page.getByRole('button', { name: 'Mở menu', exact: true });
        await open.click();
        await page.getByRole('navigation', { name: 'Điều hướng quản trị', exact: true }).waitFor();
        await page.keyboard.press('Escape');
        assert.equal(await open.evaluate((element) => document.activeElement === element), true);
      }
      await page.screenshot({
        path: `../Anime-Web/FE/test-results/admin-genres-${width}.png`,
        fullPage: true,
      });
    }
    const documents = [];
    page.on('request', (request) => {
      if (request.isNavigationRequest() && request.frame() === page.mainFrame())
        documents.push(request.url());
    });
    await save();
    assert.equal(await name.getAttribute('aria-invalid'), 'true');
    assert.equal(await name.evaluate((element) => document.activeElement === element), true);
    await fill('gia tuong', 'new-genre');
    await save();
    await page.getByText('Tên thể loại này đã được sử dụng.', { exact: true }).waitFor();
    await fill('Khoa học viễn tưởng', 'adventure');
    await save();
    await page.getByText('Slug này đã được sử dụng.', { exact: true }).waitFor();
    assert.equal(await slug.evaluate((element) => document.activeElement === element), true);
    await slug.fill('sci-fi');
    await page.getByRole('form', { name: 'Thêm thể loại', exact: true }).evaluate((form) => {
      form.requestSubmit();
      form.requestSubmit();
    });
    await page.getByText('Đã thêm thể loại trong phiên mẫu.', { exact: true }).waitFor();
    await ready();
    const genreRow = page.locator('tbody tr').filter({ hasText: 'Khoa học viễn tưởng' });
    const genreId = await genreRow.getAttribute('data-genre-id');
    assert.ok(genreId.startsWith('genre-'));
    await verifyAdminPagination(page, 'Phân trang thể loại', 'Mỗi trang');
    await page
      .getByRole('navigation', { name: 'Phân trang thể loại', exact: true })
      .getByRole('link', { name: 'Trang 2', exact: true })
      .click();
    await ready();
    assert.equal(await page.locator('tbody tr').count(), 1);
    await page.goBack();
    await ready();
    await page.goForward();
    await ready();
    await page.getByLabel('Mỗi trang', { exact: true }).selectOption('10');
    await ready();
    assert.equal(await page.locator('tbody tr').count(), 6);
    assert.equal(new URL(page.url()).searchParams.get('page'), '1');
    await page.getByLabel('Sắp xếp', { exact: true }).selectOption('name-desc');
    await ready();
    const names = await page.locator('tbody th').allTextContents();
    assert.deepEqual(
      names,
      [...names].sort((a, b) => b.localeCompare(a, 'vi')),
    );
    await page.getByLabel('Sử dụng', { exact: true }).selectOption('unused');
    await ready();
    assert.equal(await page.locator('tbody tr').count(), 1);
    await page
      .locator(`[data-genre-id="${genreId}"]`)
      .getByRole('button', { name: /^Sửa / })
      .click();
    assert.equal(await name.evaluate((element) => document.activeElement === element), true);
    await fill('Khoa học kỳ ảo', 'science-fantasy');
    await save();
    await page.getByText('Đã lưu thay đổi thể loại trong phiên mẫu.', { exact: true }).waitFor();
    await ready();
    assert.match(await page.locator(`[data-genre-id="${genreId}"]`).innerText(), /Khoa học kỳ ảo/);
    assert.deepEqual(documents, [], 'CRUD/filter/history stay in SPA');

    await page.getByRole('link', { name: 'Quản lý anime', exact: true }).click();
    await animeReady();
    await page.getByRole('link', { name: 'Thêm phim', exact: true }).click();
    await page.getByLabel('Tên phim *', { exact: true }).fill('Phim thuộc thể loại mới');
    await page.getByLabel('Slug *', { exact: true }).fill('phim-thuoc-the-loai-moi');
    await page
      .getByLabel('Mô tả *', { exact: true })
      .fill('Phim mẫu dùng để kiểm tra liên kết thể loại.');
    await page.getByLabel('Khoa học kỳ ảo', { exact: true }).check();
    await page.getByRole('button', { name: 'Lưu phim', exact: true }).click();
    await animeReady();
    await page.getByRole('link', { name: 'Quản lý thể loại', exact: true }).click();
    await ready();
    const current = page.locator(`[data-genre-id="${genreId}"]`);
    assert.equal(await current.getByRole('link').innerText(), '1');
    await current.getByRole('button', { name: /^Xoá / }).click();
    const dialog = page.getByRole('dialog', { name: 'Xoá thể loại?', exact: true });
    await dialog.waitFor();
    assert.equal(
      await dialog
        .getByRole('button', { name: 'Huỷ', exact: true })
        .evaluate((element) => document.activeElement === element),
      true,
    );
    await page.keyboard.press('Escape');
    assert.equal(await dialog.count(), 0);
    assert.equal(
      await current
        .getByRole('button', { name: /^Xoá / })
        .evaluate((element) => document.activeElement === element),
      true,
    );
    await current.getByRole('button', { name: /^Xoá / }).click();
    await dialog.getByRole('button', { name: 'Xác nhận xoá', exact: true }).click();
    await dialog.getByRole('alert').waitFor();
    assert.match(await dialog.getByRole('alert').innerText(), /đang được phim sử dụng/);
    await dialog.getByRole('button', { name: 'Huỷ', exact: true }).click();
    await current.getByRole('button', { name: /^Sửa / }).click();
    await fill('Khoa học tương lai', 'future-fantasy');
    await save();
    await page.getByText('Đã lưu thay đổi thể loại trong phiên mẫu.', { exact: true }).waitFor();
    await ready();
    await current.getByRole('link').click();
    await animeReady();
    assert.equal(new URL(page.url()).searchParams.get('genre'), 'future-fantasy');
    const animeRow = page.locator('tbody tr').filter({ hasText: 'Phim thuộc thể loại mới' });
    assert.equal(await animeRow.count(), 1);
    assert.match(await animeRow.innerText(), /Khoa học tương lai/);
    await animeRow.getByRole('link', { name: /^Sửa / }).click();
    await page.getByLabel('Khoa học tương lai', { exact: true }).uncheck();
    await page.getByLabel('Giả tưởng', { exact: true }).check();
    await page.getByRole('button', { name: 'Lưu phim', exact: true }).click();
    await animeReady();
    await page.getByRole('link', { name: 'Quản lý thể loại', exact: true }).click();
    await ready();
    await current.getByRole('button', { name: /^Xoá / }).click();
    await dialog.getByRole('button', { name: 'Xác nhận xoá', exact: true }).click();
    await dialog.waitFor({ state: 'hidden' });
    await ready();
    assert.equal(await current.count(), 0);
    await page.getByRole('button', { name: 'Thêm thể loại', exact: true }).click();
    await fill('Thể loại bị huỷ', 'the-loai-bi-huy');
    await page
      .getByRole('form', { name: 'Thêm thể loại', exact: true })
      .evaluate((form) => form.requestSubmit());
    await page.getByRole('button', { name: 'Huỷ', exact: true }).click();
    await page.getByRole('button', { name: 'Làm mới', exact: true }).click();
    await ready();
    assert.equal(await page.locator('tbody tr').filter({ hasText: 'Thể loại bị huỷ' }).count(), 0);
    assert.equal(
      await page.evaluate(() => JSON.stringify(Object.entries(localStorage).sort())),
      storage,
    );
    await enter('/admin/genres?mock=save-error');
    await ready();
    await fill('Thể loại thử lại', 'the-loai-thu-lai');
    await save();
    await page.getByRole('form').getByRole('alert').waitFor();
    assert.equal(await name.inputValue(), 'Thể loại thử lại');
    await save();
    await page.getByText('Đã thêm thể loại trong phiên mẫu.', { exact: true }).waitFor();
    await ready();
    await enter('/admin/genres?mock=error');
    await page.getByRole('heading', { name: 'Chưa tải được thể loại' }).waitFor();
    await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
    await ready();
    await enter('/admin/genres?mock=empty');
    await ready();
    await page.getByRole('heading', { name: 'Không có thể loại phù hợp' }).waitFor();
    await enter('/admin/genres?mock=forbidden');
    await page.getByRole('heading', { name: 'Bạn chưa có quyền xem thể loại' }).waitFor();
    assert.equal(await page.getByRole('form').count(), 0);
    await enter('/admin/genres?mock=loading');
    await page.getByRole('status', { name: 'Đang tải danh sách thể loại' }).waitFor();
    await logoutFromMenu(page);
    await page.getByRole('heading', { name: 'Chào mừng đến Anime Web', exact: true }).waitFor();
    await page
      .getByRole('button', { name: 'Dùng phiên quản trị có quyền chỉnh sửa', exact: true })
      .click();
    await page.getByRole('link', { name: 'Tiếp tục về trang đã yêu cầu', exact: true }).click();
    await page.locator('[data-admin-dashboard="ready"]').waitFor();
    await page.getByRole('link', { name: 'Quản lý thể loại', exact: true }).click();
    await ready();
    assert.equal(await page.locator('tbody tr').count(), 5);
    await page.reload();
    await page.getByRole('heading', { name: 'Đăng nhập để mở trang quản trị' }).waitFor();
    assert.deepEqual(errors, []);
    assert.deepEqual(outside, []);
    assert.deepEqual(writes, []);
    console.log(
      'PASS Admin Genres: guest/member/read-only/write guards, five seeds, validation/duplicates/focus, CRUD, pagination/filter/sort/SPA/history, anime assignment/rename/usage/delete restriction, pending cancellation, error/retry/empty/forbidden/loading, session/reset and 375/768/1440.',
    );
  } finally {
    await context.close();
  }
}

export async function verifyAdminGenresProduction(browser, baseURL) {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.goto(baseURL + '/admin/genres');
    await page.getByRole('heading', { name: 'Đăng nhập để mở trang quản trị' }).waitFor();
    await page.getByRole('link', { name: 'Đăng nhập', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: /^Dùng phiên quản trị/ }).count(), 0);
    await page.getByRole('button', { name: 'Dùng tài khoản có lịch sử mẫu', exact: true }).click();
    await page.getByRole('link', { name: 'Tiếp tục về trang đã yêu cầu', exact: true }).click();
    await page.getByRole('heading', { name: 'Bạn chưa có quyền quản trị' }).waitFor();
    assert.equal(await page.locator('tbody tr').count(), 0);
    assert.equal(await page.getByRole('form').count(), 0);
    console.log(
      'PASS production Admin Genres: no preview activation, guest/member denied, no private list/editor.',
    );
  } finally {
    await context.close();
  }
}

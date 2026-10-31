import assert from 'node:assert/strict';
import { logoutFromMenu } from './helpers/account-menu.mjs';

export async function verifyAdminAnimeCrud(browser, baseURL) {
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
    const listReady = () => page.locator('[data-admin-anime="ready"]').waitFor();
    const title = () => page.getByLabel('Tên phim *', { exact: true });
    const slug = () => page.getByLabel('Slug *', { exact: true });
    const openSession = async (path, writable = true) => {
      await page.goto(baseURL + path);
      await page.getByRole('heading', { name: 'Đăng nhập để mở trang quản trị' }).waitFor();
      await page.getByRole('link', { name: 'Đăng nhập', exact: true }).click();
      await page
        .getByRole('button', {
          name: writable ? 'Dùng phiên quản trị có quyền chỉnh sửa' : 'Dùng phiên quản trị mẫu',
          exact: true,
        })
        .click();
      await page.getByRole('link', { name: 'Tiếp tục về trang đã yêu cầu', exact: true }).click();
    };
    const fill = async (name, path) => {
      await title().fill(name);
      await slug().fill(path);
      await page
        .getByLabel('Mô tả *', { exact: true })
        .fill('Mô tả phim kiểm thử trong phiên quản trị riêng.');
      await page.getByLabel('Năm phát hành *', { exact: true }).fill('2027');
      await page.getByLabel('Giả tưởng', { exact: true }).check();
    };
    const save = () => page.getByRole('button', { name: 'Lưu phim', exact: true }).click();
    await openSession('/admin/anime/new', false);
    await page.getByRole('heading', { name: 'Bạn chưa có quyền chỉnh sửa phim' }).waitFor();
    assert.equal(await page.locator('form').count(), 0);
    await page.getByRole('link', { name: 'Về danh sách phim', exact: true }).click();
    await listReady();
    assert.equal(await page.getByRole('link', { name: 'Thêm phim', exact: true }).count(), 0);
    assert.equal(await page.getByRole('button', { name: /^Xoá / }).count(), 0);
    await openSession('/admin/anime/new');
    const storageBefore = await page.evaluate(() =>
      JSON.stringify(Object.entries(localStorage).sort()),
    );
    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `form overflow ${width}`,
      );
      await page.screenshot({
        path: `../Anime-Web/FE/test-results/admin-anime-form-${width}.png`,
        fullPage: true,
      });
    }
    await save();
    assert.equal(await title().getAttribute('aria-invalid'), 'true');
    assert.equal(await title().evaluate((element) => document.activeElement === element), true);
    await fill('Phim kiểm thử quản trị', 'hanh-trinh-anh-sao');
    await save();
    await page.getByText('Slug này đã được sử dụng.', { exact: true }).waitFor();
    assert.equal(await slug().evaluate((element) => document.activeElement === element), true);
    assert.equal(await title().inputValue(), 'Phim kiểm thử quản trị');
    await slug().fill('phim-kiem-thu-quan-tri');
    // Two same-tick submissions must produce one item, not two.
    await page.locator('form[aria-label="Thêm thông tin phim"]').evaluate((form) => {
      form.requestSubmit();
      form.requestSubmit();
    });
    await listReady();
    await page.getByText('Đã thêm phim trong phiên mẫu.', { exact: true }).waitFor();
    const added = page.locator('tbody tr').filter({ hasText: 'Phim kiểm thử quản trị' });
    assert.equal(await added.count(), 1);
    assert.equal(await added.getByRole('link', { name: /^Xem chi tiết / }).count(), 0);
    const id = await added.getAttribute('data-anime-id');
    assert.ok(id.startsWith('admin-anime-'));
    assert.equal(await added.locator('td').nth(3).innerText(), '0');
    await page
      .getByRole('navigation', { name: 'Điều hướng quản trị' })
      .getByRole('link', { name: 'Dashboard', exact: true })
      .click();
    await page.locator('[data-admin-dashboard="ready"]').waitFor();
    assert.equal(await page.locator('[data-metric="anime"]').textContent(), '25');
    assert.equal(await page.locator('[data-metric="episodes"]').textContent(), '155');
    await page.getByRole('link', { name: 'Quản lý anime', exact: true }).click();
    await listReady();
    await added.getByRole('link', { name: 'Sửa Phim kiểm thử quản trị', exact: true }).click();
    await title().waitFor();
    assert.equal(await title().inputValue(), 'Phim kiểm thử quản trị');
    await title().fill('Phim đã chỉnh sửa');
    await page.getByLabel('Định dạng *', { exact: true }).selectOption('movie');
    await save();
    await listReady();
    const edited = page.locator(`[data-anime-id="${id}"]`);
    assert.match(await edited.innerText(), /Phim đã chỉnh sửa/);
    assert.match(await edited.innerText(), /Điện ảnh/);
    await edited.getByRole('button', { name: 'Xoá Phim đã chỉnh sửa', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Xoá phim?', exact: true });
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
      await edited
        .getByRole('button', { name: /^Xoá / })
        .evaluate((element) => document.activeElement === element),
      true,
    );
    await edited.getByRole('button', { name: /^Xoá / }).click();
    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      const box = await dialog.boundingBox();
      assert.ok(box.x >= 0 && box.x + box.width <= width, `dialog bounds ${width}`);
      await page.screenshot({
        path: `../Anime-Web/FE/test-results/admin-anime-delete-${width}.png`,
        fullPage: true,
      });
    }
    await dialog.getByRole('button', { name: 'Xác nhận xoá', exact: true }).click();
    await dialog.waitFor({ state: 'hidden' });
    await listReady();
    assert.equal(await edited.count(), 0);
    await page.getByText('Đã xoá phim khỏi phiên mẫu.', { exact: true }).waitFor();
    await page.locator('[data-anime-id="anime-01"]').getByRole('button', { name: /^Xoá / }).click();
    await dialog.getByRole('button', { name: 'Xác nhận xoá', exact: true }).click();
    await dialog.getByRole('alert').waitFor();
    assert.match(
      await dialog.getByRole('alert').innerText(),
      /Không thể xoá phim đã có tập công khai/,
    );
    await dialog.getByRole('button', { name: 'Huỷ', exact: true }).click();
    await page.locator('[data-anime-id="anime-01"]').getByRole('link', { name: /^Sửa / }).click();
    await title().waitFor();
    await title().fill('Tên chỉ đổi trong quản trị');
    await slug().fill('ten-chi-doi-trong-quan-tri');
    await save();
    await listReady();
    await page
      .locator('[data-anime-id="anime-01"]')
      .getByRole('link', { name: /^Xem chi tiết / })
      .click();
    await page.locator('.aw-detail').waitFor();
    assert.equal(new URL(page.url()).pathname, '/anime/hanh-trinh-anh-sao');
    assert.equal(await page.locator('h1').innerText(), 'Hành trình ánh sao');
    await page.goBack();
    await listReady();
    assert.match(
      await page.locator('[data-anime-id="anime-01"]').innerText(),
      /Tên chỉ đổi trong quản trị/,
    );
    assert.equal(
      await page.evaluate(() => JSON.stringify(Object.entries(localStorage).sort())),
      storageBefore,
    );

    // Cancel after submission; a pending create must not appear after unmount.
    await page.getByRole('link', { name: 'Thêm phim', exact: true }).click();
    await fill('Phim đã huỷ lưu', 'phim-da-huy-luu');
    await page
      .locator('form[aria-label="Thêm thông tin phim"]')
      .evaluate((form) => form.requestSubmit());
    await page.getByRole('link', { name: 'Huỷ', exact: true }).click();
    await listReady();
    assert.equal(await page.locator('tbody tr').filter({ hasText: 'Phim đã huỷ lưu' }).count(), 0);
    await openSession('/admin/anime/new?mock=save-error');
    await fill('Phim thử lại', 'phim-thu-lai');
    await save();
    await page.getByRole('alert').waitFor();
    assert.equal(await title().inputValue(), 'Phim thử lại');
    await save();
    await listReady();
    assert.equal(await page.locator('tbody tr').filter({ hasText: 'Phim thử lại' }).count(), 1);
    await openSession('/admin/anime?mock=delete-error');
    await listReady();
    const upcoming = page.locator('[data-anime-id="anime-08"]');
    await upcoming.getByRole('button', { name: /^Xoá / }).click();
    await dialog.getByRole('button', { name: 'Xác nhận xoá', exact: true }).click();
    await dialog.getByRole('alert').waitFor();
    await dialog.getByRole('button', { name: 'Xác nhận xoá', exact: true }).click();
    await dialog.waitFor({ state: 'hidden' });
    await listReady();
    assert.equal(await upcoming.count(), 0);
    await openSession('/admin/anime/missing-anime/edit');
    await page.getByRole('heading', { name: 'Không tìm thấy phim', exact: true }).waitFor();
    await openSession('/admin/anime/anime-01/edit?mock=error');
    await page.getByRole('heading', { name: 'Chưa tải được thông tin phim' }).waitFor();
    await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
    await title().waitFor();
    await title().fill('Bản nháp không được giữ');
    await save();
    await logoutFromMenu(page);
    await page.getByRole('heading', { name: 'Chào mừng đến Anime Web', exact: true }).waitFor();
    await page
      .getByRole('button', { name: 'Dùng phiên quản trị có quyền chỉnh sửa', exact: true })
      .click();
    await page.getByRole('link', { name: 'Tiếp tục về trang đã yêu cầu', exact: true }).click();
    await page.locator('[data-admin-dashboard="ready"]').waitFor();
    await page.getByRole('link', { name: 'Quản lý anime', exact: true }).click();
    await listReady();
    assert.match(
      await page.locator('[data-anime-id="anime-01"]').innerText(),
      /Hành trình ánh sao/,
    );
    assert.doesNotMatch(await page.locator('[data-anime-id="anime-01"]').innerText(), /Bản nháp/);
    await page.reload();
    await page.getByRole('heading', { name: 'Đăng nhập để mở trang quản trị' }).waitFor();
    assert.deepEqual(errors, []);
    assert.deepEqual(external, []);
    assert.deepEqual(writes, []);
    console.log(
      'PASS Admin Anime CRUD: read/write guards, field validation/focus, duplicate slug, create/update/delete, stable IDs/public isolation, double submit, cancel/Escape/focus, referenced delete refusal, errors/retry/not found, pending cancel/logout/session reset, Dashboard sync, 375/768/1440, no external/HTTP writes.',
    );
  } finally {
    await context.close();
  }
}

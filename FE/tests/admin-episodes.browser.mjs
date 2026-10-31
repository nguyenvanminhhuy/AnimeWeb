import { verifyAdminPagination } from './helpers/admin-pagination.mjs';
import assert from 'node:assert/strict';

export async function verifyAdminEpisodesRepository(browser, baseURL) {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.goto(baseURL + '/tests/fixtures/admin-episodes-repository.html');
    await page.waitForFunction(() => typeof window.verifyAdminEpisodesRepository === 'function');
    console.log(
      'PASS Admin Episodes repository: ' +
        (await page.evaluate(() => window.verifyAdminEpisodesRepository())),
    );
  } finally {
    await context.close();
  }
}

export async function verifyAdminEpisodes(browser, baseURL) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const errors = [],
    outside = [],
    writes = [];
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
    const ready = () => page.locator('[data-admin-episodes="ready"]').waitFor();
    const enter = async (writable) => {
      await page.goto(baseURL + '/admin/episodes');
      await page.getByRole('link', { name: 'Đăng nhập', exact: true }).click();
      await page
        .getByRole('button', {
          name: writable ? 'Dùng phiên quản trị có quyền chỉnh sửa' : 'Dùng phiên quản trị mẫu',
          exact: true,
        })
        .click();
      await page.getByRole('link', { name: 'Tiếp tục về trang đã yêu cầu', exact: true }).click();
      await ready();
    };
    await enter(false);
    await verifyAdminPagination(page, 'Phân trang tập phim', 'Số tập mỗi trang');
    assert.equal(await page.getByRole('link', { name: 'Thêm tập phim', exact: true }).count(), 0);
    await page.getByLabel('Phim', { exact: true }).selectOption('anime-01');
    assert.equal(await page.getByRole('button', { name: 'Thêm mùa/phần', exact: true }).count(), 0);
    // Reload clears the dev-only preview; activate a fresh writable session.
    await enter(true);
    await page.getByLabel('Phim', { exact: true }).selectOption('anime-01');
    await page.getByRole('button', { name: 'Thêm mùa/phần', exact: true }).click();
    await page.getByLabel('Tiêu đề *', { exact: true }).fill('Mùa thử nghiệm');
    await page.getByRole('button', { name: 'Lưu mùa/phần', exact: true }).click();
    await page.getByText('Đã lưu mùa/phần trong phiên mẫu.', { exact: true }).waitFor();
    await ready();
    await page.getByLabel('Mùa/phần', { exact: true }).selectOption({ label: 'Mùa thử nghiệm' });
    const seasonId = new URL(page.url()).searchParams.get('seasonId');
    await page.getByRole('button', { name: 'Sửa mùa Mùa thử nghiệm', exact: true }).click();
    await page.getByLabel('Tiêu đề *', { exact: true }).fill('Mùa đã sửa');
    await page.getByRole('button', { name: 'Lưu mùa/phần', exact: true }).click();
    await page.getByRole('form', { name: 'Thông tin mùa/phần' }).waitFor({ state: 'hidden' });
    await ready();
    await page.getByRole('link', { name: 'Thêm tập phim', exact: true }).click();
    await page.getByRole('form', { name: 'Thông tin tập phim' }).waitFor();
    assert.equal(await page.getByLabel('Mùa/phần *', { exact: true }).inputValue(), seasonId);
    await page.getByRole('button', { name: 'Lưu tập phim', exact: true }).click();
    assert.equal(
      await page.getByLabel('Tiêu đề *', { exact: true }).getAttribute('aria-invalid'),
      'true',
    );
    await page.getByLabel('Tiêu đề *', { exact: true }).fill('Tập thử nghiệm');
    await page.getByRole('button', { name: 'Lưu tập phim', exact: true }).click();
    await page.getByRole('heading', { name: 'Đã lưu tập phim trong phiên mẫu.' }).waitFor();
    await page.getByRole('link', { name: 'Về danh sách tập phim', exact: true }).click();
    await ready();
    assert.equal(await page.locator('tbody tr').count(), 1);
    await page.getByRole('button', { name: 'Xoá mùa Mùa đã sửa', exact: true }).click();
    await page.getByRole('button', { name: 'Xác nhận xoá', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Mùa còn tập phim' }).waitFor();
    await page.keyboard.press('Escape');
    await page.getByRole('link', { name: 'Sửa tập Tập thử nghiệm', exact: true }).click();
    await page.getByLabel('Tiêu đề *', { exact: true }).fill('Tập đã sửa');
    await page.getByRole('button', { name: 'Lưu tập phim', exact: true }).click();
    await page.getByRole('link', { name: 'Về danh sách tập phim', exact: true }).click();
    await ready();
    await page.getByRole('button', { name: 'Xoá tập Tập đã sửa', exact: true }).click();
    assert.equal(
      await page
        .getByRole('button', { name: 'Huỷ', exact: true })
        .evaluate((e) => e === document.activeElement),
      true,
    );
    await page.getByRole('button', { name: 'Xác nhận xoá', exact: true }).click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await ready();
    assert.equal(await page.locator('tbody tr').count(), 0);
    await page.getByRole('button', { name: 'Xoá mùa Mùa đã sửa', exact: true }).click();
    await page.getByRole('button', { name: 'Xác nhận xoá', exact: true }).click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await ready();
    await page.getByLabel('Phim', { exact: true }).selectOption('');
    await page.waitForURL((url) => !url.searchParams.has('animeId'));
    await page.locator('tbody tr').first().waitFor();
    assert.equal(await page.locator('tbody tr').count(), 10);
    await page.getByLabel('Tìm tập phim', { exact: true }).fill('khong co tap abc');
    await page.waitForURL((url) => url.searchParams.get('q') === 'khong co tap abc');
    await page.getByRole('heading', { name: 'Chưa có tập phim phù hợp', exact: true }).waitFor();
    assert.equal(await page.locator('tbody tr').count(), 0);
    await page.goBack();
    await page.locator('tbody tr').first().waitFor();
    assert.equal(await page.getByLabel('Tìm tập phim', { exact: true }).inputValue(), '');
    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        'Page overflow ' + width,
      );
      await page.screenshot({
        path: `../Anime-Web/FE/test-results/admin-episodes-${width}.png`,
        fullPage: true,
      });
    }
    await page.reload();
    await page.getByRole('heading', { name: 'Đăng nhập để mở trang quản trị' }).waitFor();
    assert.deepEqual(errors, []);
    assert.deepEqual(outside, []);
    assert.deepEqual(writes, []);
    console.log(
      'PASS Admin Episodes UI: explicit read/write preview, season and episode CRUD, inline validation, delete guard/dialog focus, debounce/history, 375/768/1440, reload reset, no external or mutation HTTP requests.',
    );
  } finally {
    await context.close();
  }
}

export async function verifyAdminEpisodesProduction(browser, baseURL) {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    for (const path of [
      '/admin/episodes',
      '/admin/episodes/new',
      '/admin/episodes/episode-01-01/edit',
    ]) {
      await page.goto(baseURL + path);
      await page.getByRole('heading', { name: 'Đăng nhập để mở trang quản trị' }).waitFor();
      assert.equal(await page.locator('[data-admin-episodes],form').count(), 0);
    }
    console.log(
      'PASS Admin Episodes production: list/new/edit denied without trusted permissions.',
    );
  } finally {
    await context.close();
  }
}

export async function verifyAdminEpisodeStates(browser, baseURL) {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    const enter = async (path, writable = true) => {
      await page.goto(baseURL + path);
      await page.getByRole('link', { name: 'Đăng nhập', exact: true }).click();
      await page
        .getByRole('button', {
          name: writable ? 'Dùng phiên quản trị có quyền chỉnh sửa' : 'Dùng phiên quản trị mẫu',
          exact: true,
        })
        .click();
      await page.getByRole('link', { name: 'Tiếp tục về trang đã yêu cầu', exact: true }).click();
    };
    await enter('/admin/episodes?mock=error');
    await page.getByRole('heading', { name: 'Chưa tải được mùa và tập' }).waitFor();
    await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
    await page.locator('[data-admin-episodes="ready"]').waitFor();
    await enter('/admin/episodes/new', false);
    await page.getByRole('heading', { name: 'Bạn chưa có quyền chỉnh sửa tập phim' }).waitFor();
    await enter('/admin/episodes/not-found/edit');
    await page.getByRole('heading', { name: 'Không tìm thấy tập phim' }).waitFor();
    await enter('/admin/episodes/new?mock=save-error');
    await page.getByLabel('Phim *', { exact: true }).selectOption('anime-01');
    const season = await page
      .getByLabel('Mùa/phần *', { exact: true })
      .locator('option')
      .nth(1)
      .getAttribute('value');
    await page.getByLabel('Mùa/phần *', { exact: true }).selectOption(season);
    await page.getByLabel('Tiêu đề *', { exact: true }).fill('Published test');
    await page.getByLabel('Số tập *', { exact: true }).fill('999');
    await page.getByLabel('Thứ tự hiển thị *', { exact: true }).fill('999');
    await page.getByLabel('Trạng thái *', { exact: true }).selectOption('published');
    await page.getByRole('button', { name: 'Lưu tập phim', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Xác nhận công bố' }).waitFor();
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Lưu tập phim', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Không thể lưu thay đổi mẫu' }).waitFor();
    assert.equal(
      await page.getByLabel('Tiêu đề *', { exact: true }).inputValue(),
      'Published test',
    );
    await page.getByRole('button', { name: 'Lưu tập phim', exact: true }).click();
    await page.getByRole('heading', { name: 'Đã lưu tập phim trong phiên mẫu.' }).waitFor();
    await page.getByRole('link', { name: 'Về danh sách tập phim', exact: true }).click();
    await page.locator('[data-admin-episodes="ready"]').waitFor();
    await page.getByLabel('Tìm tập phim', { exact: true }).fill('Published test');
    await page.getByRole('button', { name: 'Xoá tập Published test', exact: true }).click();
    await page.getByRole('button', { name: 'Xác nhận xoá', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Không thể xoá tập đã công bố' }).waitFor();
    console.log(
      'PASS Admin Episode states: load error/retry, direct read-only form guard, not found, publication confirmation, save error preserves values/retry and published deletion refusal.',
    );
  } finally {
    await context.close();
  }
}

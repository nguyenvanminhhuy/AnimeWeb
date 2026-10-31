import { verifyAdminPagination } from './helpers/admin-pagination.mjs';
import assert from 'node:assert/strict';

export async function verifyAdminPlaybackRepository(browser, baseURL) {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.goto(baseURL + '/tests/fixtures/admin-playback-repository.html');
    await page.waitForFunction(() => typeof window.verifyAdminPlaybackRepository === 'function');
    console.log(
      'PASS Admin Playback repository: ' +
        (await page.evaluate(() => window.verifyAdminPlaybackRepository())),
    );
  } finally {
    await context.close();
  }
}

export async function verifyAdminPlayback(browser, baseURL) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const errors = [],
    outside = [],
    writes = [],
    media = [];
  await context.route('**/*', (route) => {
    const r = route.request();
    if (new URL(r.url()).origin !== baseURL) {
      outside.push(r.url());
      return route.abort();
    }
    if (r.method() !== 'GET') writes.push(r.url());
    if (new URL(r.url()).pathname.startsWith('/media/')) {
      media.push(r.url());
      return route.abort();
    }
    return route.continue();
  });
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    page.on('pageerror', (e) => errors.push(e.message));
    const ready = () => page.locator('[data-admin-playback="ready"]').waitFor();
    async function enter(writable, path = '/admin/playback') {
      await page.goto(baseURL + path);
      await page.getByRole('link', { name: 'Đăng nhập', exact: true }).click();
      await page
        .getByRole('button', {
          name: writable ? 'Dùng phiên quản trị có quyền chỉnh sửa' : 'Dùng phiên quản trị mẫu',
          exact: true,
        })
        .click();
      await page.getByRole('link', { name: 'Tiếp tục về trang đã yêu cầu', exact: true }).click();
      await ready();
    }
    async function selectEpisode() {
      await page.getByLabel('Phim', { exact: true }).selectOption('anime-01');
      const season = await page
        .getByLabel('Mùa/phần', { exact: true })
        .locator('option')
        .nth(1)
        .getAttribute('value');
      await page.getByLabel('Mùa/phần', { exact: true }).selectOption(season);
      const episode = await page
        .getByLabel('Tập phim', { exact: true })
        .locator('option')
        .nth(1)
        .getAttribute('value');
      await page.getByLabel('Tập phim', { exact: true }).selectOption(episode);
      await page.getByRole('heading', { name: 'Chưa có nguồn phát', exact: true }).waitFor();
      return episode;
    }
    async function source(label, url) {
      await page.getByRole('button', { name: 'Thêm nguồn phát', exact: true }).click();
      await page.getByLabel('Nhãn *', { exact: true }).fill(label);
      await page.getByLabel('Địa chỉ tài nguyên *', { exact: true }).fill(url);
    }
    async function save(noun) {
      await page.getByRole('button', { name: 'Lưu ' + noun, exact: true }).click();
      await page
        .getByRole('form', { name: 'Thông tin ' + noun, exact: true })
        .waitFor({ state: 'hidden' });
      await ready();
    }
    await enter(false);
    const id = await selectEpisode();
    assert.equal(
      await page.getByRole('button', { name: 'Thêm nguồn phát', exact: true }).count(),
      0,
    );
    await enter(true, '/admin/playback?episodeId=' + id);
    await page.getByRole('heading', { name: 'Chưa có nguồn phát', exact: true }).waitFor();
    assert.equal(await page.getByLabel('Phim', { exact: true }).inputValue(), 'anime-01');
    await source('Nguồn chính', 'javascript:alert(1)');
    await page.getByRole('button', { name: 'Lưu nguồn phát', exact: true }).click();
    assert.equal(
      await page.getByLabel('Địa chỉ tài nguyên *', { exact: true }).getAttribute('aria-invalid'),
      'true',
    );
    await page.getByLabel('Địa chỉ tài nguyên *', { exact: true }).fill('/media/test.mp4');
    await save('nguồn phát');
    await page.getByRole('button', { name: 'Sửa nguồn Nguồn chính', exact: true }).click();
    await page.getByLabel('Bật nguồn phát', { exact: true }).check();
    await page.getByRole('button', { name: 'Lưu nguồn phát', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Xác nhận thay đổi trạng thái' }).waitFor();
    await page.getByLabel('Xác nhận bật nguồn trong phiên mẫu.', { exact: true }).check();
    await save('nguồn phát');
    await page.getByRole('link', { name: 'Phụ đề của Nguồn chính', exact: true }).click();
    await page.getByRole('button', { name: 'Thêm phụ đề', exact: true }).click();
    await page.getByLabel('Nhãn *', { exact: true }).fill('Tiếng Việt');
    await page.getByLabel('Địa chỉ tài nguyên *', { exact: true }).fill('/media/vi.vtt');
    await page.getByLabel('Đặt làm phụ đề mặc định', { exact: true }).check();
    await save('phụ đề');
    await page.getByRole('button', { name: 'Thêm phụ đề', exact: true }).click();
    await page.getByLabel('Nhãn *', { exact: true }).fill('English');
    await page.getByLabel('Ngôn ngữ *', { exact: true }).fill('en');
    await page.getByLabel('Địa chỉ tài nguyên *', { exact: true }).fill('/media/en.vtt');
    await page.getByLabel('Đặt làm phụ đề mặc định', { exact: true }).check();
    await save('phụ đề');
    assert.equal(
      await page.locator('[data-subtitle-id]').filter({ hasText: 'Mặc định' }).count(),
      1,
    );
    await page.getByRole('button', { name: 'Xoá nguồn Nguồn chính', exact: true }).click();
    assert.ok(
      await page
        .getByRole('button', { name: 'Huỷ', exact: true })
        .evaluate((e) => e === document.activeElement),
    );
    await page.getByRole('button', { name: 'Xác nhận xoá', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Nguồn còn phụ đề' }).waitFor();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Sửa phụ đề English', exact: true }).click();
    await page.getByLabel('Nhãn *', { exact: true }).fill('English edited');
    await save('phụ đề');
    await source('Nguồn dự phòng', '/media/backup.mp4');
    await save('nguồn phát');
    await page.getByLabel('Tìm nguồn phát', { exact: true }).fill('du phong');
    await page.waitForURL((u) => u.searchParams.get('q') === 'du phong');
    await page
      .getByRole('button', { name: 'Sửa nguồn Nguồn chính', exact: true })
      .waitFor({ state: 'hidden' });
    assert.equal(await page.locator('tbody tr').count(), 1);
    await page.goBack();
    await page.getByRole('button', { name: 'Sửa nguồn Nguồn chính', exact: true }).waitFor();
    assert.equal(await page.getByLabel('Tìm nguồn phát', { exact: true }).inputValue(), '');
    for (let index = 1; index <= 4; index++) {
      await source(`Extra ${index}`, `/media/extra-${index}.mp4`);
      await save('nguồn phát');
    }
    await page
      .getByRole('navigation', { name: 'Phân trang nguồn phát', exact: true })
      .getByRole('link', { name: 'Trang 2', exact: true })
      .click();
    await page.getByRole('button', { name: 'Sửa nguồn Extra 4', exact: true }).waitFor();
    assert.equal(await page.locator('tbody tr').count(), 1);
    await page.getByLabel('Số nguồn mỗi trang', { exact: true }).selectOption('20');
    await page.getByRole('button', { name: 'Sửa nguồn Nguồn chính', exact: true }).waitFor();
    assert.equal(await page.locator('tbody tr').count(), 6);
    await verifyAdminPagination(page, 'Phân trang nguồn phát', 'Số nguồn mỗi trang');
    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        'Overflow ' + width,
      );
      await page.screenshot({
        path: `../Anime-Web/FE/test-results/admin-playback-${width}.png`,
        fullPage: true,
      });
    }
    for (const name of ['Tiếng Việt', 'English edited']) {
      await page.getByRole('button', { name: 'Xoá phụ đề ' + name, exact: true }).click();
      await page.getByRole('button', { name: 'Xác nhận xoá', exact: true }).click();
      await page.getByRole('dialog').waitFor({ state: 'hidden' });
      await ready();
    }
    for (const name of [
      'Nguồn chính',
      'Nguồn dự phòng',
      'Extra 1',
      'Extra 2',
      'Extra 3',
      'Extra 4',
    ]) {
      await page.getByRole('button', { name: 'Xoá nguồn ' + name, exact: true }).click();
      await page.getByRole('button', { name: 'Xác nhận xoá', exact: true }).click();
      await page.getByRole('dialog').waitFor({ state: 'hidden' });
      await ready();
    }
    await page.getByRole('heading', { name: 'Chưa có nguồn phát', exact: true }).waitFor();
    await page.reload();
    await page.getByRole('heading', { name: 'Đăng nhập để mở trang quản trị' }).waitFor();
    assert.deepEqual(errors, []);
    assert.deepEqual(outside, []);
    assert.deepEqual(writes, []);
    assert.deepEqual(media, []);
    console.log(
      'PASS Admin Playback UI: read/write preview, deep episode link, source/subtitle CRUD, default track, enable confirmation, validation/deletion guard/dialog focus, debounce/history/pagination/page size, 375/768/1440, reload reset, no media fetch/external/HTTP writes.',
    );
  } finally {
    await context.close();
  }
}

export async function verifyAdminPlaybackProduction(browser, baseURL) {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.goto(baseURL + '/admin/playback?episodeId=episode-01-01');
    await page.getByRole('heading', { name: 'Đăng nhập để mở trang quản trị' }).waitFor();
    assert.equal(await page.locator('[data-admin-playback],form').count(), 0);
    console.log('PASS Admin Playback production: guarded direct route.');
  } finally {
    await context.close();
  }
}

export async function verifyAdminPlaybackStates(browser, baseURL) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    const enter = async (path) => {
      await page.goto(baseURL + path);
      await page.getByRole('link', { name: 'Đăng nhập', exact: true }).click();
      await page
        .getByRole('button', { name: 'Dùng phiên quản trị có quyền chỉnh sửa', exact: true })
        .click();
      await page.getByRole('link', { name: 'Tiếp tục về trang đã yêu cầu', exact: true }).click();
    };
    await enter('/admin/playback?mock=error');
    await page.getByRole('heading', { name: 'Chưa tải được cấu hình phát', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
    await page.locator('[data-admin-playback="ready"]').waitFor();
    await enter('/admin/playback?episodeId=missing');
    await page
      .getByRole('heading', { name: 'Không tìm thấy tập phim đã chọn', exact: true })
      .waitFor();
    const fill = async () => {
      await page.getByRole('button', { name: 'Thêm nguồn phát', exact: true }).click();
      await page.getByLabel('Nhãn *', { exact: true }).fill('Retry source');
      await page.getByLabel('Địa chỉ tài nguyên *', { exact: true }).fill('/media/retry.mp4');
    };
    await enter('/admin/playback?episodeId=episode-01-01&mock=save-error');
    await fill();
    await page.getByRole('button', { name: 'Lưu nguồn phát', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Không thể lưu thay đổi mẫu' }).waitFor();
    assert.equal(await page.getByLabel('Nhãn *', { exact: true }).inputValue(), 'Retry source');
    await page.getByRole('button', { name: 'Lưu nguồn phát', exact: true }).click();
    await page
      .getByRole('form', { name: 'Thông tin nguồn phát', exact: true })
      .waitFor({ state: 'hidden' });
    await page.locator('[data-source-id]').waitFor();
    await enter('/admin/playback?episodeId=episode-01-01&mock=delete-error');
    await fill();
    await page.getByRole('button', { name: 'Lưu nguồn phát', exact: true }).click();
    await page
      .getByRole('form', { name: 'Thông tin nguồn phát', exact: true })
      .waitFor({ state: 'hidden' });
    await page.getByRole('button', { name: 'Xoá nguồn Retry source', exact: true }).click();
    await page.getByRole('button', { name: 'Xác nhận xoá', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Không thể lưu thay đổi mẫu' }).waitFor();
    await page.getByRole('button', { name: 'Xác nhận xoá', exact: true }).click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await page.getByRole('heading', { name: 'Chưa có nguồn phát', exact: true }).waitFor();
    console.log(
      'PASS Admin Playback states: load error/retry, missing episode, save error retains draft/retry, delete error/retry.',
    );
  } finally {
    await context.close();
  }
}

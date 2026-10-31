import { verifyAdminPagination } from './helpers/admin-pagination.mjs';
import assert from 'node:assert/strict';

export async function verifyAdminCommentsRepository(browser, baseURL) {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.goto(baseURL + '/tests/fixtures/admin-comments-repository.html');
    await page.waitForFunction(() => typeof window.verifyAdminCommentsRepository === 'function');
    console.log(
      'PASS Admin Comments repository: ' +
        (await page.evaluate(() => window.verifyAdminCommentsRepository())),
    );
  } finally {
    await context.close();
  }
}

export async function verifyAdminComments(browser, baseURL) {
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
  await context.addInitScript(() =>
    localStorage.setItem('aw:comments:v1:viewer', JSON.stringify({ version: 1, comments: [] })),
  );
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    page.on('pageerror', (error) => errors.push(error.message));
    const ready = () => page.locator('[data-admin-comments="ready"]').waitFor();
    const panel = () => page.locator('[data-comment-detail]');
    async function enter(writable, path = '/admin/comments') {
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
    await enter(false);
    assert.equal(await page.locator('[data-comment-count="total"]').textContent(), '24');
    assert.equal(await page.locator('tbody tr').count(), 10);
    await verifyAdminPagination(page, 'Phân trang bình luận quản trị', 'Số dòng mỗi trang');
    const first = page.locator('tbody').getByRole('link').first();
    await first.click();
    await panel().waitFor();
    assert.equal(
      await page.getByRole('button', { name: /^Ẩn bình luận$|^Hiện lại bình luận$/ }).count(),
      0,
    );
    await page.getByRole('link', { name: 'Đóng', exact: true }).click();
    await panel().waitFor({ state: 'hidden' });
    await page.waitForFunction(() =>
      document.activeElement?.getAttribute('aria-label')?.startsWith('Xem bình luận'),
    );
    await enter(true, '/admin/comments?commentId=comment-fixture-01');
    await panel().waitFor();
    const body = await panel().locator('p').first().textContent();
    await page.getByRole('button', { name: 'Ẩn bình luận', exact: true }).click();
    const dialog = page.getByRole('dialog');
    assert.ok(
      await dialog
        .getByRole('button', { name: 'Huỷ', exact: true })
        .evaluate((e) => e === document.activeElement),
    );
    await dialog.getByRole('button', { name: 'Xác nhận ẩn', exact: true }).click();
    assert.equal(
      await page.getByLabel('Lý do kiểm duyệt *', { exact: true }).getAttribute('aria-invalid'),
      'true',
    );
    await page.getByLabel('Lý do kiểm duyệt *', { exact: true }).fill('Kiểm tra <b>nội dung</b>');
    await dialog.getByRole('button', { name: 'Xác nhận ẩn', exact: true }).click();
    await dialog.waitFor({ state: 'hidden' });
    await ready();
    await page.getByRole('button', { name: 'Hiện lại bình luận', exact: true }).waitFor();
    assert.equal(await page.locator('[data-comment-count="hidden"]').textContent(), '7');
    assert.equal(await panel().locator('b').count(), 0);
    assert.ok((await panel().textContent()).includes('Kiểm tra <b>nội dung</b>'));
    assert.equal(await panel().locator('p').first().textContent(), body);
    await page.getByRole('button', { name: 'Hiện lại bình luận', exact: true }).click();
    await page.getByLabel('Lý do kiểm duyệt *', { exact: true }).fill('Đã xem xét nội dung');
    await dialog.getByRole('button', { name: 'Xác nhận hiện lại', exact: true }).click();
    await dialog.waitFor({ state: 'hidden' });
    await ready();
    await page.getByRole('button', { name: 'Ẩn bình luận', exact: true }).waitFor();
    assert.equal(await page.locator('[data-comment-count="hidden"]').textContent(), '6');
    await page.getByRole('button', { name: 'Ẩn bình luận', exact: true }).click();
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden' });
    assert.ok(
      await page
        .getByRole('button', { name: 'Ẩn bình luận', exact: true })
        .evaluate((e) => e === document.activeElement),
    );
    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        'Overflow ' + width,
      );
      await page.screenshot({
        path: `../Anime-Web/FE/test-results/admin-comments-${width}.png`,
        fullPage: true,
      });
    }
    await page.getByLabel('Trạng thái', { exact: true }).selectOption('deleted');
    await panel().waitFor({ state: 'hidden' });
    await page.waitForFunction(() => document.querySelectorAll('tbody tr').length === 6);
    await page.locator('tbody').getByRole('link').first().click();
    await panel().waitFor();
    assert.ok((await panel().textContent()).includes('Nội dung không còn được cung cấp'));
    assert.equal(
      await page.getByRole('button', { name: /^Ẩn bình luận$|^Hiện lại bình luận$/ }).count(),
      0,
    );
    await page.getByLabel('Trạng thái', { exact: true }).selectOption('');
    await page.waitForFunction(() => document.querySelectorAll('tbody tr').length === 10);
    await page.getByLabel('Số dòng mỗi trang', { exact: true }).selectOption('20');
    await page.waitForFunction(() => document.querySelectorAll('tbody tr').length === 20);
    await page
      .getByRole('navigation', { name: 'Phân trang bình luận quản trị', exact: true })
      .getByRole('link', { name: 'Trang 2', exact: true })
      .click();
    await page.waitForFunction(() => document.querySelectorAll('tbody tr').length === 4);
    await page.getByLabel('Tìm bình luận', { exact: true }).fill('ban doc 20');
    await page.waitForURL((url) => url.searchParams.get('q') === 'ban doc 20');
    await page.waitForFunction(() => document.querySelectorAll('tbody tr').length === 1);
    assert.equal(new URL(page.url()).searchParams.has('page'), false);
    await page.goBack();
    await page.waitForFunction(() => document.querySelectorAll('tbody tr').length === 4);
    assert.equal(await page.getByLabel('Tìm bình luận', { exact: true }).inputValue(), '');
    assert.equal(
      await page.evaluate(() => localStorage.getItem('aw:comments:v1:viewer')),
      JSON.stringify({ version: 1, comments: [] }),
    );
    await page.reload();
    await page.getByRole('heading', { name: 'Đăng nhập để mở trang quản trị' }).waitFor();
    assert.deepEqual(errors, []);
    assert.deepEqual(outside, []);
    assert.deepEqual(writes, []);
    console.log(
      'PASS Admin Comments UI: explicit read/moderate preview, summary/filter/pagination/history, detail/focus, reason validation and hide/restore, escaped reason text, deleted content/actions withheld, 375/768/1440, localStorage isolation and reload reset; no external/HTTP writes/page errors.',
    );
  } finally {
    await context.close();
  }
}

export async function verifyAdminCommentsStates(browser, baseURL) {
  const context = await browser.newContext();
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
    await enter('/admin/comments?mock=error');
    await page.getByRole('heading', { name: 'Chưa tải được bình luận', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
    await page.locator('[data-admin-comments="ready"]').waitFor();
    await enter('/admin/comments?commentId=missing');
    await page.getByRole('heading', { name: 'Không tìm thấy bình luận', exact: true }).waitFor();
    await enter('/admin/comments?mock=empty');
    await page.getByRole('heading', { name: 'Không có bình luận phù hợp', exact: true }).waitFor();
    await enter('/admin/comments?commentId=comment-fixture-01&mock=moderation-error');
    await page.getByRole('button', { name: 'Ẩn bình luận', exact: true }).click();
    await page.getByLabel('Lý do kiểm duyệt *', { exact: true }).fill('Lý do thử lại');
    await page.getByRole('button', { name: 'Xác nhận ẩn', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Không thể lưu thay đổi mẫu' }).waitFor();
    assert.equal(
      await page.getByLabel('Lý do kiểm duyệt *', { exact: true }).inputValue(),
      'Lý do thử lại',
    );
    await page.getByRole('button', { name: 'Xác nhận ẩn', exact: true }).click();
    await page.getByRole('button', { name: 'Hiện lại bình luận', exact: true }).waitFor();
    console.log(
      'PASS Admin Comments states: load error/retry, detail not found, empty, moderation error retains reason/retry.',
    );
  } finally {
    await context.close();
  }
}

export async function verifyAdminCommentsProduction(browser, baseURL) {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.goto(baseURL + '/admin/comments?commentId=comment-fixture-01');
    await page.getByRole('heading', { name: 'Đăng nhập để mở trang quản trị' }).waitFor();
    assert.equal(await page.locator('[data-admin-comments],tbody').count(), 0);
    console.log('PASS Admin Comments production: direct list/detail guarded.');
  } finally {
    await context.close();
  }
}

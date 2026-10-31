import assert from 'node:assert/strict';
import { logoutFromMenu } from './helpers/account-menu.mjs';

const oldPassword = 'FakeOldDemo-123';
const newPassword = 'FakeNewDemo-456';
async function fill(page, current = oldPassword, next = newPassword, confirmation = next) {
  await page.getByLabel('Mật khẩu hiện tại', { exact: true }).fill(current);
  await page.getByLabel('Mật khẩu mới', { exact: true }).fill(next);
  await page.getByLabel('Nhập lại mật khẩu mới', { exact: true }).fill(confirmation);
}
async function enter(page, baseURL, path = '/profile/change-password') {
  await page.goto(baseURL + path);
  await page.locator('main').getByRole('link', { name: 'Đăng nhập', exact: true }).click();
  assert.equal(new URL(page.url()).searchParams.get('returnTo'), path);
  await page.getByRole('button', { name: 'Dùng tài khoản có lịch sử mẫu', exact: true }).click();
  await page.getByRole('link', { name: 'Tiếp tục về trang đã yêu cầu', exact: true }).click();
  await page.getByRole('form', { name: 'Đổi mật khẩu', exact: true }).waitFor();
}

export async function verifyChangePasswordRepository(browser, baseURL) {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.goto(baseURL + '/tests/fixtures/change-password.html');
    await page.waitForFunction(() => typeof window.verifyPasswordPreview === 'function');
    console.log(
      'PASS Change Password preview/validation: ' +
        (await page.evaluate(() => window.verifyPasswordPreview())),
    );
  } finally {
    await context.close();
  }
}

export async function verifyChangePassword(browser, baseURL) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const errors = [],
    outside = [],
    writes = [],
    messages = [];
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
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (msg) => messages.push(msg.text()));
    await enter(page, baseURL, '/profile/change-password?mock=error');
    const snapshot = () =>
      page.evaluate(() =>
        JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }),
      );
    const before = await snapshot();
    await page.evaluate(async () => {
      const { authRepository } = await import('/src/lib/api/repositories.ts');
      const original = authRepository.previewPasswordChange;
      window.passwordBoundary = [];
      authRepository.previewPasswordChange = (...args) => {
        window.passwordBoundary.push({ id: args[0], state: args[1], count: args.length });
        return original(...args);
      };
    });
    const submit = () => page.getByRole('button', { name: 'Đổi mật khẩu', exact: true }).click();
    await submit();
    assert.ok(
      await page
        .getByLabel('Mật khẩu hiện tại', { exact: true })
        .evaluate((e) => e === document.activeElement),
    );
    await fill(page, oldPassword, oldPassword);
    await submit();
    assert.equal(
      await page.getByLabel('Mật khẩu mới', { exact: true }).getAttribute('aria-invalid'),
      'true',
    );
    await fill(page, oldPassword, newPassword, 'mismatch');
    await submit();
    assert.equal(
      await page.getByLabel('Nhập lại mật khẩu mới', { exact: true }).getAttribute('aria-invalid'),
      'true',
    );
    await fill(page);
    await page.getByRole('button', { name: 'Hiện mật khẩu hiện tại', exact: true }).click();
    assert.equal(
      await page.getByLabel('Mật khẩu hiện tại', { exact: true }).getAttribute('type'),
      'text',
    );
    await page.getByRole('button', { name: 'Ẩn mật khẩu hiện tại', exact: true }).click();
    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        'Overflow ' + width,
      );
      await page.screenshot({
        path: `../Anime-Web/FE/test-results/change-password-${width}.png`,
        fullPage: true,
      });
    }
    await submit();
    await page.getByRole('alert').filter({ hasText: 'Thao tác demo tạm thời thất bại' }).waitFor();
    assert.equal(await page.getByLabel('Mật khẩu mới', { exact: true }).inputValue(), newPassword);
    assert.equal(new URL(page.url()).searchParams.has('mock'), false);
    await submit();
    await page.getByRole('heading', { name: 'Biểu mẫu đã hợp lệ', exact: true }).waitFor();
    assert.equal(await page.locator('input[type="password"]').count(), 0);
    assert.ok((await page.locator('main').textContent()).includes('Mật khẩu chưa được thay đổi'));
    assert.equal(await snapshot(), before);
    const boundary = await page.evaluate(() => window.passwordBoundary);
    assert.equal(boundary.length, 2);
    assert.ok(boundary.every((call) => call.id === 'viewer' && call.count === 3));
    assert.ok(!JSON.stringify(boundary).includes(newPassword));
    await page.getByRole('button', { name: 'Thử lại biểu mẫu', exact: true }).click();
    assert.equal(await page.getByLabel('Mật khẩu hiện tại', { exact: true }).inputValue(), '');
    assert.ok(
      await page
        .getByLabel('Mật khẩu hiện tại', { exact: true })
        .evaluate((e) => e === document.activeElement),
    );
    await fill(page);
    await page.getByRole('link', { name: 'Huỷ', exact: true }).click();
    await page.getByRole('heading', { name: 'Trang cá nhân', exact: true }).waitFor();
    await page.locator('main').getByRole('link', { name: 'Đổi mật khẩu', exact: true }).click();
    assert.equal(await page.getByLabel('Mật khẩu mới', { exact: true }).inputValue(), '');
    await page.getByRole('button', { name: /^Tài khoản của / }).click();
    await page
      .getByRole('navigation', { name: 'Tài khoản', exact: true })
      .getByRole('link', { name: 'Đổi mật khẩu', exact: true })
      .click();
    await page.getByRole('form', { name: 'Đổi mật khẩu', exact: true }).waitFor();
    await page.goto(baseURL + '/profile/change-password?mock=loading');
    await fill(page);
    await submit();
    await page.getByRole('status').filter({ hasText: 'Đang mô phỏng xử lý' }).waitFor();
    await page.getByRole('link', { name: 'Huỷ', exact: true }).click();
    await page.getByRole('heading', { name: 'Trang cá nhân', exact: true }).waitFor();
    await page.waitForTimeout(1600);
    assert.equal(
      await page.getByRole('heading', { name: 'Biểu mẫu đã hợp lệ', exact: true }).count(),
      0,
    );
    await page.goto(baseURL + '/profile/change-password?mock=loading');
    await fill(page);
    await submit();
    await page.getByRole('status').filter({ hasText: 'Đang mô phỏng xử lý' }).waitFor();
    await logoutFromMenu(page);
    await page.getByRole('heading', { name: 'Đăng nhập để đổi mật khẩu', exact: true }).waitFor();
    await page.waitForTimeout(1600);
    assert.equal(await page.getByRole('form', { name: 'Đổi mật khẩu', exact: true }).count(), 0);
    const storage = await snapshot();
    for (const value of [oldPassword, newPassword]) {
      assert.ok(!storage.includes(value));
      assert.ok(!page.url().includes(value));
      assert.ok(!messages.join(' ').includes(value));
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(outside, []);
    assert.deepEqual(writes, []);
    console.log(
      'PASS Change Password UI: guest returnTo/member guard, profile/avatar entry, field validation/focus/toggles, 375/768/1440, error/retry, explicit preview-only result and cleared fields, secret-free repository/storage/URL/logs, cancel/logout abort and no HTTP writes.',
    );
  } finally {
    await context.close();
  }
}

export async function verifyChangePasswordProduction(browser, baseURL) {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await enter(page, baseURL, '/profile/change-password?mock=error');
    await fill(page);
    await page.getByRole('button', { name: 'Đổi mật khẩu', exact: true }).click();
    await page.getByRole('heading', { name: 'Biểu mẫu đã hợp lệ', exact: true }).waitFor();
    assert.ok((await page.locator('main').textContent()).includes('Mật khẩu chưa được thay đổi'));
    console.log(
      'PASS Change Password production: guest/member guard, dev mock ignored and preview-only result.',
    );
  } finally {
    await context.close();
  }
}

import assert from 'node:assert/strict';

export async function verifyAdminUserRoles(browser, baseURL) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  await context.route('**/*', (route) =>
    new URL(route.request().url()).origin === baseURL ? route.continue() : route.abort(),
  );
  try {
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(baseURL + '/admin/users');
    await page.getByRole('link', { name: 'Đăng nhập', exact: true }).click();
    await page
      .getByRole('button', { name: 'Dùng phiên quản trị có quyền chỉnh sửa', exact: true })
      .click();
    await page.getByRole('link', { name: 'Tiếp tục về trang đã yêu cầu', exact: true }).click();
    const ready = () => page.locator('[data-admin-users="ready"]').waitFor();
    await ready();
    const row = page.locator('tbody tr').first();
    const id = await row.getAttribute('data-user-id');
    await row.getByRole('link', { name: /Xem hồ sơ/ }).click();
    await page.locator('[data-user-profile="ready"]').waitFor();
    const originalURL = page.url();
    const open = () => row.getByRole('button', { name: /Đổi vai trò/ }).click();
    const dialog = page.getByRole('dialog');
    const confirm = dialog.getByRole('button', { name: 'Xác nhận đổi vai trò', exact: true });
    await open();
    assert.equal(await confirm.isDisabled(), true);
    assert.equal(
      await dialog
        .getByRole('button', { name: 'Huỷ', exact: true })
        .evaluate((el) => el === document.activeElement),
      true,
    );
    await dialog.getByLabel('Vai trò mới', { exact: true }).selectOption('manage');
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden' });
    assert.match(await row.locator('td').nth(1).innerText(), /Người dùng/);
    await open();
    await dialog.getByLabel('Vai trò mới', { exact: true }).selectOption('manage');
    await confirm.click();
    await dialog.waitFor({ state: 'hidden' });
    await ready();
    await page.locator('[data-user-profile="ready"]').waitFor();
    assert.match(await row.locator('td').nth(1).innerText(), /Quản lý/);
    assert.match(await page.locator('[data-user-profile="ready"]').innerText(), /Quản lý/);
    assert.equal(page.url(), originalURL);
    assert.equal(await row.getAttribute('data-user-id'), id);
    // Simulate a concurrent server update at the repository boundary; stale confirmation must require reload.
    await page.evaluate(async () => {
      const { mockAdminUserRepository: repository } =
        await import('/src/lib/api/mock/mock-admin-user-repository.ts');
      const { ApiError } = await import('/src/lib/api/backend/error.ts');
      const original = repository.setRole;
      repository.setRole = async (...args) => {
        repository.setRole = original;
        throw new ApiError(409, 'CONFLICT', 'Fixture concurrent update');
      };
    });
    await open();
    await dialog.getByLabel('Vai trò mới', { exact: true }).selectOption('user');
    await confirm.click();
    await dialog.getByRole('alert').waitFor();
    assert.match(await dialog.getByRole('alert').innerText(), /Tài khoản đã thay đổi/);
    assert.equal(await confirm.count(), 0);
    await dialog.getByRole('button', { name: 'Tải lại danh sách', exact: true }).click();
    await ready();
    await open();
    await dialog.getByLabel('Vai trò mới', { exact: true }).selectOption('user');
    await confirm.click();
    await dialog.waitFor({ state: 'hidden' });
    await ready();
    assert.match(await row.locator('td').nth(1).innerText(), /Người dùng/);
    await page.setViewportSize({ width: 390, height: 844 });
    await open();
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    await dialog.getByRole('button', { name: 'Huỷ', exact: true }).click();
    assert.deepEqual(errors, []);
    console.log(
      'PASS admin role UI: no-op, focus/Escape/cancel, promote/demote, table/profile refresh, query preserved, conflict refresh and 390px layout.',
    );
  } finally {
    await context.close();
  }
  const reader = await browser.newContext();
  await reader.route('**/*', (route) =>
    new URL(route.request().url()).origin === baseURL ? route.continue() : route.abort(),
  );
  try {
    const page = await reader.newPage();
    await page.goto(baseURL + '/admin/users');
    await page.getByRole('link', { name: 'Đăng nhập', exact: true }).click();
    await page.getByRole('button', { name: 'Dùng phiên quản trị mẫu', exact: true }).click();
    await page.getByRole('link', { name: 'Tiếp tục về trang đã yêu cầu', exact: true }).click();
    await page.locator('[data-admin-users="ready"]').waitFor();
    assert.equal(await page.getByRole('button', { name: /Đổi vai trò/ }).count(), 0);
    console.log('PASS read-only user role UI: mutation controls hidden.');
  } finally {
    await reader.close();
  }
}

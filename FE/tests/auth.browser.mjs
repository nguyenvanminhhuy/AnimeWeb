import { logoutFromMenu } from './helpers/account-menu.mjs';
import assert from 'node:assert/strict';

export async function verifyAuth(browser, baseURL) {
  const context = await browser.newContext();
  const errors = [];
  const external = [];
  const posts = [];
  await context.route('**/*', (route) => {
    if (route.request().method() !== 'GET') posts.push(route.request().method());
    if (new URL(route.request().url()).origin !== baseURL) {
      external.push(route.request().url());
      return route.abort();
    }
    return route.continue();
  });
  try {
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    const success = () =>
      page.getByRole('heading', { name: 'Phiên demo đã sẵn sàng', exact: true }).waitFor();
    const logout = () => logoutFromMenu(page);
    const password = 'OnlyDemo!234';
    const fillRegistration = async (email, name = 'Người xem thử') => {
      await page.getByLabel('Tên hiển thị', { exact: true }).fill(name);
      await page.getByLabel('Email demo', { exact: true }).fill(email);
      await page.getByLabel('Mật khẩu demo', { exact: true }).fill(password);
      await page.getByLabel('Nhập lại mật khẩu demo', { exact: true }).fill(password);
    };
    const libraryReady = () =>
      page.waitForFunction(() => {
        const section = document.querySelector('.aw-library-collection');
        return (
          section?.getAttribute('aria-busy') === 'false' &&
          section.dataset.query === new URLSearchParams(location.search).toString()
        );
      });
    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const mode of ['login', 'register']) {
        await page.goto(`${baseURL}/${mode}?returnTo=%2Flibrary%3Ftab%3Dhistory`);
        await page.locator('.aw-auth-panel h1').waitFor();
        assert.ok(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          `${mode} overflow at ${width}`,
        );
        await page.screenshot({
          path: `../Anime-Web/FE/test-results/${mode}-${width}.png`,
          fullPage: true,
        });
      }
    }

    await page.goto(`${baseURL}/login?returnTo=%2Flibrary%3Ftab%3Dhistory`);
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await page.getByRole('alert').waitFor();
    assert.equal(
      await page.getByLabel('Email demo', { exact: true }).getAttribute('aria-invalid'),
      'true',
    );
    await page.waitForFunction(() => document.activeElement?.id === 'login-email');
    await page.getByLabel('Email demo', { exact: true }).fill('not-an-email');
    await page.getByLabel('Mật khẩu demo', { exact: true }).fill('short');
    await page.getByRole('button', { name: 'Hiện mật khẩu demo', exact: true }).click();
    assert.equal(
      await page.getByLabel('Mật khẩu demo', { exact: true }).getAttribute('type'),
      'text',
    );
    await page.getByRole('button', { name: 'Ẩn mật khẩu demo', exact: true }).click();
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    assert.equal(
      await page.getByLabel('Mật khẩu demo', { exact: true }).getAttribute('aria-invalid'),
      'true',
    );
    await page.getByLabel('Email demo', { exact: true }).fill('missing@anime.test');
    await page.getByLabel('Mật khẩu demo', { exact: true }).fill(password);
    await page.getByLabel('Mật khẩu demo', { exact: true }).press('Enter');
    await page
      .getByText('Chưa có hồ sơ demo với email này. Hãy đăng ký hoặc chọn tài khoản mẫu.', {
        exact: true,
      })
      .waitFor();
    await page.getByRole('link', { name: /Đăng ký ngay/ }).click();
    await page.getByRole('heading', { name: 'Tạo tài khoản demo', exact: true }).waitFor();
    assert.equal(new URL(page.url()).searchParams.get('returnTo'), '/library?tab=history');
    assert.equal(await page.getByLabel('Mật khẩu demo', { exact: true }).inputValue(), '');
    await page.getByRole('button', { name: 'Đăng ký', exact: true }).click();
    await page.waitForFunction(() => document.activeElement?.id === 'register-displayName');
    await fillRegistration('viewer@anime.test');
    await page.getByLabel('Nhập lại mật khẩu demo', { exact: true }).fill('Mismatch!123');
    await page.getByRole('button', { name: 'Đăng ký', exact: true }).click();
    await page.getByText('Mật khẩu nhập lại chưa khớp.', { exact: true }).waitFor();
    await page.getByLabel('Nhập lại mật khẩu demo', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Đăng ký', exact: true }).click();
    await page
      .getByText('Email này đã có hồ sơ demo. Hãy chuyển sang đăng nhập.', { exact: true })
      .waitFor();

    await page.goto(`${baseURL}/register?returnTo=%2Flibrary%3Ftab%3Dhistory&mock=loading`);
    await fillRegistration('Reader@anime.test');
    await page.evaluate(() => {
      window.__authMarker = 'same-document';
    });
    await page.getByRole('button', { name: 'Đăng ký', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'Đang xử lý hồ sơ demo' }).waitFor();
    assert.equal(await page.getByRole('button', { name: /Đang xử lý/ }).isDisabled(), true);
    await page.locator('form.aw-auth-form').evaluate((form) => form.requestSubmit());
    await success();
    assert.equal(await page.locator('input[name="password"]').count(), 0);
    const profiles = await page.evaluate(
      () => JSON.parse(localStorage.getItem('aw:profiles:v1')).profiles,
    );
    assert.equal(profiles.length, 1);
    assert.equal(profiles[0].email, 'reader@anime.test');
    assert.equal(profiles[0].displayName, 'Người xem thử');
    assert.ok(profiles[0].id.startsWith('local-'));
    await page.getByRole('link', { name: /Tiếp tục về trang/ }).click();
    await libraryReady();
    assert.equal(new URL(page.url()).searchParams.get('tab'), 'history');
    assert.equal(await page.locator('.aw-library-card').count(), 0);
    assert.equal(await page.evaluate(() => window.__authMarker), 'same-document');
    await page
      .getByRole('navigation', { name: 'Điều hướng chính' })
      .getByRole('link', { name: 'Trang chủ', exact: true })
      .click();
    await page.locator('.aw-hero h1').waitFor();
    await page.getByRole('button', { name: 'Yêu thích', exact: true }).click();
    await page
      .getByRole('navigation', { name: 'Điều hướng chính' })
      .getByRole('link', { name: 'Thư viện', exact: true })
      .click();
    await libraryReady();
    assert.equal(await page.locator('.aw-library-card').count(), 1);
    await page.reload();
    await libraryReady();
    assert.equal(await page.locator('.aw-library-card').count(), 1);
    await logout();
    await page.goto(`${baseURL}/register?returnTo=%2Flibrary`);
    await fillRegistration('second@anime.test', 'W'.repeat(40));
    await page.getByRole('button', { name: 'Đăng ký', exact: true }).click();
    await success();
    await page.setViewportSize({ width: 375, height: 1000 });
    assert.ok(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      'Long profile name must wrap on mobile',
    );
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.getByRole('link', { name: /Tiếp tục về trang/ }).click();
    await libraryReady();
    assert.equal(await page.locator('.aw-library-card').count(), 0);
    await logout();
    await page.goto(`${baseURL}/login?returnTo=%2Flibrary`);
    await page.getByLabel('Email demo', { exact: true }).fill('READER@ANIME.TEST');
    // The UI explicitly states that passwords only validate the demo form.
    await page.getByLabel('Mật khẩu demo', { exact: true }).fill('OtherDemo!456');
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await success();
    await page.getByRole('link', { name: /Tiếp tục về trang/ }).click();
    await libraryReady();
    assert.equal(await page.locator('.aw-library-card').count(), 1);
    assert.equal(
      await page.evaluate(() =>
        Object.values(localStorage).some(
          (value) => value.includes('OnlyDemo!234') || value.includes('OtherDemo!456'),
        ),
      ),
      false,
    );
    await logout();

    await page.goto(`${baseURL}/login?mock=error`);
    await page.getByLabel('Email demo', { exact: true }).fill('viewer@anime.test');
    await page.getByLabel('Mật khẩu demo', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Thao tác demo tạm thời thất bại' }).waitFor();
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await success();
    await logout();
    await page.goto(`${baseURL}/register?mock=loading`);
    await fillRegistration('cancelled@anime.test');
    await page.getByRole('button', { name: 'Đăng ký', exact: true }).click();
    await page
      .locator('.aw-auth-switch')
      .getByRole('link', { name: 'Đăng nhập', exact: true })
      .click();
    await page.waitForTimeout(1700);
    assert.equal(
      await page.evaluate(() =>
        JSON.parse(localStorage.getItem('aw:profiles:v1')).profiles.some(
          (profile) => profile.email === 'cancelled@anime.test',
        ),
      ),
      false,
    );
    assert.equal(
      await page.getByRole('heading', { name: 'Phiên demo đã sẵn sàng', exact: true }).count(),
      0,
    );
    await page.goto(`${baseURL}/register`);
    await fillRegistration('quota@anime.test');
    await page.evaluate(() => {
      Storage.prototype.setItem = () => {
        throw new Error('QuotaExceededError');
      };
    });
    await page.getByRole('button', { name: 'Đăng ký', exact: true }).click();
    await page
      .getByRole('alert')
      .filter({ hasText: 'Trình duyệt không lưu được hồ sơ demo' })
      .waitFor();
    assert.equal(
      await page.evaluate(() => JSON.parse(localStorage.getItem('aw:profiles:v1')).profiles.length),
      2,
    );
    await page.reload();
    await page.evaluate(() => {
      localStorage.setItem('aw:profiles:v1', '{broken');
    });
    await fillRegistration('broken@anime.test');
    await page.getByRole('button', { name: 'Đăng ký', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Không đọc được hồ sơ demo' }).waitFor();
    assert.equal(await page.evaluate(() => localStorage.getItem('aw:profiles:v1')), '{broken');
    await page
      .locator('.aw-auth-switch')
      .getByRole('link', { name: 'Đăng nhập', exact: true })
      .click();
    await page.getByRole('button', { name: 'Dùng tài khoản có lịch sử mẫu' }).click();
    await success();
    for (const mode of ['login', 'register']) {
      for (const target of [
        'https://example.com',
        '//example.com',
        '/\\example.com',
        '/LOGIN/',
        '/%72egister',
      ]) {
        await page.goto(`${baseURL}/${mode}?returnTo=${encodeURIComponent(target)}`);
        await success();
        assert.equal(
          await page.getByRole('link', { name: /Tiếp tục về trang/ }).getAttribute('href'),
          '/',
        );
      }
    }
    await logout();
    await page.route('**/images/hero.svg', (route) => route.abort());
    await page.goto(`${baseURL}/login`);
    await page.waitForFunction(() =>
      [...document.images].some(
        (image) => image.src.endsWith('/fallback.svg') && image.complete && image.naturalWidth > 0,
      ),
    );
    assert.deepEqual(errors, []);
    assert.deepEqual(external, []);
    assert.deepEqual(posts, []);
    console.log(
      'PASS Auth: login/register 375/768/1440, validation/focus, password toggle, duplicate email, pending/double submit, separate profiles/library persistence, demo login, no password storage or HTTP POST, retry/cancellation/storage errors, safe returnTo and artwork fallback.',
    );
  } finally {
    await context.close();
  }
}

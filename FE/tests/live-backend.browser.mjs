import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { logoutFromMenu } from './helpers/account-menu.mjs';

/** Explicit opt-in only: creates a local test user and its own favorite/comment. No admin bootstrap. */
export async function verifyLiveBackend(browser, baseURL, { allowWrites = false } = {}) {
  const context = await browser.newContext();
  const errors = [],
    serverErrors = [];
  await context.route('**/*', (route) =>
    new URL(route.request().url()).origin === baseURL ? route.continue() : route.abort(),
  );
  try {
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('response', (response) => {
      if (response.url().includes('/api/') && response.status() >= 500)
        serverErrors.push(response.status());
    });
    const catalogResponse = await context.request.get(baseURL + '/api/v1/common/anime');
    assert.equal(catalogResponse.status(), 200);
    const catalog = await catalogResponse.json();
    assert.ok(catalog.meta.total > 0, 'Seeded public catalog is empty');
    await page.goto(baseURL + '/');
    await page.locator('.aw-hero h1').waitFor();
    await page.goto(baseURL + '/anime');
    await page.locator('.aw-anime-card').first().waitFor();
    assert.equal(await page.locator('.aw-anime-card').count(), Math.min(12, catalog.meta.total));
    const anime = catalog.data.find((row) => row.slug === 'hanh-trinh-anh-sao') ?? catalog.data[0];
    await page.goto(baseURL + '/anime/' + anime.slug);
    await page.locator('.aw-detail').waitFor();
    assert.equal(await page.locator('h1').innerText(), anime.title);
    const seasons = await (
      await context.request.get(
        baseURL + '/api/v1/common/anime/' + encodeURIComponent(anime.id) + '/seasons',
      )
    ).json();
    if (seasons.data.length) {
      const episodes = await (
        await context.request.get(
          baseURL +
            '/api/v1/common/seasons/' +
            encodeURIComponent(seasons.data[0].id) +
            '/episodes',
        )
      ).json();
      if (episodes.data.length) {
        await page.goto(baseURL + '/watch/' + encodeURIComponent(episodes.data[0].id));
        await page.locator('.aw-watch[data-episode-id="' + episodes.data[0].id + '"]').waitFor();
      }
    }
    await page.goto(baseURL + '/login?returnTo=/admin');
    await page.getByRole('form', { name: 'Đăng nhập bằng email', exact: true }).waitFor();
    assert.equal(
      await page.getByRole('button', { name: /Dùng phiên quản trị|Dùng tài khoản/ }).count(),
      0,
    );
    if (allowWrites) {
      const password = 'Connection-' + randomUUID();
      const email = 'connection-' + randomUUID() + '@example.test';
      await page.goto(baseURL + '/register?returnTo=/library');
      await page.getByLabel('Tên hiển thị', { exact: true }).fill('Kiểm thử kết nối');
      await page.getByLabel('Email', { exact: true }).fill(email);
      await page.getByLabel('Mật khẩu', { exact: true }).fill(password);
      await page.getByLabel('Nhập lại mật khẩu', { exact: true }).fill(password);
      await page.getByRole('button', { name: 'Đăng ký', exact: true }).click();
      await page.getByRole('heading', { name: 'Đăng nhập thành công', exact: true }).waitFor();
      await page.getByRole('link', { name: 'Tiếp tục về trang đã yêu cầu', exact: true }).click();
      await page.locator('.aw-library-collection[aria-busy="false"]').waitFor();
      await page.goto(baseURL + '/anime/' + anime.slug);
      const favorite = page.getByRole('button', { name: 'Yêu thích', exact: true });
      await favorite.click();
      await page.getByRole('button', { name: 'Đã yêu thích', exact: true }).waitFor();
      await page.goto(baseURL + '/library');
      await page.locator('.aw-library-card').first().waitFor();
      assert.equal(await page.locator('.aw-library-card').count(), 1);
      await page.reload();
      await page.locator('.aw-library-card').first().waitFor();
      await page.goto(baseURL + '/anime/' + anime.slug);
      await page
        .getByLabel('Cảm nhận của bạn', { exact: true })
        .fill('Kiểm thử kết nối HTTP local.');
      await page.getByRole('button', { name: 'Gửi bình luận', exact: true }).click();
      const ownComment = page
        .locator('.aw-comment')
        .filter({ hasText: 'Kiểm thử kết nối HTTP local.' });
      await ownComment.waitFor();
      await ownComment.getByRole('button', { name: 'Sửa bình luận', exact: true }).click();
      await page.locator('.aw-comment textarea').fill('Đã kiểm tra cập nhật version.');
      await page.getByRole('button', { name: 'Lưu bình luận', exact: true }).click();
      const edited = page
        .locator('.aw-comment')
        .filter({ hasText: 'Đã kiểm tra cập nhật version.' });
      await edited.waitFor();
      await edited.getByRole('button', { name: 'Xóa bình luận', exact: true }).click();
      await edited.getByRole('button', { name: 'Xác nhận xóa', exact: true }).click();
      await edited.waitFor({ state: 'hidden' });
      const storage = await page.evaluate(() =>
        JSON.stringify({ ...localStorage, ...sessionStorage }),
      );
      assert.ok(!storage.includes(password));
      await page.evaluate(async () => {
        const { backendCredentials } = await import('/src/lib/api/backend/credentials.ts');
        const headers = { Authorization: 'Bearer ' + backendCredentials.read().accessToken };
        const { data } = await (await fetch('/api/v1/me/library', { headers })).json();
        for (const row of data)
          await fetch(
            '/api/v1/me/library/' + encodeURIComponent(row.animeId) + '?version=' + row.version,
            { method: 'DELETE', headers },
          );
      });
      await logoutFromMenu(page);
      await page.goto(baseURL + '/login');
      await page.getByLabel('Email', { exact: true }).fill(email);
      await page.getByLabel('Mật khẩu', { exact: true }).fill(password);
      await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
      await page.getByRole('heading', { name: 'Đăng nhập thành công', exact: true }).waitFor();
      const forbidden = await page.evaluate(async () => {
        const { backendCredentials } = await import('/src/lib/api/backend/credentials.ts');
        const response = await fetch('/api/v1/admin/dashboard', {
          headers: { Authorization: 'Bearer ' + backendCredentials.read().accessToken },
        });
        return response.status;
      });
      assert.equal(forbidden, 403, 'Registered user gained admin rights');
      await page.evaluate(async () => {
        const { authRepository } = await import('/src/lib/api/repositories.ts');
        const { backendCredentials } = await import('/src/lib/api/backend/credentials.ts');
        const token = backendCredentials.read().accessToken;
        await fetch('/api/v1/auth/logout', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + token },
        });
        try {
          await authRepository.restore(new AbortController().signal);
        } catch {
          /* 401 expires session. */
        }
      });
      await page.goto(baseURL + '/profile');
      await page
        .getByRole('heading', { name: 'Đăng nhập để xem trang cá nhân', exact: true })
        .waitFor();
      assert.equal(
        await page.evaluate(() => sessionStorage.getItem('aw:backend:session:v1')),
        null,
      );
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(serverErrors, []);
    console.log(
      'PASS live BE/FE: proxied PostgreSQL catalog, Home/Explore/Detail, real auth mode' +
        (allowWrites
          ? ', register/login, reload, favorite, versioned own comments, logout, 401 invalidation and 403 user/admin boundary. One local test account remains.'
          : '. Read-only check.'),
    );
  } finally {
    await context.close();
  }
}

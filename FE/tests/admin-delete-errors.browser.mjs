import assert from 'node:assert/strict';

export async function verifyAdminDeleteErrors(browser, baseURL) {
  for (const scenario of [
    'published',
    'episodes',
    'STALE_VERSION',
    'ANIME_IN_USE',
    '403',
    '404',
    '500',
  ]) {
    const context = await browser.newContext();
    let row = {
      version: 3,
      publicationStatus: scenario === 'published' ? 'published' : 'draft',
      alternativeTitles: [],
      publicSlug: null,
      publishedEpisodes: scenario === 'episodes' ? 1 : 0,
      anime: {
        id: 'delete-fixture',
        slug: 'delete-fixture',
        title: 'Delete Fixture',
        subtitle: '',
        synopsis: '',
        posterUrl: '/images/fallback.svg',
        bannerUrl: null,
        status: 'completed',
        format: 'movie',
        releaseYear: 2026,
        genres: [],
      },
    };
    let writes = 0,
      reads = 0;
    const errors = [];
    await context.addInitScript(() =>
      sessionStorage.setItem(
        'aw:backend:session:v1',
        JSON.stringify({ version: 1, accessToken: 'fixture', expiresAt: '2035-01-01T00:00:00Z' }),
      ),
    );
    await context.route('**/*', async (route) => {
      const request = route.request(),
        url = new URL(request.url());
      if (url.origin !== baseURL) return route.abort();
      if (!url.pathname.startsWith('/api/')) return route.continue();
      if (url.pathname === '/api/v1/me')
        return route.fulfill({
          json: {
            data: {
              id: 'admin-fixture',
              displayName: 'Admin Fixture',
              email: 'fixture@example.invalid',
              roles: ['admin'],
              permissions: [
                'admin:anime:read',
                'admin:anime:write',
                'library:read:own',
                'progress:read:own',
              ],
              avatarUrl: null,
              version: 1,
            },
          },
        });
      if (['/api/v1/me/library', '/api/v1/me/progress'].includes(url.pathname))
        return route.fulfill({
          json: {
            data: [],
            meta: { page: 1, pageSize: 50, total: 0, totalPages: 0 },
            summary: { total: 0 },
          },
        });
      if (url.pathname === '/api/v1/admin/anime') {
        reads++;
        return route.fulfill({
          json: {
            data: row ? [row] : [],
            meta: { page: 1, pageSize: 24, total: row ? 1 : 0, totalPages: row ? 1 : 0 },
            years: [2026],
            genreOptions: [],
          },
        });
      }
      if (request.method() === 'DELETE' && url.pathname === '/api/v1/admin/anime/delete-fixture') {
        writes++;
        assert.equal(url.searchParams.get('version'), String(row.version));
        if (writes === 1) {
          if (scenario === 'STALE_VERSION') row = { ...row, version: 4 };
          const status = ['403', '404', '500'].includes(scenario) ? Number(scenario) : 409;
          if (scenario === '404') row = null;
          return route.fulfill({
            status,
            json: {
              error: { code: scenario, message: 'English server detail must not be displayed' },
            },
          });
        }
        row = null;
        return route.fulfill({ status: 204 });
      }
      throw new Error('Unexpected request ' + url.pathname);
    });
    try {
      const page = await context.newPage();
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(baseURL + '/admin/anime?sort=title&page=1&pageSize=24');
      const ready = () => page.locator('[data-admin-anime="ready"]').waitFor();
      await ready();
      await page.getByRole('button', { name: 'Xoá Delete Fixture', exact: true }).click();
      const dialog = page.getByRole('dialog'),
        confirm = dialog.getByRole('button', { name: 'Xác nhận xoá', exact: true });
      assert.doesNotMatch(await dialog.innerText(), /phiên mẫu|phiên quản trị mẫu/);
      if (scenario === 'published' || scenario === 'episodes') {
        assert.equal(await confirm.isDisabled(), true);
        assert.equal(writes, 0);
        if (scenario === 'published')
          assert.match(
            await dialog.getByRole('link', { name: 'Chỉnh sửa phim' }).getAttribute('href'),
            /\/admin\/anime\/delete-fixture\/edit/,
          );
      } else {
        await confirm.click();
        await dialog.getByRole('alert').waitFor();
        assert.doesNotMatch(await dialog.getByRole('alert').innerText(), /English server/);
        if (scenario === 'STALE_VERSION' || scenario === '404') {
          assert.equal(await confirm.count(), 0);
          await dialog.getByRole('button', { name: 'Tải lại danh sách', exact: true }).click();
          await ready();
          assert.ok(reads >= 2);
          assert.equal(new URL(page.url()).searchParams.get('sort'), 'title');
          assert.equal(new URL(page.url()).searchParams.get('pageSize'), '24');
          if (scenario === 'STALE_VERSION') {
            await page.getByRole('button', { name: 'Xoá Delete Fixture', exact: true }).click();
            await confirm.click();
            await dialog.waitFor({ state: 'hidden' });
            await ready();
            assert.equal(writes, 2);
          }
        } else if (scenario === '500') {
          assert.equal(await confirm.isEnabled(), true);
          await confirm.click();
          await dialog.waitFor({ state: 'hidden' });
          await ready();
          assert.equal(writes, 2);
        } else assert.equal(await confirm.isDisabled(), true);
      }
      const messages = await page.evaluate(async () => {
        const { adminApiErrorMessage } = await import('/src/utils/admin-api-error.ts');
        const { ApiError } = await import('/src/lib/api/backend/error.ts');
        return [400, 401, 403, 404, 409, 429, 500, 0].map((s) =>
          adminApiErrorMessage(new ApiError(s, 'REQUEST_FAILED', 'English detail')),
        );
      });
      assert.ok(messages.every((m) => m && !m.includes('English')));
      assert.match(messages[4], /liên kết/);
      assert.deepEqual(errors, []);
      console.log(
        'PASS admin delete ' +
          scenario +
          ': guards, localized error and appropriate refresh/retry.',
      );
    } finally {
      await context.close();
    }
  }
}

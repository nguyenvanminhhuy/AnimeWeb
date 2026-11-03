import assert from 'node:assert/strict';

export async function verifyAdminArchiveAudit(browser, baseURL) {
  for (const writable of [true, false]) {
    const context = await browser.newContext();
    const errors = [];
    let writes = 0;
    let row = {
      version: 1,
      publicationStatus: 'published',
      alternativeTitles: [],
      publicSlug: 'fixture',
      publishedEpisodes: 1,
      anime: {
        id: 'fixture',
        slug: 'fixture',
        title: 'Archive Fixture',
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
    await context.addInitScript(() =>
      sessionStorage.setItem(
        'aw:backend:session:v1',
        JSON.stringify({ version: 1, accessToken: 'fixture', expiresAt: '2035-01-01T00:00:00Z' }),
      ),
    );
    await context.route('**/*', async (route) => {
      const req = route.request(),
        url = new URL(req.url());
      if (url.origin !== baseURL) return route.abort();
      if (!url.pathname.startsWith('/api/')) return route.continue();
      if (url.pathname === '/api/v1/me')
        return route.fulfill({
          json: {
            data: {
              id: 'actor',
              displayName: 'Fixture',
              email: 'fixture@example.invalid',
              roles: [writable ? 'admin' : 'manage'],
              permissions: [
                'admin:anime:read',
                'admin:audit:read',
                'library:read:own',
                'progress:read:own',
                ...(writable ? ['admin:anime:write'] : []),
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
      if (url.pathname === '/api/v1/admin/anime')
        return route.fulfill({
          json: {
            data: [row],
            meta: { page: 1, pageSize: 12, total: 1, totalPages: 1 },
            years: [2026],
            genreOptions: [],
          },
        });
      if (url.pathname === '/api/v1/admin/anime/fixture/archive') {
        assert.equal(writable, true);
        assert.equal(req.method(), 'PATCH');
        const input = req.postDataJSON();
        assert.equal(input.version, row.version);
        writes++;
        row = {
          ...row,
          version: row.version + 1,
          publicationStatus: input.archived ? 'archived' : 'draft',
          publicSlug: null,
        };
        return route.fulfill({ json: { data: row } });
      }
      if (url.pathname === '/api/v1/admin/audit-logs')
        return route.fulfill({
          json: {
            data: [
              {
                id: 'audit',
                actorId: 'actor',
                actorName: 'Fixture Admin',
                action: 'archive',
                resourceType: 'anime',
                resourceId: 'fixture',
                targetLabel: 'Archive Fixture',
                changedFields: ['PublicationStatus'],
                occurredAt: '2026-11-03T00:00:00Z',
              },
            ],
            meta: {
              page: 1,
              pageSize: Number(url.searchParams.get('pageSize')),
              total: 1,
              totalPages: 1,
            },
          },
        });
      throw new Error('Unexpected API ' + url.pathname);
    });
    try {
      const page = await context.newPage();
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(baseURL + '/admin/anime?sort=title&pageSize=24');
      await page.locator('[data-admin-anime="ready"]').waitFor();
      if (writable) {
        await page.getByRole('button', { name: 'Lưu trữ Archive Fixture', exact: true }).click();
        await page.getByRole('button', { name: 'Xác nhận lưu trữ', exact: true }).click();
        await page.getByRole('dialog').waitFor({ state: 'hidden' });
        await page
          .getByRole('button', { name: 'Khôi phục Archive Fixture', exact: true })
          .waitFor();
        assert.equal(
          await page.getByRole('link', { name: 'Sửa Archive Fixture', exact: true }).count(),
          0,
        );
        await page.getByRole('button', { name: 'Khôi phục Archive Fixture', exact: true }).click();
        await page.getByRole('button', { name: 'Xác nhận khôi phục', exact: true }).click();
        await page.getByRole('dialog').waitFor({ state: 'hidden' });
        await page.getByRole('link', { name: 'Sửa Archive Fixture', exact: true }).waitFor();
        assert.equal(writes, 2);
        assert.equal(row.publicationStatus, 'draft');
      } else
        assert.equal(
          await page.getByRole('button', { name: 'Lưu trữ Archive Fixture', exact: true }).count(),
          0,
        );
      await page.getByRole('link', { name: 'Lịch sử quản trị', exact: true }).click();
      await page.getByRole('cell', { name: 'Fixture Admin actor', exact: true }).waitFor();
      assert.equal(
        await page.getByRole('navigation', { name: /Phân trang lịch sử quản trị/ }).count(),
        2,
      );
      assert.equal(await page.getByRole('combobox', { name: 'Mỗi trang' }).count(), 1);
      await page.getByRole('combobox', { name: 'Mỗi trang' }).selectOption('50');
      assert.equal(new URL(page.url()).searchParams.get('pageSize'), '50');
      await page.setViewportSize({ width: 375, height: 812 });
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        true,
      );
      assert.deepEqual(errors, []);
    } finally {
      await context.close();
    }
  }
  console.log(
    'PASS admin archive/restore and readonly manager; audit route, pagination, page size, mobile; fake HTTP only.',
  );
}

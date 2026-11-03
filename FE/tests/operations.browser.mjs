import assert from 'node:assert/strict';
export async function verifyOperations(browser, baseURL) {
  const context = await browser.newContext();
  const errors = [];
  await context.addInitScript(() =>
    sessionStorage.setItem(
      'aw:backend:session:v1',
      JSON.stringify({ version: 1, accessToken: 'fixture', expiresAt: '2035-01-01T00:00:00Z' }),
    ),
  );
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== baseURL) return route.abort();
    if (!url.pathname.startsWith('/api/')) return route.continue();
    if (url.pathname === '/api/v1/me')
      return route.fulfill({
        json: {
          data: {
            id: 'manager',
            displayName: 'Manager Fixture',
            email: 'fixture@example.invalid',
            roles: ['manage'],
            permissions: ['admin:dashboard:read', 'library:read:own', 'progress:read:own'],
            version: 1,
            avatarUrl: null,
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
    if (url.pathname === '/api/v1/admin/operations')
      return route.fulfill({
        json: {
          data: {
            databaseReady: true,
            databaseProbeMs: 2,
            runtime: {
              instanceId: 'fixture',
              startedAt: '2026-11-03T00:00:00Z',
              activeRequests: 1,
              database: { count: 12, errors: 0, p95UpperBoundMs: 5 },
              clientPlaybackFailures: { media: 1, hls: 0, subtitle: 0, expired: 0 },
              cleanup: { lastRunAt: null, lastSuccessAt: null, removed: 0, errorType: null },
              requests: [
                {
                  name: 'GET api/v1/common/home',
                  count: 12,
                  errors: 0,
                  limited: 1,
                  averageMs: 3,
                  p95UpperBoundMs: 5,
                  maxMs: 4,
                },
              ],
            },
          },
        },
      });
    throw new Error('Unexpected API ' + url.pathname);
  });
  try {
    const page = await context.newPage();
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(baseURL + '/admin/operations');
    await page.getByRole('rowheader', { name: 'GET api/v1/common/home', exact: true }).waitFor();
    assert.equal(
      await page.getByRole('link', { name: 'Giám sát vận hành', exact: true }).count(),
      1,
    );
    await page.setViewportSize({ width: 375, height: 812 });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    await page.getByRole('button', { name: 'Làm mới', exact: true }).click();
    await page.getByRole('rowheader', { name: 'GET api/v1/common/home', exact: true }).waitFor();
    assert.deepEqual(errors, []);
    console.log(
      'PASS operations manager route, metrics, refresh and mobile layout; fake HTTP only.',
    );
  } finally {
    await context.close();
  }
}

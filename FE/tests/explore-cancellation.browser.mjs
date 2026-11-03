import assert from 'node:assert/strict';

export async function verifyExploreCancellation(browser, baseURL) {
  const context = await browser.newContext();
  const errors = [];
  await context.addInitScript(() => {
    window.abortedSearches = 0;
    const original = window.fetch;
    window.fetch = (input, options) => {
      if (String(input).includes('/common/anime?') && options?.signal)
        options.signal.addEventListener('abort', () => window.abortedSearches++);
      return original(input, options);
    };
  });
  await context.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== baseURL) return route.abort();
    if (!url.pathname.startsWith('/api/')) return route.continue();
    if (url.pathname === '/api/v1/common/genres') return route.fulfill({ json: { data: [] } });
    if (url.pathname === '/api/v1/common/catalog/options')
      return route.fulfill({ json: { data: { years: [2025], formats: ['tv'] } } });
    assert.equal(url.pathname, '/api/v1/common/anime');
    const q = url.searchParams.get('q');
    if (q === 'slow') await new Promise((resolve) => setTimeout(resolve, 1200));
    const data = q
      ? [
          {
            id: q,
            slug: q,
            title: q === 'slow' ? 'Old result' : 'Latest result',
            posterUrl: '/images/fallback.svg',
            status: 'completed',
            format: 'tv',
            releaseYear: 2025,
            genres: [],
          },
        ]
      : [];
    await route
      .fulfill({
        json: {
          data,
          meta: { page: 1, pageSize: 12, total: data.length, totalPages: data.length ? 1 : 0 },
        },
      })
      .catch(() => {});
  });
  try {
    const page = await context.newPage();
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(baseURL + '/anime?year=2025&status=completed&format=tv');
    await page.locator('.aw-explore-results[aria-busy="false"]').waitFor();
    await page.locator('#explore-search').fill('slow');
    await page.waitForRequest((req) => new URL(req.url()).searchParams.get('q') === 'slow');
    await page.locator('#explore-search').fill('fast');
    await page.getByRole('heading', { name: 'Latest result', exact: true }).waitFor();
    assert.equal(await page.getByRole('heading', { name: 'Old result', exact: true }).count(), 0);
    assert.ok((await page.evaluate(() => window.abortedSearches)) > 0);
    for (const [name, value] of Object.entries({ year: '2025', status: 'completed', format: 'tv' }))
      assert.equal(new URL(page.url()).searchParams.get(name), value);
    assert.deepEqual(errors, []);
    console.log(
      'PASS continuous search cancels superseded fetch, renders latest result and preserves filters; fake HTTP only.',
    );
  } finally {
    await context.close();
  }
}

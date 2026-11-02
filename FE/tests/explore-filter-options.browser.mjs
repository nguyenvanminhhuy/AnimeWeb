import assert from 'node:assert/strict';

/** Run against the normal backend adapter, with all API responses intercepted locally. */
export async function verifyExploreFilterOptions(browser, baseURL) {
  const context = await browser.newContext();
  const requests = [];
  const errors = [];
  let failList = false;
  const genres = [{ id: 'fixture-genre', slug: 'science-fiction', name: 'Khoa học viễn tưởng' }];
  await context.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== baseURL) return route.abort();
    if (!url.pathname.startsWith('/api/')) return route.continue();
    let body;
    if (url.pathname === '/api/v1/common/catalog/options')
      body = { data: { years: [2012, 1998], formats: ['movie', 'tv'] } };
    else if (url.pathname === '/api/v1/common/genres') body = { data: genres };
    else if (url.pathname === '/api/v1/common/anime') {
      requests.push(Object.fromEntries(url.searchParams));
      await new Promise((resolve) => setTimeout(resolve, 150));
      if (failList)
        return route.fulfill({
          status: 503,
          json: { error: { code: 'UNAVAILABLE', message: 'Fixture failure' } },
        });
      body = {
        data: [],
        meta: {
          page: Number(url.searchParams.get('page') ?? 1),
          pageSize: Number(url.searchParams.get('pageSize') ?? 12),
          total: 0,
          totalPages: 0,
        },
      };
    } else throw new Error('Unexpected API request: ' + url.pathname);
    return route.fulfill({ status: 200, json: body });
  });
  try {
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    const ready = () => page.locator('.aw-explore-results[aria-busy="false"]').waitFor();
    const assertControls = async (expected) => {
      for (const [name, value] of Object.entries(expected)) {
        assert.equal(
          await page.locator(`#explore-${name}`).inputValue(),
          value,
          `${name} control lost selection`,
        );
        assert.equal(
          new URL(page.url()).searchParams.get(name),
          value,
          `${name} URL lost selection`,
        );
      }
    };
    const select = async (name, value) => {
      await page.locator(`#explore-${name}`).selectOption(value);
      await page.waitForURL(
        (url) => url.searchParams.get(name === 'page-size' ? 'pageSize' : name) === value,
      );
      await ready();
    };
    await page.goto(baseURL + '/anime');
    await ready();
    await select('year', '2012');
    await assertControls({ year: '2012' });
    await select('status', 'completed');
    await assertControls({ year: '2012', status: 'completed' });
    await select('format', 'movie');
    await assertControls({ year: '2012', status: 'completed', format: 'movie' });
    await select('genre', 'science-fiction');
    await assertControls({
      year: '2012',
      status: 'completed',
      format: 'movie',
      genre: 'science-fiction',
    });
    const combined = requests.at(-1);
    for (const [key, value] of Object.entries({
      year: '2012',
      status: 'completed',
      format: 'movie',
      genre: 'science-fiction',
    }))
      assert.equal(combined[key], value);
    await select('sort', 'title');
    await assertControls({
      year: '2012',
      status: 'completed',
      format: 'movie',
      genre: 'science-fiction',
      sort: 'title',
    });
    await select('page-size', '24');
    assert.equal(requests.at(-1).pageSize, '24');
    assert.equal(requests.at(-1).year, '2012');
    await page.reload();
    await ready();
    await assertControls({
      year: '2012',
      status: 'completed',
      format: 'movie',
      genre: 'science-fiction',
    });
    await page.goBack();
    await ready();
    await assertControls({
      year: '2012',
      status: 'completed',
      format: 'movie',
      genre: 'science-fiction',
    });
    await page.goForward();
    await ready();
    await assertControls({
      year: '2012',
      status: 'completed',
      format: 'movie',
      genre: 'science-fiction',
    });
    failList = true;
    await select('status', 'airing');
    await page.getByRole('heading', { name: 'Chuyến khám phá tạm gián đoạn' }).waitFor();
    await assertControls({
      year: '2012',
      status: 'airing',
      format: 'movie',
      genre: 'science-fiction',
    });
    failList = false;
    await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
    await ready();
    await assertControls({
      year: '2012',
      status: 'airing',
      format: 'movie',
      genre: 'science-fiction',
    });
    // Selecting another filter before a delayed response must preserve the year and genre as well.
    await page.locator('#explore-status').selectOption('completed');
    await page.locator('#explore-format').selectOption('tv');
    await ready();
    await assertControls({
      year: '2012',
      status: 'completed',
      format: 'tv',
      genre: 'science-fiction',
    });
    assert.deepEqual(errors, []);
    console.log(
      'PASS Explore API filters: old year/real genre, combined URL and payload, empty/error/retry, sort/pageSize, reload/history and rapid selection.',
    );
  } finally {
    await context.close();
  }
}

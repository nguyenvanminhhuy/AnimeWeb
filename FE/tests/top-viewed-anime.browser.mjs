import assert from 'node:assert/strict';

export async function verifyTopViewedAnime(browser, baseURL) {
  const context = await browser.newContext();
  const errors = [];
  await context.route('**/*', (route) =>
    new URL(route.request().url()).origin === baseURL ? route.continue() : route.abort(),
  );
  try {
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    const ranking = () =>
      page.getByRole('region', { name: 'Top 10 phim được xem nhiều nhất', exact: true });
    const snapshot = () =>
      ranking()
        .locator('li')
        .evaluateAll((rows) =>
          rows.map((row) => ({
            id: row.dataset.topAnime,
            views: Number(row.dataset.viewCount),
            href: row.querySelector('a').getAttribute('href'),
            text: row.textContent,
          })),
        );
    await page.goto(baseURL);
    await ranking().waitFor();
    const home = await snapshot();
    assert.equal(home.length, 10);
    assert.equal(home[0].id, 'anime-03');
    assert.equal(home[0].views, 245800);
    assert.equal(new Set(home.map((row) => row.id)).size, 10);
    assert.deepEqual(
      home.map((row) => row.views),
      home.map((row) => row.views).sort((a, b) => b - a),
    );
    assert.match(await ranking().textContent(), /Số liệu mẫu/);
    const firstHref = home[0].href;
    await ranking().getByRole('link').first().click();
    await page.waitForURL((url) => url.pathname === firstHref);
    await page.getByRole('heading', { name: 'Kiếm sĩ bình minh', exact: true, level: 1 }).waitFor();
    await page.goto(baseURL + '/?genre=Tình+cảm');
    await ranking().waitFor();
    assert.deepEqual(await snapshot(), home, 'Recommendation filters do not filter the ranking');
    await page.goto(baseURL + '/admin');
    assert.equal(await ranking().count(), 0, 'Guest cannot see Dashboard');
    await page.getByRole('link', { name: 'Đăng nhập', exact: true }).click();
    await page.getByRole('button', { name: 'Dùng phiên quản trị mẫu', exact: true }).click();
    await page.getByRole('link', { name: 'Tiếp tục về trang đã yêu cầu', exact: true }).click();
    await ranking().waitFor();
    assert.deepEqual(await snapshot(), home, 'Home and Dashboard use the same ranking');
    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({
        path: `../Anime-Web/FE/test-results/top-viewed-admin-${width}.png`,
        fullPage: true,
      });
    }
    const isolated = await page.evaluate(async () => {
      const { getTopViewedAnime } = await import('/src/lib/api/mock/top-viewed-anime.ts');
      const { anime } = await import('/src/testing/mocks/fixtures/anime.ts');
      const first = getTopViewedAnime();
      first[0].anime.title = 'mutated';
      first[0].anime.genres.push('mutated');
      const second = getTopViewedAnime();
      return {
        clean: second[0].anime.title !== 'mutated' && !second[0].anime.genres.includes('mutated'),
        upcoming: second.some((row) => row.anime.status === 'upcoming'),
        seed: anime[0].id,
      };
    });
    assert.equal(isolated.clean, true);
    assert.equal(isolated.upcoming, false);
    assert.equal(isolated.seed, 'anime-01');
    assert.deepEqual(errors, []);
    console.log(
      'PASS Top Viewed Anime: shared top 10 order/counts/links, public/admin guards, filter independence, responsive, cloned results and upcoming exclusion.',
    );
  } finally {
    await context.close();
  }
}

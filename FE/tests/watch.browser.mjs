import assert from 'node:assert/strict';

export async function verifyWatch(browser, baseURL) {
  const context = await browser.newContext();
  const errors = [];
  const external = [];
  await context.route('**/*', (route) => {
    if (new URL(route.request().url()).origin !== baseURL) {
      external.push(route.request().url());
      return route.abort();
    }
    return route.continue();
  });
  try {
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    const ready = async (id) => page.locator(`.aw-watch[data-episode-id="${id}"]`).waitFor();
    const goto = async (id, query = '') => {
      await page.goto(`${baseURL}/watch/${id}${query}`);
      await ready(id);
    };
    const list = () => page.getByRole('list', { name: 'Các tập đã công bố' });
    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await goto('episode-01-03');
      assert.equal(
        await page.getByRole('heading', { name: 'Chưa có video demo' }).isVisible(),
        true,
      );
      assert.equal(await page.getByLabel('Nguồn phát').isDisabled(), true);
      assert.equal(await page.locator('video').count(), 0);
      assert.equal(await list().locator('a').count(), 8);
      assert.equal(
        await list().locator('[aria-current="page"]').getAttribute('href'),
        '/watch/episode-01-03',
      );
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      const player = await page.getByRole('region', { name: 'Trình phát' }).boundingBox();
      const sidebar = await page
        .getByRole('complementary', { name: 'Danh sách tập' })
        .boundingBox();
      assert.ok(width <= 1000 ? sidebar.y >= player.y + player.height : sidebar.x > player.x);
      await page.screenshot({
        path: `../Anime-Web/FE/test-results/watch-${width}.png`,
        fullPage: true,
      });
    }
    await page.evaluate(() => {
      window.__watchDocument = 'same';
    });
    await page.getByRole('button', { name: 'Chế độ rạp', exact: true }).click();
    assert.equal(await page.locator('.aw-watch').getAttribute('data-theater'), 'true');
    await page.getByLabel('Tự chuyển tập', { exact: true }).check();
    await page.getByRole('link', { name: 'Tập sau', exact: true }).click();
    await ready('episode-01-04');
    assert.equal(await page.locator('.aw-watch').getAttribute('data-theater'), 'true');
    assert.equal(await page.getByLabel('Tự chuyển tập', { exact: true }).isChecked(), true);
    await page.goBack();
    await ready('episode-01-03');
    await page.goForward();
    await ready('episode-01-04');
    assert.equal(await page.evaluate(() => window.__watchDocument), 'same');
    await page.getByLabel('Chọn mùa', { exact: true }).selectOption('season-01-side');
    await page.waitForURL((url) => url.searchParams.get('season') === 'season-01-side');
    await page.waitForFunction(() => document.querySelectorAll('aside ol a').length === 2);
    assert.equal(await list().locator('a').count(), 2);
    await list().locator('a').first().click();
    await ready('episode-01-side-a');
    assert.equal(
      await page.getByRole('link', { name: 'Tập trước', exact: true }).getAttribute('href'),
      '/watch/episode-01-08',
    );
    assert.equal(
      await page.getByRole('link', { name: 'Tập sau', exact: true }).getAttribute('href'),
      '/watch/episode-01-side-z',
    );
    await page.getByRole('link', { name: 'Tập sau', exact: true }).click();
    await ready('episode-01-side-z');
    assert.equal(
      await page.getByRole('button', { name: 'Tập sau', exact: true }).isDisabled(),
      true,
    );
    await page.reload();
    await ready('episode-01-side-z');
    await goto('episode-01-01', '?season=invalid');
    await page.waitForURL((url) => url.searchParams.get('season') === 'season-01-1');
    assert.equal(
      await page.getByRole('button', { name: 'Tập trước', exact: true }).isDisabled(),
      true,
    );
    await goto('episode-04-01');
    assert.equal(await list().locator('a').count(), 1);
    assert.equal(
      await page.getByRole('button', { name: 'Tập sau', exact: true }).isDisabled(),
      true,
    );
    for (const id of ['missing', 'episode-01-draft', 'episode-08-01']) {
      await page.goto(`${baseURL}/watch/${id}`);
      await page.getByRole('heading', { name: 'Không tìm thấy tập phim', exact: true }).waitFor();
    }
    await page.goto(`${baseURL}/watch/episode-01-03?mock=loading`);
    await page.getByRole('status', { name: 'Đang tải tập phim' }).waitFor();
    await page.goto(`${baseURL}/watch/episode-01-03?mock=error`);
    await page.getByRole('heading', { name: 'Chưa thể mở tập phim' }).waitFor();
    await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
    await ready('episode-01-03');
    await goto('episode-01-03', '?mock=empty');
    assert.equal(await list().locator('a').count(), 0);
    await goto('episode-01-03');
    await page.getByRole('link', { name: 'Đăng nhập để lưu tiến độ', exact: true }).click();
    assert.equal(new URL(page.url()).searchParams.get('returnTo'), '/watch/episode-01-03');
    await page.getByRole('button', { name: 'Dùng tài khoản có lịch sử mẫu', exact: true }).click();
    await page.getByRole('link', { name: 'Tiếp tục về trang đã yêu cầu', exact: true }).click();
    await ready('episode-01-03');
    assert.equal(await page.getByText(/Tiến độ đã lưu: 8:30/).isVisible(), true);
    assert.equal(await page.evaluate(() => localStorage.getItem('aw:account:v1:viewer')), null);
    await page.getByRole('link', { name: 'Tập sau', exact: true }).click();
    await ready('episode-01-04');
    assert.equal(await page.evaluate(() => localStorage.getItem('aw:account:v1:viewer')), null);
    await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
    assert.equal(await page.getByText(/Tiến độ đã lưu:/).count(), 0);
    assert.deepEqual(errors, []);
    assert.deepEqual(external, []);
    console.log(
      'PASS Watch: responsive, theater, seasons/nonsequential neighbors, history/reload, source absent, no fake progress, member/guest, returnTo, mock states/draft/404/movie; no external requests or page errors.',
    );
  } finally {
    await context.close();
  }
}

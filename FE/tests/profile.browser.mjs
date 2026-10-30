import assert from 'node:assert/strict';
import { logoutFromMenu } from './helpers/account-menu.mjs';

export async function verifyProfile(browser, baseURL, { mockStates = true } = {}) {
  const context = await browser.newContext();
  const errors = [];
  const account = {
    version: 1,
    favorites: ['anime-01', 'anime-02', 'anime-03', 'anime-04', 'anime-05'],
    progress: [
      {
        animeId: 'anime-01',
        episodeId: 'episode-01-03',
        episodeNumber: 3,
        positionSeconds: 510,
        durationSeconds: 1440,
      },
      {
        animeId: 'anime-02',
        episodeId: 'episode-02-02',
        episodeNumber: 2,
        positionSeconds: 1440,
        durationSeconds: 1440,
        completed: true,
      },
    ],
  };
  await context.addInitScript((seed) => {
    if (!localStorage.getItem('aw:account:v1:viewer'))
      localStorage.setItem('aw:account:v1:viewer', JSON.stringify(seed));
  }, account);
  await context.route('**/*', (route) => {
    assert.equal(new URL(route.request().url()).origin, baseURL);
    return route.continue();
  });
  try {
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    const ready = () =>
      page.waitForFunction(
        () =>
          document
            .querySelector('[aria-label="Nội dung thư viện cá nhân"]')
            ?.getAttribute('aria-busy') === 'false',
      );
    const login = async (name, waitReady = true) => {
      await page.locator('main').getByRole('link', { name: 'Đăng nhập', exact: true }).click();
      await page.getByRole('button', { name, exact: true }).click();
      await page.getByRole('link', { name: 'Tiếp tục về trang đã yêu cầu', exact: true }).click();
      if (waitReady) await ready();
    };
    await page.goto(baseURL + '/profile');
    await page
      .getByRole('heading', { name: 'Đăng nhập để xem trang cá nhân', exact: true })
      .waitFor();
    await login('Dùng tài khoản có lịch sử mẫu');
    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `overflow ${width}`,
      );
      assert.equal(await page.locator('.aw-profile .aw-anime-card').count(), 4);
      assert.equal(await page.locator('.aw-profile .aw-continue-card').count(), 1);
      assert.deepEqual(
        await page
          .getByRole('region', { name: 'Thống kê thư viện cá nhân', exact: true })
          .locator('a > span:last-child')
          .allTextContents(),
        ['5', '1', '1', '2'],
      );
      assert.equal(
        await page
          .getByRole('region', { name: 'Thông tin tài khoản', exact: true })
          .getByText('viewer@anime.test', { exact: true })
          .count(),
        1,
      );
      assert.equal(await page.locator('.aw-profile input').count(), 0);
      await page.screenshot({
        path: `../Anime-Web/FE/test-results/profile-${width}.png`,
        fullPage: true,
      });
    }
    await page.getByRole('link', { name: 'Tất cả yêu thích', exact: true }).click();
    await page.waitForURL(
      (u) => u.pathname === '/library' && u.searchParams.get('tab') === 'favorites',
    );
    await page.locator('.aw-library-card').first().waitFor();
    await page.goBack();
    await ready();
    await page.locator('.aw-profile .aw-continue-card').click();
    await page.locator('.aw-watch[data-episode-id="episode-01-03"]').waitFor();
    await page.goBack();
    await ready();
    assert.deepEqual(
      await page.evaluate(() => JSON.parse(localStorage.getItem('aw:account:v1:viewer'))),
      account,
    );
    if (mockStates) {
      await page.goto(baseURL + '/profile?mock=error');
      await page
        .getByRole('heading', { name: 'Thư viện tạm thời gián đoạn', exact: true })
        .waitFor();
      await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
      await ready();
      assert.equal(new URL(page.url()).searchParams.has('mock'), false);
      await page.goto(baseURL + '/profile?mock=empty');
      await ready();
      assert.equal(
        await page.locator('.aw-profile .aw-anime-card, .aw-profile .aw-continue-card').count(),
        0,
      );
      await page.goto(baseURL + '/profile?mock=forbidden');
      await page
        .getByRole('heading', { name: 'Bạn chưa có quyền xem thư viện', exact: true })
        .waitFor();
      assert.equal(
        await page.getByRole('region', { name: 'Thống kê thư viện cá nhân', exact: true }).count(),
        0,
      );
      await page.goto(baseURL + '/profile?mock=loading');
      await page.getByRole('status', { name: 'Đang tải hồ sơ', exact: true }).waitFor();
    }
    await logoutFromMenu(page);
    await page
      .getByRole('heading', { name: 'Đăng nhập để xem trang cá nhân', exact: true })
      .waitFor();
    assert.equal(await page.getByText('viewer@anime.test', { exact: true }).count(), 0);
    await login('Dùng tài khoản mới', false);
    // Loading-only mock is intentionally cleared via a fresh direct URL after switching users.
    await page.goto(baseURL + '/profile');
    await ready();
    assert.equal(
      await page
        .getByRole('region', { name: 'Thông tin tài khoản', exact: true })
        .getByText('newcomer@anime.test', { exact: true })
        .count(),
      1,
    );
    assert.deepEqual(
      await page
        .getByRole('region', { name: 'Thống kê thư viện cá nhân', exact: true })
        .locator('a > span:last-child')
        .allTextContents(),
      ['0', '0', '0', '0'],
    );
    assert.equal(
      await page.locator('.aw-profile .aw-anime-card, .aw-profile .aw-continue-card').count(),
      0,
    );
    assert.deepEqual(
      await page.evaluate(() => JSON.parse(localStorage.getItem('aw:account:v1:viewer'))),
      account,
    );
    await page.reload();
    await ready();
    assert.deepEqual(errors, []);
    console.log(
      'PASS Profile: 375/768/1440, account email/stats, limited favorites and incomplete progress, library/watch/history links, no fake writes, mock states/retry/permission, logout and member isolation, reload; no external requests or page errors.',
    );
  } finally {
    await context.close();
  }
}

import { logoutFromMenu } from './helpers/account-menu.mjs';
import assert from 'node:assert/strict';

export async function verifyLibrary(browser, baseURL) {
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
    const ready = () =>
      page.waitForFunction(() => {
        const section = document.querySelector('.aw-library-collection');
        if (!section || section.getAttribute('aria-busy') !== 'false') return false;
        if (section.querySelector('[role="alert"]')) return true;
        return section.dataset.query === new URLSearchParams(location.search).toString();
      });
    const cards = () => page.locator('.aw-library-card');
    const goto = async (path) => {
      await page.goto(baseURL + path);
      await ready();
    };
    const tab = async (label) => {
      await page
        .getByRole('navigation', { name: 'Các bộ sưu tập' })
        .getByRole('link', { name: new RegExp(label) })
        .click();
      await ready();
    };
    const login = async (account) => {
      await page.getByRole('button', { name: account }).click();
      await page.getByRole('link', { name: /Tiếp tục về trang/ }).click();
      await ready();
    };

    await page.goto(baseURL + '/library?tab=history');
    await page
      .getByRole('heading', { name: 'Thư viện dành cho thành viên', exact: true })
      .waitFor();
    assert.equal(await cards().count(), 0);
    assert.equal(await page.locator('.aw-library-summary').count(), 0);
    await page
      .locator('.aw-library-guest')
      .getByRole('link', { name: 'Đăng nhập', exact: true })
      .click();
    assert.equal(new URL(page.url()).searchParams.get('returnTo'), '/library?tab=history');
    await login('Dùng tài khoản có lịch sử mẫu');
    assert.equal(await cards().count(), 2);
    assert.equal(new URL(page.url()).searchParams.get('tab'), 'history');
    await tab('Đang xem');
    assert.equal(await cards().count(), 2);
    assert.equal(
      await cards().first().getByRole('link', { name: 'Xem tiếp' }).getAttribute('href'),
      '/watch/episode-01-03',
    );
    await cards().first().getByRole('link', { name: 'Xem tiếp' }).click();
    await page.locator('.aw-watch[data-episode-id="episode-01-03"]').waitFor();
    await page.goBack();
    await ready();
    await tab('Yêu thích');
    await page.getByRole('heading', { name: 'Chưa có anime yêu thích' }).waitFor();
    await page.getByRole('link', { name: 'Về Trang chủ để thêm yêu thích' }).click();
    await page.locator('.aw-hero h1').waitFor();
    await page.getByRole('button', { name: 'Yêu thích', exact: true }).click();
    await page
      .getByRole('navigation', { name: 'Điều hướng chính' })
      .getByRole('link', { name: 'Thư viện' })
      .click();
    await ready();
    assert.equal(await cards().count(), 1);
    await page.reload();
    await ready();
    assert.equal(await cards().count(), 1);
    await page
      .getByRole('button', { name: 'Bỏ yêu thích Hành trình ánh sao', exact: true })
      .click();
    await ready();
    assert.equal(await cards().count(), 0);
    await tab('Lịch sử');
    assert.equal(await cards().count(), 2);
    await tab('Đang xem');
    assert.equal(await cards().count(), 2);

    // A controlled account fixture exercises multi-page collections and completed episodes.
    await page.evaluate(() => {
      const key = 'aw:account:v1:viewer';
      const account = JSON.parse(localStorage.getItem(key));
      account.favorites = Array.from(
        { length: 12 },
        (_, index) => `anime-${String(index + 1).padStart(2, '0')}`,
      );
      account.progress = account.progress.map((entry, index) => ({
        ...entry,
        updatedAt: `2026-10-${String(25 - index).padStart(2, '0')}T10:00:00Z`,
      }));
      account.progress.push({
        animeId: 'anime-03',
        episodeId: 'episode-03-01',
        episodeNumber: 1,
        positionSeconds: 1440,
        durationSeconds: 1440,
        completed: true,
        updatedAt: '2026-10-23T10:00:00Z',
      });
      localStorage.setItem(key, JSON.stringify(account));
    });
    await goto('/library');
    assert.equal(await cards().count(), 8);
    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `Library overflow at ${width}`,
      );
      await page.screenshot({
        path: `../Anime-Web/FE/test-results/library-${width}.png`,
        fullPage: true,
      });
    }
    await page.getByRole('link', { name: 'Sau', exact: true }).click();
    await ready();
    assert.equal(await cards().count(), 4);
    await page.reload();
    await ready();
    assert.equal(await cards().count(), 4);
    for (let index = 0; index < 4; index++) {
      await cards()
        .first()
        .getByRole('button', { name: /^Bỏ yêu thích/ })
        .click();
      await ready();
    }
    assert.equal(new URL(page.url()).searchParams.get('page'), '1');
    assert.equal(await cards().count(), 8);
    await tab('Lịch sử');
    assert.equal(await cards().count(), 3);
    assert.equal(await page.getByRole('link', { name: 'Xem lại', exact: true }).count(), 1);
    await tab('Đang xem');
    assert.equal(await cards().count(), 2);
    await page
      .getByRole('searchbox', { name: 'Tìm trong bộ sưu tập', exact: true })
      .fill('hanh trinh anh sao');
    await page.getByRole('searchbox', { name: 'Tìm trong bộ sưu tập', exact: true }).press('Enter');
    await ready();
    assert.equal(await cards().count(), 1);
    await page.goBack();
    await ready();
    assert.equal(await cards().count(), 2);
    assert.equal(
      await page.getByRole('searchbox', { name: 'Tìm trong bộ sưu tập', exact: true }).inputValue(),
      '',
    );
    await page.goForward();
    await ready();
    assert.equal(await cards().count(), 1);
    await goto('/library?tab=favorites&sort=title');
    const titles = await cards().locator('h3').allTextContents();
    assert.deepEqual(
      titles,
      [...titles].sort((a, b) => a.localeCompare(b, 'vi')),
    );
    await goto('/library?tab=bogus&page=-3&sort=wrong');
    assert.equal(new URL(page.url()).searchParams.get('tab'), 'favorites');
    assert.equal(new URL(page.url()).searchParams.get('page'), '1');
    await goto('/library?tab=history&q=does-not-exist');
    await page.getByRole('heading', { name: 'Không tìm thấy trong bộ sưu tập' }).waitFor();
    await page.getByRole('link', { name: 'Bỏ tìm kiếm', exact: true }).click();
    await ready();
    assert.equal(await cards().count(), 3);

    await goto('/library?tab=history&mock=error');
    await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
    await ready();
    assert.equal(await cards().count(), 3);
    await goto('/library?tab=watching&mock=empty');
    assert.equal(await cards().count(), 0);
    await page.goto(baseURL + '/library?mock=loading');
    await page.getByRole('status', { name: 'Đang tải thư viện' }).waitFor();
    await page.goto(baseURL + '/library?mock=forbidden');
    await page.getByRole('heading', { name: 'Bạn chưa có quyền xem thư viện' }).waitFor();
    assert.equal(await cards().count(), 0);
    assert.equal(await page.locator('.aw-library-summary').count(), 0);

    await goto('/library?tab=history');
    await logoutFromMenu(page);
    await page
      .getByRole('heading', { name: 'Thư viện dành cho thành viên', exact: true })
      .waitFor();
    assert.equal(await cards().count(), 0);
    await page
      .locator('.aw-library-guest')
      .getByRole('link', { name: 'Đăng nhập', exact: true })
      .click();
    await login('Dùng tài khoản mới');
    assert.equal(await cards().count(), 0);
    for (const label of ['Yêu thích', 'Đang xem', 'Lịch sử']) {
      await tab(label);
      assert.equal(await cards().count(), 0);
    }
    await goto('/library?tab=history&userId=viewer');
    assert.equal(await cards().count(), 0);

    await logoutFromMenu(page);
    await page
      .locator('.aw-library-guest')
      .getByRole('link', { name: 'Đăng nhập', exact: true })
      .click();
    await login('Dùng tài khoản có lịch sử mẫu');
    assert.equal(await cards().count(), 3);
    await tab('Yêu thích');
    await page.evaluate(() => {
      Storage.prototype.setItem = () => {
        throw new Error('QuotaExceededError');
      };
    });
    const before = await cards().count();
    await cards()
      .first()
      .getByRole('button', { name: /^Bỏ yêu thích/ })
      .click();
    await ready();
    assert.equal(await cards().count(), before - 1);
    await page
      .getByRole('status')
      .filter({ hasText: 'trình duyệt không lưu được dữ liệu' })
      .waitFor();
    await page.reload();
    await ready();
    await page.evaluate(() => {
      localStorage.setItem('aw:account:v1:viewer', '{broken');
    });
    await page.reload();
    await ready();
    assert.equal(await cards().count(), 0);
    await tab('Lịch sử');
    assert.equal(await cards().count(), 2);
    await page.route('**/images/starlight.svg', (route) => route.abort());
    await page.reload();
    await ready();
    await page.waitForFunction(() =>
      [...document.images].some(
        (image) => image.src.endsWith('/fallback.svg') && image.complete && image.naturalWidth > 0,
      ),
    );
    assert.deepEqual(errors, []);
    assert.deepEqual(external, []);
    console.log(
      'PASS Library: guest/returnTo, shared favorites and progress, removal preserves history, completed episodes, 375/768/1440, pagination/clamp, search/sort/back/forward, loading/empty/error/retry/forbidden, account isolation/logout, corrupt/quota storage, artwork fallback.',
    );
  } finally {
    await context.close();
  }
}

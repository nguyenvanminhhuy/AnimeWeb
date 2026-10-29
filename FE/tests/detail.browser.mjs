import assert from 'node:assert/strict';

export async function verifyDetail(browser, baseURL) {
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
    const path = '/anime/hanh-trinh-anh-sao';
    const title = () =>
      page.getByRole('heading', { name: 'Hành trình ánh sao', exact: true, level: 1 }).waitFor();
    const commentsReady = () =>
      page.waitForFunction(() => {
        const section = document.querySelector('.aw-comments');
        if (!section || section.getAttribute('aria-busy') !== 'false') return false;
        const current = Number(new URLSearchParams(location.search).get('commentPage') ?? 1);
        return Number(section.dataset.commentPage) === current;
      });
    const goto = async (suffix) => {
      await page.goto(baseURL + path + suffix);
      await title();
      await commentsReady();
    };
    const login = async (account) => {
      await page.getByRole('button', { name: account }).click();
      await page.getByRole('link', { name: /Tiếp tục về trang/ }).click();
      await title();
      await commentsReady();
    };
    const post = async (body) => {
      await page.getByLabel('Cảm nhận của bạn', { exact: true }).fill(body);
      await page.getByRole('button', { name: 'Gửi bình luận', exact: true }).click();
      await page.locator('.aw-comment-content').getByText(body, { exact: true }).waitFor();
      await commentsReady();
    };
    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await goto('');
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `Detail overflow at ${width}`,
      );
      assert.equal(await page.locator('.aw-detail-episodes li').count(), 8);
      assert.equal(await page.locator('.aw-comment').count(), 2);
      assert.equal(await page.getByText('Tập chưa công bố', { exact: true }).count(), 0);
      assert.equal(
        await page.getByText('BÌNH LUẬN BỊ ẨN KHÔNG ĐƯỢC HIỂN THỊ', { exact: true }).count(),
        0,
      );
      assert.equal(
        await page.getByText('BÌNH LUẬN ĐÃ XÓA KHÔNG ĐƯỢC HIỂN THỊ', { exact: true }).count(),
        0,
      );
      assert.equal(await page.getByRole('button', { name: 'Sửa', exact: true }).count(), 0);
      assert.equal(await page.getByRole('link', { name: /Xem ngay|Xem tiếp/ }).count(), 0);
      await page.screenshot({
        path: `../Anime-Web/FE/test-results/detail-${width}.png`,
        fullPage: true,
      });
    }
    await page.evaluate(() => {
      window.__detailMarker = 'same-document';
    });
    await page.getByLabel('Chọn mùa', { exact: true }).selectOption('season-01-side');
    await page.waitForFunction(
      () => document.querySelector('#episodes')?.dataset.seasonId === 'season-01-side',
    );
    assert.equal(await page.locator('.aw-detail-episodes li').count(), 2);
    assert.equal(
      await page.locator('.aw-detail-episodes a').first().getAttribute('href'),
      '/watch/episode-01-side-a',
    );
    await page.goBack();
    await page.waitForFunction(
      () => document.querySelector('#episodes')?.dataset.seasonId === 'season-01-1',
    );
    assert.equal(await page.locator('.aw-detail-episodes li').count(), 8);
    await page.goForward();
    await page.waitForFunction(
      () => document.querySelector('#episodes')?.dataset.seasonId === 'season-01-side',
    );
    assert.equal(await page.evaluate(() => window.__detailMarker), 'same-document');
    await page.reload();
    await title();
    assert.equal(await page.getByLabel('Chọn mùa', { exact: true }).inputValue(), 'season-01-side');
    await page.getByRole('link', { name: 'Yêu thích', exact: true }).click();
    assert.ok(new URL(page.url()).searchParams.get('returnTo').includes('season=season-01-side'));
    await login('Dùng tài khoản có lịch sử mẫu');
    await page.getByText(/Tiến độ mẫu của bạn: Tập 3/).waitFor();
    await page.getByRole('button', { name: 'Yêu thích', exact: true }).click();
    await page.getByRole('button', { name: 'Đã yêu thích', exact: true }).waitFor();
    await page
      .getByRole('navigation', { name: 'Điều hướng chính' })
      .getByRole('link', { name: 'Thư viện', exact: true })
      .click();
    await page.waitForFunction(() => document.querySelectorAll('.aw-library-card').length === 1);
    await page.locator('.aw-library-card .aw-anime-card a').click();
    await title();
    await commentsReady();
    await page.getByRole('button', { name: 'Gửi bình luận', exact: true }).click();
    await page
      .getByRole('alert')
      .filter({ hasText: 'Bình luận cần từ 1 đến 2000 ký tự.' })
      .waitFor();
    const body = '<img src=x onerror="window.__commentInjected=1"> Bình luận thử';
    await post(body);
    assert.equal(await page.evaluate(() => window.__commentInjected), undefined);
    assert.equal(await page.getByRole('button', { name: 'Sửa', exact: true }).count(), 1);
    await page.reload();
    await title();
    await commentsReady();
    await page.getByText(body, { exact: true }).waitFor();
    const postedId = await page
      .getByText(body, { exact: true })
      .locator('xpath=ancestor::article')
      .getAttribute('data-comment-id');
    await page.getByRole('button', { name: 'Sửa', exact: true }).click();
    await page.getByLabel('Sửa bình luận của bạn', { exact: true }).fill('Bình luận đã sửa');
    await page.getByRole('button', { name: 'Lưu bình luận', exact: true }).click();
    await page.locator('.aw-comment-content > p').filter({ hasText: 'Bình luận đã sửa' }).waitFor();
    await commentsReady();
    const denied = await page.evaluate(async (id) => {
      const { commentRepository } = await import('/src/lib/api/repositories.ts');
      const actor = {
        id: 'newcomer',
        displayName: 'Tài khoản khác',
        permissions: ['comment:update:own', 'comment:delete:own'],
      };
      const results = [];
      for (const method of ['update', 'remove']) {
        try {
          if (method === 'update')
            await commentRepository.update(
              actor,
              id,
              'Sửa trái phép',
              new AbortController().signal,
            );
          else await commentRepository.remove(actor, id, new AbortController().signal);
          results.push(false);
        } catch {
          results.push(true);
        }
      }
      return results;
    }, postedId);
    assert.deepEqual(denied, [true, true]);
    await page
      .getByLabel('Cảm nhận của bạn', { exact: true })
      .fill('Bản nháp phải được xóa khi đổi tài khoản');
    await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
    await commentsReady();
    assert.equal(await page.locator('#comment-body').count(), 0);
    await page.getByText('Bình luận đã sửa', { exact: true }).waitFor();
    await page.getByRole('link', { name: /Đăng nhập để bình luận/ }).click();
    await login('Dùng tài khoản mới');
    assert.equal(await page.getByRole('button', { name: 'Sửa', exact: true }).count(), 0);
    assert.equal(await page.getByRole('button', { name: 'Xóa', exact: true }).count(), 0);
    assert.equal(await page.getByLabel('Cảm nhận của bạn', { exact: true }).inputValue(), '');
    assert.equal(
      await page.getByText('Bản nháp phải được xóa khi đổi tài khoản', { exact: true }).count(),
      0,
    );
    await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
    await commentsReady();
    await page.getByRole('link', { name: /Đăng nhập để bình luận/ }).click();
    await login('Dùng tài khoản có lịch sử mẫu');
    await page.getByRole('button', { name: 'Xóa', exact: true }).click();
    await page.getByRole('button', { name: 'Hủy xóa', exact: true }).click();
    await page.getByText('Bình luận đã sửa', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Xóa', exact: true }).click();
    await page.getByRole('button', { name: 'Xác nhận xóa', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'Đã xóa bình luận của bạn.' }).waitFor();
    await commentsReady();
    assert.equal(await page.getByText('Bình luận đã sửa', { exact: true }).count(), 0);
    assert.equal(
      await page.evaluate(
        (id) =>
          JSON.parse(localStorage.getItem('aw:comments:v1:viewer')).comments.find(
            (c) => c.id === id,
          ).status,
        postedId,
      ),
      'deleted',
    );
    await page.getByLabel('Cảm nhận của bạn', { exact: true }).fill('Không được lưu sau đăng xuất');
    await page.evaluate(() => {
      document.querySelector('form.aw-comment-form').requestSubmit();
      document.querySelector('.aw-header .aw-account').click();
    });
    await commentsReady();
    await page.waitForTimeout(250);
    assert.equal(
      await page.evaluate(() =>
        JSON.parse(localStorage.getItem('aw:comments:v1:viewer')).comments.some(
          (c) => c.body === 'Không được lưu sau đăng xuất',
        ),
      ),
      false,
    );
    await page.getByRole('link', { name: /Đăng nhập để bình luận/ }).click();
    await login('Dùng tài khoản có lịch sử mẫu');
    for (let index = 0; index < 6; index++) await post(`Cảm nhận demo số ${index}`);
    assert.equal(await page.locator('.aw-comment').count(), 5);
    await page
      .getByRole('navigation', { name: 'Phân trang bình luận' })
      .getByRole('link', { name: 'Sau', exact: true })
      .click();
    await commentsReady();
    assert.equal(await page.locator('.aw-comment').count(), 3);
    await page.reload();
    await title();
    await commentsReady();
    assert.equal(await page.locator('.aw-comment').count(), 3);

    await goto('?comments=error');
    await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
    await commentsReady();
    await goto('?comments=empty');
    assert.equal(await page.locator('.aw-comment').count(), 0);
    await goto('?comments=forbidden');
    await page
      .getByText('Tài khoản hiện tại chưa có quyền viết bình luận.', { exact: true })
      .waitFor();
    assert.equal(await page.locator('#comment-body').count(), 0);
    await goto('?season=invalid&commentPage=999');
    assert.equal(await page.getByLabel('Chọn mùa', { exact: true }).inputValue(), 'season-01-1');
    assert.equal(new URL(page.url()).searchParams.get('commentPage'), '2');
    await goto('?mock=empty');
    assert.equal(await page.locator('.aw-detail-episodes li').count(), 0);
    await page.goto(baseURL + path + '?mock=error');
    await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
    await title();
    await commentsReady();
    await page.goto(baseURL + path + '?mock=loading');
    await page.getByRole('status', { name: 'Đang tải chi tiết anime' }).waitFor();
    await page.goto(baseURL + path + '?comments=loading');
    await title();
    await page.getByRole('status').filter({ hasText: 'Đang tải bình luận…' }).waitFor();
    await page.goto(baseURL + '/anime/not-a-real-anime');
    await page.getByRole('heading', { name: 'Không tìm thấy anime', exact: true }).waitFor();
    await page.goto(baseURL + '/anime/loi-hua-cua-gio');
    await page.getByRole('heading', { name: 'Lời hứa của gió', exact: true, level: 1 }).waitFor();
    assert.equal(await page.locator('.aw-detail-episodes li').count(), 0);
    await page.goto(baseURL + '/anime/mua-he-o-dao-xanh');
    await page.getByRole('heading', { name: 'Mùa hè ở đảo xanh', exact: true, level: 1 }).waitFor();
    assert.equal(await page.locator('.aw-detail-episodes li').count(), 1);
    await goto('');
    const href = await page
      .locator('.aw-detail-related .aw-anime-card a')
      .first()
      .getAttribute('href');
    await page.locator('.aw-detail-related .aw-anime-card a').first().click();
    await page.waitForFunction(
      () => document.querySelector('.aw-detail')?.dataset.animeId === 'anime-03',
    );
    assert.ok(page.url().endsWith(href));
    await goto('');
    await page.evaluate(() => {
      Storage.prototype.setItem = () => {
        throw new Error('QuotaExceededError');
      };
    });
    await page
      .getByLabel('Cảm nhận của bạn', { exact: true })
      .fill('Không được giả vờ lưu thành công');
    await page.getByRole('button', { name: 'Gửi bình luận', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Không lưu được bình luận.' }).waitFor();
    assert.equal(
      await page
        .locator('.aw-comment-content')
        .getByText('Không được giả vờ lưu thành công', { exact: true })
        .count(),
      0,
    );
    await page.reload();
    await title();
    await commentsReady();
    await page.evaluate(() => {
      localStorage.setItem('aw:comments:v1:viewer', '{broken');
    });
    await page.reload();
    await title();
    await page.getByRole('heading', { name: 'Chưa tải được bình luận', exact: true }).waitFor();
    assert.equal(
      await page.evaluate(() => localStorage.getItem('aw:comments:v1:viewer')),
      '{broken',
    );
    await page.route('**/images/starlight.svg', (route) => route.abort());
    await page.reload();
    await title();
    await page.waitForFunction(() =>
      [...document.images].some(
        (image) => image.src.endsWith('/fallback.svg') && image.complete && image.naturalWidth > 0,
      ),
    );
    assert.deepEqual(errors, []);
    assert.deepEqual(external, []);
    console.log(
      'PASS Detail: 375/768/1440, published seasons/IDs/history, guest/member favorites, no fabricated playback, visible comments/create/edit/delete/ownership, pagination, safe text, account draft clearing, mock states/404/upcoming/movie, related navigation, quota/corrupt storage/fallback.',
    );
  } finally {
    await context.close();
  }
}

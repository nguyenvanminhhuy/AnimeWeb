import assert from 'node:assert/strict';

export async function verifyExplore(browser, baseURL) {
  const context = await browser.newContext();
  const external = [];
  const errors = [];
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
        const section = document.querySelector('.aw-explore-results');
        if (!section || section.getAttribute('aria-busy') !== 'false') return false;
        if (section.querySelector('[role="alert"]')) return true;
        const rendered = new URLSearchParams(section.dataset.query);
        const current = new URLSearchParams(location.search);
        return ['q', 'genre', 'year', 'status', 'format', 'sort', 'page', 'pageSize'].every(
          (key) => (rendered.get(key) ?? '') === (current.get(key) ?? ''),
        );
      });
    const cards = () => page.locator('.aw-explore-grid .aw-anime-card');
    const hrefs = () =>
      cards()
        .locator('a')
        .evaluateAll((links) => links.map((link) => link.getAttribute('href')));
    const goto = async (path) => {
      await page.goto(baseURL + path);
      await ready();
    };
    const select = async (label, value) => {
      const control = page.getByLabel(label, { exact: true });
      const name = await control.getAttribute('name');
      await control.selectOption(value);
      await page.waitForURL((url) => url.searchParams.get(name) === value, {
        waitUntil: 'load',
        timeout: 10000,
      });
      await ready();
    };
    const navigate = async (locator) => {
      await Promise.all([page.waitForNavigation(), locator.click()]);
      await ready();
    };
    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await goto('/anime');
      assert.equal(await cards().count(), 12);
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `overflow at ${width}`,
      );
      assert.equal(
        await page.locator('.aw-explore-filters details').evaluate((element) => element.open),
        width >= 768,
      );
      if (width === 375) {
        await page.locator('summary').focus();
        await page.keyboard.press('Enter');
        assert.equal(
          await page.locator('.aw-explore-filters details').evaluate((element) => element.open),
          true,
        );
      }
      assert.equal(
        await cards()
          .first()
          .locator('h3')
          .evaluate((element) => getComputedStyle(element).fontSize),
        '13px',
      );
      await page.screenshot({
        path: `../Anime-Web/FE/test-results/explore-${width}.png`,
        fullPage: true,
      });
    }

    const firstPage = await hrefs();
    await navigate(page.getByRole('link', { name: 'Sau →', exact: true }));
    assert.equal(new URL(page.url()).searchParams.get('page'), '2');
    const secondPage = await hrefs();
    assert.equal(secondPage.length, 12);
    assert.equal(new Set([...firstPage, ...secondPage]).size, 24);
    assert.equal(await page.locator('.aw-pagination a[aria-current="page"]').textContent(), '2');
    await page.reload();
    await ready();
    assert.deepEqual(await hrefs(), secondPage);
    await page.goBack();
    await ready();
    assert.deepEqual(await hrefs(), firstPage);
    await page.goForward();
    await ready();
    assert.deepEqual(await hrefs(), secondPage);

    await select('Thể loại', 'adventure');
    assert.equal(new URL(page.url()).searchParams.get('page'), '1');
    assert.equal(await page.getByLabel('Thể loại', { exact: true }).inputValue(), 'adventure');
    await select('Năm phát hành', '2025');
    await select('Trạng thái', 'completed');
    await select('Định dạng', 'movie');
    assert.equal(await cards().count(), 1);
    assert.equal(await cards().locator('h3').textContent(), 'Cầu vồng cuối chân trời');
    await page.reload();
    await ready();
    assert.equal(await cards().count(), 1);
    await navigate(page.getByRole('link', { name: 'Bỏ lọc Điện ảnh', exact: true }));
    assert.equal(await page.getByLabel('Định dạng', { exact: true }).inputValue(), '');
    assert.equal(await page.getByLabel('Thể loại', { exact: true }).inputValue(), 'adventure');
    assert.equal(await cards().count(), 4);
    await navigate(page.getByRole('link', { name: 'Xóa tất cả', exact: true }));
    assert.equal(await cards().count(), 12);

    await page.getByLabel('Từ khóa anime', { exact: true }).fill('hanh trinh anh sao');
    await Promise.all([
      page.waitForNavigation(),
      page.getByLabel('Từ khóa anime', { exact: true }).press('Enter'),
    ]);
    await ready();
    assert.equal(await cards().count(), 1);
    assert.equal(await cards().locator('h3').textContent(), 'Hành trình ánh sao');
    await cards().first().locator('a').click();
    await page
      .getByRole('heading', { name: 'Hành trình ánh sao', exact: true, level: 1 })
      .waitFor();

    await goto('/anime?q=moon');
    assert.equal(await cards().count(), 1);
    assert.equal(await cards().locator('h3').textContent(), 'Người đưa thư mặt trăng');
    await goto('/anime?q=khong-co-anime-nay');
    await page.getByRole('heading', { name: 'Chưa tìm thấy câu chuyện phù hợp' }).waitFor();
    assert.equal(await cards().count(), 0);
    assert.equal(await page.locator('.aw-pagination').count(), 0);
    await navigate(page.getByRole('link', { name: 'Xóa bộ lọc và khám phá lại' }));

    await select('Sắp xếp', 'title');
    await select('Mỗi trang', '24');
    const titles = await cards().locator('h3').allTextContents();
    assert.equal(titles.length, 24);
    assert.deepEqual(
      titles,
      [...titles].sort((a, b) => a.localeCompare(b, 'vi')),
    );
    assert.equal(new URL(page.url()).searchParams.get('page'), '1');
    await select('Sắp xếp', 'newest');
    const years = await cards().locator(':scope > p').allTextContents();
    assert.deepEqual(
      years.map((value) => Number(value.slice(0, 4))),
      years.map((value) => Number(value.slice(0, 4))).sort((a, b) => b - a),
    );

    await goto('/anime?page=999');
    assert.equal(new URL(page.url()).searchParams.get('page'), '2');
    assert.equal(await cards().count(), 12);
    await goto(
      '/anime?page=-2&genre=bogus&status=no&format=no&year=banana&sort=popular&pageSize=10000',
    );
    const normalized = new URL(page.url()).searchParams;
    assert.equal(normalized.get('page'), '1');
    assert.equal(normalized.get('pageSize'), '12');
    assert.equal(normalized.get('sort'), 'newest');
    assert.equal(normalized.has('genre'), false);
    assert.equal(normalized.has('status'), false);
    assert.equal(normalized.has('format'), false);
    assert.equal(normalized.has('year'), false);
    await goto('/anime?genre=Phi%C3%AAu%20l%C6%B0u');
    assert.equal(new URL(page.url()).searchParams.get('genre'), 'adventure');

    await goto('/anime?mock=error');
    await page.getByRole('heading', { name: 'Chuyến khám phá tạm gián đoạn' }).waitFor();
    await page.getByRole('button', { name: 'Thử lại' }).click();
    await ready();
    assert.equal(await cards().count(), 12);
    await goto('/anime?mock=empty');
    assert.equal(await cards().count(), 0);
    await navigate(page.getByRole('link', { name: 'Xóa bộ lọc và khám phá lại' }));
    assert.equal(await cards().count(), 12);
    await page.goto(baseURL + '/anime?mock=loading');
    await page.getByRole('status', { name: 'Đang tải danh mục anime' }).waitFor();

    await goto('/anime?genre=fantasy');
    const publicResults = await hrefs();
    await page.getByRole('link', { name: /Đăng nhập/ }).click();
    await page.getByRole('button', { name: 'Dùng tài khoản mới' }).click();
    await page.getByRole('link', { name: /Tiếp tục về trang/ }).click();
    await ready();
    assert.deepEqual(await hrefs(), publicResults);
    assert.equal(new URL(page.url()).searchParams.get('genre'), 'fantasy');
    await page.getByRole('button', { name: 'Đăng xuất demo' }).click();
    assert.deepEqual(await hrefs(), publicResults);

    await page.route('**/images/starlight.svg', (route) => route.abort());
    await goto('/anime');
    await page.waitForFunction(() =>
      [...document.images].some(
        (image) => image.src.endsWith('/fallback.svg') && image.complete && image.naturalWidth > 0,
      ),
    );
    assert.deepEqual(external, []);
    assert.deepEqual(errors, []);
    console.log(
      'PASS Explore: 375/768/1440, keyboard/mobile filters, search, combined filters/reset/removal, sorting, pagination, reload/back/forward, query validation/clamping, loading/error/retry/empty, guest/member parity, image fallback, no external requests/page errors.',
    );
  } finally {
    await context.close();
  }
}

import assert from 'node:assert/strict';

// Mock-only acceptance coverage for the approved responsive layouts and keyboard path.
export async function verifyUiuxPolish(browser, baseURL) {
  const context = await browser.newContext();
  const errors = [];
  const apiRequests = [];
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.startsWith('/api/')) {
      apiRequests.push(url.pathname);
      return route.abort();
    }
    return url.origin === baseURL ? route.continue() : route.abort();
  });
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    page.on('pageerror', (error) => errors.push(error.message));
    const capture = async (name, width) => {
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        name,
      );
      assert.equal(
        await page.locator('body').evaluate((el) => getComputedStyle(el).fontSize),
        '14px',
      );
      await page.screenshot({
        path: `../Anime-Web/FE/test-results/uiux-${name}-${width}.png`,
        fullPage: true,
      });
    };
    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(baseURL);
      await page.locator('.aw-hero h1').waitFor();
      const updated = page.locator('#updated-title');
      const ranking = page.locator('[data-top-anime]').first();
      assert.ok((await updated.boundingBox()).y < (await ranking.boundingBox()).y);
      assert.equal(await page.locator('[data-top-anime]').count(), 10);
      for (const box of await page.locator('.aw-slide-controls button').all()) {
        const bounds = await box.boundingBox();
        assert.ok(bounds.width >= 44 && bounds.height >= 44);
      }
      await page.getByRole('button', { name: 'Anime nổi bật tiếp theo' }).click();
      await page
        .getByRole('heading', { name: 'Kiếm sĩ bình minh', level: 1, exact: true })
        .waitFor();
      await page.getByRole('button', { name: 'Nổi bật: Hành trình ánh sao', exact: true }).click();
      if (width === 375) {
        const list = ranking.locator('..');
        assert.ok((await list.boundingBox()).height < 200);
        await page.getByRole('button', { name: 'Xếp hạng tiếp theo', exact: true }).click();
        await page.waitForFunction(
          () => document.querySelector('[data-top-anime]').parentElement.scrollLeft > 0,
        );
      }
      await page.evaluate(() => scrollTo(0, 0));
      await capture('home', width);

      await page.goto(`${baseURL}/anime`);
      await page.locator('.aw-anime-card').first().waitFor();
      for (const id of ['genre', 'year', 'status', 'format']) {
        assert.ok(await page.locator(`#explore-${id}`).isVisible());
      }
      await page.locator('#explore-year').selectOption('2026');
      await page.locator('#explore-status').selectOption('airing');
      await page.locator('#explore-format').selectOption('tv');
      await page.waitForFunction(() => {
        const params = new URLSearchParams(location.search);
        return (
          params.get('year') === '2026' &&
          params.get('status') === 'airing' &&
          params.get('format') === 'tv' &&
          document.querySelector('.aw-explore-results').getAttribute('aria-busy') === 'false'
        );
      });
      assert.equal(await page.locator('#explore-year').inputValue(), '2026');
      assert.equal(await page.locator('#explore-status').inputValue(), 'airing');
      await capture('explore', width);

      await page.goto(`${baseURL}/anime/hanh-trinh-anh-sao`);
      await page.locator('#episodes').waitFor();
      await page.locator('.aw-comments[aria-busy="false"]').waitFor();
      assert.ok(
        (await page.locator('#episodes').boundingBox()).y <
          (await page.locator('#synopsis-title').boundingBox()).y,
      );
      if (width === 375) {
        assert.ok(
          (await page.locator('#episodes').boundingBox()).y <
            (await page.locator('.aw-detail-info').boundingBox()).y,
        );
        const actions = await page.locator('.aw-detail-actions').boundingBox();
        assert.ok(actions.width > 280, 'Detail actions span the mobile hero');
      }
      await page.locator('#detail-season').selectOption('season-01-side');
      await page.waitForFunction(
        () => document.querySelector('#episodes').dataset.seasonId === 'season-01-side',
      );
      assert.equal(await page.locator('.aw-detail-episodes li').count(), 2);
      await capture('detail', width);
    }

    await page.goto(`${baseURL}/login?returnTo=%2Flibrary`);
    const email = page.locator('#login-email');
    const border = await email.evaluate((el) => getComputedStyle(el).borderColor);
    await email.focus();
    await page.keyboard.press('Tab');
    const password = page.locator('#login-password');
    assert.ok(await password.evaluate((el) => el === document.activeElement));
    assert.notEqual(await password.evaluate((el) => getComputedStyle(el).outlineStyle), 'none');
    await email.focus();
    assert.equal(await email.evaluate((el) => getComputedStyle(el).borderColor), border);
    await page.getByRole('button', { name: 'Dùng tài khoản có lịch sử mẫu', exact: true }).click();
    await page.getByRole('link', { name: 'Tiếp tục về trang đã yêu cầu', exact: true }).click();
    await page.locator('.aw-library-collection[aria-busy="false"]').waitFor();
    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.locator('.aw-library-summary').isVisible(), width >= 768);
      assert.equal(await page.locator('.aw-library-tabs a').count(), 3);
      await page.locator('.aw-library-tabs a').nth(1).click();
      await page.locator('.aw-library-collection[aria-busy="false"]').waitFor();
      assert.match(new URL(page.url()).search, /tab=watching/);
      assert.ok(await page.getByRole('button', { name: /^Tài khoản của / }).isVisible());
      await capture('library', width);
    }
    await context.close();

    // Separate sessions: guest has no admin records; manage can read; admin sees guarded actions.
    for (const writable of [false, true]) {
      const admin = await browser.newContext();
      await admin.route('**/*', (route) => {
        const url = new URL(route.request().url());
        if (url.pathname.startsWith('/api/')) {
          apiRequests.push(url.pathname);
          return route.abort();
        }
        return url.origin === baseURL ? route.continue() : route.abort();
      });
      const adminPage = await admin.newPage();
      adminPage.setDefaultTimeout(10000);
      adminPage.on('pageerror', (error) => errors.push(error.message));
      try {
        await adminPage.goto(`${baseURL}/admin/anime`);
        await adminPage.getByRole('heading', { name: 'Đăng nhập để mở trang quản trị' }).waitFor();
        assert.equal(await adminPage.locator('tbody tr').count(), 0);
        await adminPage.getByRole('link', { name: 'Đăng nhập', exact: true }).click();
        await adminPage
          .getByRole('button', {
            name: writable ? 'Dùng phiên quản trị có quyền chỉnh sửa' : 'Dùng phiên quản trị mẫu',
            exact: true,
          })
          .click();
        await adminPage
          .getByRole('link', { name: 'Tiếp tục về trang đã yêu cầu', exact: true })
          .click();
        await adminPage.locator('[data-admin-anime="ready"]').waitFor();
        for (const width of [375, 768, 1440]) {
          await adminPage.setViewportSize({ width, height: 900 });
          const row = adminPage.locator('tbody tr').first();
          assert.equal(
            await row.evaluate((el) => getComputedStyle(el).display),
            width < 768 ? 'block' : 'table-row',
          );
          assert.equal(await row.getByRole('link', { name: /^Sửa / }).count(), writable ? 1 : 0);
          assert.equal(await row.getByRole('button', { name: /^Xoá / }).count(), writable ? 1 : 0);
          if (width === 375 && writable) {
            for (const action of await row.locator('td[data-label="Thao tác"] .aw-button').all()) {
              const bounds = await action.boundingBox();
              assert.ok(
                bounds.width >= 44 &&
                  bounds.height >= 44 &&
                  bounds.x >= 0 &&
                  bounds.x + bounds.width <= width,
              );
            }
          }
          assert.equal(await adminPage.locator('.aw-pagination').count(), 2);
          assert.ok(
            await adminPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          );
          if (writable)
            await adminPage.screenshot({
              path: `../Anime-Web/FE/test-results/uiux-admin-${width}.png`,
              fullPage: true,
            });
        }
        await rowActionChecks(adminPage, writable);
      } finally {
        await admin.close();
      }
    }
    assert.deepEqual(apiRequests, [], 'Mock checks must never request a BE API');
    assert.deepEqual(errors, []);
    console.log(
      'PASS UI/UX polish: 375/768/1440, focus, 44px carousel/actions, filters, ranking scroll, detail seasons/comments, library tabs/avatar, guest/read/write admin and dual pagination; no API calls.',
    );
  } finally {
    await context.close();
  }
}

async function rowActionChecks(page, writable) {
  if (!writable) return;
  await page.setViewportSize({ width: 375, height: 900 });
  await page.locator('tbody tr').first().getByRole('button', { name: /^Xoá / }).click();
  await page.getByRole('dialog').waitFor();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /Hủy|Huỷ/ })
    .click();
  assert.equal(await page.getByRole('dialog').count(), 0);
}

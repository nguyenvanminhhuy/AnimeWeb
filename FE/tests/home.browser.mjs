import assert from 'node:assert/strict';

// Run with Chromium supplied by the workspace's existing @playwright/test.
export async function verifyHome(browser, baseURL) {
  const context = await browser.newContext();
  const outsideRequests = [];
  const errors = [];
  await context.route('**/*', (route) => {
    if (new URL(route.request().url()).origin !== baseURL) {
      outsideRequests.push(route.request().url());
      return route.abort();
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  const homeReady = () =>
    page.getByRole('heading', { name: 'Hành trình ánh sao', exact: true, level: 1 }).waitFor();
  await page.goto(baseURL);
  await homeReady();
  assert.equal(await page.getByRole('heading', { name: /Tiếp tục xem/ }).count(), 0);
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.ok(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      `overflow at ${width}`,
    );
    assert.equal(await page.locator('.aw-anime-card').count(), 10);
    assert.equal(
      await page
        .locator('.aw-anime-card h3')
        .first()
        .evaluate((element) => getComputedStyle(element).fontSize),
      '14px',
    );
    assert.equal(
      await page
        .locator('.aw-btn-primary')
        .first()
        .evaluate((element) => getComputedStyle(element).backgroundColor),
      'rgb(172, 154, 247)',
    );
    assert.ok(
      await page.locator('.aw-hero-art').evaluate((img) => img.complete && img.naturalWidth > 0),
    );
    await page.screenshot({
      path: `../Anime-Web/FE/test-results/home-${width}.png`,
      fullPage: true,
    });
  }
  await page.getByRole('button', { name: 'Anime nổi bật tiếp theo' }).click();
  await page.getByRole('heading', { name: 'Kiếm sĩ bình minh', exact: true, level: 1 }).waitFor();
  await page.getByRole('button', { name: 'Nổi bật: Hành trình ánh sao', exact: true }).click();
  await page.getByRole('button', { name: 'Tình cảm', exact: true }).click();
  await page
    .locator('.aw-filter-chips button[aria-pressed="true"]')
    .filter({ hasText: 'Tình cảm' })
    .waitFor();
  assert.equal(await page.locator('.aw-recommendation-grid .aw-anime-card').count(), 2);
  assert.equal(new URL(page.url()).searchParams.get('genre'), 'Tình cảm');
  await page.reload();
  await homeReady();
  assert.equal(
    await page.getByRole('button', { name: 'Tình cảm', exact: true }).getAttribute('aria-pressed'),
    'true',
  );
  await page.getByRole('link', { name: 'Yêu thích', exact: true }).click();
  await page.getByRole('button', { name: 'Dùng tài khoản có lịch sử mẫu' }).click();
  await page.getByRole('link', { name: /Tiếp tục về trang/ }).click();
  await homeReady();
  await page.getByRole('heading', { name: /Tiếp tục xem/ }).waitFor();
  assert.equal(await page.locator('progress').count(), 2);
  await page.getByRole('button', { name: 'Yêu thích', exact: true }).click();
  await page.reload();
  await homeReady();
  assert.equal(
    await page.getByRole('button', { name: 'Đã yêu thích' }).getAttribute('aria-pressed'),
    'true',
  );
  await page.locator('.aw-continue-card').first().click();
  assert.ok(page.url().endsWith('/watch/episode-01-03'));
  await page.getByText(/Chưa có video demo/).waitFor();
  await page.getByRole('link', { name: 'Về Trang chủ' }).click();
  await homeReady();
  await page.getByRole('button', { name: 'Đăng xuất' }).click();
  assert.equal(await page.locator('progress').count(), 0);
  await page.goto(`${baseURL}/login`);
  await page.getByRole('button', { name: 'Dùng tài khoản mới' }).click();
  await page.getByRole('link', { name: /Tiếp tục về trang/ }).click();
  await homeReady();
  assert.equal(await page.locator('progress').count(), 0);
  assert.equal(
    await page.getByRole('button', { name: 'Yêu thích', exact: true }).getAttribute('aria-pressed'),
    'false',
  );
  await page.getByRole('button', { name: 'Đăng xuất' }).click();
  await page.goto(`${baseURL}/library`);
  await page.getByRole('heading', { name: 'Thư viện dành cho thành viên' }).waitFor();
  await page.goto(`${baseURL}/`);
  await homeReady();
  await page.getByLabel('Tìm anime', { exact: true }).fill('ánh sao');
  await page.getByRole('button', { name: 'Tìm kiếm', exact: true }).click();
  await page.getByRole('heading', { name: 'Khám phá anime' }).waitFor();
  assert.equal(new URL(page.url()).searchParams.get('q'), 'ánh sao');
  await page.reload();
  await page.getByRole('heading', { name: 'Khám phá anime' }).waitFor();
  for (const state of ['error', 'empty']) {
    await page.goto(`${baseURL}/?mock=${state}`);
    await page.getByRole('button', { name: 'Thử lại' }).click();
    await homeReady();
  }
  await page.goto(`${baseURL}/?mock=loading`);
  await page.getByRole('status', { name: 'Đang tải Trang chủ' }).waitFor();
  await page.goto(`${baseURL}/login?returnTo=https://example.com`);
  await page.getByRole('button', { name: 'Dùng tài khoản mới' }).click();
  assert.equal(
    await page.getByRole('link', { name: /Tiếp tục về trang/ }).getAttribute('href'),
    '/',
  );
  await page.goto(`${baseURL}/not-a-page`);
  await page.getByRole('heading', { name: 'Không tìm thấy trang' }).waitFor();
  await page.evaluate(() => {
    localStorage.setItem('aw:session:v1', '{broken');
  });
  await page.goto(baseURL);
  await homeReady();
  assert.equal(await page.locator('progress').count(), 0);
  await page.route('**/images/starlight.svg', (route) => route.abort());
  await page.reload();
  await homeReady();
  await page.waitForFunction(() =>
    [...document.images].some(
      (img) => img.src.endsWith('fallback.svg') && img.complete && img.naturalWidth > 0,
    ),
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(outsideRequests, []);
  await context.close();
  console.log(
    'PASS: responsive 375/768/1440, carousel, filters/reload, guest/member, favorites, isolated accounts, logout, routes/search, loading/empty/error/retry, safe returnTo, corrupt storage, artwork fallback; no external requests or page errors.',
  );
}

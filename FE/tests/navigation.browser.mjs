import assert from 'node:assert/strict';

export async function verifyNavigation(browser, baseURL) {
  const context = await browser.newContext();
  const errors = [];
  let documents = 0;
  await context.route('**/*', (route) => {
    assert.equal(new URL(route.request().url()).origin, baseURL);
    if (route.request().resourceType() === 'document') documents++;
    return route.continue();
  });
  try {
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(baseURL);
    await page.locator('.aw-hero h1').waitFor();
    await page.evaluate(() => {
      window.__spaMarker = 'same-document';
    });
    const unchangedDocument = async () => {
      assert.equal(await page.evaluate(() => window.__spaMarker), 'same-document');
      assert.equal(documents, 1);
    };
    const menu = page.getByRole('navigation', { name: 'Điều hướng chính' });
    await menu.getByRole('link', { name: 'Khám phá' }).click();
    await page.locator('.aw-explore-results[aria-busy="false"]').waitFor();
    assert.equal(
      await menu.getByRole('link', { name: 'Khám phá' }).getAttribute('aria-current'),
      'page',
    );
    await unchangedDocument();
    await page.getByLabel('Từ khóa anime', { exact: true }).fill('moon');
    await page.getByLabel('Từ khóa anime', { exact: true }).press('Enter');
    await page.waitForFunction(
      () =>
        document.querySelector('.aw-explore-results')?.getAttribute('aria-busy') === 'false' &&
        document.querySelectorAll('.aw-anime-card').length === 1,
    );
    assert.equal(await page.locator('.aw-anime-card h3').textContent(), 'Người đưa thư mặt trăng');
    await unchangedDocument();
    await page.goBack();
    await page.waitForFunction(() => document.querySelectorAll('.aw-anime-card').length === 12);
    assert.equal(await page.getByLabel('Từ khóa anime', { exact: true }).inputValue(), '');
    await page.goForward();
    await page.waitForFunction(() => document.querySelectorAll('.aw-anime-card').length === 1);
    assert.equal(await page.getByLabel('Từ khóa anime', { exact: true }).inputValue(), 'moon');
    await page.locator('.aw-anime-card a').click();
    await page
      .getByRole('heading', { name: 'Người đưa thư mặt trăng', exact: true, level: 1 })
      .waitFor();
    assert.equal(new URL(page.url()).pathname, '/anime/nguoi-dua-thu-mat-trang');
    await unchangedDocument();
    await menu.getByRole('link', { name: 'Thư viện' }).click();
    await page.getByRole('heading', { name: 'Chào mừng đến Anime Web' }).waitFor();
    assert.equal(new URL(page.url()).searchParams.get('returnTo'), '/library');
    await page.evaluate(() => {
      Storage.prototype.setItem = () => {
        throw new Error('Storage unavailable in test');
      };
    });
    await page.getByRole('button', { name: 'Dùng tài khoản mới' }).click();
    await page.getByRole('link', { name: /Tiếp tục về trang/ }).click();
    await page.getByRole('heading', { name: 'Thư viện của bạn', exact: true }).waitFor();
    await unchangedDocument();
    await page.getByRole('button', { name: 'Đăng xuất demo' }).click();
    await page
      .getByRole('heading', { name: 'Thư viện dành cho thành viên', exact: true })
      .waitFor();
    await unchangedDocument();
    assert.deepEqual(errors, []);
    console.log(
      'PASS React Router: links/forms/back/forward/detail/login/returnTo/library guard use one document; session survives SPA navigation without localStorage; active menu and form query stay synchronized.',
    );
  } finally {
    await context.close();
  }
}

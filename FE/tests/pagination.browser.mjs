import assert from 'node:assert/strict';

export async function verifyPagination(browser, baseURL) {
  const context = await browser.newContext();
  const errors = [];
  await context.route('**/*', (route) =>
    new URL(route.request().url()).origin === baseURL ? route.continue() : route.abort(),
  );
  try {
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    const goto = async (query) => {
      await page.goto(`${baseURL}/tests/fixtures/pagination.html?${query}`);
      await page.getByRole('heading', { name: 'Pagination fixture' }).waitFor();
    };
    const nav = () => page.getByRole('navigation', { name: 'Test pagination' });
    const current = async (value) => {
      await page.waitForFunction(
        (expected) =>
          document.querySelector('.aw-pagination [aria-current]')?.textContent.trim() ===
          String(expected),
        value,
      );
    };
    await goto('page=50&total=100&q=kept');
    assert.deepEqual(await nav().locator('a[aria-label]').allTextContents(), [
      '1',
      '49',
      '50',
      '51',
      '100',
    ]);
    assert.equal(await nav().locator('.aw-pagination-gap').count(), 2);
    await page.evaluate(() => {
      window.__paginationDocument = 'same';
    });
    await nav().locator('a[rel="next"]').click();
    await current(51);
    assert.equal(new URL(page.url()).searchParams.get('q'), 'kept');
    assert.equal(await page.evaluate(() => window.__paginationDocument), 'same');
    await page.goBack();
    await current(50);
    await page.goForward();
    await current(51);
    await page.reload();
    await current(51);

    for (const [size, height] of [
      ['sm', 32],
      ['md', 44],
      ['lg', 52],
    ]) {
      for (const width of [375, 768, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        await goto(`page=50&total=100&size=${size}`);
        const active = nav().locator('[aria-current]');
        assert.equal(
          await active.evaluate((element) => getComputedStyle(element).fontSize),
          '14px',
        );
        assert.ok((await active.boundingBox()).height >= height);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      }
    }
    for (const flag of ['disabled', 'loading']) {
      await goto(`page=50&total=100&${flag}=1`);
      assert.equal(await nav().locator('a').count(), 0);
      assert.equal(await nav().locator('[aria-disabled="true"]').count(), 7);
      assert.equal(await nav().getAttribute('aria-busy'), flag === 'loading' ? 'true' : null);
      assert.equal(await nav().locator('[aria-current]').textContent(), '50');
    }
    await goto('page=1&total=100');
    assert.equal(await nav().locator('a[rel="prev"]').count(), 0);
    await goto('page=100&total=100');
    assert.equal(await nav().locator('a[rel="next"]').count(), 0);
    await goto('page=-5&total=10');
    await current(1);
    await goto('page=999&total=10');
    await current(10);
    await goto('page=NaN&total=10');
    await current(1);
    for (const total of ['0', '1', '-10', 'NaN', 'Infinity']) {
      await goto(`page=1&total=${total}`);
      assert.equal(await page.locator('.aw-pagination').count(), 0);
    }
    await goto('page=500000000&total=1000000000&siblings=100');
    assert.equal(await nav().locator('a[aria-label]').count(), 9);
    await nav().locator('[aria-current]').focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    assert.equal(
      await nav()
        .locator('[aria-current]')
        .evaluate((element) => getComputedStyle(element).outlineStyle),
      'solid',
    );
    assert.deepEqual(errors, []);
    console.log(
      'PASS Pagination: query/SPA/history/reload, first/last/ellipsis/current, sizes/responsive/14px, loading/disabled, invalid inputs, bounded billion-page rendering and keyboard focus.',
    );
  } finally {
    await context.close();
  }
}

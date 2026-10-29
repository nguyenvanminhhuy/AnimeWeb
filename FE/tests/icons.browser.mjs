import assert from 'node:assert/strict';

export async function verifyIcons(browser, baseURL) {
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
    await page.goto(`${baseURL}/tests/fixtures/icons.html`);
    await page.getByRole('img', { name: 'Saved successfully' }).waitFor();
    assert.equal(await page.getByRole('img').count(), 1);
    for (const [size, pixels] of [
      ['sm', 16],
      ['md', 18],
      ['lg', 24],
    ]) {
      const icon = page.locator(`#sizes [data-size="${size}"]`);
      const metrics = await icon.evaluate((element) => ({
        width: element.getBoundingClientRect().width,
        height: element.getBoundingClientRect().height,
        color: getComputedStyle(element).color,
        parentColor: getComputedStyle(element.parentElement).color,
      }));
      assert.equal(metrics.width, pixels);
      assert.equal(metrics.height, pixels);
      assert.equal(metrics.color, metrics.parentColor);
      assert.equal(await icon.getAttribute('aria-hidden'), 'true');
      assert.equal(await icon.getAttribute('focusable'), 'false');
    }
    assert.equal(await page.getByRole('button', { name: 'Search', exact: true }).count(), 1);
    assert.equal(await page.locator('#registry svg path').count(), 13);
    assert.equal(await page.locator('[data-name="heart"]').getAttribute('data-prefix'), 'far');
    assert.equal(
      await page.locator('[data-name="heart-filled"]').getAttribute('data-prefix'),
      'fas',
    );
    assert.equal(
      await page.locator('style:not([data-vite-dev-id])').count(),
      0,
      'Font Awesome must not inject global CSS beyond the Vite stylesheet',
    );

    await page.goto(baseURL);
    await page.locator('.aw-hero').waitFor();
    const favorite = page.getByRole('link', { name: 'Yêu thích', exact: true });
    assert.equal(await favorite.locator('svg[data-icon="heart"]').count(), 1);
    await favorite.click();
    await page.getByRole('button', { name: 'Dùng tài khoản mới', exact: true }).click();
    await page.locator('.aw-auth-success a.aw-button').click();
    const toggle = page.getByRole('button', { name: 'Yêu thích', exact: true });
    await toggle.click();
    const saved = page.getByRole('button', { name: 'Đã yêu thích', exact: true });
    assert.equal(await saved.getAttribute('aria-pressed'), 'true');
    assert.equal(await saved.locator('svg[data-prefix="fas"][data-icon="heart"]').count(), 1);
    assert.deepEqual(external, []);
    assert.deepEqual(errors, []);
    console.log(
      'PASS Font Awesome: local SVG registry, 16/18/24 sizing, inherited color, decorative/semantic accessibility, no CSS injection or CDN, icon-only button label, favorite regular/solid toggle and login returnTo.',
    );
  } finally {
    await context.close();
  }
}

import assert from 'node:assert/strict';

export async function verifyControlSizes(browser, baseURL) {
  const context = await browser.newContext();
  const errors = [];
  await context.route('**/*', (route) =>
    new URL(route.request().url()).origin === baseURL ? route.continue() : route.abort(),
  );
  try {
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`${baseURL}/tests/fixtures/control-sizes.html`);
    await page.locator('#native-width').waitFor();
    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const kind of ['button', 'link', 'anchor', 'quiet', 'input', 'combobox', 'selectbox']) {
        const heights = [];
        for (const size of ['sm', 'md', 'lg', 'default']) {
          const control = page.locator(`[data-size="${size}"] [data-kind="${kind}"]`);
          const metrics = await control.evaluate((element) => ({
            height: element.getBoundingClientRect().height,
            font: getComputedStyle(element).fontSize,
            nativeSize: element.getAttribute('size'),
          }));
          assert.equal(metrics.font, '14px', `${kind} ${size} font`);
          assert.equal(metrics.nativeSize, null, `${kind} must not leak UI size to DOM`);
          heights.push(metrics.height);
        }
        assert.ok(heights[0] >= 32 && heights[1] >= 44 && heights[2] >= 52, `${kind} min heights`);
        assert.ok(heights[0] < heights[1] && heights[1] < heights[2], `${kind} sizes increase`);
        assert.equal(heights[1], heights[3], `${kind} defaults to md`);
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
    assert.equal(await page.locator('#native-width').getAttribute('size'), '30');
    assert.equal(await page.locator('#native-rows').getAttribute('size'), '3');
    assert.equal(await page.locator('#unstyled').getAttribute('class'), 'aw-button-unstyled');
    assert.ok((await page.locator('#unstyled-sized').boundingBox()).height >= 52);
    assert.equal(await page.locator('#hidden').isVisible(), false);
    assert.equal(await page.locator('#hidden').inputValue(), 'kept');
    await page.locator('#combo-sm').fill('Free input');
    await page.locator('#select-lg').selectOption('two');
    const data = await page
      .locator('#controls')
      .evaluate((form) => Object.fromEntries(new FormData(form)));
    assert.equal(data['combo-sm'], 'Free input');
    assert.equal(data['select-lg'], 'two');
    assert.deepEqual(errors, []);
    console.log(
      'PASS control sizes: sm/md/lg/default for all four controls, Button link/anchor/quiet, existing page CSS, 14px, responsive, htmlSize, unstyled opt-in, hidden and native FormData.',
    );
  } finally {
    await context.close();
  }
}

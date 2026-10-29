import assert from 'node:assert/strict';

export async function verifyButton(browser, baseURL) {
  const context = await browser.newContext();
  const errors = [];
  await context.route('**/*', (route) =>
    new URL(route.request().url()).origin === baseURL ? route.continue() : route.abort(),
  );
  try {
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`${baseURL}/tests/fixtures/button.html`);
    const save = page.getByRole('button', { name: 'Save', exact: true });
    await save.waitFor();
    assert.deepEqual(
      await save
        .locator(':scope > span')
        .evaluateAll((elements) => elements.map((element) => element.className)),
      ['aw-button-icon', 'aw-button-label', 'aw-button-icon'],
    );
    assert.equal(await save.evaluate((element) => getComputedStyle(element).gap), '8px');
    assert.equal(await save.locator('[aria-hidden="true"]').count(), 3);
    assert.equal(await page.getByRole('img', { name: 'Hidden slot' }).count(), 0);
    assert.equal(await page.locator('#plain > span').count(), 0);
    assert.equal(await page.locator('#zero').textContent(), '0');
    assert.equal(await page.locator('#only-icon .aw-button-label').count(), 0);
    assert.equal(await page.getByRole('button', { name: 'Close', exact: true }).count(), 1);
    assert.equal(await page.locator('#rich strong').textContent(), 'Rich content');
    assert.equal(await page.locator('#loading').isDisabled(), true);
    assert.equal(await page.locator('#loading').getAttribute('aria-busy'), 'true');
    assert.equal(await page.locator('#anchor').getAttribute('href'), '#target');
    assert.equal(await page.locator('#link').getAttribute('data-ref-tag'), 'A');
    assert.equal(await page.locator('[label], [starticon], [endicon]').count(), 0);
    await save.click();
    assert.equal(await page.locator('#clicked').textContent(), '1');
    assert.equal(await page.locator('#submitted').textContent(), '0');
    await page.locator('#submit').click();
    assert.equal(await page.locator('#submitted').textContent(), '1');
    await page.getByRole('link', { name: 'Next', exact: true }).click();
    await page.waitForFunction(
      () => document.querySelector('#location').textContent === '/next?kept=yes',
    );
    const positions = await page
      .locator('#rtl > span')
      .evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().x));
    assert.ok(positions[0] > positions[1] && positions[1] > positions[2]);
    const heights = [];
    for (const size of ['sm', 'md', 'lg']) {
      const button = page.locator(`#size-${size}`);
      heights.push((await button.boundingBox()).height);
      assert.equal(await button.evaluate((element) => getComputedStyle(element).fontSize), '14px');
    }
    assert.ok(heights[0] < heights[1] && heights[1] < heights[2]);
    assert.deepEqual(errors, []);
    console.log(
      'PASS Button slots: label/children, ordered decorative icons/gap, icon-only and zero label, loading, default/explicit submit, Link/anchor/ref, clean DOM props, RTL and sizes.',
    );
  } finally {
    await context.close();
  }
}

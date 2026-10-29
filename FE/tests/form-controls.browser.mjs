import assert from 'node:assert/strict';

export async function verifyFormControls(browser, baseURL) {
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
        const section = document.querySelector('.aw-explore-results');
        return (
          section?.getAttribute('aria-busy') === 'false' &&
          new URLSearchParams(section.dataset.query).get('q') ===
            new URLSearchParams(location.search).get('q')
        );
      });
    await page.goto(`${baseURL}/anime`);
    await ready();
    const input = page.getByRole('combobox', { name: 'Từ khóa anime', exact: true });
    const suggestions = await input.evaluate((element) =>
      [...element.list.options].map((option) => option.value),
    );
    const titles = await page.locator('.aw-explore-grid .aw-anime-card h3').allTextContents();
    assert.deepEqual(
      suggestions,
      titles.map((title) => title.trim()),
    );
    assert.equal(new Set(suggestions).size, suggestions.length);
    assert.ok(suggestions.length > 0);
    assert.equal(await input.getAttribute('name'), 'q');
    assert.equal(await input.evaluate((element) => element.labels.length), 1);
    await input.fill(suggestions[0]);
    await page.waitForTimeout(150);
    assert.equal(new URL(page.url()).searchParams.get('q'), null);
    await page.waitForURL((url) => url.searchParams.get('q') === suggestions[0]);
    await ready();
    assert.equal(await input.evaluate((element) => element === document.activeElement), true);
    assert.equal(await input.inputValue(), suggestions[0]);
    assert.equal(await page.locator('.aw-anime-card h3').first().textContent(), suggestions[0]);

    // An arbitrary value remains valid input; suggestions do not constrain search.
    const freeText = 'no-matching-anime-control-test';
    await input.fill(freeText);
    await page.waitForURL((url) => url.searchParams.get('q') === freeText);
    await ready();
    assert.equal(await input.inputValue(), freeText);
    assert.equal(await input.evaluate((element) => element.list.options.length), 0);
    assert.equal(await page.locator('.aw-explore-empty').count(), 1);
    await page.goBack();
    await page.waitForURL((url) => url.searchParams.get('q') === suggestions[0]);
    await ready();
    assert.equal(await input.inputValue(), suggestions[0]);
    assert.ok(await input.evaluate((element) => element.list.options.length > 0));

    // Selectbox options API keeps native form events and the field's accessible name.
    const sort = page.getByLabel('Sắp xếp', { exact: true });
    await sort.selectOption('title');
    await page.waitForURL((url) => url.searchParams.get('sort') === 'title');
    await ready();
    assert.equal(await sort.inputValue(), 'title');
    assert.equal(await input.inputValue(), suggestions[0]);
    // Search updates retain the selected sort, and clearing restores the full catalog.
    await input.fill('');
    await page.waitForURL((url) => !url.searchParams.has('q'));
    await ready();
    assert.equal(new URL(page.url()).searchParams.get('sort'), 'title');
    assert.equal(await page.locator('.aw-anime-card').count(), 12);

    // Do not search an unfinished IME composition.
    await input.dispatchEvent('compositionstart');
    await input.fill('moon');
    await page.waitForTimeout(450);
    assert.equal(new URL(page.url()).searchParams.get('q'), null);
    await input.dispatchEvent('compositionend');
    await page.waitForURL((url) => url.searchParams.get('q') === 'moon');
    await ready();
    assert.equal(await page.locator('.aw-anime-card').count(), 1);

    // Back cancels a pending search instead of allowing it to overwrite navigation.
    await input.fill('pending-search');
    await page.goBack();
    await ready();
    await page.waitForTimeout(450);
    assert.equal(new URL(page.url()).searchParams.get('q'), null);
    assert.equal(await input.inputValue(), '');
    assert.deepEqual(errors, []);
    assert.deepEqual(external, []);
    console.log(
      'PASS form controls: labeled native combobox/datalist, suggestions from results, free text/form query, empty suggestions, Back restore, Selectbox options/onChange preserve search; no external requests/page errors.',
    );
  } finally {
    await context.close();
  }
}

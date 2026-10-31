import assert from 'node:assert/strict';

export async function verifyAdminPagination(page, label, sizeLabel) {
  const top = page.getByRole('navigation', { name: `${label} phía trên`, exact: true });
  const bottom = page.getByRole('navigation', { name: label, exact: true });
  assert.equal(await top.count(), 1);
  assert.equal(await bottom.count(), 1);
  const upperBar = top.locator('..');
  assert.equal(await upperBar.getByLabel(sizeLabel, { exact: true }).count(), 1);
  assert.equal(await bottom.locator('..').getByRole('combobox').count(), 0);
  assert.equal(await page.getByLabel(sizeLabel, { exact: true }).count(), 1);
  assert.deepEqual(
    await top.locator('a').evaluateAll((links) => links.map((link) => link.getAttribute('href'))),
    await bottom
      .locator('a')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href'))),
  );
  assert.equal(
    await top.locator('[aria-current]').textContent(),
    await bottom.locator('[aria-current]').textContent(),
  );
  const beforeTable = await top.evaluate((nav) => {
    const table = nav.closest('section').querySelector('table');
    return !!(nav.compareDocumentPosition(table) & Node.DOCUMENT_POSITION_FOLLOWING);
  });
  const afterTable = await bottom.evaluate((nav) => {
    const table = nav.closest('section').querySelector('table');
    return !!(table.compareDocumentPosition(nav) & Node.DOCUMENT_POSITION_FOLLOWING);
  });
  assert.ok(beforeTable && afterTable, 'Pagination surrounds the records');
}

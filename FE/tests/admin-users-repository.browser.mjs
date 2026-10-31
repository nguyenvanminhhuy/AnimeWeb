import assert from 'node:assert/strict';

export async function verifyAdminUsersRepository(browser, baseURL) {
  const context = await browser.newContext();
  const errors = [];
  await context.route('**/*', (route) => {
    assert.equal(new URL(route.request().url()).origin, baseURL);
    return route.continue();
  });
  try {
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(baseURL + '/tests/fixtures/admin-users-repository.html');
    await page.waitForFunction(() => typeof window.verifyAdminUsersRepository === 'function');
    const report = await page.evaluate(() => window.verifyAdminUsersRepository());
    assert.deepEqual(errors, []);
    console.log(`PASS Admin Users repository: ${report}.`);
  } finally {
    await context.close();
  }
}

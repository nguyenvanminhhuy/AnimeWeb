export async function verifyBackendCompatibility(browser, baseURL) {
  const context = await browser.newContext();
  const outside = [];
  await context.route('**/*', (route) =>
    new URL(route.request().url()).origin === baseURL
      ? route.continue()
      : (outside.push(route.request().url()), route.abort()),
  );
  try {
    const page = await context.newPage();
    await page.goto(baseURL + '/tests/fixtures/backend-compatibility.html');
    await page.waitForFunction(() => typeof window.verifyBackendCompatibility === 'function');
    console.log(
      'PASS Backend compatibility: ' +
        (await page.evaluate(() => window.verifyBackendCompatibility())),
    );
    if (outside.length) throw new Error('Unexpected external requests: ' + outside.join(','));
  } finally {
    await context.close();
  }
}

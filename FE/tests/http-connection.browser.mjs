export async function verifyHttpConnection(browser, baseURL) {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.goto(baseURL + '/tests/fixtures/http-connection.html');
    await page.waitForFunction(() => typeof window.verifyHttpConnection === 'function');
    console.log(
      'PASS HTTP connection: ' + (await page.evaluate(() => window.verifyHttpConnection())),
    );
  } finally {
    await context.close();
  }
}

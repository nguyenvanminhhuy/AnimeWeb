import assert from 'node:assert/strict';

export async function verifyMediaCompatibility(browser, baseURL) {
  const context = await browser.newContext();
  const errors = [],
    requests = [];
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url());
    assert.equal(url.origin, baseURL);
    requests.push(url.pathname);
    if (url.pathname === '/__fixture.srt')
      return route.fulfill({
        contentType: 'text/plain',
        body: '1\n00:00:01,000 --> 00:00:02,000\nFixture subtitle',
      });
    if (url.pathname === '/__fixture.m3u8')
      return route.fulfill({ contentType: 'application/vnd.apple.mpegurl', body: '#EXTM3U\n' });
    if (url.pathname === '/__fixture.mp4')
      return route.fulfill({ contentType: 'video/mp4', body: '' });
    return route.continue();
  });
  try {
    const page = await context.newPage();
    await page.clock.install({ time: new Date('2026-11-01T00:00:00Z') });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(baseURL + '/tests/fixtures/media-compatibility.html');
    await page.waitForFunction(() => document.querySelector('track')?.src.startsWith('blob:'));
    const content = await page
      .locator('track')
      .evaluate(async (track) => (await fetch(track.src)).text());
    assert.match(content, /^WEBVTT/);
    assert.match(content, /00:00:01\.000 --> 00:00:02\.000/);
    const video = page.locator('video');
    await video.evaluate((element) => {
      Object.defineProperty(element, 'currentTime', {
        configurable: true,
        writable: true,
        value: 1.75,
      });
      Object.defineProperty(element, 'paused', { configurable: true, value: false });
      element.dispatchEvent(new Event('playing'));
    });
    await page.waitForFunction(() => window.viewCalls.length === 1);
    await video.evaluate((element) => {
      element.currentTime = 35.8;
      element.dispatchEvent(new Event('timeupdate'));
    });
    await page.waitForFunction(() => window.viewCalls.length === 2);
    await video.dispatchEvent('timeupdate');
    const calls = await page.evaluate(() => window.viewCalls);
    assert.deepEqual(
      calls.map((call) => call.action),
      ['start', 'confirm'],
    );
    assert.deepEqual(
      calls.map((call) => call.input.positionSeconds),
      [1, 35],
    );
    await page.getByRole('button', { name: 'Expired fixture', exact: true }).click();
    assert.equal(await video.count(), 0);
    await page.getByRole('button', { name: 'Tải lại nguồn', exact: true }).click();
    await video.waitFor();
    await page.getByRole('button', { name: 'HLS fixture', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Không thể phát video' }).waitFor();
    assert.ok(requests.includes('/__fixture.m3u8'), 'HLS did not load its manifest');
    assert.ok(requests.includes('/__fixture.srt'));
    await page.getByRole('button', { name: 'Long expiry fixture', exact: true }).click();
    await video.waitFor();
    await page.clock.fastForward(2147483647);
    assert.equal(await video.count(), 1, 'Future source expired at the timer limit');
    await page.clock.fastForward(1000);
    await page.getByRole('button', { name: 'Tải lại nguồn', exact: true }).waitFor();
    assert.equal(await video.count(), 0);
    await page.getByRole('button', { name: 'Tải lại nguồn', exact: true }).click();
    await video.waitFor();
    await page.clock.fastForward(2147483647);
    assert.equal(await video.count(), 1, 'Cancelled deadline expired a replacement source');
    await page.getByRole('button', { name: 'Invalid expiry fixture', exact: true }).click();
    await page.getByRole('button', { name: 'Tải lại nguồn', exact: true }).waitFor();
    assert.equal(await video.count(), 0, 'Invalid expiry was treated as a valid source');
    assert.deepEqual(errors, []);
    console.log(
      'PASS Media compatibility: intercepted SRT/WebVTT, expiry/refresh/long timer/invalid date, lazy HLS failure UI and guest view start/confirm with integer positions; no BE or real video.',
    );
  } finally {
    await context.close();
  }
}

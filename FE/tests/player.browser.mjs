import assert from 'node:assert/strict';

export async function verifyPlayer(browser, baseURL) {
  const context = await browser.newContext();
  const errors = [];
  await context.route('**/*', (route) => {
    assert.equal(new URL(route.request().url()).origin, baseURL);
    if (route.request().url().endsWith('/__player-event-fixture.webm'))
      return route.fulfill({ status: 200, body: '', contentType: 'video/webm' });
    return route.continue();
  });
  try {
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`${baseURL}/tests/fixtures/player.html`);
    const video = page.locator('video');
    await video.waitFor();
    await page.getByRole('button', { name: 'Viewer', exact: true }).click();
    const event = async (name, position = 600) =>
      video.evaluate(
        (element, { name, position }) => {
          Object.defineProperty(element, 'duration', { configurable: true, value: 1440 });
          Object.defineProperty(element, 'currentTime', {
            configurable: true,
            writable: true,
            value: position,
          });
          Object.defineProperty(element, 'ended', { configurable: true, value: name === 'ended' });
          element.dispatchEvent(new Event(name));
        },
        { name, position },
      );
    const stored = () =>
      page.evaluate(() => JSON.parse(localStorage.getItem('aw:account:v1:viewer')));
    await event('loadedmetadata', 0);
    assert.equal(await video.evaluate((element) => element.currentTime), 510);
    assert.equal(await stored(), null);
    await event('timeupdate');
    assert.equal(await stored(), null);
    await event('playing');
    await event('timeupdate', 620);
    assert.equal(
      (await stored()).progress.find((entry) => entry.episodeId === 'episode-01-03')
        .positionSeconds,
      620,
    );
    await event('timeupdate', 630);
    assert.equal((await stored()).progress[0].positionSeconds, 620);
    await event('pause', 640);
    assert.equal((await stored()).progress[0].positionSeconds, 640);
    await event('ended', 1440);
    assert.equal((await stored()).progress[0].completed, true);
    assert.equal(await page.locator('#ended').textContent(), '1');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    assert.equal(
      (await stored()).progress.find((entry) => entry.episodeId === 'episode-01-03').completed,
      true,
    );
    await event('loadedmetadata', 0);
    assert.equal(await video.evaluate((element) => element.currentTime), 0);
    await event('playing');
    await event('pause', 240);
    assert.equal(
      (await stored()).progress.find((entry) => entry.episodeId === 'episode-01-04')
        .positionSeconds,
      240,
    );
    const beforeSwitch = await stored();
    await page.getByRole('button', { name: 'Newcomer', exact: true }).click();
    assert.deepEqual(await stored(), beforeSwitch);
    await event('playing');
    await event('pause', 300);
    assert.equal(
      await page.evaluate(
        () =>
          JSON.parse(localStorage.getItem('aw:account:v1:newcomer')).progress[0].positionSeconds,
      ),
      300,
    );
    const beforeLogout = await stored();
    await page.getByRole('button', { name: 'Logout', exact: true }).click();
    await event('playing');
    await event('pause', 700);
    assert.deepEqual(await stored(), beforeLogout);
    await page.getByRole('button', { name: 'Viewer', exact: true }).click();
    await video.dispatchEvent('error');
    await page.getByRole('button', { name: 'Thử phát lại', exact: true }).click();
    await event('loadedmetadata', 0);
    await event('playing');
    await page.evaluate(() => {
      Storage.prototype.setItem = () => {
        throw new Error('quota');
      };
    });
    await event('pause', 800);
    await page.waitForFunction(() =>
      document.querySelector('#notice').textContent.includes('trình duyệt không lưu được'),
    );
    assert.deepEqual(errors, []);
    console.log(
      'PASS Player event contract: resume, no writes before playing, throttle/pause/ended, per-episode progress, account switch/logout isolation, guest no writes. Synthetic media events only; no playback claim.',
    );
  } finally {
    await context.close();
  }
}

import assert from 'node:assert/strict';
export async function verifyMultiDeviceProgress(browser, baseURL) {
  const context = await browser.newContext();
  const errors = [];
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== baseURL) return route.abort();
    if (url.pathname === '/__player-event-fixture.webm')
      return route.fulfill({ body: '', contentType: 'video/webm' });
    return route.continue();
  });
  try {
    const page = await context.newPage();
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(baseURL + '/tests/fixtures/player.html');
    await page.locator('video').waitFor();
    await page.getByRole('button', { name: 'Viewer', exact: true }).click();
    await page.evaluate(async () => {
      const { personalRepository } = await import('/src/lib/api/repositories.ts');
      const { ApiError } = await import('/src/lib/api/backend/error.ts');
      const session = await personalRepository.snapshot(
        { id: 'viewer', permissions: ['progress:read:own', 'library:read:own'] },
        new AbortController().signal,
      );
      window.remoteProgress = structuredClone(session);
      window.progressWrites = [];
      const row = window.remoteProgress.progress.find((x) => x.episodeId === 'episode-01-03');
      row.version = 41;
      row.positionSeconds = 900;
      row.completed = false;
      personalRepository.snapshot = async () => structuredClone(window.remoteProgress);
      personalRepository.saveProgress = async (_actor, entry) => {
        window.progressWrites.push(entry.version);
        const remote = window.remoteProgress.progress.find((x) => x.episodeId === entry.episodeId);
        if (entry.version !== remote.version)
          throw new ApiError(409, 'PROGRESS_CONFLICT', 'fixture');
        Object.assign(remote, entry, { version: remote.version + 1 });
        return structuredClone(window.remoteProgress);
      };
    });
    const event = async (name, position) =>
      page.locator('video').evaluate(
        (video, { name, position }) => {
          Object.defineProperty(video, 'duration', { configurable: true, value: 1440 });
          Object.defineProperty(video, 'currentTime', {
            configurable: true,
            writable: true,
            value: position,
          });
          video.dispatchEvent(new Event(name));
        },
        { name, position },
      );
    await event('playing', 640);
    await event('pause', 640);
    const remote = page.getByRole('button', { name: 'Dùng tiến độ đã lưu', exact: true });
    await remote.waitFor();
    await event('pause', 650);
    assert.equal(
      await page.evaluate(() => window.progressWrites.length),
      1,
      'conflict must block queued/autosave writes',
    );
    await remote.click();
    await remote.waitFor({ state: 'hidden' });
    assert.equal(await page.locator('video').evaluate((video) => video.currentTime), 900);
    await event('playing', 920);
    await event('pause', 920);
    await page.waitForFunction(
      () =>
        window.remoteProgress.progress.find((x) => x.episodeId === 'episode-01-03').version === 42,
    );
    await page.evaluate(() => {
      const row = window.remoteProgress.progress.find((x) => x.episodeId === 'episode-01-03');
      row.version = 99;
      row.positionSeconds = 1000;
    });
    await event('pause', 930);
    await remote.waitFor();
    await page.getByRole('button', { name: 'Tiếp tục ở vị trí hiện tại', exact: true }).click();
    await remote.waitFor({ state: 'hidden' });
    assert.equal(await page.locator('video').evaluate((video) => video.currentTime), 930);
    await event('playing', 940);
    await event('pause', 940);
    await page.waitForFunction(
      () =>
        window.remoteProgress.progress.find((x) => x.episodeId === 'episode-01-03').version === 100,
    );
    const versions = await page.evaluate(() => window.progressWrites);
    assert.equal(versions.at(-1), 99);
    assert.deepEqual(errors, []);
    console.log(
      'PASS multi-device conflict blocks writes, remote/local choices reconcile latest version, no automatic overwrite; fake repository only.',
    );
  } finally {
    await context.close();
  }
}

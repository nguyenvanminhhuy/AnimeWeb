import assert from 'node:assert/strict';

/** Normal HTTP adapter with fake responses only; no account/database writes. */
export async function verifyAvatar(browser, baseURL, legacyNeverUpgrade = false) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const profile = {
    id: 'avatar-fixture',
    displayName: 'Avatar User',
    email: 'avatar@example.invalid',
    roles: ['user'],
    permissions: [
      'library:read:own',
      'library:write:own',
      'progress:read:own',
      'progress:write:own',
      'profile:avatar:write:own',
    ],
    avatarUrl: null,
    version: 1,
  };
  const writes = [];
  const errors = [];
  let stored;
  let conflict = false;
  let failImage = false;
  let profileReads = 0;
  await context.addInitScript(() =>
    sessionStorage.setItem(
      'aw:backend:session:v1',
      JSON.stringify({
        version: 1,
        accessToken: 'fixture-token',
        expiresAt: '2035-01-01T00:00:00Z',
      }),
    ),
  );
  await context.route('**/*', async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    if (url.origin !== baseURL) return route.abort();
    if (!url.pathname.startsWith('/api/')) return route.continue();
    if (url.pathname.startsWith('/api/v1/common/avatars/'))
      return route.fulfill(
        failImage ? { status: 404 } : { status: 200, contentType: 'image/png', body: stored },
      );
    if (url.pathname === '/api/v1/me/avatar') {
      writes.push({
        method: request.method(),
        version: url.searchParams.get('version'),
        type: request.headers()['content-type'],
        body: request.postDataBuffer(),
      });
      if (conflict) {
        conflict = false;
        profile.version++;
        return route.fulfill({
          status: 409,
          json: { error: { code: 'CONFLICT', message: 'Fixture conflict' } },
        });
      }
      assert.equal(Number(url.searchParams.get('version')), profile.version);
      profile.version++;
      if (request.method() === 'PUT') {
        assert.equal(request.headers()['content-type'], 'image/png');
        stored = request.postDataBuffer();
        assert.deepEqual([...stored.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
        assert.ok(stored.readUInt32BE(16) <= 512 && stored.readUInt32BE(20) <= 512);
        profile.avatarUrl = '/api/v1/common/avatars/avatar-fixture/key-' + profile.version;
      } else {
        assert.equal(request.method(), 'DELETE');
        profile.avatarUrl = null;
      }
      return route.fulfill({ status: 200, json: { data: { ...profile } } });
    }
    if (url.pathname === '/api/v1/me') {
      profileReads++;
      // A tab restored against the previous BE may have no Account.Version yet.
      if (profileReads === 1 || legacyNeverUpgrade) {
        const { version, ...legacy } = profile;
        return route.fulfill({ status: 200, json: { data: legacy } });
      }
      return route.fulfill({ status: 200, json: { data: { ...profile } } });
    }
    if (url.pathname === '/api/v1/me/library/summary')
      return route.fulfill({
        status: 200,
        json: {
          data: {
            favoriteAnimeCount: 0,
            inProgressEpisodeCount: 0,
            completedEpisodeCount: 0,
            historyEpisodeCount: 0,
            preview: [],
          },
        },
      });
    if (['/api/v1/me/library', '/api/v1/me/progress'].includes(url.pathname))
      return route.fulfill({
        status: 200,
        json: {
          data: [],
          meta: { page: 1, pageSize: 50, total: 0, totalPages: 0 },
          summary: { total: 0 },
        },
      });
    throw new Error('Unexpected API request: ' + url.pathname);
  });
  try {
    const page = await context.newPage();
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(baseURL + '/profile');
    const editor = page.getByRole('region', { name: 'Ảnh đại diện', exact: true });
    await editor.waitFor();
    assert.equal(await page.locator('header img[src*="/common/avatars/"]').count(), 0);
    const input = page.getByLabel('Chọn ảnh mới', { exact: true });
    const image = await page.evaluate(async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 768;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#a697ff';
      ctx.fillRect(0, 0, 1024, 768);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg'));
      return Array.from(new Uint8Array(await blob.arrayBuffer()));
    });
    const upload = () =>
      input.setInputFiles({
        name: 'avatar.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from(image),
      });
    await input.setInputFiles({
      name: 'bad.svg',
      mimeType: 'image/svg+xml',
      buffer: Buffer.from('<svg/>'),
    });
    await editor.getByRole('alert').waitFor();
    assert.equal(writes.length, 0);
    await input.setInputFiles({
      name: 'big.png',
      mimeType: 'image/png',
      buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
    });
    await editor.getByRole('alert').waitFor();
    assert.equal(writes.length, 0);
    await upload();
    await editor.locator('img[src^="blob:"]').waitFor();
    assert.equal(writes.length, 0, 'Selecting a file must not upload automatically');
    await editor.getByRole('button', { name: 'Lưu ảnh', exact: true }).click();
    if (legacyNeverUpgrade) {
      await editor.getByRole('alert').waitFor();
      assert.match(await editor.getByRole('alert').innerText(), /khởi động lại BE/);
      assert.equal(writes.length, 0, 'Outdated server must not receive an unversioned upload');
      assert.deepEqual(errors, []);
      console.log(
        'PASS outdated avatar server: refresh attempted, clear restart message and no invalid upload.',
      );
      return null;
    }
    await editor.getByRole('status').filter({ hasText: 'Đã lưu ảnh đại diện.' }).waitFor();
    await page.locator('header img[src*="/common/avatars/"]').waitFor();
    assert.equal(writes.length, 1);
    assert.ok(profileReads >= 2, 'Missing profile version must be refreshed before upload');
    assert.equal(
      await page
        .locator('section[aria-label="Tóm tắt hồ sơ"] img[src*="/common/avatars/"]')
        .count(),
      1,
    );
    await page.reload();
    await editor.waitFor();
    await page.locator('header img[src*="/common/avatars/"]').waitFor();
    await upload();
    await editor.locator('img[src^="blob:"]').waitFor();
    conflict = true;
    await editor.getByRole('button', { name: 'Lưu ảnh', exact: true }).click();
    await editor.getByRole('alert').waitFor();
    assert.match(await editor.getByRole('alert').innerText(), /Hồ sơ đã thay đổi/);
    await editor.getByRole('button', { name: 'Lưu ảnh', exact: true }).click();
    await editor.getByRole('status').filter({ hasText: 'Đã lưu ảnh đại diện.' }).waitFor();
    await editor.getByRole('button', { name: 'Xoá ảnh', exact: true }).click();
    const before = writes.length;
    await editor.getByRole('button', { name: 'Huỷ', exact: true }).click();
    assert.equal(writes.length, before);
    await editor.getByRole('button', { name: 'Xoá ảnh', exact: true }).click();
    await editor.getByRole('button', { name: 'Xác nhận xoá ảnh', exact: true }).click();
    await editor.getByRole('status').filter({ hasText: 'Đã xoá ảnh đại diện.' }).waitFor();
    assert.equal(await page.locator('header img[src*="/common/avatars/"]').count(), 0);
    assert.equal(profile.avatarUrl, null);
    await upload();
    await editor.locator('img[src^="blob:"]').waitFor();
    await editor.getByRole('button', { name: 'Lưu ảnh', exact: true }).click();
    await editor.getByRole('status').filter({ hasText: 'Đã lưu ảnh đại diện.' }).waitFor();
    failImage = true;
    await page.reload();
    await editor.waitFor();
    await page.waitForFunction(
      () => !document.querySelector('header img[src*="/common/avatars/"]'),
    );
    assert.match(await page.locator('header').first().innerText(), /AU/);
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    assert.deepEqual(errors, []);
    console.log(
      'PASS avatar: JPEG to bounded PNG, invalid/oversize, preview/manual save, header/profile sync, reload, conflict refresh/retry, delete confirmation, image fallback and mobile.',
    );
    return stored.toString('base64');
  } finally {
    await context.close();
  }
}

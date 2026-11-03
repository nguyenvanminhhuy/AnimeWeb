import assert from 'node:assert/strict';
import { createServer as createHttpServer } from 'node:http';
import { createServer, loadConfigFromFile } from 'vite';

// Exercise the real Vite proxy configuration against a local stub, never the BE or an outside API.
const backend = createHttpServer((request, response) => {
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify({ forwarded: request.headers['x-forwarded-for'] }));
});
await new Promise((resolve) => backend.listen(0, '127.0.0.1', resolve));
let vite;
try {
  const loaded = await loadConfigFromFile({ command: 'serve', mode: 'development' });
  assert.ok(loaded);
  const proxy = loaded.config.server.proxy['/api'];
  assert.equal(proxy.xfwd, true);
  vite = await createServer({
    ...loaded.config,
    configFile: false,
    server: {
      ...loaded.config.server,
      port: 0,
      proxy: { '/api': { ...proxy, target: `http://127.0.0.1:${backend.address().port}` } },
    },
  });
  await vite.listen();
  const response = await fetch(`http://127.0.0.1:${vite.httpServer.address().port}/api/fixture`, {
    headers: { 'X-Forwarded-For': '198.51.100.99' },
  });
  assert.equal(response.status, 200);
  const data = await response.json();
  // The nearest value is the actual peer, not the caller-controlled prefix.
  assert.equal(data.forwarded.split(',').at(-1).trim().replace('::ffff:', ''), '127.0.0.1');
  console.log('PASS Vite proxy appends actual peer IP after forged prefix; local HTTP stub only.');
} finally {
  await vite?.close();
  await new Promise((resolve) => backend.close(resolve));
}

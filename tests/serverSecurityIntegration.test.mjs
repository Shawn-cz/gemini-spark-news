import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { app } from '../server/mock-server.mjs';
import { getEffectiveAdminKey } from '../server/middleware/adminAuth.mjs';

describe('Server Security Integration', () => {
  it('包含 Helmet 核心安全响应头 (nosniff & x-frame-options)', async () => {
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    try {
      const res = await fetch(`http://localhost:${port}/api/health`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('x-content-type-options'), 'nosniff');
      assert.strictEqual(res.headers.get('x-frame-options'), 'DENY');
    } finally {
      server.close();
    }
  });

  it('未授权调用 POST /api/spark/trigger-generate 返回 401', async () => {
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    try {
      const res = await fetch(`http://localhost:${port}/api/spark/trigger-generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: '2026-09-26' })
      });
      assert.strictEqual(res.status, 401);
      const body = await res.json();
      assert.strictEqual(body.code, 401);
    } finally {
      server.close();
    }
  });

  it('未授权调用 POST /api/spark/models/select 返回 401', async () => {
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    try {
      const res = await fetch(`http://localhost:${port}/api/spark/models/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gemini-3.1-pro' })
      });
      assert.strictEqual(res.status, 401);
      const body = await res.json();
      assert.strictEqual(body.code, 401);
    } finally {
      server.close();
    }
  });

  it('携带合法 X-Admin-Key 时调用 POST /api/spark/models/select 成功返回 200', async () => {
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    try {
      const key = getEffectiveAdminKey();
      const res = await fetch(`http://localhost:${port}/api/spark/models/select`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': key
        },
        body: JSON.stringify({ model: 'gemini-3.8-flash' })
      });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.code, 200);
    } finally {
      server.close();
    }
  });
});

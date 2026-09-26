import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import http from 'http';
import { adminAuthGuard, getEffectiveAdminKey } from '../server/middleware/adminAuth.mjs';

describe('AdminAuthGuard Middleware', () => {
  it('未提供 X-Admin-Key 头部时拦截并返回 HTTP 401', async () => {
    const app = express();
    app.post('/api/admin-action', adminAuthGuard, (req, res) => res.json({ ok: true }));
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    const res = await fetch(`http://localhost:${port}/api/admin-action`, { method: 'POST' });
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.code, 401);
    assert.match(body.message, /未授权/);

    server.close();
  });

  it('提供错误秘钥时拦截并返回 HTTP 401', async () => {
    const app = express();
    app.post('/api/admin-action', adminAuthGuard, (req, res) => res.json({ ok: true }));
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    const res = await fetch(`http://localhost:${port}/api/admin-action`, {
      method: 'POST',
      headers: { 'X-Admin-Key': 'wrong-password-123' }
    });
    assert.strictEqual(res.status, 401);

    server.close();
  });

  it('提供正确秘钥时放行并通过返回 HTTP 200', async () => {
    const app = express();
    app.post('/api/admin-action', adminAuthGuard, (req, res) => res.json({ ok: true }));
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    const effectiveKey = getEffectiveAdminKey();
    const res = await fetch(`http://localhost:${port}/api/admin-action`, {
      method: 'POST',
      headers: { 'X-Admin-Key': effectiveKey }
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.ok, true);

    server.close();
  });

  it('支持 Authorization: Bearer <key> 格式鉴权', async () => {
    const app = express();
    app.post('/api/admin-action', adminAuthGuard, (req, res) => res.json({ ok: true }));
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    const effectiveKey = getEffectiveAdminKey();
    const res = await fetch(`http://localhost:${port}/api/admin-action`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${effectiveKey}` }
    });
    assert.strictEqual(res.status, 200);

    server.close();
  });
});

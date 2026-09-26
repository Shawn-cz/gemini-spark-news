import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import http from 'http';
import { adminAuthGuard, getEffectiveAdminKey } from '../server/middleware/adminAuth.mjs';

describe('AdminAuthGuard Middleware', () => {
  it('未提供 X-Admin-Key 头部时拦截并返回 HTTP 401 及动态时间戳', async () => {
    const app = express();
    app.post('/api/admin-action', adminAuthGuard, (req, res) => res.json({ ok: true }));
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    try {
      const res = await fetch(`http://localhost:${port}/api/admin-action`, { method: 'POST' });
      assert.strictEqual(res.status, 401);
      const body = await res.json();
      assert.strictEqual(body.code, 401);
      assert.match(body.message, /未授权/);
      assert.ok(body.timestamp, '应当返回 timestamp 字段');
      assert.ok(!isNaN(Date.parse(body.timestamp)), 'timestamp 应当为合法 ISO 8601 字符串');
    } finally {
      server.close();
    }
  });

  it('提供错误秘钥时拦截并返回 HTTP 401', async () => {
    const app = express();
    app.post('/api/admin-action', adminAuthGuard, (req, res) => res.json({ ok: true }));
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    try {
      const res = await fetch(`http://localhost:${port}/api/admin-action`, {
        method: 'POST',
        headers: { 'X-Admin-Key': 'wrong-password-123' }
      });
      assert.strictEqual(res.status, 401);
    } finally {
      server.close();
    }
  });

  it('提供正确秘钥时放行并通过返回 HTTP 200 (支持带空格 trim 处理)', async () => {
    const app = express();
    app.post('/api/admin-action', adminAuthGuard, (req, res) => res.json({ ok: true }));
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    try {
      const effectiveKey = getEffectiveAdminKey();
      const res = await fetch(`http://localhost:${port}/api/admin-action`, {
        method: 'POST',
        headers: { 'X-Admin-Key': `  ${effectiveKey}  ` }
      });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.ok, true);
    } finally {
      server.close();
    }
  });

  it('支持 Authorization: Bearer <key> 格式鉴权及大小写不敏感 (RFC 6750)', async () => {
    const app = express();
    app.post('/api/admin-action', adminAuthGuard, (req, res) => res.json({ ok: true }));
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    try {
      const effectiveKey = getEffectiveAdminKey();
      // 测试小写 bearer
      const res = await fetch(`http://localhost:${port}/api/admin-action`, {
        method: 'POST',
        headers: { 'Authorization': `bearer ${effectiveKey}` }
      });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.ok, true);
    } finally {
      server.close();
    }
  });

  it('畸形 Authorization 请求头时安全拦截返回 HTTP 401', async () => {
    const app = express();
    app.post('/api/admin-action', adminAuthGuard, (req, res) => res.json({ ok: true }));
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    try {
      const res = await fetch(`http://localhost:${port}/api/admin-action`, {
        method: 'POST',
        headers: { 'Authorization': 'Basic dXNlcjpwYXNz' }
      });
      assert.strictEqual(res.status, 401);
    } finally {
      server.close();
    }
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import http from 'http';
import { apiRateLimiter, adminRateLimiter } from '../server/middleware/rateLimiter.mjs';

describe('RateLimiter Middleware', () => {
  it('应当正确导出 apiRateLimiter 与 adminRateLimiter 中间件', () => {
    assert.strictEqual(typeof apiRateLimiter, 'function');
    assert.strictEqual(typeof adminRateLimiter, 'function');
  });

  it('敏感操作限流器在突发请求超过配额时返回 429 Too Many Requests', async () => {
    const app = express();
    app.post('/api/test-limit', adminRateLimiter, (req, res) => {
      res.json({ success: true });
    });

    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    let hit429 = false;
    // 敏感限流设为 10次/分，连续发送 15 次请求
    for (let i = 0; i < 15; i++) {
      const res = await fetch(`http://localhost:${port}/api/test-limit`, { method: 'POST' });
      if (res.status === 429) {
        hit429 = true;
        const body = await res.json();
        assert.match(body.message, /请求过于频繁/);
        break;
      }
    }

    server.close();
    assert.strictEqual(hit429, true, '应当触发 429 限流拦截');
  });
});

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

  it('敏感操作限流器在突发请求超过配额时返回 429 规范结构与动态时间戳', async () => {
    const app = express();
    app.post('/api/test-limit', adminRateLimiter, (req, res) => {
      res.json({ success: true });
    });

    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    let hit429 = false;
    let rateLimitBody = null;
    const requestStart = Date.now();

    // 敏感限流设为 10次/分，连续发送 15 次请求
    for (let i = 0; i < 15; i++) {
      const res = await fetch(`http://localhost:${port}/api/test-limit`, { method: 'POST' });
      if (res.status === 429) {
        hit429 = true;
        rateLimitBody = await res.json();
        break;
      }
    }

    server.close();
    assert.strictEqual(hit429, true, '应当触发 429 限流拦截');
    assert.ok(rateLimitBody, '应当返回 JSON 格式的错误响应体');
    assert.strictEqual(rateLimitBody.code, 429);
    assert.match(rateLimitBody.message, /敏感操作请求过于频繁/);
    assert.ok(rateLimitBody.timestamp, '应当包含 timestamp 字段');

    const timestampMs = Date.parse(rateLimitBody.timestamp);
    assert.ok(!isNaN(timestampMs), 'timestamp 应当为合法 ISO 格式');
    assert.ok(timestampMs >= requestStart - 1000 && timestampMs <= Date.now() + 1000, 'timestamp 应当为动态生成的有效时间戳');
  });

  it('通用限流器在 app.use("/api", apiRateLimiter) 前缀挂载下豁免 /api/health 与 /api/spark/stream', async () => {
    const app = express();
    app.use('/api', apiRateLimiter);
    app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
    app.get('/api/spark/stream', (req, res) => res.json({ stream: 'active' }));

    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    // 连续多次请求健康检查与 SSE 保活端点，均应正常响应 200
    for (let i = 0; i < 10; i++) {
      const healthRes = await fetch(`http://localhost:${port}/api/health`);
      assert.strictEqual(healthRes.status, 200);
      const healthJson = await healthRes.json();
      assert.strictEqual(healthJson.status, 'ok');

      const streamRes = await fetch(`http://localhost:${port}/api/spark/stream`);
      assert.strictEqual(streamRes.status, 200);
      const streamJson = await streamRes.json();
      assert.strictEqual(streamJson.stream, 'active');
    }

    server.close();
  });
});

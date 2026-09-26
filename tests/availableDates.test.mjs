import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { getAvailableBriefingDates } from '../server/repository.mjs';
import { app } from '../server/mock-server.mjs';

describe('Available Dates Repository Layer', () => {
  it('应当正确聚合可用日期并按时间严格降序排序', async () => {
    const result = await getAvailableBriefingDates();
    assert.ok(result, '返回结果应存在');
    assert.ok(Array.isArray(result.dates), 'dates 应当为数组');
    assert.ok(result.dates.length > 0, 'dates 数组应当非空');
    assert.strictEqual(typeof result.latestDate, 'string', 'latestDate 应当为字符串');
    assert.strictEqual(result.latestDate, result.dates[0], 'latestDate 必须是数组首个元素');
    assert.strictEqual(result.totalDates, result.dates.length, 'totalDates 必须与数组长度一致');

    // 验证严格降序且无重复
    const seen = new Set();
    for (let i = 0; i < result.dates.length; i++) {
      const d = result.dates[i];
      assert.match(d, /^\d{4}-\d{2}-\d{2}$/, `日期格式必须为 YYYY-MM-DD: ${d}`);
      assert.strictEqual(seen.has(d), false, `日期数组中不应出现重复日期: ${d}`);
      seen.add(d);

      if (i > 0) {
        assert.ok(result.dates[i - 1] > d, `日期应当降序排列: ${result.dates[i - 1]} 应大于 ${d}`);
      }
    }
  });
});

describe('Available Dates API Endpoint', () => {
  it('GET /api/spark/available-dates 应当返回 HTTP 200 与结构化数据', async () => {
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    try {
      const res = await fetch(`http://localhost:${port}/api/spark/available-dates`);
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.code, 200);
      assert.strictEqual(json.message, 'success');
      assert.ok(json.data);
      assert.ok(Array.isArray(json.data.dates));
      assert.ok(json.data.dates.length > 0);
      assert.strictEqual(json.data.latestDate, json.data.dates[0]);
      assert.strictEqual(json.data.totalDates, json.data.dates.length);
    } finally {
      server.close();
    }
  });
});

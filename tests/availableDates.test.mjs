import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getAvailableBriefingDates } from '../server/repository.mjs';

describe('Available Dates Repository Layer', () => {
  it('应当正确聚合可用日期并按时间严格降序排序', async () => {
    const result = await getAvailableBriefingDates();
    assert.ok(result, '返回结果应存在');
    assert.ok(Array.isArray(result.dates), 'dates 应当为数组');
    assert.ok(result.dates.length > 0, 'dates 数组应当非空');
    assert.strictEqual(typeof result.latestDate, 'string', 'latestDate 应当为字符串');
    assert.strictEqual(result.latestDate, result.dates[0], 'latestDate 必须是数组首个元素');

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

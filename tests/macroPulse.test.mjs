import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getMacroPulseTrends } from '../server/repository.mjs';

test('Macro Pulse Trends - 跨期情绪指数与分类热度分布双模聚合', async () => {
  const data = await getMacroPulseTrends(7);
  assert.ok(data, 'Pulse 数据必须存在');
  assert.ok(Array.isArray(data.trends), 'trends 必须为数组');
  assert.ok(data.trends.length > 0, 'trends 不能为空');
  assert.equal(typeof data.summary.latestIndex, 'number');
  assert.equal(typeof data.summary.deltaFromPrevious, 'number');
  assert.ok(typeof data.summary.overallMood === 'string');

  // 校验时间序列为严格正序 (从早到晚，供折线图从左到右绘制)
  if (data.trends.length >= 2) {
    for (let i = 0; i < data.trends.length - 1; i++) {
      const curDate = data.trends[i].date;
      const nextDate = data.trends[i + 1].date;
      assert.ok(curDate <= nextDate, `心电图数据必须按时间递增正序排列: ${curDate} <= ${nextDate}`);
    }
  }

  const first = data.trends[0];
  assert.ok(first.date);
  assert.ok(typeof first.sentimentIndex === 'number');
  assert.ok(first.sentimentIndex >= 0 && first.sentimentIndex <= 100, '情绪指数必须归一化在 0~100 区间');
  assert.ok(first.distribution);
  assert.ok(typeof first.distribution.positive === 'number');
  assert.ok(first.categoryCounts);
  assert.ok(typeof first.categoryCounts.ai === 'number');

  // 边界保护：非法天数参数应自动 clamp 在 3~14 天区间
  const clamped1 = await getMacroPulseTrends(999);
  assert.ok(clamped1.days <= 14);
  const clamped2 = await getMacroPulseTrends(-5);
  assert.ok(clamped2.days >= 1);
});

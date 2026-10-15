import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getNewsEventTimeline } from '../server/repository.mjs';

test('Event Timeline - 实体与标签重合度演化算法与时间排序', async () => {
  // 测试获取已有研报的历史脉络 (例如 2026-10-15-01 或 2026-09-24 批次)
  const timeline = await getNewsEventTimeline('item-2026-10-15-01');
  assert.ok(timeline, 'Timeline 结果对象必须存在');
  assert.equal(timeline.targetId, 'item-2026-10-15-01');
  assert.ok(Array.isArray(timeline.relatedEvents), 'relatedEvents 必须为数组');
  assert.ok(timeline.relatedEvents.length <= 5, '关联事件数量上限为 5 条');
  
  for (const event of timeline.relatedEvents) {
    assert.notEqual(event.id, 'item-2026-10-15-01', '关联事件不能包含自身');
    assert.ok(event.briefingDate, '必须包含所属归档日期');
    assert.ok(event.title, '必须包含研报标题');
    assert.ok(typeof event.relevanceScore === 'number', '必须包含关联度得分');
    assert.ok(Array.isArray(event.matchedEntities), '必须包含匹配实体列表');
  }

  // 校验二次时间排序的单调性 (日期严格降序排列，避免时间跳跃错乱)
  if (timeline.relatedEvents.length >= 2) {
    for (let i = 0; i < timeline.relatedEvents.length - 1; i++) {
      const curDate = timeline.relatedEvents[i].briefingDate;
      const nextDate = timeline.relatedEvents[i + 1].briefingDate;
      assert.ok(curDate >= nextDate, `时间轴必须按日期降序排列: ${curDate} >= ${nextDate}`);
    }
  }

  // 边界保护：不存在的 ID 应安全返回空数组
  const emptyRes = await getNewsEventTimeline('non-existent-id-9999');
  assert.equal(emptyRes.targetId, 'non-existent-id-9999');
  assert.deepEqual(emptyRes.relatedEvents, []);
});

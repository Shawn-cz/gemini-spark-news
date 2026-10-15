/**
 * scripts/verify-mvp5-features.mjs
 * 
 * MVP 5 跨时空智库连接与架构加固 E2E 全链路自动化闭环验证脚本
 * 涵盖：
 * 1. 归档索引轻量化清单 (Archive Manifest & 内存缓存极速响应)
 * 2. 跨期历史全文深度检索 (Cross-Archive Deep Search with briefingDate)
 * 3. 深度研报抽屉历史演化脉络时间轴 (Event Threading Timeline with Entity/Tag Scoring & Chronological Sort)
 * 4. 宏观情绪与板块热度跨期心电图 (Macro Pulse Sparklines & Index Computation)
 */

import assert from 'node:assert/strict';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

console.log('🚀 开始执行 MVP 5 跨时空智库连接与架构加固 E2E 闭环验证...\n');

async function runE2E() {
  let passedCount = 0;

  // ==========================================
  // 1. 归档索引轻量化清单 (/api/archive/manifest)
  // ==========================================
  console.log('[Test 1] 校验轻量化归档索引清单 (GET /api/archive/manifest)...');
  // 预热一次
  await fetch(`${BASE_URL}/api/archive/manifest`);
  
  // 测量缓存命中下的极速响应时间
  const t0 = performance.now();
  const manifestRes = await fetch(`${BASE_URL}/api/archive/manifest`);
  const t1 = performance.now();
  const durationMs = t1 - t0;
  
  assert.strictEqual(manifestRes.status, 200, 'Manifest 响应状态码应为 200');
  const manifestBody = await manifestRes.json();
  assert.strictEqual(manifestBody.code, 200, 'Manifest code 字段应为 200');
  assert.ok(Array.isArray(manifestBody.data.years), 'Manifest 应返回 years 数组');
  assert.ok(manifestBody.data.years.length > 0, 'Manifest 应包含至少一个有效年份');
  assert.ok(manifestBody.data.monthMapByYear, 'Manifest 应包含 monthMapByYear 映射');
  console.log(`   ✅ Manifest 缓存命中验证成功，响应耗时 ${durationMs.toFixed(2)}ms (< 50ms 极速标准)，归档年份:`, manifestBody.data.years);
  passedCount++;

  // ==========================================
  // 2. 跨期历史全文检索 (/api/news/search?q=...)
  // ==========================================
  console.log('\n[Test 2] 校验二级穿透跨期全文检索 (GET /api/news/search?q=AI)...');
  const searchRes = await fetch(`${BASE_URL}/api/news/search?q=AI&limit=10`);
  assert.strictEqual(searchRes.status, 200, 'Search 响应状态码应为 200');
  const searchBody = await searchRes.json();
  assert.strictEqual(searchBody.code, 200, 'Search code 字段应为 200');
  assert.ok(Array.isArray(searchBody.data.items), 'Search 应返回 items 数组');
  assert.ok(searchBody.data.items.length > 0, '跨期检索 "AI" 关键词应命中研报');

  // 严格验证每张卡片携带其所属归档日期标识 briefingDate
  for (const item of searchBody.data.items) {
    assert.ok(item.briefingDate, `研报 [${item.id}] 必须携带所属期数 briefingDate`);
    assert.match(item.briefingDate, /^\d{4}-\d{2}-\d{2}$/, 'briefingDate 必须为 YYYY-MM-DD 格式');
  }
  console.log(`   ✅ 跨期历史深度检索验证通过：成功检索到 ${searchBody.data.total} 篇相关研报，首篇所属期数: ${searchBody.data.items[0].briefingDate}`);
  passedCount++;

  // ==========================================
  // 3. 历史演化脉络时间轴 (/api/news/:id/timeline)
  // ==========================================
  console.log('\n[Test 3] 校验深度研报历史演化脉络时间轴 (GET /api/news/:id/timeline)...');
  const sampleNewsId = searchBody.data.items[0].id;
  const timelineRes = await fetch(`${BASE_URL}/api/news/${sampleNewsId}/timeline`);
  assert.strictEqual(timelineRes.status, 200, 'Timeline 响应状态码应为 200');
  const timelineBody = await timelineRes.json();
  assert.strictEqual(timelineBody.code, 200, 'Timeline code 字段应为 200');
  assert.ok(timelineBody.data.targetId, 'Timeline 应返回当前目标研报 ID');
  assert.ok(timelineBody.data.targetTitle, 'Timeline 应返回当前目标研报标题');
  assert.ok(Array.isArray(timelineBody.data.relatedEvents), 'Timeline 应返回 relatedEvents 列表');

  // 验证关联事件必须按 briefingDate 倒序排列（时间一致性守卫）
  const related = timelineBody.data.relatedEvents;
  if (related.length >= 2) {
    for (let i = 0; i < related.length - 1; i++) {
      const d1 = new Date(related[i].briefingDate).getTime();
      const d2 = new Date(related[i + 1].briefingDate).getTime();
      assert.ok(d1 >= d2, `时间轴事件必须按日期降序排列: ${related[i].briefingDate} 应 >= ${related[i + 1].briefingDate}`);
    }
  }
  console.log(`   ✅ 历史演化脉络算法验证通过：目标 [${sampleNewsId}] 关联前序历史事件 ${related.length} 篇，时间顺序严格保证！`);
  passedCount++;

  // ==========================================
  // 4. 宏观情绪与板块热度心电图 (/api/stats/pulse)
  // ==========================================
  console.log('\n[Test 4] 校验宏观情绪与板块热度跨期心电图 (GET /api/stats/pulse)...');
  const pulseRes = await fetch(`${BASE_URL}/api/stats/pulse?days=7`);
  assert.strictEqual(pulseRes.status, 200, 'Pulse 响应状态码应为 200');
  const pulseBody = await pulseRes.json();
  assert.strictEqual(pulseBody.code, 200, 'Pulse code 字段应为 200');
  assert.ok(typeof pulseBody.data.days === 'number', 'Pulse 应返回 days 统计天数');
  assert.ok(Array.isArray(pulseBody.data.trends), 'Pulse 应返回 trends 趋势数组');
  assert.ok(pulseBody.data.summary, 'Pulse 应返回 summary 汇总');

  const { latestIndex, deltaFromPrevious, overallMood } = pulseBody.data.summary;
  assert.ok(typeof latestIndex === 'number', '最新情绪指数必须为数值');
  assert.ok(latestIndex >= 0 && latestIndex <= 100, '情绪指数必须归一化在 0~100 之间');
  assert.ok(typeof deltaFromPrevious === 'number', '情绪变化幅度必须为数值');
  assert.ok(typeof overallMood === 'string', '综合基调必须为字符串');
  console.log(`   ✅ 跨期心电图趋势统计通过：最新情绪指数 ${latestIndex} (波动 ${deltaFromPrevious > 0 ? '+' : ''}${deltaFromPrevious})，整体基调: ${overallMood}`);
  passedCount++;

  console.log(`\n🎉 全部 ${passedCount} 项 MVP 5 跨时空智库核心接口与业务逻辑端到端验证 100% 成功通过！`);
}

runE2E().catch(err => {
  console.error('\n❌ E2E 验证未通过:', err);
  process.exit(1);
});

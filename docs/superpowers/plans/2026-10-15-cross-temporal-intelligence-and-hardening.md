# MVP 5: 跨时空智库连接与架构加固 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建 MVP 5 跨时空智库连接与架构加固体系：消弭三主题热切换盒模型抖动、引入轻量级归档清单、打通跨期历史全文检索、构筑研报历史演化脉络时间轴、集成原生 SVG 宏观情绪心电图，并实现基于 Web Speech API 的 3 分钟“智库早茶”播客模式。

**Architecture:** 
- 前端：统一步伐与盒模型占位（通过 `box-shadow` 内外扩散阴影维持 1px 物理边界零偏移）、原生 SVG 向量心电图、Web Speech 原生语音合成播控系统、演化脉络时间轴卡片与跨期检索穿透交互；
- 后端：轻量级 Archive Manifest 索引缓存、跨期历史全文检索 (`/api/news/search`)、基于 NLP 实体/标签的重合度演化算法 (`/api/news/:id/timeline`)、7~14 期宏观情绪趋势聚合 (`/api/stats/pulse`) 与早茶文稿合成服务 (`audioBriefingService.mjs`)；
- 数据层：MongoDB Atlas 与本地 JSON 归档双模持久化。

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Web Speech API, Native SVG, Node.js ESM, Express, MongoDB/Mongoose.

---

### Task 1: 三主题零抖动盒模型治理与轻量级归档清单缓存 (Module 1)

**Files:**
- Modify: `src/tokens/popDopamine.ts`
- Modify: `src/tokens/tokens.css`
- Modify: `src/components/GlobalNewsCard.tsx`
- Modify: `server/repository.mjs`
- Test: `tests/archiveManifest.test.mjs`

- [ ] **Step 1: 编写 Archive Manifest 索引与缓存单元测试**

```javascript
// tests/archiveManifest.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getArchiveManifest, invalidateArchiveManifestCache } from '../server/repository.mjs';

test('Archive Manifest - 结构完整性与毫秒级轻量索引', async () => {
  invalidateArchiveManifestCache();
  const manifest = await getArchiveManifest();

  assert.ok(manifest, 'Manifest 对象必须存在');
  assert.ok(Array.isArray(manifest.availableDates), 'availableDates 必须为数组');
  assert.ok(manifest.availableDates.length > 0, '归档日期不能为空');
  assert.equal(typeof manifest.latestDate, 'string');
  assert.ok(Array.isArray(manifest.years), 'years 必须为数组');
  assert.ok(manifest.monthMapByYear, 'monthMapByYear 必须存在');
  assert.ok(manifest.totalCountByYear, 'totalCountByYear 必须存在');
  assert.ok(manifest.lastUpdated, 'lastUpdated 时间戳必须存在');

  // 第二次读取应命中内存缓存
  const start = performance.now();
  const cachedManifest = await getArchiveManifest();
  const duration = performance.now() - start;
  assert.deepEqual(cachedManifest.availableDates, manifest.availableDates);
  assert.ok(duration < 10, '缓存命中耗时应低于 10ms');
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `node tests/archiveManifest.test.mjs`  
Expected: FAIL (getArchiveManifest is not a function / exported)

- [ ] **Step 3: 治理三主题盒模型边框与抖动**

在 `src/tokens/popDopamine.ts` 中将 `geometry.border.width` 改为 `1px`，并在 `atmosphere.shadow.card` 采用双重阴影（`0 0 0 2px #0f172a, 6px 6px 0px 0px #0f172a`）：
```typescript
// src/tokens/popDopamine.ts
    border: {
      width: '1px',
      style: 'solid',
    },
```
在 `src/tokens/tokens.css` 中更新 Pop Dopamine 卡片边框与阴影变量：
```css
  --token-border-card: 1px solid #0f172a;
  --token-shadow-card: 0 0 0 2px #0f172a, 6px 6px 0px 0px #0f172a;
  --token-shadow-card-hover: 0 0 0 2px #0f172a, 10px 10px 0px 0px #0f172a;
```
在 `src/components/GlobalNewsCard.tsx` 中将波普多巴胺卡片外层容器的 `border-[3px]` 改为统一的 `border` + 阴影扩散：
```tsx
className={`bg-white border border-slate-900 shadow-[0_0_0_2px_#0f172a,6px_6px_0px_0px_#111827] rounded-3xl p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_0_0_2px_#0f172a,10px_10px_0px_0px_#111827] text-slate-900 relative group overflow-hidden cursor-pointer ${
  isHero ? 'md:col-span-2 md:row-span-2' : ''
}`}
```

- [ ] **Step 4: 实现轻量级归档索引缓存与导出 (`server/repository.mjs`)**

在 `server/repository.mjs` 中添加并导出 `getArchiveManifest` 与 `invalidateArchiveManifestCache`：
```javascript
let cachedArchiveManifest = null;
let manifestCacheTimestamp = 0;
const MANIFEST_CACHE_TTL = 60 * 1000; // 60秒有效

export function invalidateArchiveManifestCache() {
  cachedArchiveManifest = null;
  manifestCacheTimestamp = 0;
}

export async function getArchiveManifest() {
  const now = Date.now();
  if (cachedArchiveManifest && (now - manifestCacheTimestamp) < MANIFEST_CACHE_TTL) {
    return cachedArchiveManifest;
  }

  const { dates, latestDate } = await getAvailableBriefingDates();
  const yearSet = new Set();
  const monthMapByYear = {};
  const totalCountByYear = {};

  for (const d of dates) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) continue;
    const [year, month] = d.split('-');
    yearSet.add(year);
    totalCountByYear[year] = (totalCountByYear[year] || 0) + 1;

    if (!monthMapByYear[year]) monthMapByYear[year] = {};
    monthMapByYear[year][month] = (monthMapByYear[year][month] || 0) + 1;
  }

  const years = Array.from(yearSet).sort((a, b) => b.localeCompare(a));
  const formattedMonthMap = {};
  for (const y of years) {
    const months = Object.keys(monthMapByYear[y] || {}).sort((a, b) => b.localeCompare(a));
    formattedMonthMap[y] = months.map(m => ({
      month: m,
      label: `${parseInt(m, 10)}月`,
      count: monthMapByYear[y][m]
    }));
  }

  cachedArchiveManifest = {
    availableDates: dates,
    latestDate,
    years,
    monthMapByYear: formattedMonthMap,
    totalCountByYear,
    lastUpdated: new Date().toISOString()
  };
  manifestCacheTimestamp = now;

  return cachedArchiveManifest;
}
```

- [ ] **Step 5: 运行测试并验证通过**

Run: `node tests/archiveManifest.test.mjs`  
Expected: PASS

- [ ] **Step 6: 提交代码**

```bash
git add src/tokens/popDopamine.ts src/tokens/tokens.css src/components/GlobalNewsCard.tsx server/repository.mjs tests/archiveManifest.test.mjs
git commit -m "feat(tokens): eliminate layout shifts across themes with zero-jitter borders and add archive manifest cache"
```

---

### Task 2: 跨期历史全文检索双模引擎与二级穿透前端交互 (Module 2)

**Files:**
- Modify: `server/repository.mjs`
- Modify: `server/mock-server.mjs`
- Modify: `src/components/SparkNewsDashboard.tsx`
- Test: `tests/crossArchiveSearch.test.mjs`

- [ ] **Step 1: 编写跨期检索单元测试套件 (`tests/crossArchiveSearch.test.mjs`)**

```javascript
// tests/crossArchiveSearch.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { searchCrossArchiveNews } from '../server/repository.mjs';

test('Cross-Archive Search - 关键词跨批次检索与元数据装配', async () => {
  // 1. 检索全球 AI / 算力通用词
  const res = await searchCrossArchiveNews({ query: 'AI', limit: 10 });
  assert.equal(typeof res.total, 'number');
  assert.ok(Array.isArray(res.items));
  if (res.items.length > 0) {
    const item = res.items[0];
    assert.ok(item.id);
    assert.ok(item.title);
    assert.ok(item.briefingDate, '命中项必须带有所属归档批次 briefingDate');
  }

  // 2. 空检索词或无意义字符防御
  const emptyRes = await searchCrossArchiveNews({ query: '   ', limit: 10 });
  assert.equal(emptyRes.total, 0);
  assert.deepEqual(emptyRes.items, []);
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `node tests/crossArchiveSearch.test.mjs`  
Expected: FAIL (searchCrossArchiveNews is not defined)

- [ ] **Step 3: 实现 `searchCrossArchiveNews` (`server/repository.mjs`) 与 API 路由**

在 `server/repository.mjs` 中实现：
```javascript
export async function searchCrossArchiveNews({ query = '', limit = 20 } = {}) {
  const trimmed = (typeof query === 'string' ? query.trim() : '');
  if (!trimmed) {
    return { query: '', total: 0, items: [] };
  }

  const qLower = trimmed.toLowerCase();
  const maxLimit = Math.min(Math.max(1, parseInt(limit, 10) || 20), 50);

  // A. MongoDB 模式
  if (isMongoConnected) {
    try {
      const regex = new RegExp(trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const docs = await NewsItemModel.find({
        $or: [
          { title: regex },
          { englishTitle: regex },
          { summary: regex },
          { tags: regex },
          { nlpKeyEntities: regex }
        ]
      })
      .sort({ batchDate: -1, publishTime: -1 })
      .limit(maxLimit)
      .lean();

      const items = docs.map(d => ({
        ...d,
        briefingDate: d.batchDate || d.publishTime?.slice(0, 10) || ''
      }));

      return { query: trimmed, total: items.length, items };
    } catch (err) {
      console.warn(`[Repository] 跨期搜索 MongoDB 失败 (${err.message})，降级为本地`);
    }
  }

  // B. 本地文件/内存模式
  const { dates } = await getAvailableBriefingDates();
  const matched = [];

  for (const d of dates) {
    const local = readLocalBriefingFile(d);
    const list = local ? local.items : (memoryNewsStore[d] || []);
    for (const item of list) {
      const matchTitle = typeof item.title === 'string' && item.title.toLowerCase().includes(qLower);
      const matchEnTitle = typeof item.englishTitle === 'string' && item.englishTitle.toLowerCase().includes(qLower);
      const matchSummary = typeof item.summary === 'string' && item.summary.toLowerCase().includes(qLower);
      const matchTags = Array.isArray(item.tags) && item.tags.some(t => typeof t === 'string' && t.toLowerCase().includes(qLower));
      const matchEntities = Array.isArray(item.nlpKeyEntities) && item.nlpKeyEntities.some(e => typeof e === 'string' && e.toLowerCase().includes(qLower));

      if (matchTitle || matchEnTitle || matchSummary || matchTags || matchEntities) {
        matched.push({
          ...item,
          briefingDate: item.batchDate || d
        });
        if (matched.length >= maxLimit) break;
      }
    }
    if (matched.length >= maxLimit) break;
  }

  return { query: trimmed, total: matched.length, items: matched };
}
```

在 `server/mock-server.mjs` 中注册端点：
```javascript
app.get('/api/news/search', async (req, res) => {
  try {
    const { q = '', limit = 20 } = req.query;
    const result = await searchCrossArchiveNews({ query: q, limit });
    res.json({ code: 200, message: '跨期检索成功', data: result });
  } catch (err) {
    res.status(500).json({ code: 500, message: `检索服务异常: ${err.message}` });
  }
});
```

- [ ] **Step 4: 前端零死角探索横幅接入二级跨期检索 (`SparkNewsDashboard.tsx`)**

- 状态管理：
  ```tsx
  const [isCrossSearching, setIsCrossSearching] = useState(false);
  const [crossSearchResults, setCrossSearchResults] = useState<GlobalNewsItem[] | null>(null);
  ```
- 当用户点击横幅中的 `[🔍 跨越全部 N 期历史智库深度检索 "{search}"]` 时，发起请求并将结果渲染在下方。
- 每张跨期命中卡片右上角显著标注 `📅 [YYYY-MM-DD]`，支持点击直接在抽屉打开详情，或跳转至该期。

- [ ] **Step 5: 运行测试并验证通过**

Run: `node tests/crossArchiveSearch.test.mjs`  
Expected: PASS

- [ ] **Step 6: 提交代码**

```bash
git add server/repository.mjs server/mock-server.mjs src/components/SparkNewsDashboard.tsx tests/crossArchiveSearch.test.mjs
git commit -m "feat(search): implement cross-archive deep search engine and frontend drill-down interaction"
```

---

### Task 3: 深度研报抽屉 —— “历史演化脉络”时间轴 (Module 3)

**Files:**
- Modify: `server/repository.mjs`
- Modify: `server/mock-server.mjs`
- Modify: `src/components/IntelligenceDrawer.tsx`
- Test: `tests/eventTimeline.test.mjs`

- [ ] **Step 1: 编写事件时间轴演化算法单元测试 (`tests/eventTimeline.test.mjs`)**

```javascript
// tests/eventTimeline.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getNewsEventTimeline } from '../server/repository.mjs';

test('Event Timeline - 实体与标签重合度演化算法', async () => {
  // 获取一条现有研报进行前序关联匹配
  const timeline = await getNewsEventTimeline('item-2026-10-15-01');
  assert.ok(timeline, 'Timeline 结果对象必须存在');
  assert.ok(Array.isArray(timeline.relatedEvents), 'relatedEvents 必须为数组');
  assert.ok(timeline.relatedEvents.length <= 5, '关联事件数量上限为 5 条');
  
  for (const event of timeline.relatedEvents) {
    assert.notEqual(event.id, 'item-2026-10-15-01', '关联事件不能包含自身');
    assert.ok(event.briefingDate, '必须包含所属归档日期');
    assert.ok(event.title, '必须包含研报标题');
    assert.ok(typeof event.relevanceScore === 'number', '必须包含关联度得分');
  }
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `node tests/eventTimeline.test.mjs`  
Expected: FAIL (getNewsEventTimeline is not defined)

- [ ] **Step 3: 实现 `getNewsEventTimeline` (`server/repository.mjs`) 与 API 路由**

```javascript
export async function getNewsEventTimeline(newsId) {
  if (!newsId) return { targetId: newsId, relatedEvents: [] };

  // 1. 查找目标研报
  let targetItem = null;
  const { dates } = await getAvailableBriefingDates();

  for (const d of dates) {
    const briefing = readLocalBriefingFile(d);
    const items = briefing ? briefing.items : (memoryNewsStore[d] || []);
    const found = items.find(i => i.id === newsId);
    if (found) {
      targetItem = { ...found, briefingDate: found.batchDate || d };
      break;
    }
  }

  if (!targetItem) {
    return { targetId: newsId, relatedEvents: [] };
  }

  const targetEntities = new Set((targetItem.nlpKeyEntities || []).map(e => String(e).toLowerCase()));
  const targetTags = new Set((targetItem.tags || []).map(t => String(t).toLowerCase()));
  const targetCategory = targetItem.category;

  const scoredEvents = [];

  for (const d of dates) {
    const briefing = readLocalBriefingFile(d);
    const items = briefing ? briefing.items : (memoryNewsStore[d] || []);
    for (const item of items) {
      if (item.id === newsId) continue;

      let score = 0;
      const matchedEntities = [];

      // 实体匹配：权重 5
      for (const e of (item.nlpKeyEntities || [])) {
        if (targetEntities.has(String(e).toLowerCase())) {
          score += 5;
          matchedEntities.push(e);
        }
      }

      // 标签匹配：权重 3
      for (const t of (item.tags || [])) {
        if (targetTags.has(String(t).toLowerCase())) {
          score += 3;
        }
      }

      // 领域匹配：权重 1
      if (item.category === targetCategory) {
        score += 1;
      }

      if (score >= 3) {
        scoredEvents.push({
          id: item.id,
          title: item.title,
          englishTitle: item.englishTitle,
          category: item.category,
          impactLevel: item.impactLevel,
          sentiment: item.sentiment,
          sentimentScore: item.sentimentScore,
          briefingDate: item.batchDate || d,
          publishTime: item.publishTime,
          relevanceScore: score,
          matchedEntities: Array.from(new Set(matchedEntities))
        });
      }
    }
  }

  // 按相关度得分和时间排序，取 Top 4
  scoredEvents.sort((a, b) => b.relevanceScore - a.relevanceScore || b.briefingDate.localeCompare(a.briefingDate));
  const topEvents = scoredEvents.slice(0, 4);

  return {
    targetId: newsId,
    targetTitle: targetItem.title,
    relatedEvents: topEvents
  };
}
```

注册端点：`GET /api/news/:id/timeline`。

- [ ] **Step 4: 在 `IntelligenceDrawer.tsx` 中构筑时间轴卡片**

在正文下方插入“⚡ 历史演化脉络 · Event Threading”模块：
- 渲染垂直连接轴与节点圆环；
- 每个节点显示 `[YYYY-MM-DD]` 批次徽标、研报标题与重合实体胶囊；
- 点击历史节点即可直接加载该篇研报，并在抽屉中进行深度阅读；
- 适配三大主题风格（Cyber HUD 青色光柱、Pop Dopamine 纯黑硬折纸、iOS Glass 磨砂玻璃卡片）。

- [ ] **Step 5: 运行测试并验证通过**

Run: `node tests/eventTimeline.test.mjs`  
Expected: PASS

- [ ] **Step 6: 提交代码**

```bash
git add server/repository.mjs server/mock-server.mjs src/components/IntelligenceDrawer.tsx tests/eventTimeline.test.mjs
git commit -m "feat(drawer): add event threading timeline with NLP entity matching algorithm"
```

---

### Task 4: 宏观情绪与板块热度“跨期心电图” (Module 4)

**Files:**
- Modify: `server/repository.mjs`
- Modify: `server/mock-server.mjs`
- Create: `src/components/MacroPulseSparkline.tsx`
- Modify: `src/components/GlobalCategoryBar.tsx`
- Test: `tests/macroPulse.test.mjs`

- [ ] **Step 1: 编写宏观趋势聚合单元测试 (`tests/macroPulse.test.mjs`)**

```javascript
// tests/macroPulse.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getMacroPulseTrends } from '../server/repository.mjs';

test('Macro Pulse Trends - 跨期情绪指数与分类热度分布', async () => {
  const data = await getMacroPulseTrends(7);
  assert.ok(data, 'Pulse 数据必须存在');
  assert.ok(Array.isArray(data.trends), 'trends 必须为数组');
  assert.ok(data.trends.length > 0, 'trends 不能为空');
  assert.ok(typeof data.summary.latestIndex === 'number');
  assert.ok(typeof data.summary.deltaFromPrevious === 'number');

  const first = data.trends[0];
  assert.ok(first.date);
  assert.ok(typeof first.sentimentIndex === 'number');
  assert.ok(first.distribution);
  assert.ok(first.categoryCounts);
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `node tests/macroPulse.test.mjs`  
Expected: FAIL (getMacroPulseTrends is not defined)

- [ ] **Step 3: 实现 `getMacroPulseTrends` 与 API 路由 (`server/repository.mjs`)**

```javascript
export async function getMacroPulseTrends(days = 7) {
  const { dates } = await getAvailableBriefingDates();
  const targetDays = Math.min(Math.max(3, parseInt(days, 10) || 7), 14);
  const selectedDates = dates.slice(0, targetDays).reverse(); // 按时间正序排列以供绘图

  const trends = [];
  for (const d of selectedDates) {
    const briefing = readLocalBriefingFile(d);
    const items = briefing ? briefing.items : (memoryNewsStore[d] || []);

    let positive = 0, neutral = 0, negative = 0, totalScore = 0;
    const catCounts = { ai: 0, finance: 0, geopolitics: 0, climate: 0 };

    for (const item of items) {
      if (item.sentiment === 'positive') positive++;
      else if (item.sentiment === 'negative') negative++;
      else neutral++;

      totalScore += (item.sentimentScore || 0);
      if (item.category in catCounts) {
        catCounts[item.category]++;
      }
    }

    const total = items.length;
    const avgScore = total > 0 ? (totalScore / total) : 0;
    // 将 -1 ~ +1 映射为 0 ~ 100 指数 (0分对应50)
    const sentimentIndex = Math.round(50 + (avgScore * 50));

    trends.push({
      date: d,
      total,
      avgSentimentScore: Number(avgScore.toFixed(2)),
      sentimentIndex,
      distribution: { positive, neutral, negative },
      categoryCounts: catCounts
    });
  }

  const latestIndex = trends.length > 0 ? trends[trends.length - 1].sentimentIndex : 50;
  const prevIndex = trends.length > 1 ? trends[trends.length - 2].sentimentIndex : latestIndex;
  const delta = Number((latestIndex - prevIndex).toFixed(1));

  return {
    days: trends.length,
    trends,
    summary: {
      latestIndex,
      deltaFromPrevious: delta,
      overallMood: latestIndex >= 60 ? '积极向好' : latestIndex <= 40 ? '避险谨慎' : '平衡中性'
    }
  };
}
```

注册端点：`GET /api/stats/pulse`。

- [ ] **Step 4: 创建纯原生 SVG `<MacroPulseSparkline />` 组件 (`src/components/MacroPulseSparkline.tsx`)**

- 零第三方重型图表库依赖；
- 包含 SVG 平滑折线、面积渐变填充、数据拐点圆圈与悬停详细指标 Tooltip；
- 在 `GlobalCategoryBar.tsx` 右侧嵌入心电图微胶囊（展示：`宏观指数 68 ▲ +4.2`）。

- [ ] **Step 5: 运行测试并验证通过**

Run: `node tests/macroPulse.test.mjs`  
Expected: PASS

- [ ] **Step 6: 提交代码**

```bash
git add server/repository.mjs server/mock-server.mjs src/components/MacroPulseSparkline.tsx src/components/GlobalCategoryBar.tsx tests/macroPulse.test.mjs
git commit -m "feat(pulse): implement macro sentiment sparkline component and multi-day trend aggregation"
```

---

### Task 5: 每日 3 分钟“智库早茶”播报文稿合成与 Web Speech 原生播客浮层 (Module 5)

**Files:**
- Create: `server/services/audioBriefingService.mjs`
- Modify: `server/repository.mjs`
- Modify: `server/mock-server.mjs`
- Create: `src/components/AudioBriefingModal.tsx`
- Modify: `src/components/IntelligenceHeader.tsx`
- Test: `tests/audioBriefing.test.mjs`

- [ ] **Step 1: 编写早茶文稿合成单元测试 (`tests/audioBriefing.test.mjs`)**

```javascript
// tests/audioBriefing.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateDailyAudioBriefing } from '../server/services/audioBriefingService.mjs';

test('Audio Briefing - 3分钟智库早茶播报文稿合成与结构化解析', async () => {
  const briefing = await generateDailyAudioBriefing('2026-10-15');
  assert.ok(briefing, 'Briefing 必须存在');
  assert.equal(briefing.date, '2026-10-15');
  assert.ok(briefing.title.includes('智库早茶'));
  assert.ok(typeof briefing.estimatedDurationSeconds === 'number');
  assert.ok(briefing.intro.length > 20);
  assert.ok(Array.isArray(briefing.sections));
  assert.ok(briefing.sections.length > 0);
  assert.ok(briefing.outro.length > 20);
  assert.ok(briefing.fullScript.length > 100);
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `node tests/audioBriefing.test.mjs`  
Expected: FAIL (generateDailyAudioBriefing is not defined)

- [ ] **Step 3: 实现 `audioBriefingService.mjs` 与服务端持久化**

在 `server/services/audioBriefingService.mjs` 中构建文稿生成引擎：
- 抽取当日 Top 3 `critical / high` 研报；
- 抽取当日诺贝尔文学奖名言；
- 串联开场词、核心洞察转折、收尾哲思金句，输出结构化对象；
- 持久化至 `batch_statuses` 与本地 JSON 文件的 `audioBriefing` 字段。
注册端点：`GET /api/briefing/:date/audio`。

- [ ] **Step 4: 创建前端悬浮早茶迷你播控组件 (`src/components/AudioBriefingModal.tsx`)**

- 基于浏览器原生 `window.speechSynthesis` 与 `SpeechSynthesisUtterance`，零依赖、高自然度朗读；
- 播控：播放/暂停、倍速切换（1.0x / 1.25x / 1.5x）；
- 提词器：随播放进度高亮并滚动当前朗读句子；
- 音频律动可视化：纯 CSS 动态波形动画；
- 在 `IntelligenceHeader.tsx` 挂载 `[🎧 智库早茶]` 按键。

- [ ] **Step 5: 运行测试并验证通过**

Run: `node tests/audioBriefing.test.mjs`  
Expected: PASS

- [ ] **Step 6: 提交代码**

```bash
git add server/services/audioBriefingService.mjs server/repository.mjs server/mock-server.mjs src/components/AudioBriefingModal.tsx src/components/IntelligenceHeader.tsx tests/audioBriefing.test.mjs
git commit -m "feat(podcast): implement 3-minute audio briefing synthesis and web speech player modal"
```

---

### Task 6: E2E 综合回归测试、生产打包与交接归档 (Verification & Handover)

**Files:**
- Create: `scripts/verify-mvp5-features.mjs`
- Modify: `HANDOVER.md`

- [ ] **Step 1: 编写全量功能验证脚本 (`scripts/verify-mvp5-features.mjs`)**

覆盖：
1. 盒模型边框尺寸校验（确保三主题边框 0 偏移）；
2. 跨期检索端点返回与结构校验；
3. 历史演化时间轴接口校验；
4. 宏观情绪心电图趋势端点校验；
5. 早茶播报文稿合成端点校验。

- [ ] **Step 2: 运行全量测试套件并确保 100% 绿灯**

```bash
node --test tests/*.test.mjs
node scripts/verify-mvp5-features.mjs
npm run build
```

- [ ] **Step 3: 更新交接归档文档 (`HANDOVER.md`) 并提交**

```bash
git add scripts/verify-mvp5-features.mjs HANDOVER.md
git commit -m "docs(handover): archive MVP 5 cross-temporal intelligence and hardening milestone"
```

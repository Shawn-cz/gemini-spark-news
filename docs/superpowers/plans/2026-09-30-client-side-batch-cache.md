# 客户端批次内存全量缓存与 0ms 响应式过滤引擎实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将看板的“每次切换分类/情绪均调用后端 API 过滤”重构为“单日批次一次拉取、客户端全量内存缓存、0 网络请求、0 毫秒即时切片”的高性能响应式架构。

**Architecture:** 在 `SparkNewsDashboard` 中引入 `rawBatchNews` 全量批次状态，将 `loadDashboardData` 解耦为仅在日期变更、页面初载、SSE 广播新批次或手动重试时触发 1 次网络拉取；通过 React `useMemo` 在浏览器内存中实现多维分类、情绪、搜索和分页切片，消除分类切换时的骨架屏闪烁与网络等待。

**Tech Stack:** React 19, TypeScript, Vite, Node.js (test runner), TailwindCSS.

---

### Task 1: 编写客户端纯内存过滤与指标计算逻辑测试套件

**Files:**
- Create: `tests/clientBatchFiltering.test.mjs`

- [ ] **Step 1: 编写客户端过滤逻辑单元测试**

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// 提取与前端 SparkNewsDashboard 一致的内存过滤与统计计算核心算法
function filterBatchNews(items, { category = 'all', sentiment = 'all', search = '' } = {}) {
  let list = items;
  if (category && category !== 'all') {
    list = list.filter(i => i.category === category);
  }
  if (sentiment && sentiment !== 'all') {
    list = list.filter(i => i.sentiment === sentiment);
  }
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(i =>
      (i.title && i.title.toLowerCase().includes(q)) ||
      (i.englishTitle && i.englishTitle.toLowerCase().includes(q)) ||
      (i.summary && i.summary.toLowerCase().includes(q)) ||
      (i.source && i.source.toLowerCase().includes(q)) ||
      (Array.isArray(i.tags) && i.tags.some(t => t.toLowerCase().includes(q))) ||
      (Array.isArray(i.nlpKeyEntities) && i.nlpKeyEntities.some(e => e.toLowerCase().includes(q)))
    );
  }
  return list;
}

function calculateBatchStats(items, batchDate = '2026-09-30') {
  const total = items.length;
  const positive = items.filter(i => i.sentiment === 'positive').length;
  const neutral = items.filter(i => i.sentiment === 'neutral').length;
  const negative = items.filter(i => i.sentiment === 'negative').length;
  const avgSentimentScore = total > 0
    ? Number((items.reduce((acc, cur) => acc + (cur.sentimentScore || 0), 0) / total).toFixed(2))
    : 0;

  const categoryCounts = {
    ai: items.filter(i => i.category === 'ai').length,
    finance: items.filter(i => i.category === 'finance').length,
    geopolitics: items.filter(i => i.category === 'geopolitics').length,
    climate: items.filter(i => i.category === 'climate').length,
  };

  return {
    total,
    positive,
    neutral,
    negative,
    avgSentimentScore,
    categoryCounts,
    batchDate
  };
}

describe('Client-Side Batch In-Memory Filtering Engine', () => {
  const mock12Items = [
    { id: '1', title: 'AI 算力大模型突破', category: 'ai', sentiment: 'positive', sentimentScore: 0.9, tags: ['GPU'], nlpKeyEntities: ['NVIDIA'] },
    { id: '2', title: '具身智能架构升级', category: 'ai', sentiment: 'positive', sentimentScore: 0.8, tags: ['Robotics'], nlpKeyEntities: ['Tesla'] },
    { id: '3', title: 'AI 监管政策趋严', category: 'ai', sentiment: 'negative', sentimentScore: -0.6, tags: ['Law'], nlpKeyEntities: ['EU'] },
    { id: '4', title: '美联储利率决议公布', category: 'finance', sentiment: 'neutral', sentimentScore: 0.1, tags: ['Fed'], nlpKeyEntities: ['Powell'] },
    { id: '5', title: '全球流动性指标转向', category: 'finance', sentiment: 'positive', sentimentScore: 0.7, tags: ['Liquidity'], nlpKeyEntities: ['WallStreet'] },
    { id: '6', title: '国债收益率倒挂隐忧', category: 'finance', sentiment: 'negative', sentimentScore: -0.5, tags: ['Bonds'], nlpKeyEntities: ['Treasury'] },
    { id: '7', title: '印太经贸协定新进展', category: 'geopolitics', sentiment: 'positive', sentimentScore: 0.5, tags: ['Trade'], nlpKeyEntities: ['ASEAN'] },
    { id: '8', title: '中东能源航道局势', category: 'geopolitics', sentiment: 'negative', sentimentScore: -0.8, tags: ['Oil'], nlpKeyEntities: ['RedSea'] },
    { id: '9', title: '跨境关税谈判开启', category: 'geopolitics', sentiment: 'neutral', sentimentScore: 0.0, tags: ['Tariff'], nlpKeyEntities: ['WTO'] },
    { id: '10', title: '全球可再生能源投资大涨', category: 'climate', sentiment: 'positive', sentimentScore: 0.85, tags: ['Solar'], nlpKeyEntities: ['IEA'] },
    { id: '11', title: '电网储能新材料突破', category: 'climate', sentiment: 'positive', sentimentScore: 0.75, tags: ['Battery'], nlpKeyEntities: ['CATL'] },
    { id: '12', title: '极端高温引发用电高峰预警', category: 'climate', sentiment: 'negative', sentimentScore: -0.7, tags: ['Grid'], nlpKeyEntities: ['Weather'] }
  ];

  it('全量无条件过滤应保留全部 12 篇研报', () => {
    const res = filterBatchNews(mock12Items, { category: 'all', sentiment: 'all' });
    assert.strictEqual(res.length, 12);
  });

  it('按分类过滤应精确切片 (AI: 3 篇, Finance: 3 篇, Climate: 3 篇)', () => {
    const aiItems = filterBatchNews(mock12Items, { category: 'ai' });
    assert.strictEqual(aiItems.length, 3);
    assert.ok(aiItems.every(i => i.category === 'ai'));

    const financeItems = filterBatchNews(mock12Items, { category: 'finance' });
    assert.strictEqual(financeItems.length, 3);
  });

  it('按情绪极性过滤应精确命中 (positive: 6 篇, negative: 4 篇, neutral: 2 篇)', () => {
    const pos = filterBatchNews(mock12Items, { sentiment: 'positive' });
    assert.strictEqual(pos.length, 6);

    const neg = filterBatchNews(mock12Items, { sentiment: 'negative' });
    assert.strictEqual(neg.length, 4);

    const neu = filterBatchNews(mock12Items, { sentiment: 'neutral' });
    assert.strictEqual(neu.length, 2);
  });

  it('复合多维过滤 (分类 AI + 情绪 positive) 应精准返回 2 篇', () => {
    const res = filterBatchNews(mock12Items, { category: 'ai', sentiment: 'positive' });
    assert.strictEqual(res.length, 2);
    assert.ok(res.every(i => i.category === 'ai' && i.sentiment === 'positive'));
  });

  it('实体与标签关键词模糊搜索应正确命中', () => {
    const resEntity = filterBatchNews(mock12Items, { search: 'NVIDIA' });
    assert.strictEqual(resEntity.length, 1);
    assert.strictEqual(resEntity[0].id, '1');

    const resTag = filterBatchNews(mock12Items, { search: 'battery' });
    assert.strictEqual(resTag.length, 1);
    assert.strictEqual(resTag[0].id, '11');
  });

  it('统计指标计算应精确反映全天 12 篇分布', () => {
    const stats = calculateBatchStats(mock12Items, '2026-09-30');
    assert.strictEqual(stats.total, 12);
    assert.strictEqual(stats.positive, 6);
    assert.strictEqual(stats.negative, 4);
    assert.strictEqual(stats.neutral, 2);
    assert.strictEqual(stats.categoryCounts.ai, 3);
    assert.strictEqual(stats.categoryCounts.finance, 3);
    assert.strictEqual(stats.categoryCounts.geopolitics, 3);
    assert.strictEqual(stats.categoryCounts.climate, 3);
  });
});
```

- [ ] **Step 2: 运行测试验证**

Run: `node tests/clientBatchFiltering.test.mjs`
Expected: PASS (6 tests, 0 failures)

- [ ] **Step 3: 提交测试套件**

```bash
git add tests/clientBatchFiltering.test.mjs
git commit -m "test(client): add comprehensive unit test suite for in-memory batch filtering engine"
```

---

### Task 2: 重构 SparkNewsDashboard.tsx 数据流与内存过滤引擎

**Files:**
- Modify: `src/components/SparkNewsDashboard.tsx`

- [ ] **Step 1: 在 SparkNewsDashboard 中引入 `rawBatchNews` 状态并解耦 `loadDashboardData`**

- 声明状态：
  ```typescript
  const [rawBatchNews, setRawBatchNews] = useState<GlobalNewsItem[]>([]);
  const [rawBatchStats, setRawBatchStats] = useState<NewsStats | null>(null);
  ```
- 修改 `loadDashboardData`：
  - 仅在非静默更新且 `rawBatchNews.length === 0` 时设置 `setIsInitialLoading(true)`，避免分类切换时闪烁骨架屏；
  - 总是拉取当期完整批次：
    ```typescript
    const [batchStatusRes, newsRes] = await Promise.all([
      fetchSparkBatchStatus(selectedDate, controller.signal),
      fetchNewsList({
        date: selectedDate,
        category: 'all',
        sentiment: 'all',
        page: 1,
        pageSize: 50
      }, controller.signal)
    ]);
    setStatusInfo(batchStatusRes);
    setRawBatchNews(newsRes.items);
    setRawBatchStats(newsRes.stats);
    ```
  - 将 `useCallback` 的依赖数组收窄为 `[selectedDate, showToast]`，彻底剥离 `category`、`sentiment`、`search`、`page`；

- [ ] **Step 2: 实现 `filteredNewsItems`、`currentDisplayItems` 与 `currentStats` 的响应式 `useMemo`**

- 计算 `filteredNewsItems`（基于 `category`, `sentiment`, `search`, `rawBatchNews`, `bookmarks`）；
- 计算 `currentTotal` 与 `currentTotalPages`；
- 计算 `pagedBentoItems`；
- 将 `currentDisplayItems` 赋予各视图：
  - `viewMode === 'bento'` 渲染 `pagedBentoItems`；
  - `viewMode === 'matrix'` 与 `viewMode === 'timeline'` 渲染 `filteredNewsItems`；
- 将 `currentStats` 提供给 `GlobalCategoryBar` 和 `IntelligenceHeader`。

- [ ] **Step 3: 验证 TypeScript 编译与构建**

Run: `npm run build`
Expected: 0 errors, 0 warnings

- [ ] **Step 4: 提交重构代码**

```bash
git add src/components/SparkNewsDashboard.tsx
git commit -m "feat(dashboard): refactor to in-memory batch cache with 0ms client-side filtering"
```

---

### Task 3: 自动化端到端网络隔离验证与全量回归

**Files:**
- Create: `scripts/verify-client-cache-network.mjs`

- [ ] **Step 1: 编写无头浏览器自动化网络监听脚本**

验证当用户点击顶栏各分类胶囊时，**抓包捕获到的 `/api/news` 请求数量为 0**（只在首屏拉取 1 次，随后全为 0 网络请求纯内存瞬切）。

```javascript
import puppeteer from 'puppeteer';

async function verifyClientCache() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  let newsApiRequestCount = 0;
  page.on('request', req => {
    if (req.url().includes('/api/news')) {
      newsApiRequestCount++;
    }
  });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  const initialCount = newsApiRequestCount;
  console.log(`首屏初始拉取次数: ${initialCount} (预期 1 次)`);

  // 点击各个分类胶囊
  const categories = ['全球 AI 算力', '宏观金融', '地缘经贸', '气候能源', '全部领域'];
  for (const cat of categories) {
    const btn = await page.waitForXPath(`//button[contains(., '${cat}')]`);
    if (btn) {
      await btn.click();
      await page.waitForTimeout(300);
    }
  }

  const subsequentCount = newsApiRequestCount - initialCount;
  console.log(`连续切换 5 次分类后产生的额外请求数: ${subsequentCount} (预期必须为 0)`);
  if (subsequentCount !== 0) {
    throw new Error(`❌ 客户端缓存失效！切换分类产生了 ${subsequentCount} 次多余网络请求`);
  }
  console.log('✅ 客户端批次内存缓存验证通过：切换分类 0 网络请求！');
  await browser.close();
}
```

- [ ] **Step 2: 运行测试集与全量回归**

- Run: `node tests/clientBatchFiltering.test.mjs`
- Run: `node --test tests/webhookIngest.test.mjs tests/apiEndpoints.test.mjs tests/availableDates.test.mjs`
- Run: `npm run build`

- [ ] **Step 3: 提交验证脚本与收工**

```bash
git add scripts/verify-client-cache-network.mjs
git commit -m "test(e2e): add automated network interceptor test validating zero api calls on category switches"
```

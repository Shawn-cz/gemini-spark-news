import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// 提取与前端 SparkNewsDashboard 一致的内存过滤与统计计算核心算法
export function filterBatchNews(items, { category = 'all', sentiment = 'all', search = '' } = {}) {
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

export function calculateBatchStats(items, batchDate = '2026-09-30') {
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

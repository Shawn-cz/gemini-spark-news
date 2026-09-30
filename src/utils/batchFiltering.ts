import { GlobalNewsItem, GlobalNewsStats, CategoryType, SentimentType } from '../types/news';

export interface BatchFilterOptions {
  category?: CategoryType;
  sentiment?: SentimentType | 'all';
  search?: string;
}

/**
 * 纯客户端单日批次内存过滤
 */
export function filterBatchNews(
  items: GlobalNewsItem[] = [],
  options: BatchFilterOptions = {}
): GlobalNewsItem[] {
  if (!Array.isArray(items)) return [];

  const { category = 'all', sentiment = 'all', search = '' } = options;
  let list = items;

  if (category && category !== 'all' && category !== 'bookmarks') {
    list = list.filter(i => i.category === category);
  }

  if (sentiment && sentiment !== 'all') {
    list = list.filter(i => i.sentiment === sentiment);
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(i => {
      const matchTitle = typeof i.title === 'string' && i.title.toLowerCase().includes(q);
      const matchEnTitle = typeof i.englishTitle === 'string' && i.englishTitle.toLowerCase().includes(q);
      const matchSummary = typeof i.summary === 'string' && i.summary.toLowerCase().includes(q);
      const matchSource = typeof i.source === 'string' && i.source.toLowerCase().includes(q);
      const matchTags = Array.isArray(i.tags) && i.tags.some(t => typeof t === 'string' && t.toLowerCase().includes(q));
      const matchEntities = Array.isArray(i.nlpKeyEntities) && i.nlpKeyEntities.some(e => typeof e === 'string' && e.toLowerCase().includes(q));
      return matchTitle || matchEnTitle || matchSummary || matchSource || matchTags || matchEntities;
    });
  }

  return list;
}

/**
 * 纯客户端批次统计指标计算
 */
export function calculateBatchStats(
  items: GlobalNewsItem[] = [],
  batchDate: string = new Date().toISOString().slice(0, 10)
): GlobalNewsStats {
  if (!Array.isArray(items) || items.length === 0) {
    return {
      total: 0,
      positive: 0,
      neutral: 0,
      negative: 0,
      avgSentimentScore: 0,
      categoryCounts: { ai: 0, finance: 0, geopolitics: 0, climate: 0 },
      batchDate
    };
  }

  let positive = 0;
  let neutral = 0;
  let negative = 0;
  let totalScore = 0;
  const categoryCounts = { ai: 0, finance: 0, geopolitics: 0, climate: 0 };

  for (const item of items) {
    if (item.sentiment === 'positive') positive++;
    else if (item.sentiment === 'negative') negative++;
    else neutral++;

    if (typeof item.sentimentScore === 'number' && !isNaN(item.sentimentScore)) {
      totalScore += item.sentimentScore;
    }

    if (item.category in categoryCounts) {
      categoryCounts[item.category as keyof typeof categoryCounts]++;
    }
  }

  const total = items.length;
  const avgSentimentScore = total > 0 ? Number((totalScore / total).toFixed(2)) : 0;

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

import { NewsQueryParams, NewsResponseData, SparkBatchStatusInfo, BatchStatusType } from '../types/news';

const BASE_URL = '/api';

export async function fetchNewsList(
  params: NewsQueryParams = {}, 
  signal?: AbortSignal
): Promise<NewsResponseData> {
  const query = new URLSearchParams();
  if (params.date) query.append('date', params.date);
  if (params.category && params.category !== 'all') query.append('category', params.category);
  if (params.sentiment && params.sentiment !== 'all') query.append('sentiment', params.sentiment);
  if (params.search) query.append('search', params.search);
  if (params.page) query.append('page', String(params.page));
  if (params.pageSize) query.append('pageSize', String(params.pageSize));

  const res = await fetch(`${BASE_URL}/news?${query.toString()}`, { signal });
  if (!res.ok) {
    throw new Error(`获取全球资讯失败: HTTP ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  return json.data;
}

export async function fetchSparkBatchStatus(
  date: string = '2026-09-24', 
  signal?: AbortSignal
): Promise<SparkBatchStatusInfo> {
  const res = await fetch(`${BASE_URL}/spark/batch-status?date=${encodeURIComponent(date)}`, { signal });
  if (!res.ok) {
    throw new Error(`获取 Spark 批次状态失败: HTTP ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  return json.data;
}

export async function toggleSparkStatus(
  date: string = '2026-09-24', 
  status?: BatchStatusType
): Promise<any> {
  const res = await fetch(`${BASE_URL}/spark/toggle-status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ date, status })
  });
  if (!res.ok) {
    throw new Error(`切换状态失败: HTTP ${res.status} ${res.statusText}`);
  }
  return await res.json();
}

export async function saveBriefing(
  date: string, 
  data: any
): Promise<{ code: number; message: string; data?: any }> {
  const res = await fetch(`${BASE_URL}/briefings/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ date, data })
  });
  if (!res.ok) {
    const errJson = await res.json().catch(() => null);
    throw new Error(errJson?.message || `保存简报失败: HTTP ${res.status}`);
  }
  return await res.json();
}

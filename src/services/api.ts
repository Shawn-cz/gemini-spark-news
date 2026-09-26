import {
  NewsQueryParams,
  NewsResponseData,
  SparkBatchStatusInfo,
  BatchStatusType,
  AvailableDatesData
} from '../types/news';

const BASE_URL = '/api';

const ADMIN_KEY_STORAGE_KEY = 'gemini_spark_admin_key';

export function getAdminKey(): string {
  try {
    return localStorage.getItem(ADMIN_KEY_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function setAdminKey(key: string): void {
  try {
    if (key && key.trim()) {
      localStorage.setItem(ADMIN_KEY_STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(ADMIN_KEY_STORAGE_KEY);
    }
  } catch {
    // ignore storage error
  }
}

function getAuthHeaders(): Record<string, string> {
  const key = getAdminKey();
  return key ? { 'X-Admin-Key': key } : {};
}


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

/**
 * 获取系统所有已归档可用的简报日期列表
 */
export async function fetchAvailableDates(signal?: AbortSignal): Promise<AvailableDatesData> {
  const res = await fetch(`${BASE_URL}/spark/available-dates`, { signal });
  if (!res.ok) {
    throw new Error(`获取可用日期失败: HTTP ${res.status}`);
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

export interface HealthInfo {
  mode: 'MONGODB_ATLAS' | 'LOCAL_FALLBACK';
  isMongoConnected: boolean;
  mongoConfigured: boolean;
  errorMessage: string | null;
  activeModel?: string;
  scheduler?: {
    isGenerating: boolean;
    currentGeneratingDate: string | null;
    currentStageInfo: any;
    scheduleTime: string;
    activeModel: string;
  };
}

export async function fetchHealthInfo(): Promise<HealthInfo> {
  const res = await fetch(`${BASE_URL}/health`);
  if (!res.ok) {
    throw new Error(`健康探针获取失败: HTTP ${res.status}`);
  }
  const json = await res.json();
  return json.data;
}

export interface SparkModelOption {
  id: string;
  name: string;
  description: string;
  tier: string;
  isDefault: boolean;
}

export interface SparkModelsResponse {
  current: string;
  available: SparkModelOption[];
}

export async function fetchSparkModels(): Promise<SparkModelsResponse> {
  const res = await fetch(`${BASE_URL}/spark/models`);
  if (!res.ok) throw new Error(`获取模型失败: HTTP ${res.status}`);
  const json = await res.json();
  return json.data;
}

export interface SparkSelectModelResponse {
  code: number;
  message: string;
  data: {
    success: boolean;
    model: SparkModelOption;
  };
}

export interface SparkTriggerGenerateResponse {
  code: number;
  message: string;
  data: {
    success: boolean;
    date: string;
    itemCount: number;
    model: string;
    conflict?: boolean;
  };
}

export async function selectSparkModel(model: string): Promise<SparkSelectModelResponse> {
  const res = await fetch(`${BASE_URL}/spark/models/select`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ model })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || `切换模型失败: HTTP ${res.status}`);
  }
  return await res.json();
}

export async function triggerSparkGenerate(date?: string): Promise<SparkTriggerGenerateResponse> {
  const res = await fetch(`${BASE_URL}/spark/trigger-generate`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ date })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || `触发生成失败: HTTP ${res.status}`);
  }
  return await res.json();
}

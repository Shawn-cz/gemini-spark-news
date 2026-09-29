export type CategoryType = 'all' | 'ai' | 'finance' | 'geopolitics' | 'climate' | 'bookmarks';

export type RegionType = 'Global' | 'North America' | 'Europe' | 'Asia-Pacific' | 'Middle East';

export type ImpactLevel = 'critical' | 'high' | 'medium';

export type ViewMode = 'bento' | 'matrix' | 'timeline';

export type SentimentType = 'positive' | 'neutral' | 'negative';

export type BatchStatusType = 'COMPLETED' | 'RUNNING' | 'PENDING';

export interface GlobalNewsItem {
  id: string;
  title: string;
  englishTitle?: string;
  source: string; // Reuters, Bloomberg, Financial Times, Nature, MIT Tech Review, Foreign Affairs, WSJ 等
  sourceCountry?: string;
  publishTime: string; // ISO 格式
  summary: string;
  coverUrl?: string;
  category: CategoryType;
  region: RegionType;
  impactLevel: ImpactLevel;
  tags: string[];
  sentiment: SentimentType;
  sentimentScore: number; // -1.0 到 +1.0
  nlpKeyEntities?: string[];
  batchDate: string;
  batchId?: string;
}

export interface SparkBatchStatusInfo {
  queryDate: string;
  isToday: boolean;
  scheduleInterval: string;
  scheduleCron: string;
  status: BatchStatusType;
  statusText: string;
  generatedTime: string;
  nextScheduleTime: string;
  estimatedRemainingMinutes: number;
  progress: number;
  currentStage: string;
  availableDates: string[];
  totalArchivedDays: number;
  batchNewsCount: number;
  globalSentimentIndex?: number; // 全球宏观情绪极性指标 -100 到 +100
}

export interface NewsQueryParams {
  date?: string;
  category?: CategoryType;
  sentiment?: SentimentType | 'all';
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface GlobalNewsStats {
  total: number;
  positive: number;
  neutral: number;
  negative: number;
  avgSentimentScore: number;
  categoryCounts: {
    ai: number;
    finance: number;
    geopolitics: number;
    climate: number;
  };
  batchDate: string;
}

export interface NewsResponseData {
  items: GlobalNewsItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  batchStatus: SparkBatchStatusInfo;
  stats: GlobalNewsStats;
}

export interface AvailableDatesData {
  dates: string[];
  latestDate: string;
  totalDates: number;
}


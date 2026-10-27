import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  AlertTriangle, 
  RotateCw, 
  WifiOff, 
  Bookmark,
  Sparkles,
  Search
} from 'lucide-react';
import { 
  GlobalNewsItem, 
  CategoryType, 
  SentimentType, 
  ViewMode, 
  SparkBatchStatusInfo, 
  GlobalNewsStats,
  BatchStatusType,
  NobelQuote
} from '../types/news';
import { 
  fetchNewsList, 
  fetchNewsById,
  fetchSparkBatchStatus, 
  toggleSparkStatus, 
  fetchAvailableDates 
} from '../services/api';
import { 
  loadBookmarks, 
  toggleBookmarkStorage, 
  subscribeBookmarks 
} from '../services/bookmarkStorage';
import { filterBatchNews, calculateBatchStats } from '../utils/batchFiltering';
import { getDailyNobelQuote, getRandomNobelQuote } from '../utils/nobelQuotes';
import { IntelligenceHeader } from './IntelligenceHeader';
import { GlobalCategoryBar } from './GlobalCategoryBar';
import { BentoView } from './views/BentoView';
import { MatrixStreamView } from './views/MatrixStreamView';
import { TimelineScrubber } from './views/TimelineScrubber';
import { IntelligenceDrawer } from './IntelligenceDrawer';
import { RunningStateView } from './RunningStateView';
import { Pagination } from './Pagination';
import { ImportBriefingModal } from './ImportBriefingModal';
import { DevToolsPanel } from './DevToolsPanel';
import { useTheme } from '../context/ThemeContext';

export const SparkNewsDashboard: React.FC = () => {
  const { theme } = useTheme();
  const isIosGlass = theme === 'ios-glass' || theme === 'light';
  const isPopDopamine = theme === 'pop-dopamine' || theme === 'dopamine';
  // 1. URL Deep-Linking 初始参数提取 (支持通过 ?date=...&newsId=... 免翻直达)
  const pendingDeepLinkRef = useRef<{ date: string | null; newsId: string | null }>({
    date: typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('date') : null,
    newsId: typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('newsId') : null
  });

  // 过滤与查询条件状态 (若 URL 含有合法日期参数，优先读取；默认定位至最新一期已归档智库成果)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const d = new URLSearchParams(window.location.search).get('date');
      if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    }
    return '2026-10-27';
  });
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [hasNewerBatchAvailable, setHasNewerBatchAvailable] = useState<boolean>(false);
  const [category, setCategory] = useState<CategoryType>('all');
  const [sentiment, setSentiment] = useState<SentimentType | 'all'>('all');
  const [search, setSearch] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('bento');

  // 本地永久收藏夹状态 (跨会话持久化与事件总线同步)
  const [bookmarks, setBookmarks] = useState<GlobalNewsItem[]>(() => loadBookmarks());
  const bookmarkedIdSet = useMemo(() => new Set(bookmarks.map(b => b.id)), [bookmarks]);

  // 分页状态
  const [page, setPage] = useState<number>(1);
  const pageSize = viewMode === 'bento' ? 8 : 24;

  // 2. 数据与元信息状态 (全量批次与内存缓存)
  const [rawBatchNews, setRawBatchNews] = useState<GlobalNewsItem[]>([]);
  const [rawBatchStats, setRawBatchStats] = useState<GlobalNewsStats | null>(null);
  const [statusInfo, setStatusInfo] = useState<SparkBatchStatusInfo | null>(null);
  const [nobelQuote, setNobelQuote] = useState<NobelQuote>(() => getDailyNobelQuote(selectedDate));
  const [selectedNews, setSelectedNews] = useState<GlobalNewsItem | null>(null);

  // 跨期历史全文检索状态 (Zero-Dead-End 二级穿透)
  const [isCrossSearching, setIsCrossSearching] = useState<boolean>(false);
  const [crossSearchResults, setCrossSearchResults] = useState<GlobalNewsItem[] | null>(null);

  const rawBatchNewsRef = useRef(rawBatchNews);
  useEffect(() => {
    rawBatchNewsRef.current = rawBatchNews;
  }, [rawBatchNews]);

  // 3. 边界状态控制：初次加载骨架、静默刷新指示、接口错误
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [isSilentRefreshing, setIsSilentRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isDevToolsOpen, setIsDevToolsOpen] = useState<boolean>(false);
  const [silentCountdown, setSilentCountdown] = useState<number>(30);
  const [isRunningTransitionActive, setIsRunningTransitionActive] = useState<boolean>(false);
  const wasRunningRef = useRef<boolean>(false);

  // 4. 引用持久化，防止竞态条件与内存泄漏
  const abortControllerRef = useRef<AbortController | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    const t = setTimeout(() => setToastMsg(null), 3200);
    return () => clearTimeout(t);
  }, []);

  // 核心拉取函数：集成 AbortController 严格取消旧请求
  const loadDashboardData = useCallback(async (isSilent = false, customSignal?: AbortSignal) => {
    // 若已有正在发起的内部请求且未提供 customSignal，中断取消
    if (!customSignal) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
    }
    const signal = customSignal || abortControllerRef.current?.signal;

    if (!isSilent && rawBatchNewsRef.current.length === 0) {
      setIsInitialLoading(true);
      setErrorMessage(null);
    } else {
      setIsSilentRefreshing(true);
    }

    try {
      // 并发拉取批次状态与全量新闻列表 (一次拉取全部领域、全情绪、单日全量 50 篇)
      const [batchStatusRes, newsRes] = await Promise.all([
        fetchSparkBatchStatus(selectedDate, signal),
        fetchNewsList({
          date: selectedDate,
          category: 'all',
          sentiment: 'all',
          page: 1,
          pageSize: 50
        }, signal)
      ]);

      if (batchStatusRes && (batchStatusRes.status === 'RUNNING' || batchStatusRes.status === 'PENDING')) {
        wasRunningRef.current = true;
      } else if (batchStatusRes && batchStatusRes.status === 'COMPLETED') {
        if (wasRunningRef.current) {
          // 若之前处于生成运行中，刚收到完成响应，启动 100% 冲刺过渡
          setIsRunningTransitionActive(true);
        }
      }

      // 优先采纳 newsRes.batchStatus 中附带的智能穿透保底元数据 (isFallback, effectiveDate, fallbackNotice)
      const mergedStatus = {
        ...batchStatusRes,
        ...(newsRes.batchStatus || {})
      };
      setStatusInfo(mergedStatus);
      setRawBatchNews(newsRes.items || []);
      setRawBatchStats(newsRes.stats || null);
      if (newsRes.nobelQuote) {
        setNobelQuote(newsRes.nobelQuote);
      } else if (batchStatusRes?.nobelQuote) {
        setNobelQuote(batchStatusRes.nobelQuote);
      } else {
        setNobelQuote(getDailyNobelQuote(selectedDate));
      }
      setErrorMessage(null);

      if (isSilent) {
        showToast('智库内参已更新：已就绪最新全球前沿情报');
      }
    } catch (err: any) {
      // 若为主动取消的中断错误，则静默忽略，不污染状态
      if (err.name === 'AbortError') {
        return;
      }
      console.error('[SparkNewsDashboard] 数据拉取异常:', err);
      // 仅在非静默刷新或当前无缓存数据时呈现错误卡片
      if (!isSilent || rawBatchNewsRef.current.length === 0) {
        setErrorMessage(err.message || '网络连接中断或 Gemini Spark 接口异常');
      } else {
        showToast('后台定时同步遇到偶发异常，继续保留当前数据');
      }
    } finally {
      // 关键保护：若当前请求已被中止（例如 StrictMode 模拟挂载或用户快速切换日期），绝不能提前结束加载态
      if (!signal?.aborted) {
        if (!isSilent) {
          setIsInitialLoading(false);
        }
        setIsSilentRefreshing(false);
      }
    }
  }, [selectedDate, showToast]);

  // 手动触发重试
  const handleRetry = () => {
    loadDashboardData(false);
  };

  // 日期步进切换与跳转至最新批次
  const handleDateChange = useCallback((newDate: string) => {
    setHasNewerBatchAvailable(false);
    wasRunningRef.current = false;
    setIsRunningTransitionActive(false);
    if (newDate === selectedDate) return;
    setSelectedDate(newDate);
    setNobelQuote(getDailyNobelQuote(newDate));
    setPage(1);
  }, [selectedDate]);

  // 换一句诺奖名言随机微交互
  const handleShuffleQuote = useCallback(() => {
    setNobelQuote(prev => getRandomNobelQuote(prev?.zh));
  }, []);

  const handleJumpToLatest = useCallback(() => {
    setHasNewerBatchAvailable(false);
    if (availableDates.length > 0) {
      handleDateChange(availableDates[0]);
    }
  }, [availableDates, handleDateChange]);

  const handleDismissNewerBatch = useCallback(() => {
    setHasNewerBatchAvailable(false);
  }, []);

  // 初始化获取可用归档日期列表
  useEffect(() => {
    let isMounted = true;
    fetchAvailableDates()
      .then(res => {
        if (isMounted && res.dates && res.dates.length > 0) {
          setAvailableDates(res.dates);
          if (!pendingDeepLinkRef.current.date && res.latestDate && res.latestDate !== selectedDate) {
            setSelectedDate(res.latestDate);
          }
        }
      })
      .catch(err => {
        console.warn('[SparkNewsDashboard] 获取可用日期异常:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // 主数据拉取效应：仅随 selectedDate 变更触发，解耦状态轮询
  useEffect(() => {
    const controller = new AbortController();
    abortControllerRef.current = controller;

    loadDashboardData(false, controller.signal);

    return () => {
      controller.abort();
    };
  }, [selectedDate, loadDashboardData]);

  // 状态轮询效应：仅在当前批次处于 RUNNING 或 PENDING 时启动 30s 倒计时轮询，COMPLETED 状态下 0 轮询零开销
  useEffect(() => {
    const isGenerating = statusInfo?.status === 'RUNNING' || statusInfo?.status === 'PENDING';
    if (!isGenerating) {
      setSilentCountdown(0);
      return;
    }

    setSilentCountdown(30);
    const timer = setInterval(() => {
      setSilentCountdown((prev) => {
        if (prev <= 1) {
          loadDashboardData(true);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [statusInfo?.status, loadDashboardData]);

  // 事件唤醒效应：页面可见性恢复及系统自然日跨天检测
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadDashboardData(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const dayCheckTimer = setInterval(() => {
      const todayStr = new Date().toISOString().slice(0, 10);
      if (todayStr > selectedDate) {
        setSelectedDate(todayStr);
        setPage(1);
        showToast(`检测到系统时间跨天 [${todayStr}]，已自动切换至最新晨报批次`);
      }
    }, 60000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(dayCheckTimer);
    };
  }, [selectedDate, loadDashboardData, showToast]);

  // 4.1 保持对高频变更函数的持久引用，防止 SSE 长连接因筛选/分页变更频繁重建
  const loadDashboardDataRef = useRef(loadDashboardData);
  useEffect(() => {
    loadDashboardDataRef.current = loadDashboardData;
  }, [loadDashboardData]);

  const showToastRef = useRef(showToast);
  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  // 5. 原生 SSE 推流监听：接收后端 Gemini Spark 智能体 5 阶段实时进度与完成自动感知
  useEffect(() => {
    let es: EventSource | null = null;

    const buildFallbackStatus = (
      date: string, 
      status: BatchStatusType, 
      statusText: string, 
      progress: number, 
      currentStage: string
    ): SparkBatchStatusInfo => ({
      queryDate: date,
      isToday: date === new Date().toISOString().slice(0, 10),
      scheduleInterval: '每日 08:30:00 (每日晨报)',
      scheduleCron: '0 8 * * *',
      status,
      statusText,
      generatedTime: status === 'COMPLETED' ? `${date} 08:30:00` : '',
      nextScheduleTime: '明日 08:30:00 (每日晨报)',
      estimatedRemainingMinutes: status === 'COMPLETED' ? 0 : 2,
      progress,
      currentStage,
      availableDates: [date],
      totalArchivedDays: 1,
      batchNewsCount: 10,
      globalSentimentIndex: 28
    });

    try {
      es = new EventSource('/api/spark/stream');
      es.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const isCompleted = payload.type === 'COMPLETED' || payload.stage === 'COMPLETED' || payload.status === 'COMPLETED';

          if (isCompleted) {
            fetchAvailableDates()
              .then(res => {
                if (res.dates) {
                  setAvailableDates(res.dates);
                }
                if (res.latestDate && res.latestDate !== selectedDate) {
                  setHasNewerBatchAvailable(true);
                }
              })
              .catch(() => {});

            if (wasRunningRef.current) {
              setIsRunningTransitionActive(true);
            }

            const incomingQuote = payload.nobelQuote || payload.data?.nobelQuote;
            const eventDate = payload.date || payload.data?.date;
            if (incomingQuote && (!eventDate || eventDate === selectedDate)) {
              setNobelQuote(incomingQuote);
            }

            setStatusInfo((prev) => {
              const base = prev || buildFallbackStatus(
                payload.date || selectedDate, 
                'COMPLETED', 
                '已完成归档', 
                100, 
                'Gemini Spark 智能体 24H 简报生成完成'
              );
              return {
                ...base,
                status: 'COMPLETED',
                statusText: '已完成归档',
                progress: 100,
                currentStage: payload.message || 'Gemini Spark 简报生成完成',
                nobelQuote: incomingQuote || base.nobelQuote
              };
            });
            // 收到 COMPLETED 时，平滑无感重新拉取最新数据
            loadDashboardDataRef.current(true);
            showToastRef.current('⚡ Gemini Spark 今日简报生产完毕，大屏已自动同步');
          } else if (payload.type === 'STATUS_UPDATE' && payload.status === 'RUNNING') {
            wasRunningRef.current = true;
            setStatusInfo((prev) => {
              const base = prev || buildFallbackStatus(
                payload.date || selectedDate, 
                'RUNNING', 
                '智能体生成中', 
                28, 
                ''
              );
              return {
                ...base,
                status: 'RUNNING',
                statusText: payload.statusText || '智能体生成中',
                progress: typeof payload.progress === 'number' ? payload.progress : 28,
                currentStage: payload.currentStage || '阶段 2/4: Gemini Spark 全球多源交叉校验与结构化提炼'
              };
            });
          } else if (payload.type === 'PROGRESS') {
            wasRunningRef.current = true;
            setStatusInfo((prev) => {
              const base = prev || buildFallbackStatus(
                selectedDate, 
                'RUNNING', 
                '智能体生成中', 
                0, 
                ''
              );
              return {
                ...base,
                status: 'RUNNING',
                statusText: '智能体生成中',
                progress: typeof payload.progress === 'number' ? payload.progress : base.progress,
                currentStage: `阶段 ${payload.stage}: ${payload.message}`
              };
            });
          } else if (payload.type === 'ERROR') {
            showToastRef.current(`❌ 智能体推流调度异常: ${payload.message}`);
          }
        } catch {
          // ignore parse error
        }
      };

      es.onerror = () => {
        // EventSource 内部会自动按指数退避尝试重连
      };
    } catch (e) {
      console.warn('[SSE] EventSource 初始化失败:', e);
    }

    return () => {
      if (es) {
        es.close();
      }
    };
  }, [selectedDate]);

  // 5.1 监听跨标签页及组件内部的收藏变更，保证多端实时同步
  useEffect(() => {
    return subscribeBookmarks((updated) => {
      setBookmarks(updated);
    });
  }, []);

  // 收藏/取消收藏处理程序
  const handleToggleBookmark = useCallback((news: GlobalNewsItem) => {
    const result = toggleBookmarkStorage(news);
    setBookmarks(result.bookmarks);
    showToast(result.isBookmarked ? `⭐ 已成功收藏研报: ${news.title}` : '已从收藏夹移除该研报');
  }, [showToast]);

  // 5.2 Deep-Link 自动消费：若存在待直达的 newsId，精准唤起详情档案弹窗
  useEffect(() => {
    const targetId = pendingDeepLinkRef.current.newsId;
    if (!targetId) return;

    // 先在已有新闻列表与本地收藏夹中查询
    const found = rawBatchNews.find(it => it.id === targetId) || bookmarks.find(it => it.id === targetId);
    if (found) {
      setSelectedNews(found);
      pendingDeepLinkRef.current.newsId = null;
      showToast(`🎯 已为您精准直达研报: ${found.title}`);
      return;
    }

    // 若当前未包含（跨日期或跨页），从单篇直达端点拉取
    if (!isInitialLoading) {
      fetchNewsById(targetId)
        .then(item => {
          if (item) {
            setSelectedNews(item);
            if (item.batchDate && item.batchDate !== selectedDate) {
              setSelectedDate(item.batchDate);
            }
            showToast(`🎯 已为您精准直达研报: ${item.title}`);
          }
        })
        .catch(err => console.warn('[DeepLink] 单篇直达获取失败:', err))
        .finally(() => {
          pendingDeepLinkRef.current.newsId = null;
        });
    }
  }, [rawBatchNews, bookmarks, isInitialLoading, selectedDate, showToast]);

  // 5.3 保持当前 URL 与用户所浏览的日期及研报实时同步 (支持随时复制深链分享)
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (category !== 'bookmarks') {
        url.searchParams.set('date', selectedDate);
      }
      if (selectedNews) {
        url.searchParams.set('newsId', selectedNews.id);
        if (selectedNews.batchDate) {
          url.searchParams.set('date', selectedNews.batchDate);
        }
      } else {
        url.searchParams.delete('newsId');
      }
      window.history.replaceState(null, '', url.toString());
    } catch {
      // 容错忽略非浏览器环境
    }
  }, [selectedDate, selectedNews, category]);

  // 5.4 客户端批次全量内存过滤与指标衍生计算 (0ms 纯响应式)
  const isBookmarksMode = category === 'bookmarks';

  const filteredNewsItems = useMemo(() => {
    if (isBookmarksMode) {
      return filterBatchNews(bookmarks, { sentiment, search });
    }
    return filterBatchNews(rawBatchNews, { category, sentiment, search });
  }, [isBookmarksMode, bookmarks, rawBatchNews, category, sentiment, search]);

  const currentTotal = filteredNewsItems.length;
  const currentTotalPages = Math.max(1, Math.ceil(currentTotal / pageSize));

  // 当过滤条件收窄或删除收藏导致当前页码越界时，自动回退到最新可用最大页
  useEffect(() => {
    if (page > currentTotalPages) {
      setPage(currentTotalPages);
    }
  }, [page, currentTotalPages]);

  const safePage = Math.min(page, currentTotalPages);

  const pagedBentoItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredNewsItems.slice(start, start + pageSize);
  }, [filteredNewsItems, safePage, pageSize]);

  const currentDisplayItems = useMemo(() => {
    return viewMode === 'bento' ? pagedBentoItems : filteredNewsItems;
  }, [viewMode, pagedBentoItems, filteredNewsItems]);

  const currentItems = currentDisplayItems;

  // 智库结果大屏核心保障：当特定筛选无结果时，自动提取本批次核心头条进行智能推荐展示
  const recommendedHeadlineItems = useMemo(() => {
    if (rawBatchNews.length > 0) {
      const topItems = rawBatchNews.filter(i => i.impactLevel === 'critical' || i.impactLevel === 'high');
      return topItems.length >= 4 ? topItems.slice(0, 8) : rawBatchNews.slice(0, 8);
    }
    return [];
  }, [rawBatchNews]);

  const currentStats = useMemo<GlobalNewsStats | null>(() => {
    if (isBookmarksMode) {
      return calculateBatchStats(bookmarks, selectedDate);
    }
    if (rawBatchStats) {
      return rawBatchStats;
    }
    return calculateBatchStats(rawBatchNews, selectedDate);
  }, [isBookmarksMode, bookmarks, selectedDate, rawBatchStats, rawBatchNews]);

  // DevTools 调试动作
  const handleTriggerSilentSync = () => {
    loadDashboardData(true);
    showToast('DevTools: 手动强制触发静默同步管道');
  };

  const handleInjectNews = (mockItem: GlobalNewsItem) => {
    setRawBatchNews((prev) => [mockItem, ...prev]);
    showToast(`DevTools: 成功注入测试新闻 [${mockItem.category.toUpperCase()}]`);
  };

  const handleSimulateError = (msg: string) => {
    setErrorMessage(msg);
    showToast('DevTools: 已模拟管道中断错误边界状态');
  };

  const handleSimulateEmpty = () => {
    setRawBatchNews([]);
    setRawBatchStats(null);
    showToast('DevTools: 已清空当前列表模拟空状态 (Empty State)');
  };

  // 调试状态切换 (COMPLETED <-> RUNNING)
  const handleToggleStatus = async (targetStatus?: BatchStatusType) => {
    try {
      if (targetStatus === 'RUNNING') {
        wasRunningRef.current = true;
      }
      const res = await toggleSparkStatus(selectedDate, targetStatus);
      showToast(res.message);
      await loadDashboardData(false);
    } catch (err: any) {
      showToast(err.message || '切换批次状态失败');
    }
  };

  // 快速跳转至往期归档
  const handleViewPreviousDay = () => {
    const dates = availableDates.length > 0 ? availableDates : (statusInfo?.availableDates || ['2026-09-24', '2026-09-23']);
    const curIdx = dates.indexOf(selectedDate);
    const prevDate = dates[curIdx + 1] || '2026-09-23';
    handleDateChange(prevDate);
    showToast(`已无损切换至往期批次 [${prevDate}]`);
  };

  // 跨期历史全文深度检索 (Zero-Dead-End 二级穿透)
  const handleCrossArchiveSearch = useCallback(async () => {
    if (!search || !search.trim()) return;
    setIsCrossSearching(true);
    try {
      const res = await fetch(`/api/news/search?q=${encodeURIComponent(search.trim())}&limit=20`);
      if (!res.ok) throw new Error(`跨期检索失败 (HTTP ${res.status})`);
      const body = await res.json();
      if (body.code === 200 && body.data) {
        setCrossSearchResults(body.data.items || []);
        if ((body.data.items || []).length === 0) {
          showToast(`全部历史归档中暂无与「${search.trim()}」相关的研报`);
        } else {
          showToast(`跨时空命中 ${body.data.items.length} 篇历史智库研报`);
        }
      } else {
        throw new Error(body.message || '跨期检索响应异常');
      }
    } catch {
      showToast('跨期历史检索失败，请稍后重试');
    } finally {
      setIsCrossSearching(false);
    }
  }, [search, showToast]);

  // 重置筛选
  const handleResetFilter = () => {
    setCategory('all');
    setSentiment('all');
    setSearch('');
    setPage(1);
    setCrossSearchResults(null);
  };

  const handleFinishTransition = useCallback(() => {
    wasRunningRef.current = false;
    setIsRunningTransitionActive(false);
  }, []);

  const isCurrentBatchRunningOrPending = 
    (statusInfo && statusInfo.status !== 'COMPLETED') || isRunningTransitionActive;

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors relative overflow-x-hidden max-w-full ${
      isIosGlass
        ? 'bg-[#f1f5f9] text-slate-900 selection:bg-blue-500 selection:text-white'
        : 'bg-obsidian-950 text-slate-100 selection:bg-cyan-500 selection:text-obsidian-950'
    }`}>
      {/* 方案 C 极光流体环境柔光层 */}
      {isIosGlass && (
        <div id="ios-mesh-bg" className="ios-glass-mesh-layer ios-mesh-mist pointer-events-none fixed inset-0 z-0" />
      )}
      
      {/* 1. 顶部 Header (含情绪极性心电图、24H 调度监控与每日诺贝尔文学奖名言灵感胶囊) */}
      <IntelligenceHeader
        statusInfo={statusInfo}
        onManualSync={handleRetry}
        isSyncing={isSilentRefreshing || isInitialLoading}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenDevTools={() => setIsDevToolsOpen(true)}
        nobelQuote={nobelQuote}
        onShuffleQuote={handleShuffleQuote}
        currentDate={selectedDate}
      />



      {/* 悬浮 Toast 消息 */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-obsidian-card/95 backdrop-blur-md text-cyan-300 font-mono text-xs px-4 py-2.5 rounded-xl shadow-2xl border border-cyan-500/30 animate-fade-in flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 主体视窗容器 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        
        {/* 2. 领域分类与新奇视图控制栏 (方案 C：前置日期步进器与分类筛选一体化) */}
        <GlobalCategoryBar
          selectedCategory={category}
          onSelectCategory={(cat) => { setCategory(cat); setPage(1); }}
          viewMode={viewMode}
          onSelectViewMode={(mode) => { setViewMode(mode); setPage(1); }}
          selectedSentiment={sentiment}
          onSelectSentiment={(s) => { setSentiment(s); setPage(1); }}
          selectedDate={selectedDate}
          availableDates={availableDates.length > 0 ? availableDates : (statusInfo?.availableDates || [selectedDate])}
          onSelectDate={handleDateChange}
          searchValue={search}
          onSearchChange={(val) => { setSearch(val); setPage(1); setCrossSearchResults(null); }}
          stats={currentStats}
          bookmarkCount={bookmarks.length}
          isLoading={isSilentRefreshing || isInitialLoading}
          hasNewerBatchAvailable={hasNewerBatchAvailable}
          onJumpToLatest={handleJumpToLatest}
          onDismissNewerBatch={handleDismissNewerBatch}
        />

        {/* 智库成果页面专属：非侵入式晨报提炼与穿透提示微胶囊 */}
        {(statusInfo?.isFallback || isCurrentBatchRunningOrPending) && (
          <div className={`mb-4 px-4 py-3 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono transition border ${
            isPopDopamine
              ? 'bg-amber-100 border-[2.5px] border-slate-900 shadow-[3px_3px_0px_#000] text-slate-900 font-bold'
              : isIosGlass
              ? 'bg-amber-500/10 border border-amber-500/20 text-amber-900 shadow-sm font-semibold'
              : 'bg-amber-950/40 border border-amber-500/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.15)] font-semibold'
          }`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping flex-shrink-0" />
              <span className="font-bold whitespace-nowrap flex-shrink-0">
                {statusInfo?.isFallback ? '⚡ 智库内参穿透归档' : '🚀 晨报调度提炼中'}
              </span>
              <span className="truncate">
                {statusInfo?.fallbackNotice || `[${selectedDate}] 晨报正在深度提炼中，当前为您呈现最新一期已归档智库成果`}
              </span>
            </div>
            {statusInfo?.isFallback && statusInfo.effectiveDate && (
              <button
                type="button"
                onClick={() => handleDateChange(statusInfo.effectiveDate!)}
                className={`px-2.5 py-1 text-[11px] rounded-lg transition whitespace-nowrap cursor-pointer ${
                  isPopDopamine
                    ? 'bg-white border-2 border-slate-900 shadow-[1px_1px_0px_#000] text-slate-900 hover:bg-yellow-200'
                    : isIosGlass
                    ? 'bg-white text-blue-600 border border-slate-200 shadow-xs'
                    : 'bg-black/60 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-950'
                }`}
              >
                切换至该期 [{statusInfo.effectiveDate}]
              </button>
            )}
          </div>
        )}

        {/* 3. 边界状态处理 1: 网络错误捕获与“点击重试”按钮 */}
        {errorMessage ? (
          <div className="glass-card rounded-2xl p-10 text-center max-w-lg mx-auto my-12 border border-rose-500/30 shadow-glow-rose">
            <div className="w-16 h-16 rounded-2xl bg-rose-950/60 border border-rose-500/40 flex items-center justify-center mx-auto mb-4 text-rose-400">
              <WifiOff className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white mb-2 font-mono flex items-center justify-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>智库情报网络连接超时</span>
            </h3>
            <p className="text-xs text-rose-300/80 mb-6 font-mono leading-relaxed bg-black/40 p-3 rounded-lg border border-rose-900/40">
              {errorMessage}
            </p>
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-mono font-bold text-white bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 rounded-xl transition shadow-lg active:scale-95 border border-rose-400/30"
            >
              <RotateCw className="w-4 h-4" />
              <span>点击重试加载</span>
            </button>
          </div>
        ) : (isCurrentBatchRunningOrPending && rawBatchNews.length === 0) ? (
          /* 仅在完全没有历史或穿透缓存可用时才呈现过程态 */
          <RunningStateView
            statusInfo={statusInfo}
            onViewPreviousDay={handleViewPreviousDay}
            previousDateStr={availableDates[1] || '2026-09-23'}
            isFinishing={isRunningTransitionActive}
            onFinishTransition={handleFinishTransition}
          />
        ) : isInitialLoading ? (
          /* 3. 边界状态处理 2: 初次加载骨架屏 (Skeleton Loading) */
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              <span>正在载入全球智库前沿内参...</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-2 md:row-span-2 h-96 glass-card rounded-2xl animate-pulse bg-white/[0.02]"></div>
              <div className="h-64 glass-card rounded-2xl animate-pulse bg-white/[0.02]"></div>
              <div className="h-64 glass-card rounded-2xl animate-pulse bg-white/[0.02]"></div>
              <div className="h-64 glass-card rounded-2xl animate-pulse bg-white/[0.02]"></div>
              <div className="h-64 glass-card rounded-2xl animate-pulse bg-white/[0.02]"></div>
              <div className="h-64 glass-card rounded-2xl animate-pulse bg-white/[0.02]"></div>
            </div>
          </div>
        ) : isBookmarksMode && currentItems.length === 0 ? (
          /* 3. 边界状态处理 3A: 收藏夹为空提示 */
          <div className={`glass-card rounded-2xl p-12 text-center max-w-lg mx-auto my-12 border ${
            isIosGlass
              ? 'bg-white/95 border-amber-300 shadow-sm'
              : 'border-amber-500/20 shadow-glow-amber bg-amber-950/10'
          }`}>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
              isIosGlass
                ? 'bg-amber-100 border border-amber-300 text-amber-600'
                : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
            }`}>
              <Bookmark className="w-8 h-8 fill-current opacity-80" />
            </div>
            <h3 className={`text-base font-bold mb-2 font-mono ${
              isIosGlass ? 'text-slate-900' : 'text-white'
            }`}>
              您的全球智库收藏夹目前为空
            </h3>
            <p className={`text-xs mb-6 font-mono leading-relaxed ${
              isIosGlass ? 'text-slate-600' : 'text-slate-300'
            }`}>
              在浏览任何研报卡片或打开深度解析档案时，点击 ⭐ 收藏按钮即可将核心宏观情报永久留存在本地浏览器中，跨越历史批次随时温故复盘。
            </p>
            <button
              type="button"
              onClick={() => {
                setCategory('all');
                setPage(1);
              }}
              className={`px-5 py-2.5 text-xs font-mono font-bold rounded-xl transition ${
                isIosGlass
                  ? 'text-white bg-amber-600 hover:bg-amber-700 shadow-sm'
                  : 'text-amber-300 bg-amber-950/80 hover:bg-amber-900 border border-amber-700/60 shadow-md shadow-amber-950/40'
              }`}
            >
              浏览全部领域研报
            </button>
          </div>
        ) : (currentItems.length === 0 && rawBatchNews.length > 0) ? (
          /* 3. 边界状态处理 3B: 结果优先的智能推荐引导 (Zero-Dead-End Discovery: 仅在筛选/检索未命中时激活) */
          <div className="space-y-6">
            <div className={`glass-card rounded-2xl p-6 sm:p-8 border transition-all ${
              isPopDopamine
                ? 'bg-white border border-slate-900 shadow-[0_0_0_2px_#0f172a,4px_4px_0px_#000]'
                : isIosGlass
                ? 'bg-white/95 border-slate-200 shadow-md'
                : 'border-cyan-500/30 bg-slate-900/60 shadow-[0_0_20px_rgba(0,240,255,0.1)]'
            }`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isPopDopamine
                      ? 'bg-yellow-300 border-2 border-slate-900 text-slate-900'
                      : isIosGlass
                      ? 'bg-blue-50 text-blue-600 border border-blue-200'
                      : 'bg-cyan-950/60 text-cyan-400 border border-cyan-500/40'
                  }`}>
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className={`text-sm sm:text-base font-bold font-mono ${
                      isPopDopamine || isIosGlass ? 'text-slate-900' : 'text-white'
                    }`}>
                      {crossSearchResults !== null
                        ? (crossSearchResults.length > 0 
                            ? `🔎 跨期深度检索命中（共 ${crossSearchResults.length} 篇）· 跨时空历史穿透` 
                            : `全历史归档未命中 · 为您推荐今日重磅头条`)
                        : '当前筛选暂无匹配项 · 智能推荐与跨期穿透'}
                    </h3>
                    <p className={`text-xs mt-1 font-mono leading-relaxed ${
                      isPopDopamine || isIosGlass ? 'text-slate-600' : 'text-slate-400'
                    }`}>
                      在当前条件「{category !== 'all' ? (category === 'bookmarks' ? '我的收藏' : category) : '全领域'}{search ? ` · 搜索: ${search}` : ''}{sentiment !== 'all' ? ` · 情绪: ${sentiment}` : ''}」下未检索到条目。
                      {search && crossSearchResults === null && ' 您可点击右侧按钮发起跨全部历史归档深度检索，或浏览今日核心头条：'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  {search && search.trim() && (
                    <button
                      type="button"
                      disabled={isCrossSearching}
                      onClick={handleCrossArchiveSearch}
                      className={`px-4 py-2.5 text-xs font-mono font-bold rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                        isCrossSearching ? 'opacity-60 cursor-not-allowed' : ''
                      } ${
                        isPopDopamine
                          ? 'bg-amber-300 text-slate-900 border-2 border-slate-900 shadow-[2px_2px_0px_#000] hover:bg-amber-400'
                          : isIosGlass
                          ? 'text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 shadow-sm'
                          : 'text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/60 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                      }`}
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>{isCrossSearching ? '正在跨期穿透检索...' : `🔍 跨越全部 ${availableDates.length || '多'} 期历史深度检索「${search}」`}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleResetFilter}
                    className={`px-4 py-2.5 text-xs font-mono font-bold rounded-xl whitespace-nowrap transition-all flex-shrink-0 cursor-pointer ${
                      isPopDopamine
                        ? 'bg-pink-500 text-white border-2 border-slate-900 shadow-[2px_2px_0px_#000] hover:translate-y-[-1px]'
                        : isIosGlass
                        ? 'text-white bg-blue-600 hover:bg-blue-700 shadow-sm'
                        : 'text-cyan-300 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800'
                    }`}
                  >
                    重置筛选 · 浏览全领域
                  </button>
                </div>
              </div>
            </div>

            {/* 若跨期检索成功且有结果，直接呈现跨期研报结果流 */}
            {crossSearchResults !== null && crossSearchResults.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span>跨时空命中研报档案（点击卡片即可查看或切换批次）：</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setCrossSearchResults(null)}
                    className="text-cyan-400 hover:underline cursor-pointer"
                  >
                    返回今日推荐 ↩
                  </button>
                </div>
                <BentoView
                  items={crossSearchResults}
                  loading={false}
                  onSelectNews={(news) => setSelectedNews(news)}
                  onResetFilter={handleResetFilter}
                  bookmarkedIdSet={bookmarkedIdSet}
                  onToggleBookmark={handleToggleBookmark}
                />
              </div>
            ) : recommendedHeadlineItems.length > 0 ? (
              /* 默认：直接呈现核心头条推荐流，杜绝任何形式的空白死胡同 */
              <BentoView
                items={recommendedHeadlineItems}
                loading={false}
                onSelectNews={(news) => setSelectedNews(news)}
                onResetFilter={handleResetFilter}
                bookmarkedIdSet={bookmarkedIdSet}
                onToggleBookmark={handleToggleBookmark}
              />
            ) : null}
          </div>
        ) : (
          /* 正常呈现新闻卡片流 (支持 Bento / Matrix / Timeline 视图) */
          <>
            {viewMode === 'bento' && (
              <BentoView
                items={currentDisplayItems}
                loading={false}
                onSelectNews={(news) => setSelectedNews(news)}
                onResetFilter={handleResetFilter}
                bookmarkedIdSet={bookmarkedIdSet}
                onToggleBookmark={handleToggleBookmark}
              />
            )}

            {viewMode === 'matrix' && (
              <MatrixStreamView
                items={currentDisplayItems}
                loading={false}
                onSelectNews={(news) => setSelectedNews(news)}
                bookmarkedIdSet={bookmarkedIdSet}
                onToggleBookmark={handleToggleBookmark}
              />
            )}

            {viewMode === 'timeline' && (
              <TimelineScrubber
                items={currentDisplayItems}
                loading={false}
                onSelectNews={(news) => setSelectedNews(news)}
                bookmarkedIdSet={bookmarkedIdSet}
                onToggleBookmark={handleToggleBookmark}
              />
            )}

            {/* Bento 模式下呈现分页控制器 */}
            {viewMode === 'bento' && (
              <Pagination
                currentPage={page}
                totalPages={currentTotalPages}
                total={currentTotal}
                pageSize={pageSize}
                onPageChange={(p) => setPage(p)}
              />
            )}
          </>
        )}

      </main>

      {/* Gemini 认知档案深度解析侧滑抽屉 */}
      <IntelligenceDrawer
        news={selectedNews}
        onClose={() => setSelectedNews(null)}
        isBookmarked={selectedNews ? bookmarkedIdSet.has(selectedNews.id) : false}
        onToggleBookmark={handleToggleBookmark}
        onShowToast={showToast}
        onSelectNews={(item) => setSelectedNews(item)}
      />

      {/* 快捷导入 Gemini 简报产物弹窗 */}
      <ImportBriefingModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        currentDate={selectedDate}
        onSuccess={(importedDate) => {
          setSelectedDate(importedDate);
          setPage(1);
          loadDashboardData(false);
          fetchAvailableDates().then(res => { if (res.dates) setAvailableDates(res.dates); }).catch(() => {});
          showToast(`已成功同步并归档 [${importedDate}] 简报`);
        }}
      />

      {/* 全栈开发者调试面板 (DevTools Panel) */}
      <DevToolsPanel
        isOpen={isDevToolsOpen}
        onClose={() => setIsDevToolsOpen(false)}
        onToggleStatus={handleToggleStatus}
        onTriggerSilentSync={handleTriggerSilentSync}
        onInjectNews={handleInjectNews}
        onSimulateError={handleSimulateError}
        onSimulateEmpty={handleSimulateEmpty}
        currentStatus={statusInfo?.status}
        silentCountdown={silentCountdown}
        onOpenImportModal={() => setIsImportModalOpen(true)}
      />

      {/* 底部智库状态条 */}
      <footer className={`border-t py-4 mt-auto transition-colors relative z-10 ${
        isIosGlass ? 'bg-white/80 border-slate-200/60 text-slate-500' : 'bg-obsidian-950 border-white/5 text-slate-500'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono gap-2">
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${isIosGlass ? 'bg-blue-600' : 'bg-cyan-400'}`}></span>
            <span className={isIosGlass ? 'text-slate-700 font-semibold' : 'text-slate-400'}>
              GEMINI SPARK GLOBAL INTELLIGENCE PLATFORM · 24H AGENT BRIEFINGS
            </span>
          </div>
          <div className={isIosGlass ? 'text-slate-500' : 'text-slate-400'}>
            EVENT-DRIVEN SYNC: ZERO-IDLE POLLING · IN-MEMORY CLIENT BATCH
          </div>
        </div>
      </footer>

    </div>
  );
};

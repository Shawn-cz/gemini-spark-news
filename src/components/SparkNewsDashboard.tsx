import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  AlertTriangle, 
  RotateCw, 
  Inbox, 
  WifiOff, 
  Radio
} from 'lucide-react';
import { 
  GlobalNewsItem, 
  CategoryType, 
  SentimentType, 
  ViewMode, 
  SparkBatchStatusInfo, 
  GlobalNewsStats,
  BatchStatusType 
} from '../types/news';
import { fetchNewsList, fetchSparkBatchStatus, toggleSparkStatus } from '../services/api';
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

export const SparkNewsDashboard: React.FC = () => {
  // 1. 过滤与查询条件状态
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-24');
  const [category, setCategory] = useState<CategoryType>('all');
  const [sentiment, setSentiment] = useState<SentimentType | 'all'>('all');
  const [search, setSearch] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('bento');

  // 分页状态
  const [page, setPage] = useState<number>(1);
  const pageSize = viewMode === 'bento' ? 8 : 24;
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // 2. 数据与元信息状态
  const [newsItems, setNewsItems] = useState<GlobalNewsItem[]>([]);
  const [stats, setStats] = useState<GlobalNewsStats | null>(null);
  const [statusInfo, setStatusInfo] = useState<SparkBatchStatusInfo | null>(null);
  const [selectedNews, setSelectedNews] = useState<GlobalNewsItem | null>(null);

  // 3. 边界状态控制：初次加载骨架、静默刷新指示、接口错误
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [isSilentRefreshing, setIsSilentRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isDevToolsOpen, setIsDevToolsOpen] = useState<boolean>(false);
  const [silentCountdown, setSilentCountdown] = useState<number>(30);

  // 4. 引用持久化，防止竞态条件与内存泄漏
  const abortControllerRef = useRef<AbortController | null>(null);
  const silentTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    const t = setTimeout(() => setToastMsg(null), 3200);
    return () => clearTimeout(t);
  }, []);

  // 核心拉取函数：集成 AbortController 严格取消旧请求
  const loadDashboardData = useCallback(async (isSilent = false) => {
    // 若已有正在发起的请求，立即中断取消
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    if (!isSilent) {
      setIsInitialLoading(true);
      setErrorMessage(null);
    } else {
      setIsSilentRefreshing(true);
    }

    try {
      // 并发拉取批次状态与新闻列表
      const [batchStatusRes, newsRes] = await Promise.all([
        fetchSparkBatchStatus(selectedDate, controller.signal),
        fetchNewsList({
          date: selectedDate,
          category,
          sentiment,
          search,
          page,
          pageSize
        }, controller.signal)
      ]);

      setStatusInfo(batchStatusRes);
      setNewsItems(newsRes.items);
      setTotalPages(newsRes.pagination.totalPages);
      setTotalCount(newsRes.pagination.total);
      setStats(newsRes.stats);
      setErrorMessage(null);

      if (isSilent) {
        showToast('批次数据同步完成：已载入最新 Gemini Spark 情报');
      }
    } catch (err: any) {
      // 若为主动取消的中断错误，则静默忽略，不污染状态
      if (err.name === 'AbortError') {
        return;
      }
      console.error('[SparkNewsDashboard] 数据拉取异常:', err);
      // 仅在非静默刷新或当前无缓存数据时呈现错误卡片
      if (!isSilent || newsItems.length === 0) {
        setErrorMessage(err.message || '网络连接中断或 Gemini Spark 接口异常');
      } else {
        showToast('后台定时同步遇到偶发异常，继续保留当前数据');
      }
    } finally {
      if (!isSilent) {
        setIsInitialLoading(false);
      }
      setIsSilentRefreshing(false);
    }
  }, [selectedDate, category, sentiment, search, page, pageSize, newsItems.length, showToast]);

  // 手动触发重试
  const handleRetry = () => {
    loadDashboardData(false);
  };

  // 效应：依赖变更即时拉取 + 智能事件驱动唤醒 (COMPLETED 状态下 0 轮询休眠) + 组件销毁时彻底清理
  useEffect(() => {
    // 首次/查询依赖变更时立即拉取
    loadDashboardData(false);

    // 清理既有定时器
    if (silentTimerRef.current) {
      clearInterval(silentTimerRef.current);
      silentTimerRef.current = null;
    }

    // 关键优化：只有在当前批次处于“计算中/排队中”时，才启动 30s 倒计时轮询直到生成完毕
    const isGenerating = statusInfo?.status === 'RUNNING' || statusInfo?.status === 'PENDING';
    if (isGenerating) {
      setSilentCountdown(30);
      silentTimerRef.current = setInterval(() => {
        setSilentCountdown((prev) => {
          if (prev <= 1) {
            loadDashboardData(true);
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // 批次已完成 (COMPLETED)：彻底关闭定时器，0 轮询零开销
      setSilentCountdown(0);
    }

    // 事件唤醒 1：用户从其他应用/网页切回当前大屏标签页时，自动静默同步一次
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadDashboardData(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 事件唤醒 2：每分钟轻量检测本地系统自然日跨天 (针对通宵开机不关电脑的用户)
    const dayCheckTimer = setInterval(() => {
      const todayStr = new Date().toISOString().slice(0, 10);
      if (todayStr > selectedDate) {
        setSelectedDate(todayStr);
        setPage(1);
        showToast(`检测到系统时间跨天 [${todayStr}]，已自动切换至最新晨报批次`);
      }
    }, 60000);

    // 关键安全清理：组件卸载或依赖重置时清理所有定时器并中止在飞请求
    return () => {
      if (silentTimerRef.current) {
        clearInterval(silentTimerRef.current);
        silentTimerRef.current = null;
      }
      clearInterval(dayCheckTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [loadDashboardData, statusInfo?.status, selectedDate, showToast]);

  // 5. 原生 SSE 推流监听：接收后端 Gemini Spark 智能体 5 阶段实时进度与完成自动感知
  useEffect(() => {
    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/spark/stream');
      es.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'PROGRESS') {
            setStatusInfo((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                status: 'RUNNING',
                statusText: '智能体生成中',
                progress: typeof payload.progress === 'number' ? payload.progress : prev.progress,
                currentStage: `阶段 ${payload.stage}: ${payload.message}`
              };
            });
          } else if (payload.type === 'COMPLETED') {
            setStatusInfo((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                status: 'COMPLETED',
                statusText: '已完成归档',
                progress: 100,
                currentStage: payload.message || 'Gemini Spark 简报生成完成'
              };
            });
            // 收到 COMPLETED 时，平滑无感重新拉取最新数据
            loadDashboardData(true);
            showToast('⚡ Gemini Spark 今日简报生产完毕，大屏已自动同步');
          }
        } catch {
          // ignore parse error
        }
      };
    } catch (e) {
      console.warn('[SSE] EventSource 初始化失败:', e);
    }

    return () => {
      if (es) {
        es.close();
      }
    };
  }, [loadDashboardData, showToast]);

  // DevTools 调试动作
  const handleTriggerSilentSync = () => {
    loadDashboardData(true);
    showToast('DevTools: 手动强制触发静默同步管道');
  };

  const handleInjectNews = (mockItem: GlobalNewsItem) => {
    setNewsItems((prev) => [mockItem, ...prev]);
    setTotalCount((prev) => prev + 1);
    showToast(`DevTools: 成功注入测试新闻 [${mockItem.category.toUpperCase()}]`);
  };

  const handleSimulateError = (msg: string) => {
    setErrorMessage(msg);
    showToast('DevTools: 已模拟管道中断错误边界状态');
  };

  const handleSimulateEmpty = () => {
    setNewsItems([]);
    setTotalCount(0);
    showToast('DevTools: 已清空当前列表模拟空状态 (Empty State)');
  };

  // 调试状态切换 (COMPLETED <-> RUNNING)
  const handleToggleStatus = async (targetStatus?: BatchStatusType) => {
    try {
      const res = await toggleSparkStatus(selectedDate, targetStatus);
      showToast(res.message);
      await loadDashboardData(false);
    } catch (err: any) {
      showToast(err.message || '切换批次状态失败');
    }
  };

  // 快速跳转至往期归档
  const handleViewPreviousDay = () => {
    const dates = statusInfo?.availableDates || ['2026-09-24', '2026-09-23'];
    const curIdx = dates.indexOf(selectedDate);
    const prevDate = dates[curIdx + 1] || '2026-09-23';
    setSelectedDate(prevDate);
    setPage(1);
    showToast(`已无损切换至往期批次 [${prevDate}]`);
  };

  // 重置筛选
  const handleResetFilter = () => {
    setCategory('all');
    setSentiment('all');
    setSearch('');
    setPage(1);
  };

  const isCurrentBatchRunningOrPending = 
    statusInfo && statusInfo.status !== 'COMPLETED';

  return (
    <div className="min-h-screen bg-obsidian-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-obsidian-950">
      
      {/* 1. 顶部 Header (含情绪极性心电图与 24H 调度监控) */}
      <IntelligenceHeader
        statusInfo={statusInfo}
        loading={isInitialLoading}
        onRefresh={() => {
          loadDashboardData(false);
          showToast('手动同步请求已发出');
        }}
        onToggleStatus={handleToggleStatus}
        onOpenImport={() => setIsImportModalOpen(true)}
        onOpenDevTools={() => setIsDevToolsOpen(true)}
      />

      {/* 静默刷新指示呼吸指示条 (触发时不打扰正常浏览) */}
      {isSilentRefreshing && (
        <div className="w-full bg-cyan-950/60 border-b border-cyan-500/20 py-1 px-4 text-center">
          <span className="inline-flex items-center gap-2 text-[11px] font-mono text-cyan-300">
            <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span>智能事件驱动机制生效中：正在后台静默同步最新 Gemini Spark 批次...</span>
          </span>
        </div>
      )}

      {/* 悬浮 Toast 消息 */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-obsidian-card/95 backdrop-blur-md text-cyan-300 font-mono text-xs px-4 py-2.5 rounded-xl shadow-2xl border border-cyan-500/30 animate-fade-in flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 主体视窗容器 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* 2. 领域分类与新奇视图控制栏 */}
        <GlobalCategoryBar
          selectedCategory={category}
          onSelectCategory={(cat) => { setCategory(cat); setPage(1); }}
          viewMode={viewMode}
          onSelectViewMode={(mode) => { setViewMode(mode); setPage(1); }}
          selectedSentiment={sentiment}
          onSelectSentiment={(s) => { setSentiment(s); setPage(1); }}
          selectedDate={selectedDate}
          availableDates={statusInfo?.availableDates || [selectedDate]}
          onSelectDate={(d) => { setSelectedDate(d); setPage(1); }}
          searchValue={search}
          onSearchChange={(val) => { setSearch(val); setPage(1); }}
          stats={stats}
        />

        {/* 3. 边界状态处理 1: 接口错误捕获与“点击重试”按钮 */}
        {errorMessage ? (
          <div className="glass-card rounded-2xl p-10 text-center max-w-lg mx-auto my-12 border border-rose-500/30 shadow-glow-rose">
            <div className="w-16 h-16 rounded-2xl bg-rose-950/60 border border-rose-500/40 flex items-center justify-center mx-auto mb-4 text-rose-400">
              <WifiOff className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white mb-2 font-mono flex items-center justify-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>数据拉取异常 / 管道通信中断</span>
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
              <span>点击重新尝试拉取</span>
            </button>
          </div>
        ) : isCurrentBatchRunningOrPending ? (
          /* 批次计算中状态 */
          <RunningStateView
            statusInfo={statusInfo}
            onViewPreviousDay={handleViewPreviousDay}
            previousDateStr="2026-09-23"
          />
        ) : isInitialLoading ? (
          /* 3. 边界状态处理 2: 初次加载骨架屏 (Skeleton Loading) */
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              <span>正在从 Gemini Spark 智能体管道初始化加载全球新闻元数据...</span>
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
        ) : newsItems.length === 0 ? (
          /* 3. 边界状态处理 3: 当 Spark 批次为空时的“暂无资讯”空状态 */
          <div className="glass-card rounded-2xl p-12 text-center max-w-lg mx-auto my-12 border border-white/10 shadow-inner">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4 text-slate-500">
              <Inbox className="w-8 h-8 text-cyan-400 opacity-60" />
            </div>
            <h3 className="text-base font-bold text-white mb-2 font-mono">
              当前 Gemini Spark 批次暂无资讯产物
            </h3>
            <p className="text-xs text-slate-400 mb-6 font-mono leading-relaxed">
              在所选日期 [{selectedDate}] 或当前检索过滤条件下，Gemini Spark 智能体未产生符合条件的输出。您可切换历史简报或重置筛选条件。
            </p>
            <button
              type="button"
              onClick={handleResetFilter}
              className="px-4 py-2 text-xs font-mono font-semibold text-cyan-300 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800 rounded-xl transition"
            >
              重置所有过滤与检索条件
            </button>
          </div>
        ) : (
          /* 正常呈现新闻卡片流 (支持 Bento / Matrix / Timeline 视图) */
          <>
            {viewMode === 'bento' && (
              <BentoView
                items={newsItems}
                loading={false}
                onSelectNews={(news) => setSelectedNews(news)}
                onResetFilter={handleResetFilter}
              />
            )}

            {viewMode === 'matrix' && (
              <MatrixStreamView
                items={newsItems}
                loading={false}
                onSelectNews={(news) => setSelectedNews(news)}
              />
            )}

            {viewMode === 'timeline' && (
              <TimelineScrubber
                items={newsItems}
                loading={false}
                onSelectNews={(news) => setSelectedNews(news)}
              />
            )}

            {/* Bento 模式下呈现分页控制器 */}
            {viewMode === 'bento' && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                total={totalCount}
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
      />

      {/* 底部智库状态条 */}
      <footer className="border-t border-white/5 py-4 mt-auto bg-obsidian-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            <span>GEMINI SPARK GLOBAL INTELLIGENCE PLATFORM · 24H AGENT BRIEFINGS</span>
          </div>
          <div className="text-slate-400">
            EVENT-DRIVEN SYNC: ZERO-IDLE POLLING · ABORT-CONTROLLER GUARDED
          </div>
        </div>
      </footer>

    </div>
  );
};

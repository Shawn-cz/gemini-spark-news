import React, { useState } from 'react';
import { 
  Globe, 
  CheckCircle2, 
  RotateCw, 
  Activity, 
  SlidersHorizontal,
  Clock,
  Radio,
  Upload
} from 'lucide-react';
import { SparkBatchStatusInfo } from '../types/news';
import { ThemeSwitcher } from './ThemeSwitcher';
import { DateStepperCapsule } from './DateStepperCapsule';

export interface IntelligenceHeaderProps {
  statusInfo: SparkBatchStatusInfo | null;
  onManualSync: () => void;
  isSyncing: boolean;
  onOpenImportModal: () => void;
  onOpenDevTools: () => void;
  currentDate: string;
  availableDates: string[];
  onDateChange: (date: string) => void;
  hasNewerBatchAvailable?: boolean;
  onJumpToLatest?: () => void;
}

export const IntelligenceHeader: React.FC<IntelligenceHeaderProps> = ({
  statusInfo,
  onManualSync,
  isSyncing,
  onOpenImportModal,
  onOpenDevTools,
  currentDate,
  availableDates,
  onDateChange,
  hasNewerBatchAvailable = false,
  onJumpToLatest
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = () => {
    if (isRefreshing || isSyncing) return;
    setIsRefreshing(true);
    onManualSync();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const isCompleted = statusInfo?.status === 'COMPLETED';
  const isRunning = statusInfo?.status === 'RUNNING';
  const sentimentScore = statusInfo?.globalSentimentIndex ?? 28;

  // 根据极性分判定文案与色彩 (拆分中英文，支持自适应紧凑排版)
  const getPulseMeta = (score: number) => {
    if (score >= 30) return { label: '显著积极', en: 'Risk-On', color: 'text-emerald-400', bar: 'bg-emerald-500' };
    if (score >= 0) return { label: '谨慎乐观', en: 'Mild Optimism', color: 'text-cyan-400', bar: 'bg-cyan-500' };
    if (score >= -30) return { label: '中性观望', en: 'Neutral Watch', color: 'text-slate-400', bar: 'bg-slate-500' };
    return { label: '避险预警', en: 'Risk-Off', color: 'text-rose-400', bar: 'bg-rose-500' };
  };

  const pulse = getPulseMeta(sentimentScore);

  return (
    <header className="bg-obsidian-950/90 border-b border-white/10 sticky top-0 z-30 backdrop-blur-xl shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        
        {/* 第一行：Logo、品牌标识、操作区 (两端分布，自适应响应式，永不重叠) */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5 xl:gap-4">
          
          {/* Logo 与智库品牌标识 */}
          <div className="flex items-center space-x-3 min-w-0">
            <div className="header-logo-icon w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-[1px] shadow-lg shadow-cyan-500/20 flex-shrink-0">
              <div className="w-full h-full bg-obsidian-950 rounded-[11px] flex items-center justify-center text-cyan-400">
                <Globe className="w-5 h-5 animate-spin-slow" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                <h1 className="text-base sm:text-lg font-black tracking-wider text-white uppercase bg-gradient-to-r from-white via-cyan-200 to-blue-400 bg-clip-text text-transparent whitespace-nowrap">
                  Gemini Spark Intelligence
                </h1>
                <span className="header-brand-badge px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 flex items-center gap-1 shadow-inner whitespace-nowrap flex-shrink-0">
                  <Radio className="w-2.5 h-2.5 text-cyan-400 animate-pulse flex-shrink-0" />
                  GEMINI AGENT 24H
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono tracking-tight truncate max-w-sm sm:max-w-md xl:max-w-xl">
                基于 Gemini 智能体定时全网检索、多语种提炼与全球宏观认知分析管道
              </p>
            </div>
          </div>

          {/* 右侧：全站主题切换胶囊、状态切换与防抖同步按钮 (自适应平铺与换行保护) */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap justify-start xl:justify-end min-w-0">
            {/* 全站色彩主题切换胶囊 */}
            <ThemeSwitcher />

            {/* 调试面板 */}
            {onOpenDevTools && (
              <button
                type="button"
                onClick={onOpenDevTools}
                className="header-action-btn header-btn-devtools px-3 py-1.5 text-xs font-mono rounded-lg text-amber-300 bg-amber-950/70 hover:bg-amber-900 border border-amber-800 transition-all flex items-center gap-1.5 shadow-sm whitespace-nowrap flex-shrink-0"
                title="打开全栈开发者调试套件 (DevTools)"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span className="whitespace-nowrap">DevTools</span>
                <span className={`whitespace-nowrap font-bold ${isRunning ? "text-amber-400" : "text-emerald-400"}`}>
                  [{isRunning ? "计算中" : "已归档"}]
                </span>
              </button>
            )}

            {/* 导入今日 Gemini 简报 */}
            {onOpenImportModal && (
              <button
                type="button"
                onClick={onOpenImportModal}
                className="header-action-btn header-btn-import px-3 py-1.5 text-xs font-mono rounded-lg text-cyan-300 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800 transition-all flex items-center gap-1.5 shadow-sm whitespace-nowrap flex-shrink-0"
                title="粘贴并导入 Gemini Spark 定时任务生成的输出"
              >
                <Upload className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                <span className="whitespace-nowrap">导入简报</span>
              </button>
            )}

            {/* 历史日期步进选择胶囊 */}
            <DateStepperCapsule
              currentDate={currentDate}
              availableDates={availableDates}
              onDateChange={onDateChange}
              isLoading={isSyncing}
              hasNewerBatchAvailable={hasNewerBatchAvailable}
              onJumpToLatest={onJumpToLatest}
            />

            {/* 防抖刷新按钮 */}
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing || isSyncing}
              className={`header-action-btn header-btn-sync inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white shadow-lg transition-all border border-cyan-400/30 whitespace-nowrap flex-shrink-0 ${
                isRefreshing || isSyncing
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed border-slate-700'
                  : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-cyan-500/20'
              }`}
            >
              <RotateCw className={`w-3.5 h-3.5 flex-shrink-0 ${isRefreshing || isSyncing ? 'animate-spin' : ''}`} />
              <span className="font-mono whitespace-nowrap">{isRefreshing || isSyncing ? 'SYNCHRONIZING...' : '同步批次'}</span>
            </button>
          </div>

        </div>

        {/* 第二行：24H 批次调度与宏观认知监控栏 (5大关键情报指标卡) */}
        <div className="header-metric-grid mt-3 pt-3 border-t border-white/5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-xs font-mono">
          
          {/* 指标 1: 批次状态 */}
          <div className="header-metric-card flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/5 min-w-0">
            {isCompleted ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <Clock className="w-4 h-4 text-amber-400 animate-spin flex-shrink-0" />
            )}
            <div className="min-w-0">
              <div className="metric-label text-slate-500 text-[10px] uppercase whitespace-nowrap">Batch Status</div>
              <div className="metric-value font-semibold truncate whitespace-nowrap">
                {isCompleted ? (
                  <div className="flex items-center gap-1 whitespace-nowrap min-h-[28px]">
                    <span className="text-emerald-400 flex items-center gap-1 whitespace-nowrap">
                      <span className="metric-dot w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"></span>
                      24H COMPLETED
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1 min-h-[28px] justify-center flex flex-col">
                    <span className="text-amber-400 flex items-center gap-1 whitespace-nowrap">
                      <span className="metric-dot w-2 h-2 rounded-full bg-amber-400 animate-ping flex-shrink-0"></span>
                      {typeof statusInfo?.progress === 'number' ? `GENERATING ${statusInfo.progress}%` : 'GENERATING...'}
                    </span>
                    <div className="w-20 bg-slate-800 rounded-full h-1 overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-300"
                        style={{ width: `${typeof statusInfo?.progress === 'number' ? Math.min(100, Math.max(0, statusInfo.progress)) : 15}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 指标 2: 全球宏观情绪极性心电图 */}
          <div className="header-metric-card flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/5 min-w-0">
            <Activity className="w-4 h-4 text-cyan-400 animate-pulse flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="metric-label text-slate-500 text-[10px] uppercase whitespace-nowrap flex items-center justify-between">
                <span>Sentiment Pulse</span>
                <span className={`font-bold ${pulse.color}`}>
                  {sentimentScore > 0 ? `+${sentimentScore}%` : `${sentimentScore}%`}
                </span>
              </div>
              <div className="flex items-center justify-between gap-1 mt-0.5">
                <span className="metric-value text-slate-300 font-medium truncate text-[11px] whitespace-nowrap">
                  {pulse.label}
                </span>
                <div className="w-10 bg-slate-800 rounded-full h-1 overflow-hidden flex-shrink-0">
                  <div
                    className={`h-full rounded-full ${pulse.bar}`}
                    style={{ width: `${Math.min(100, Math.max(10, Math.abs(sentimentScore)))}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* 指标 3: 产出时间 / 实时推流阶段 */}
          <div className="header-metric-card flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/5 min-w-0">
            <Clock className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <div className="min-w-0">
              <div className="metric-label text-slate-500 text-[10px] uppercase whitespace-nowrap">
                {isCompleted ? 'Batch Ingestion Time' : 'Current Stage'}
              </div>
              <div 
                className="metric-value text-slate-300 font-medium truncate whitespace-nowrap"
                title={statusInfo?.currentStage || undefined}
              >
                {isCompleted ? (statusInfo?.generatedTime || '今日 08:30 AM') : (statusInfo?.currentStage || 'COMPUTING...')}
              </div>
            </div>
          </div>

          {/* 指标 4: 下次调度 */}
          <div className="header-metric-card flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/5 min-w-0">
            <Radio className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <div className="min-w-0">
              <div className="metric-label text-slate-500 text-[10px] uppercase whitespace-nowrap">Next Schedule Cycle</div>
              <div className="metric-value text-slate-300 font-medium truncate whitespace-nowrap">
                {statusInfo?.nextScheduleTime || '每日 08:30 AM (晨报)'}
              </div>
            </div>
          </div>

          {/* 指标 5: 归档资讯篇数 */}
          <div className="header-metric-card flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/5 min-w-0 col-span-2 sm:col-span-1">
            <Activity className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <div className="min-w-0">
              <div className="metric-label text-slate-500 text-[10px] uppercase whitespace-nowrap">Global Entities Audited</div>
              <div className="metric-value text-slate-300 font-semibold truncate whitespace-nowrap">
                {isCompleted ? `${statusInfo?.batchNewsCount ?? 0} 篇深度情报` : 'PROCESSING'}
              </div>
            </div>
          </div>

        </div>

      </div>
    </header>
  );
};

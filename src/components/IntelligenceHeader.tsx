import React, { useState } from 'react';
import { 
  Globe, 
  RotateCw, 
  Activity, 
  SlidersHorizontal,
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
  onDismissNewerBatch?: () => void;
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
  onJumpToLatest,
  onDismissNewerBatch
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = () => {
    if (isRefreshing || isSyncing) return;
    setIsRefreshing(true);
    onManualSync();
    setTimeout(() => setIsRefreshing(false), 800);
  };

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
    <header className="bg-obsidian-950/95 border-b border-white/10 sticky top-0 z-30 backdrop-blur-xl shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5">
        
        {/* 全响应式自适应布局：
            - 大屏/中屏桌面 (lg+): 单行平铺居中对齐，左侧品牌，右侧控制区 (日期步进 + 情绪脉搏 + 主题 + 操作)
            - 移动端/平板 (<lg): 优雅双行排版，第一行品牌+主题+同步，第二行日期步进+情绪脉搏，高度极致紧凑
        */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 sm:gap-2.5">
          
          {/* 第一行 (移动端) / 左侧 (桌面端)：Logo 与智库品牌标识 + (移动端右浮 ThemeSwitcher 与同步) */}
          <div className="flex items-center justify-between min-w-0">
            {/* 品牌标识 */}
            <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
              <div className="header-logo-icon w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-[1px] shadow-md shadow-cyan-500/20 flex-shrink-0">
                <div className="w-full h-full bg-obsidian-950 rounded-[11px] flex items-center justify-center text-cyan-400">
                  <Globe className="w-4 h-4 sm:w-4.5 sm:h-4.5 animate-spin-slow" />
                </div>
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-black tracking-wider text-white uppercase bg-gradient-to-r from-white via-cyan-200 to-blue-400 bg-clip-text text-transparent whitespace-nowrap">
                  <span className="sm:hidden">Gemini Spark</span>
                  <span className="hidden sm:inline">Gemini Spark Intelligence</span>
                </h1>
              </div>
            </div>

            {/* 移动端专属第一行右侧控制：主题切换器 + 紧凑同步按键 */}
            <div className="flex items-center gap-1.5 lg:hidden flex-shrink-0">
              <ThemeSwitcher />

              {/* 移动端紧凑 DevTools 按键 */}
              {onOpenDevTools && (
                <button
                  type="button"
                  onClick={onOpenDevTools}
                  className="header-action-btn p-1.5 rounded-lg text-amber-300 bg-amber-950/70 border border-amber-800 transition-all flex items-center justify-center flex-shrink-0 shadow-sm"
                  title="DevTools 开发者控制台"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                </button>
              )}
              
              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={isRefreshing || isSyncing}
                className="header-action-btn p-1.5 rounded-lg text-white bg-cyan-600 hover:bg-cyan-500 border border-cyan-400/30 transition-all flex items-center justify-center flex-shrink-0 shadow-sm"
                title={isRefreshing || isSyncing ? '同步中...' : '手动同步最新批次'}
              >
                <RotateCw className={`w-3.5 h-3.5 ${isRefreshing || isSyncing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* 第二行 (移动端) / 右侧 (桌面端)：核心业务控制器 (日期步进 + 情绪指标脉搏 + 桌面端操作) */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap lg:flex-nowrap justify-between lg:justify-end min-w-0">
            
            {/* 1. 历史日期步进选择胶囊 */}
            <DateStepperCapsule
              currentDate={currentDate}
              availableDates={availableDates}
              onDateChange={onDateChange}
              isLoading={isSyncing}
              hasNewerBatchAvailable={hasNewerBatchAvailable}
              onJumpToLatest={onJumpToLatest}
              onDismissNewerBatch={onDismissNewerBatch}
            />

            {/* 2. 全球宏观情绪极性指标 (唯一保留且精简的高价值情报胶囊) */}
            <div 
              className="header-sentiment-capsule inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.03] text-xs font-mono flex-shrink-0 transition-all shadow-sm"
              title={`全球宏观情绪极性: ${sentimentScore > 0 ? `+${sentimentScore}%` : `${sentimentScore}%`} (${pulse.label} / ${pulse.en})`}
            >
              <Activity className={`w-3.5 h-3.5 flex-shrink-0 ${pulse.color} animate-pulse`} />
              <span className="text-[10px] text-slate-400 uppercase tracking-wider hidden md:inline">情绪脉搏:</span>
              <span className={`font-black ${pulse.color} text-xs`}>
                {sentimentScore > 0 ? `+${sentimentScore}%` : `${sentimentScore}%`}
              </span>
              <span className="font-semibold text-slate-300 text-[11px] whitespace-nowrap">{pulse.label}</span>
              <div className="w-8 sm:w-10 bg-slate-800 rounded-full h-1 overflow-hidden hidden sm:block flex-shrink-0">
                <div
                  className={`h-full rounded-full ${pulse.bar}`}
                  style={{ width: `${Math.min(100, Math.max(10, Math.abs(sentimentScore)))}%` }}
                />
              </div>
            </div>

            {/* 桌面端专属操作区 (移动端已在第一行折叠) */}
            <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
              <ThemeSwitcher />

              {/* 调试面板 */}
              {onOpenDevTools && (
                <button
                  type="button"
                  onClick={onOpenDevTools}
                  className="header-action-btn header-btn-devtools px-2.5 py-1.5 text-xs font-mono rounded-lg text-amber-300 bg-amber-950/70 hover:bg-amber-900 border border-amber-800 transition-all flex items-center gap-1.5 shadow-sm whitespace-nowrap flex-shrink-0"
                  title="打开全栈开发者调试套件 (DevTools)"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>DevTools</span>
                  <span className={`font-bold hidden 2xl:inline ${isRunning ? "text-amber-400" : "text-emerald-400"}`}>
                    [{isRunning ? "计算中" : "已归档"}]
                  </span>
                </button>
              )}

              {/* 导入今日 Gemini 简报 */}
              {onOpenImportModal && (
                <button
                  type="button"
                  onClick={onOpenImportModal}
                  className="header-action-btn header-btn-import px-2.5 py-1.5 text-xs font-mono rounded-lg text-cyan-300 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800 transition-all hidden xl:flex items-center gap-1.5 shadow-sm whitespace-nowrap flex-shrink-0"
                  title="粘贴并导入 Gemini Spark 定时任务生成的输出"
                >
                  <Upload className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                  <span>导入简报</span>
                </button>
              )}

              {/* 桌面端防抖刷新按钮 */}
              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={isRefreshing || isSyncing}
                className={`header-action-btn header-btn-sync inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-md transition-all border border-cyan-400/30 whitespace-nowrap flex-shrink-0 ${
                  isRefreshing || isSyncing
                    ? 'bg-slate-800 text-slate-400 cursor-not-allowed border-slate-700'
                    : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-cyan-500/20'
                }`}
              >
                <RotateCw className={`w-3.5 h-3.5 flex-shrink-0 ${isRefreshing || isSyncing ? 'animate-spin' : ''}`} />
                <span className="font-mono">{isRefreshing || isSyncing ? 'SYNC...' : '同步批次'}</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </header>
  );
};

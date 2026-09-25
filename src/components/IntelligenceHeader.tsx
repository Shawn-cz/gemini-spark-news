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
import { SparkBatchStatusInfo, BatchStatusType } from '../types/news';

interface IntelligenceHeaderProps {
  statusInfo: SparkBatchStatusInfo | null;
  loading: boolean;
  onRefresh: () => void;
  onToggleStatus: (status?: BatchStatusType) => void;
  onOpenImport?: () => void;
  onOpenDevTools?: () => void;
}

export const IntelligenceHeader: React.FC<IntelligenceHeaderProps> = ({
  statusInfo,
  loading,
  onRefresh,
  onToggleStatus,
  onOpenImport,
  onOpenDevTools
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = () => {
    if (isRefreshing || loading) return;
    setIsRefreshing(true);
    onRefresh();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const isCompleted = statusInfo?.status === 'COMPLETED';
  const isRunning = statusInfo?.status === 'RUNNING';
  const sentimentScore = statusInfo?.globalSentimentIndex ?? 28;

  // 根据极性分判定文案与色彩
  const getPulseMeta = (score: number) => {
    if (score >= 30) return { label: '显著积极 (Risk-On)', color: 'text-emerald-400', bar: 'bg-emerald-500' };
    if (score >= 0) return { label: '谨慎乐观 (Mild Optimism)', color: 'text-cyan-400', bar: 'bg-cyan-500' };
    if (score >= -30) return { label: '中性观望 (Neutral Watch)', color: 'text-slate-400', bar: 'bg-slate-500' };
    return { label: '避险预警 (Risk-Off)', color: 'text-rose-400', bar: 'bg-rose-500' };
  };

  const pulse = getPulseMeta(sentimentScore);

  return (
    <header className="bg-obsidian-950/90 border-b border-white/10 sticky top-0 z-30 backdrop-blur-xl shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        
        {/* 第一行：Logo、全球情绪脉搏仪、操作区 */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Logo 区域 */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-[1px] shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-obsidian-950 rounded-[11px] flex items-center justify-center text-cyan-400">
                <Globe className="w-5 h-5 animate-spin-slow" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-wider text-white uppercase bg-gradient-to-r from-white via-cyan-200 to-blue-400 bg-clip-text text-transparent">
                  Gemini Spark Intelligence
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 flex items-center gap-1 shadow-inner">
                  <Radio className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
                  GEMINI AGENT 24H
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono tracking-tight">
                基于 Gemini 智能体定时全网检索、多语种提炼与全球宏观认知分析管道
              </p>
            </div>
          </div>

          {/* 中间：全球舆情心电图 (Global Sentiment Pulse) */}
          <div className="hidden xl:flex items-center gap-3 px-4 py-2 rounded-xl bg-obsidian-card/90 border border-white/10 shadow-inner">
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
              <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>全球宏观情绪极性:</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono font-bold ${pulse.color}`}>
                {sentimentScore > 0 ? `+${sentimentScore}%` : `${sentimentScore}%`}
              </span>
              <span className="text-xs text-slate-300 font-medium">
                {pulse.label}
              </span>
            </div>
            {/* 微型极性进度条 */}
            <div className="w-20 bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full ${pulse.bar}`}
                style={{ width: `${Math.min(100, Math.max(10, Math.abs(sentimentScore)))}%` }}
              ></div>
            </div>
          </div>

          {/* 右侧：状态切换与防抖同步按钮 */}
          <div className="flex items-center gap-2.5 self-end lg:self-auto">
            {/* 调试面板 */}
            {onOpenDevTools ? (
              <button
                type="button"
                onClick={onOpenDevTools}
                className="px-2.5 py-1.5 text-xs font-mono rounded-lg text-amber-300 bg-amber-950/70 hover:bg-amber-900 border border-amber-800 transition-colors flex items-center gap-1.5 shadow-sm"
                title="打开全栈开发者调试套件 (DevTools)"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">DevTools</span>
                <span className={isRunning ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"}>
                  {isRunning ? "计算中" : "已归档"}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onToggleStatus()}
                className="px-2.5 py-1.5 text-xs font-mono rounded-lg text-slate-300 bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-1.5 border border-white/10"
                title="切换当前批次状态 (演示计算中与已完成)"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline text-slate-400">调试:</span>
                <span className={isRunning ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"}>
                  {isRunning ? "置为已完成" : "置为计算中"}
                </span>
              </button>
            )}

            {/* 导入今日 Gemini 简报 */}
            {onOpenImport && (
              <button
                type="button"
                onClick={onOpenImport}
                className="px-2.5 py-1.5 text-xs font-mono rounded-lg text-cyan-300 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800 transition-colors flex items-center gap-1.5 shadow-sm"
                title="粘贴并导入 Gemini Spark 定时任务生成的输出"
              >
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>导入简报</span>
              </button>
            )}

            {/* 防抖刷新按钮 */}
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing || loading}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white shadow-lg transition-all active:scale-95 border border-cyan-400/30 ${
                isRefreshing || loading
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed border-slate-700'
                  : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-cyan-500/20'
              }`}
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing || loading ? 'animate-spin' : ''}`} />
              <span className="font-mono">{isRefreshing ? 'SYNCHRONIZING...' : '同步批次'}</span>
            </button>
          </div>

        </div>

        {/* 第二行：24H 批次调度状态监控栏 */}
        <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono">
          
          {/* 指标 1: 批次状态 */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/5">
            {isCompleted ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <Clock className="w-4 h-4 text-amber-400 animate-spin flex-shrink-0" />
            )}
            <div className="min-w-0">
              <div className="text-slate-500 text-[10px] uppercase">Batch Status</div>
              <div className="font-semibold truncate">
                {isCompleted ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    24H BATCH COMPLETED
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                    GEMINI AGENT GENERATING...
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 指标 2: 产出时间 */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/5">
            <Clock className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-slate-500 text-[10px] uppercase">Batch Ingestion Time</div>
              <div className="text-slate-300 font-medium truncate">
                {isCompleted ? (statusInfo?.generatedTime || '今日 08:30 AM') : 'COMPUTING...'}
              </div>
            </div>
          </div>

          {/* 指标 3: 下次调度 */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/5">
            <Radio className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-slate-500 text-[10px] uppercase">Next Schedule Cycle</div>
              <div className="text-slate-300 font-medium truncate">
                {statusInfo?.nextScheduleTime || '每日 08:30 AM (晨报)'}
              </div>
            </div>
          </div>

          {/* 指标 4: 归档资讯篇数 */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/5">
            <Activity className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-slate-500 text-[10px] uppercase">Global Entities Audited</div>
              <div className="text-slate-300 font-semibold truncate">
                {isCompleted ? `${statusInfo?.batchNewsCount ?? 0} 篇全球深度情报` : 'PROCESSING'}
              </div>
            </div>
          </div>

        </div>

      </div>
    </header>
  );
};

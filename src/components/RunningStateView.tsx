import React from 'react';
import { Loader2, ArrowRight, ShieldAlert, Cpu, Radio, Sparkles } from 'lucide-react';
import { SparkBatchStatusInfo } from '../types/news';

interface RunningStateViewProps {
  statusInfo: SparkBatchStatusInfo | null;
  onViewPreviousDay: () => void;
  previousDateStr?: string;
}

export const RunningStateView: React.FC<RunningStateViewProps> = ({
  statusInfo,
  onViewPreviousDay,
  previousDateStr = '2026-09-23'
}) => {
  const isRunning = statusInfo?.status === 'RUNNING';
  const remainingMinutes = statusInfo?.estimatedRemainingMinutes ?? 18;
  const progress = statusInfo?.progress ?? 68;
  const currentStage = statusInfo?.currentStage ?? '阶段 3/4: 全球多语言 NLP 情感极性与地缘实体聚类';

  return (
    <div className="glass-card rounded-3xl border border-cyan-500/20 shadow-2xl p-8 sm:p-12 text-center max-w-2xl mx-auto my-12 relative overflow-hidden bg-gradient-to-b from-obsidian-card via-obsidian-950 to-obsidian-950">
      
      {/* 顶部背景微发光环境光 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-cyan-500/10 blur-3xl pointer-events-none rounded-full"></div>

      {/* 中心高科技雷达扫描动效 */}
      <div className="relative w-24 h-24 mx-auto mb-6">
        <div className="absolute inset-0 rounded-2xl bg-cyan-500/15 animate-ping opacity-75"></div>
        <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-glow-blue border border-cyan-400/40">
          {isRunning ? (
            <Loader2 className="w-12 h-12 animate-spin text-cyan-200" />
          ) : (
            <Cpu className="w-12 h-12 text-cyan-200 animate-pulse" />
          )}
        </div>
        <div className="absolute -bottom-1 -right-1 bg-amber-500 text-obsidian-950 p-1.5 rounded-full shadow-lg">
          <Sparkles className="w-4 h-4 fill-current" />
        </div>
      </div>

      {/* 标题 */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800 mb-3">
        <Radio className="w-3 h-3 animate-pulse" />
        <span>SPARK PIPELINE COMPUTING</span>
      </div>

      <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">
        {isRunning ? '今日全球多元智库数据正在分布式计算中' : 'Spark 24H 任务排队就绪中'}
      </h3>

      {/* 详细描述 */}
      <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto mb-8 font-mono leading-relaxed">
        Spark 集群正在并行摄入来自全球四大洲路透社、彭博社、英国金融时报、Nature 等国际媒体的实时资讯流，进行文本降维、NLP 实体提取与情绪量化。
        预计还需约 <span className="text-cyan-400 font-bold">{remainingMinutes} 分钟</span> 完成全量入库质检。
      </p>

      {/* 进度条与当前阶段卡片 */}
      <div className="bg-obsidian-950/80 border border-white/10 rounded-2xl p-5 mb-8 text-left max-w-md mx-auto shadow-inner">
        <div className="flex items-center justify-between text-xs font-mono mb-2.5">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            当前计算进度
          </span>
          <span className="font-bold text-cyan-400 font-mono">{progress}%</span>
        </div>
        <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden mb-3 border border-white/5">
          <div
            className="bg-gradient-to-r from-cyan-500 to-blue-600 h-full rounded-full transition-all duration-700 ease-out shadow-glow-blue"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
          <span className="text-slate-500">当前计算阶段:</span>
          <span className="text-slate-300 font-medium truncate">{currentStage}</span>
        </div>
      </div>

      {/* 快捷跳转与免等待回溯 */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
        <button
          type="button"
          onClick={onViewPreviousDay}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-mono font-bold text-obsidian-950 bg-cyan-400 hover:bg-cyan-300 shadow-glow-blue transition active:scale-95 w-full sm:w-auto"
        >
          <span>查看昨日已完成归档 ({previousDateStr})</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="text-xs font-mono text-slate-500 flex items-center gap-1">
          <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
          <span>支持免等待无损回溯历史天</span>
        </div>
      </div>

    </div>
  );
};

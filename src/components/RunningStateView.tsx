import React from 'react';
import { Loader2, ArrowRight, ShieldAlert, Cpu, Radio, Sparkles, CheckCircle2, Globe2, Brain, Database, Activity } from 'lucide-react';
import { SparkBatchStatusInfo } from '../types/news';
import { useTheme } from '../context/ThemeContext';

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
  const { theme } = useTheme();
  const isIosGlass = theme === 'ios-glass' || theme === 'light';
  const isRunning = statusInfo?.status === 'RUNNING';
  const remainingMinutes = statusInfo?.estimatedRemainingMinutes ?? 18;
  const progress = statusInfo?.progress ?? 68;
  const currentStage = statusInfo?.currentStage ?? '阶段 2/4: Gemini 深度多语种提炼与情绪实体抽取';

  const stages = [
    { id: 1, name: '全球资讯信源抓取', en: 'Global Crawl & Ingestion', icon: Globe2, threshold: 25 },
    { id: 2, name: 'Gemini 跨语种长文提炼', en: 'Deep Reasoning Distillation', icon: Brain, threshold: 50 },
    { id: 3, name: '情感极性与实体打分', en: 'Sentiment & Entity Extraction', icon: Activity, threshold: 75 },
    { id: 4, name: '智库多维档案结构化入库', en: 'Multi-Modal Archive DB', icon: Database, threshold: 100 },
  ];

  return (
    <div className={`relative max-w-3xl mx-auto my-10 overflow-hidden transition-all duration-300 ${
      isIosGlass
        ? 'ios-modal-window rounded-[12px] bg-white/85 backdrop-blur-2xl border border-white/95 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.1)] p-6 sm:p-10 text-slate-900'
        : 'glass-card rounded-3xl border border-cyan-500/20 shadow-2xl p-8 sm:p-12 text-center bg-gradient-to-b from-obsidian-card via-obsidian-950 to-obsidian-950'
    }`}>
      
      {/* 顶部背景微发光环境光 */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 blur-3xl pointer-events-none rounded-full ${
        isIosGlass ? 'bg-blue-400/15' : 'bg-cyan-500/10'
      }`}></div>

      {/* 中心高科技生成雷达扫描动效 */}
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6">
        <div className={`absolute inset-0 rounded-2xl animate-ping opacity-75 ${
          isIosGlass ? 'bg-blue-500/15' : 'bg-cyan-500/15'
        }`}></div>
        <div className={`relative w-full h-full rounded-2xl flex items-center justify-center text-white border shadow-lg ${
          isIosGlass 
            ? 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 border-white/40 shadow-blue-500/20'
            : 'bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 border-cyan-400/40 shadow-glow-blue'
        }`}>
          {isRunning ? (
            <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 animate-spin text-white" />
          ) : (
            <Cpu className="w-10 h-10 sm:w-12 sm:h-12 text-white animate-pulse" />
          )}
        </div>
        <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-900 p-1.5 rounded-full shadow-lg">
          <Sparkles className="w-4 h-4 fill-current text-white" />
        </div>
      </div>

      {/* 状态徽标 */}
      <div className="text-center mb-3">
        <span className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-mono font-bold border shadow-sm ${
          isIosGlass
            ? 'bg-blue-50 text-blue-700 border-blue-200'
            : 'bg-cyan-950 text-cyan-400 border border-cyan-800'
        }`}>
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>GEMINI SPARK AGENT GENERATING</span>
        </span>
      </div>

      <h3 className={`text-xl sm:text-2xl font-black tracking-tight mb-2 text-center ${
        isIosGlass ? 'text-slate-900' : 'text-white'
      }`}>
        {isRunning ? '今日 Gemini Spark 简报正在自主生成中' : 'Gemini Spark 24H 任务排队就绪中'}
      </h3>

      {/* 详细描述 */}
      <p className={`text-xs sm:text-sm max-w-lg mx-auto mb-8 font-sans leading-relaxed text-center ${
        isIosGlass ? 'text-slate-600' : 'text-slate-400 font-mono'
      }`}>
        Gemini 智能体正在自主检索全球路透社、彭博社、金融时报等全网权威资讯，执行多语种长文本提炼、情感极性打分与知识图谱构建。
        预计还需约 <span className={`font-bold ${isIosGlass ? 'text-blue-600' : 'text-cyan-400'}`}>{remainingMinutes} 分钟</span> 完成。
      </p>

      {/* 4 阶段交互流水线动态展示 */}
      <div className={`p-4 sm:p-5 rounded-[8px] mb-8 shadow-sm border ${
        isIosGlass 
          ? 'bg-slate-50/70 border-slate-200/80 text-left' 
          : 'bg-obsidian-950/80 border-white/10 text-left shadow-inner'
      }`}>
        {/* 顶部总进度 */}
        <div className="flex items-center justify-between text-xs font-mono mb-2">
          <span className={`font-semibold flex items-center gap-1.5 ${isIosGlass ? 'text-slate-700' : 'text-slate-300'}`}>
            <span className={`w-2 h-2 rounded-full animate-pulse ${isIosGlass ? 'bg-blue-600' : 'bg-cyan-400'}`}></span>
            全局流水线计算进度
          </span>
          <span className={`font-bold ${isIosGlass ? 'text-blue-600' : 'text-cyan-400'}`}>{progress}%</span>
        </div>

        {/* 动态进度条 */}
        <div className={`w-full rounded-full h-2 overflow-hidden mb-5 border ${
          isIosGlass ? 'bg-slate-200 border-slate-200' : 'bg-slate-900 border-white/5'
        }`}>
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              isIosGlass 
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 shadow-md' 
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 shadow-glow-blue'
            }`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* 4 阶段流水卡片 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {stages.map((stage) => {
            const isDone = progress >= stage.threshold;
            const isCurrent = progress < stage.threshold && progress >= stage.threshold - 25;
            const StageIcon = stage.icon;

            return (
              <div
                key={stage.id}
                className={`p-2.5 rounded-[8px] border transition-all flex items-center gap-3 ${
                  isDone
                    ? isIosGlass 
                      ? 'bg-white border-emerald-300/80 text-emerald-900 shadow-sm'
                      : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                    : isCurrent
                    ? isIosGlass
                      ? 'bg-blue-50/90 border-blue-400 text-blue-900 shadow-sm animate-pulse'
                      : 'bg-cyan-950/40 border-cyan-400/60 text-cyan-200'
                    : isIosGlass
                    ? 'bg-white/50 border-slate-200/60 text-slate-400 opacity-60'
                    : 'bg-white/[0.02] border-white/5 text-slate-500 opacity-60'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isDone 
                    ? 'bg-emerald-500 text-white' 
                    : isCurrent 
                    ? (isIosGlass ? 'bg-blue-600 text-white animate-spin' : 'bg-cyan-500 text-obsidian-950 animate-spin')
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                }`}>
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <StageIcon className="w-4 h-4" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold truncate leading-tight">
                    {stage.name}
                  </div>
                  <div className="text-[10px] font-mono opacity-70 truncate">
                    {stage.en}
                  </div>
                </div>

                {isCurrent && (
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                    isIosGlass ? 'bg-blue-600 text-white' : 'bg-cyan-400 text-obsidian-950'
                  }`}>
                    RUNNING
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 快捷跳转与免等待回溯 */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
        <button
          type="button"
          onClick={onViewPreviousDay}
          className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-xs font-semibold transition active:scale-95 w-full sm:w-auto shadow-md ${
            isIosGlass
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-[0_4px_14px_rgba(37,99,235,0.35)]'
              : 'font-mono font-bold text-obsidian-950 bg-cyan-400 hover:bg-cyan-300 shadow-glow-blue'
          }`}
        >
          <span>查看昨日已完成归档 ({previousDateStr})</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className={`text-xs flex items-center gap-1 ${isIosGlass ? 'text-slate-500' : 'text-slate-500 font-mono'}`}>
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>支持免等待无损回溯历史天</span>
        </div>
      </div>

    </div>
  );
};


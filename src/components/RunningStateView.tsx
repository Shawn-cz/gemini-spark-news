import React, { useState, useEffect, useRef } from 'react';
import { Loader2, ArrowRight, ShieldAlert, Cpu, Radio, Sparkles, CheckCircle2, Globe2, Brain, Database, Activity } from 'lucide-react';
import { SparkBatchStatusInfo } from '../types/news';
import { useTheme } from '../context/ThemeContext';

interface RunningStateViewProps {
  statusInfo: SparkBatchStatusInfo | null;
  onViewPreviousDay: () => void;
  previousDateStr?: string;
  isFinishing?: boolean;
  onFinishTransition?: () => void;
}

export const RunningStateView: React.FC<RunningStateViewProps> = ({
  statusInfo,
  onViewPreviousDay,
  previousDateStr = '2026-09-23',
  isFinishing = false,
  onFinishTransition
}) => {
  const { theme } = useTheme();
  const isIosGlass = theme === 'ios-glass' || theme === 'light';
  const isRunning = statusInfo?.status === 'RUNNING';
  const isServerCompleted = statusInfo?.status === 'COMPLETED' || isFinishing;
  const [isFinishingState, setIsFinishingState] = useState<boolean>(isServerCompleted);
  const onFinishTransitionRef = useRef(onFinishTransition);
  useEffect(() => {
    onFinishTransitionRef.current = onFinishTransition;
  }, [onFinishTransition]);
  
  // 动态推进的流水线实时进度值 (即使初始为 0% 或排队中，也会展现出智能体实时提炼的推进质感)
  const serverProgress = statusInfo?.progress ?? 0;
  const initialBase = isServerCompleted ? 100 : Math.max(serverProgress, isRunning ? 28 : 12);
  const [activeProgress, setActiveProgress] = useState<number>(initialBase);
  const [remainingMinutes, setRemainingMinutes] = useState<number>(
    isServerCompleted ? 0 : (
      statusInfo?.estimatedRemainingMinutes && statusInfo.estimatedRemainingMinutes > 0
        ? statusInfo.estimatedRemainingMinutes
        : isRunning ? 18 : 36
    )
  );

  // 1. 同步服务端下发的新进度 (若 SSE / API 推送了更高进度，优先接轨)
  useEffect(() => {
    if (serverProgress > activeProgress && !isFinishingState) {
      setActiveProgress(serverProgress);
    }
  }, [serverProgress, isFinishingState, activeProgress]);

  // 2. 模拟高科技智能体流水线的自主推进动画 (平滑递增 1~3%，直至 94% 预备就绪)
  // 当进入完成态时彻底停止模拟
  useEffect(() => {
    if (isServerCompleted || isFinishingState) return;

    const progressTimer = setInterval(() => {
      setActiveProgress((prev) => {
        if (prev >= 94) return prev;
        const step = Math.floor(Math.random() * 3) + 1;
        return Math.min(prev + step, 94);
      });
    }, 1400);

    const minTimer = setInterval(() => {
      setRemainingMinutes((prev) => (prev > 1 ? prev - 1 : 1));
    }, 50000);

    return () => {
      clearInterval(progressTimer);
      clearInterval(minTimer);
    };
  }, [isServerCompleted, isFinishingState]);

  // 3. 核心闭环：当生成完成触发冲刺时，平滑爬升到 100%，点亮全部绿色里程碑，停留 850ms 后回调退出
  useEffect(() => {
    if (isServerCompleted) {
      setIsFinishingState(true);
      setActiveProgress(100);
      setRemainingMinutes(0);

      const finishTimer = setTimeout(() => {
        if (onFinishTransitionRef.current) {
          onFinishTransitionRef.current();
        }
      }, 850);

      return () => clearTimeout(finishTimer);
    }
  }, [isServerCompleted]);

  const stages = [
    { id: 1, name: '全球资讯信源抓取', en: 'Global Crawl & Ingestion', icon: Globe2, threshold: 25 },
    { id: 2, name: 'Gemini 跨语种长文提炼', en: 'Deep Reasoning Distillation', icon: Brain, threshold: 50 },
    { id: 3, name: '情感极性与实体打分', en: 'Sentiment & Entity Extraction', icon: Activity, threshold: 75 },
    { id: 4, name: '智库多维档案结构化入库', en: 'Multi-Modal Archive DB', icon: Database, threshold: 100 },
  ];

  // 动态感知当前所处阶段的详细描述
  const activeStageDescription = 
    isFinishingState || activeProgress >= 100 ? '阶段 4/4: 全部阶段生成完成，智库档案已入库' :
    activeProgress < 25 ? '阶段 1/4: 全网路透/彭博多源信源检索与长文拉取中' :
    activeProgress < 50 ? '阶段 2/4: Gemini 深度跨语种提炼与核心事实结构化' :
    activeProgress < 75 ? '阶段 3/4: 全球宏观情感极性与知识实体图谱打分中' :
    '阶段 4/4: 智库多维档案归档校验与持久化中';

  return (
    <div className={`relative max-w-3xl mx-auto my-10 overflow-hidden transition-all duration-300 ${
      isIosGlass
        ? 'ios-modal-window rounded-[12px] bg-white/85 backdrop-blur-2xl border border-white/95 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.1)] p-6 sm:p-10 text-slate-900'
        : 'glass-card rounded-3xl border border-cyan-500/20 shadow-2xl p-8 sm:p-12 text-center bg-gradient-to-b from-obsidian-card via-obsidian-950 to-obsidian-950'
    }`}>
      
      {/* 顶部背景微发光环境光 */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 blur-3xl pointer-events-none rounded-full ${
        isFinishingState
          ? 'bg-emerald-500/20'
          : isIosGlass ? 'bg-blue-400/15' : 'bg-cyan-500/10'
      }`}></div>

      {/* 中心高科技生成雷达扫描动效 */}
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6">
        <div className={`absolute inset-0 rounded-2xl animate-ping opacity-75 ${
          isFinishingState
            ? 'bg-emerald-500/20'
            : isIosGlass ? 'bg-blue-500/15' : 'bg-cyan-500/15'
        }`}></div>
        <div className={`relative w-full h-full rounded-2xl flex items-center justify-center text-white border shadow-lg ${
          isFinishingState
            ? 'bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 border-emerald-400/50 shadow-[0_0_24px_rgba(16,185,129,0.4)]'
            : isIosGlass 
            ? 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 border-white/40 shadow-blue-500/20'
            : 'bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 border-cyan-400/40 shadow-glow-blue'
        }`}>
          {isFinishingState ? (
            <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-white animate-bounce" />
          ) : isRunning ? (
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
          isFinishingState
            ? 'bg-emerald-950 text-emerald-400 border border-emerald-700 shadow-glow-emerald'
            : isIosGlass
            ? 'bg-blue-50 text-blue-700 border-blue-200'
            : 'bg-cyan-950 text-cyan-400 border border-cyan-800'
        }`}>
          {isFinishingState ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>GEMINI SPARK BATCH READY (100%)</span>
            </>
          ) : (
            <>
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>GEMINI SPARK AGENT GENERATING</span>
            </>
          )}
        </span>
      </div>

      <h3 className={`text-xl sm:text-2xl font-black tracking-tight mb-2 text-center ${
        isIosGlass ? 'text-slate-900' : 'text-white'
      }`}>
        {isFinishingState
          ? '今日 Gemini Spark 简报生成与归档完成'
          : isRunning 
          ? '今日 Gemini Spark 简报正在自主生成中' 
          : 'Gemini Spark 24H 任务排队就绪中'}
      </h3>

      {/* 详细描述 */}
      <p className={`text-xs sm:text-sm max-w-lg mx-auto mb-8 font-sans leading-relaxed text-center ${
        isIosGlass ? 'text-slate-600' : 'text-slate-400 font-mono'
      }`}>
        {isFinishingState ? (
          '全部 4 大流水线阶段已 100% 闭环，多维研报已写入智库，正在为您呈现大屏...'
        ) : (
          <>
            Gemini 智能体正在自主检索全球路透社、彭博社、金融时报等全网权威资讯，执行多语种长文本提炼、情感极性打分与知识图谱构建。
            预计还需约 <span className={`font-bold ${isIosGlass ? 'text-blue-600' : 'text-cyan-400'}`}>{remainingMinutes} 分钟</span> 完成。
          </>
        )}
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
            <span className={`w-2 h-2 rounded-full ${isFinishingState ? 'bg-emerald-400' : isIosGlass ? 'bg-blue-600 animate-pulse' : 'bg-cyan-400 animate-pulse'}`}></span>
            {isFinishingState ? '全局流水线计算完毕' : '全局流水线计算进度'}
            <span className={`text-[10px] font-normal opacity-75 hidden sm:inline ml-1 ${isIosGlass ? 'text-slate-500' : 'text-cyan-300/70'}`}>
              ({activeStageDescription})
            </span>
          </span>
          <span className={`font-bold font-mono text-sm ${isFinishingState ? 'text-emerald-400' : isIosGlass ? 'text-blue-600' : 'text-cyan-400'}`}>
            {activeProgress}%
          </span>
        </div>

        {/* 动态进度条 (具备平滑移动过渡、脉冲光子头部与能量光束扫掠) */}
        <div className={`w-full rounded-full h-2.5 overflow-hidden mb-5 border relative ${
          isIosGlass ? 'bg-slate-200/90 border-slate-200' : 'bg-slate-950 border-cyan-500/25'
        }`}>
          {/* 实时推进高发光进度柱 */}
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out relative ${
              isFinishingState
                ? 'bg-gradient-to-r from-cyan-400 via-emerald-400 to-emerald-300 shadow-[0_0_16px_#10b981]'
                : isIosGlass 
                ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-400 shadow-[0_0_12px_rgba(37,99,235,0.4)]' 
                : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 shadow-[0_0_14px_#00f0ff]'
            }`}
            style={{ width: `${activeProgress}%` }}
          >
            {/* 顶端发光脉冲光子 */}
            {activeProgress < 100 && (
              <span className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#ffffff] animate-ping" />
            )}
          </div>

          {/* 持续扫掠的流体能量光束 (高科技脉冲推进动效) */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse pointer-events-none" />
        </div>

        {/* 4 阶段流水卡片 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {stages.map((stage) => {
            const isDone = isFinishingState || activeProgress >= stage.threshold;
            const isCurrent = !isFinishingState && activeProgress < stage.threshold && (stage.id === 1 || activeProgress >= stage.threshold - 25);
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
                {isDone && (
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                    isIosGlass ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  }`}>
                    DONE
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


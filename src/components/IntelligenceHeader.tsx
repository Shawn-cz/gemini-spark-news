import React, { useState } from 'react';
import { 
  Globe, 
  Activity, 
  SlidersHorizontal 
} from 'lucide-react';
import { SparkBatchStatusInfo } from '../types/news';
import { ThemeSwitcher } from './ThemeSwitcher';
import { DateStepperCapsule } from './DateStepperCapsule';
import { useTheme } from '../context/ThemeContext';

export interface IntelligenceHeaderProps {
  statusInfo: SparkBatchStatusInfo | null;
  onManualSync?: () => void;
  isSyncing: boolean;
  onOpenImportModal?: () => void;
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
  const isRunning = statusInfo?.status === 'RUNNING';
  const sentimentScore = statusInfo?.globalSentimentIndex ?? 28;
  const { theme } = useTheme();
  const isIosGlass = theme === 'ios-glass' || theme === 'light';

  // 根据极性分判定文案与色彩 (拆分中英文，支持自适应紧凑排版)
  const getPulseMeta = (score: number) => {
    if (score >= 30) return { label: '显著积极', en: 'Risk-On', color: isIosGlass ? 'text-emerald-600' : 'text-emerald-400', bar: 'bg-emerald-500' };
    if (score >= 0) return { label: '谨慎乐观', en: 'Mild Optimism', color: isIosGlass ? 'text-cyan-600' : 'text-cyan-400', bar: 'bg-cyan-500' };
    if (score >= -30) return { label: '中性观望', en: 'Neutral Watch', color: isIosGlass ? 'text-slate-500' : 'text-slate-400', bar: 'bg-slate-500' };
    return { label: '避险预警', en: 'Risk-Off', color: isIosGlass ? 'text-rose-600' : 'text-rose-400', bar: 'bg-rose-500' };
  };

  const pulse = getPulseMeta(sentimentScore);

  const [isRadarFast, setIsRadarFast] = useState(false);
  const isPopDopamine = theme === 'pop-dopamine' || theme === 'dopamine';
  const isCyberHud = theme === 'cyber-hud' || theme === 'dark' || (!isIosGlass && !isPopDopamine);

  return (
    <header className={`sticky top-0 z-30 backdrop-blur-xl transition-colors border-b ${
      isIosGlass 
        ? 'bg-white/80 border-slate-200/60 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.04)] text-slate-900' 
        : isPopDopamine
        ? 'bg-white border-b-[3px] border-slate-900 shadow-[0_4px_0px_#111827] text-slate-900'
        : 'bg-obsidian-950/95 border-cyan-500/40 shadow-[0_0_20px_-5px_rgba(0,240,255,0.3)] text-white cyber-corner-bracket'
    }`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5">
        
        {/* 全响应式自适应双层架构：Row 1 品牌与全局系统控制，Row 2 时间步进与全球情绪遥测 */}
        <div className="flex flex-col gap-2 sm:gap-2.5">
          
          {/* Row 1: 左侧 Logo 与品牌，右侧 主题切换器与 DevTools */}
          <div className="flex items-center justify-between min-w-0 gap-3">
            {/* 品牌标识 */}
            <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
              {isCyberHud ? (
                /* 方案 A: 动态雷达微组件（点击加速扫盘） */
                <button
                  type="button"
                  onClick={() => setIsRadarFast(prev => !prev)}
                  title="点击触发雷达脉冲"
                  className="group relative w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-cyan-500/80 bg-cyan-950/40 flex items-center justify-center overflow-hidden shadow-[inset_0_0_10px_rgba(0,240,255,0.3)] hover:scale-105 transition-transform cursor-pointer flex-shrink-0"
                >
                  <div
                    className={`absolute inset-0 border-t border-cyan-300/60 radar-beam ${isRadarFast ? 'fast' : ''}`}
                    style={{ background: 'conic-gradient(from 0deg, rgba(0,240,255,0.45) 0deg, transparent 60deg)' }}
                  />
                  <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff] z-10 group-hover:bg-amber-400" />
                  <div className="absolute w-6 h-6 rounded-full border border-cyan-500/30" />
                </button>
              ) : isPopDopamine ? (
                /* 方案 B: 黄色 3D 实体徽章 */
                <div className="w-10 h-10 bg-yellow-400 border-[3px] border-slate-900 shadow-[3px_3px_0px_0px_#111827] rounded-xl flex items-center justify-center font-black text-xl rotate-[-3deg] flex-shrink-0">
                  ⚡
                </div>
              ) : (
                /* 方案 C: iOS 流体微圆角 Logo */
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-500 via-indigo-600 to-blue-700 p-[1px] shadow-md shadow-blue-500/20 flex-shrink-0">
                  <div className="w-full h-full rounded-[11px] flex items-center justify-center bg-white text-blue-600 font-bold text-sm">
                    
                  </div>
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className={`text-xs sm:text-base font-black tracking-wider uppercase whitespace-nowrap truncate transition-colors ${
                    isIosGlass 
                      ? 'text-slate-900 font-sans' 
                      : isPopDopamine
                      ? 'text-slate-900 font-[\'Fredoka\']'
                      : 'text-white font-[\'Chakra_Petch\']'
                  }`}>
                    {isCyberHud ? (
                      <>
                        <span className="sm:hidden">TACTICAL_INTEL</span>
                        <span className="hidden sm:inline">SYS.TACTICAL_INTEL // HUD_V3</span>
                      </>
                    ) : isPopDopamine ? (
                      <>
                        <span className="sm:hidden">GEMINI SPARK</span>
                        <span className="hidden sm:inline">GEMINI SPARK // 24H 潮玩情报</span>
                      </>
                    ) : (
                      <>
                        <span className="sm:hidden">Gemini Spark</span>
                        <span className="hidden sm:inline">Gemini Spark Intelligence</span>
                      </>
                    )}
                  </h1>
                  {isPopDopamine && (
                    <span className="bg-pink-500 text-white font-black text-[10px] px-2 py-0.5 rounded-full border-2 border-slate-900 shadow-[2px_2px_0px_0px_#111827] flex-shrink-0">
                      LIVE
                    </span>
                  )}
                  {isCyberHud && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hidden sm:inline flex-shrink-0">
                      {isRadarFast ? '[RADAR BURST]' : '[SAT-LINK 99.8%]'}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 truncate hidden xs:block font-mono">
                  {isCyberHud 
                    ? 'LAT 31.23°N · LON 121.47°E // BATCH: DAILY // FREQ: 128.4MHz' 
                    : isPopDopamine 
                    ? '2026 每日智库全景 · 50 份全球突破已归档' 
                    : 'Apple VisionOS 18 · 液态高斯模糊 · WCAG AAA 高清字系'}
                </p>
              </div>

              {/* 方案 A 专属：音频均衡器跳动微柱 */}
              {isCyberHud && (
                <div className="hidden lg:flex items-end gap-1 h-5 px-2.5 py-1 bg-black/40 rounded border border-cyan-500/20 flex-shrink-0">
                  <span className="w-1 bg-cyan-400 eq-bar-1 rounded-sm"></span>
                  <span className="w-1 bg-cyan-300 eq-bar-2 rounded-sm"></span>
                  <span className="w-1 bg-cyan-400 eq-bar-3 rounded-sm"></span>
                  <span className="w-1 bg-emerald-400 eq-bar-4 rounded-sm"></span>
                  <span className="w-1 bg-cyan-300 eq-bar-1 rounded-sm"></span>
                  <span className="w-1 bg-amber-400 eq-bar-3 rounded-sm"></span>
                </div>
              )}
            </div>

            {/* 第一行右侧：主题切换器 + DevTools */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <ThemeSwitcher />

              {/* 调试面板 */}
              {onOpenDevTools && (
                <button
                  type="button"
                  onClick={onOpenDevTools}
                  className={`header-action-btn header-btn-devtools p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-mono rounded-lg transition-all flex items-center gap-1.5 shadow-sm whitespace-nowrap flex-shrink-0 ${
                    isIosGlass
                      ? 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                      : 'text-amber-300 bg-amber-950/70 hover:bg-amber-900 border border-amber-800'
                  }`}
                  title="打开全栈开发者控制台 (DevTools · 含导入简报与批次同步)"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  <span className="hidden sm:inline">DevTools</span>
                  <span className={`font-bold hidden md:inline ${isRunning ? "text-amber-600" : (isIosGlass ? "text-emerald-700" : "text-emerald-400")}`}>
                    [{isRunning ? "计算中" : "已归档"}]
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Row 2: 左侧 日期步进选择胶囊，右侧 全球宏观情绪极性指标 */}
          <div className="flex items-center justify-between gap-2 sm:gap-2.5 min-w-0 flex-shrink-0">
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

            {/* 2. 全球宏观情绪极性指标 */}
            <div 
              className={`header-sentiment-capsule inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-mono flex-shrink-0 transition-all shadow-sm ${
                isIosGlass
                  ? 'bg-white/80 border-slate-200/80 text-slate-800'
                  : 'border-white/10 bg-white/[0.03] text-slate-300'
              }`}
              title={`全球宏观情绪极性: ${sentimentScore > 0 ? `+${sentimentScore}%` : `${sentimentScore}%`} (${pulse.label} / ${pulse.en})`}
            >
              <Activity className={`w-3.5 h-3.5 flex-shrink-0 ${pulse.color} animate-pulse`} />
              <span className={`text-[10px] uppercase tracking-wider hidden sm:inline ${
                isIosGlass ? 'text-slate-500' : 'text-slate-400'
              }`}>情绪脉搏:</span>
              <span className={`font-black ${pulse.color} text-xs`}>
                {sentimentScore > 0 ? `+${sentimentScore}%` : `${sentimentScore}%`}
              </span>
              <span className={`font-semibold text-[11px] whitespace-nowrap ${
                isIosGlass ? 'text-slate-700' : 'text-slate-300'
              }`}>{pulse.label}</span>
              <div className={`w-8 sm:w-10 rounded-full h-1 overflow-hidden hidden sm:block flex-shrink-0 ${
                isIosGlass ? 'bg-slate-200' : 'bg-slate-800'
              }`}>
                <div
                  className={`h-full rounded-full ${pulse.bar}`}
                  style={{ width: `${Math.min(100, Math.max(10, Math.abs(sentimentScore)))}%` }}
                />
              </div>
            </div>
          </div>

        </div>

      </div>
    </header>
  );
};

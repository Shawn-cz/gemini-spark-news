import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  X, 
  Cpu, 
  Tag, 
  ShieldCheck, 
  Share2, 
  Calendar, 
  Globe2,
  Bookmark,
  ExternalLink,
  Flame,
  AlertTriangle,
  Sparkles,
  Bot,
  TrendingUp,
  Zap,
  Layers,
  Radio,
  FileText
} from 'lucide-react';
import { GlobalNewsItem, CategoryType, ImpactLevel } from '../types/news';
import { isNewsBookmarked, toggleBookmarkStorage } from '../services/bookmarkStorage';
import { ShareModal } from './ShareModal';
import { useTheme } from '../context/ThemeContext';

interface IntelligenceDrawerProps {
  news: GlobalNewsItem | null;
  onClose: () => void;
  isBookmarked?: boolean;
  onToggleBookmark?: (news: GlobalNewsItem) => void;
  onShowToast?: (msg: string) => void;
}

export const IntelligenceDrawer: React.FC<IntelligenceDrawerProps> = ({ 
  news, 
  onClose,
  isBookmarked: externalIsBookmarked,
  onToggleBookmark,
  onShowToast
}) => {
  const [imgError, setImgError] = useState(false);
  const [internalBookmarked, setInternalBookmarked] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const { theme } = useTheme();
  
  const isIosGlass = theme === 'ios-glass' || theme === 'light';
  const isPopDopamine = theme === 'pop-dopamine' || theme === 'dopamine';
  const isCyberHud = theme === 'cyber-hud' || theme === 'dark' || (!isIosGlass && !isPopDopamine);

  // 方案 A 全息 3D 生成动效状态
  const [isGeneratingHolo, setIsGeneratingHolo] = useState(false);
  const [scrambledTitle, setScrambledTitle] = useState(news?.title || '');
  const [displayedScore, setDisplayedScore] = useState<number>(0);
  const [paneState, setPaneState] = useState<Array<{ materialized: boolean; text: string; hasLaser: boolean }>>([
    { materialized: true, text: '', hasLaser: false },
    { materialized: true, text: '', hasLaser: false },
    { materialized: true, text: '', hasLaser: false }
  ]);
  const holoTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

  // 解析结构化研报段落
  const getStructuredSections = useCallback(() => {
    if (!news) return [];
    if (news.summary.includes('【') && news.summary.includes('】')) {
      const parts = news.summary.split(/(?=【[^】]+】)/g).filter(Boolean);
      if (parts.length > 0) {
        return parts.map(part => {
          const match = part.match(/^【([^】]+)】([\s\S]*)$/);
          if (match) {
            return { tag: match[1], text: match[2].trim() };
          }
          return { tag: '核心细节', text: part.trim() };
        });
      }
    }
    return [
      { tag: '时间与主体', text: `${news.source} · ${new Date(news.publishTime).toUTCString()}` },
      { tag: '事件核心细节', text: news.summary },
      { tag: '战略深远影响', text: `宏观极性指数: ${news.sentimentScore > 0 ? '+' : ''}${Math.round(news.sentimentScore * 100)}% (${news.sentiment.toUpperCase()})` }
    ];
  }, [news]);

  // 立即跳过全息生成动效
  const finishHoloGenerationImmediately = useCallback(() => {
    holoTimeoutsRef.current.forEach(clearTimeout);
    holoTimeoutsRef.current = [];
    setIsGeneratingHolo(false);
    if (!news) return;
    setScrambledTitle(news.title);
    setDisplayedScore(Math.round(news.sentimentScore * 100));
    const sections = getStructuredSections();
    setPaneState(sections.map(s => ({ materialized: true, text: s.text, hasLaser: false })));
  }, [news, getStructuredSections]);

  // 启动 3D 全息发射台生成交互序列
  const startHoloGenerationSequence = useCallback(() => {
    finishHoloGenerationImmediately();
    if (!news) return;
    setIsGeneratingHolo(true);
    setDisplayedScore(0);
    const sections = getStructuredSections();

    // 1. 标题黑客解密
    const chars = '░▒▓█01#@$%&*<>+-=/';
    let iter = 0;
    const targetTitle = news.title;
    const scrambleInterval = setInterval(() => {
      setScrambledTitle(
        targetTitle.split('').map((char, index) => {
          if (index < iter) return targetTitle[index];
          return chars[Math.floor(Math.random() * chars.length)];
        }).join('')
      );
      if (iter >= targetTitle.length) {
        clearInterval(scrambleInterval);
      }
      iter += 2;
    }, 25);
    holoTimeoutsRef.current.push(scrambleInterval as any);

    // 2. 置信度数字清零并启动计数
    const targetScore = Math.round(news.sentimentScore * 100);
    const scoreTimeout = setTimeout(() => {
      let currentVal = 0;
      const step = Math.max(1, Math.round(targetScore / 20));
      const counterTimer = setInterval(() => {
        currentVal += step;
        if (currentVal >= targetScore) {
          currentVal = targetScore;
          clearInterval(counterTimer);
        }
        setDisplayedScore(currentVal);
      }, 25);
      holoTimeoutsRef.current.push(counterTimer as any);
    }, 200);
    holoTimeoutsRef.current.push(scoreTimeout);

    // 3. 窗格自底向上级联升空凝聚实体化
    setPaneState(sections.map(() => ({ materialized: false, text: '', hasLaser: false })));
    sections.forEach((sec, idx) => {
      const delay = 180 + idx * 200;
      const t = setTimeout(() => {
        setPaneState(prev => {
          const next = [...prev];
          next[idx] = { materialized: true, text: sec.text, hasLaser: true };
          return next;
        });
        const laserT = setTimeout(() => {
          setPaneState(prev => {
            const next = [...prev];
            if (next[idx]) next[idx] = { ...next[idx], hasLaser: false };
            return next;
          });
          if (idx === sections.length - 1) {
            setIsGeneratingHolo(false);
          }
        }, 550);
        holoTimeoutsRef.current.push(laserT);
      }, delay);
      holoTimeoutsRef.current.push(t);
    });
  }, [news, finishHoloGenerationImmediately, getStructuredSections]);

  // 监听 ESC、空格或回车
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!isShareModalOpen) onClose();
      } else if ((e.key === ' ' || e.key === 'Enter') && isGeneratingHolo) {
        finishHoloGenerationImmediately();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isShareModalOpen, isGeneratingHolo, finishHoloGenerationImmediately]);

  // 当 news 改变时启动全息动效
  useEffect(() => {
    setImgError(false);
    if (news) {
      if (typeof externalIsBookmarked === 'boolean') {
        setInternalBookmarked(externalIsBookmarked);
      } else {
        setInternalBookmarked(isNewsBookmarked(news.id));
      }

      if (isCyberHud) {
        startHoloGenerationSequence();
      } else {
        finishHoloGenerationImmediately();
      }
    }
    return () => {
      holoTimeoutsRef.current.forEach(clearTimeout);
      holoTimeoutsRef.current = [];
    };
  }, [news?.id, externalIsBookmarked, isCyberHud, startHoloGenerationSequence, finishHoloGenerationImmediately]);

  if (!news) return null;

  const currentBookmarked = typeof externalIsBookmarked === 'boolean' 
    ? externalIsBookmarked 
    : internalBookmarked;

  const handleToggleBookmark = () => {
    if (!news) return;
    if (onToggleBookmark) {
      onToggleBookmark(news);
    } else {
      const result = toggleBookmarkStorage(news);
      setInternalBookmarked(result.isBookmarked);
      if (onShowToast) {
        onShowToast(result.isBookmarked ? `⭐ 已成功收藏研报: ${news.title}` : '已从收藏夹移除该研报');
      }
    }
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const getCategoryMeta = (cat: CategoryType) => {
    switch (cat) {
      case 'ai':
        return { label: '前沿 AI', icon: Bot, badge: 'text-cyan-400 bg-cyan-950/80 border-cyan-800' };
      case 'finance':
        return { label: '全球宏观', icon: TrendingUp, badge: 'text-emerald-400 bg-emerald-950/80 border-emerald-800' };
      case 'geopolitics':
        return { label: '地缘政治', icon: Globe2, badge: 'text-amber-400 bg-amber-950/80 border-amber-800' };
      case 'climate':
        return { label: '能源气候', icon: Zap, badge: 'text-indigo-400 bg-indigo-950/80 border-indigo-800' };
      default:
        return { label: '全球情报', icon: Layers, badge: 'text-slate-400 bg-slate-900 border-slate-700' };
    }
  };

  const catMeta = getCategoryMeta(news.category);
  const CatIcon = catMeta.icon;
  const sections = getStructuredSections();

  const scoreFormatted = news.sentimentScore > 0 
    ? `+${Math.round(news.sentimentScore * 100)}%` 
    : `${Math.round(news.sentimentScore * 100)}%`;

  // =========================================================================
  // 方案 A: 裸眼 3D 原生全息投影资讯研报视窗 (1:1 SHOWCASE 落地)
  // =========================================================================
  if (isCyberHud) {
    return (
      <div 
        id="holo-dossier-modal" 
        className="fixed inset-0 z-50 flex flex-col justify-between p-3 sm:p-6 md:p-8 bg-slate-950/95 backdrop-blur-2xl overflow-y-auto overflow-x-hidden animate-fade-in"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          } else if (isGeneratingHolo) {
            finishHoloGenerationImmediately();
          }
        }}
      >
        {/* 1. 顶部战术控制悬浮栏 (Minimalist Hologram HUD Header) */}
        <div className="relative z-30 max-w-5xl w-full mx-auto flex flex-wrap items-center justify-between border-b border-cyan-500/30 pb-3 mb-4 font-mono text-xs gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/60 flex items-center justify-center text-cyan-300 font-bold shadow-[0_0_15px_rgba(0,240,255,0.4)] shrink-0">
              ⚡
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 font-bold text-white tracking-wider">
                <span className="text-cyan-400 font-mono text-xs sm:text-sm">SYS.3D_HOLO_DOSSIER</span>
                <span className="text-[9px] sm:text-[10px] text-cyan-300 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-500/40 uppercase">
                  [{news.category} // {news.impactLevel}]
                </span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-slate-400 truncate hidden xs:block">
                裸眼 3D 原生全息投影生成资讯内容 · 等宽玻璃视窗 · 高度自适应
              </p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 bg-black/60 border border-cyan-500/40 rounded-lg px-3 py-1 font-mono text-[11px] text-cyan-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff] animate-pulse"></span>
            <span className="font-bold">📐 纯粹全息视窗 (聚焦研报正文)</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button 
              type="button"
              onClick={startHoloGenerationSequence} 
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-2.5 sm:px-3 py-1.5 rounded-lg text-xs transition-all shadow-[0_0_15px_rgba(0,240,255,0.5)] active:scale-95 flex items-center gap-1 cursor-pointer font-mono"
            >
              <span>⚡ <span className="hidden sm:inline">聚焦扫描</span> (PULSE)</span>
            </button>
            <button 
              type="button"
              onClick={handleToggleBookmark} 
              className={`border px-2.5 sm:px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer font-mono ${
                currentBookmarked
                  ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                  : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-amber-500/40'
              }`}
            >
              <span>⭐</span>
              <span className="hidden sm:inline">{currentBookmarked ? '已收藏研报' : '收藏研报'}</span>
            </button>
            <button 
              type="button"
              onClick={handleShare}
              className="bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer font-mono"
              title="分享"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
            <button 
              type="button"
              onClick={onClose} 
              className="bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/60 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer font-mono"
            >
              <span>✕ <span className="hidden sm:inline">关闭全息</span> (ESC)</span>
            </button>
          </div>
        </div>

        {/* 2. 中央核心：完全浮空于虚空之中的 3D 全息投影内容区 */}
        <div className="relative z-20 max-w-4xl w-full mx-auto my-auto flex flex-col items-center text-center py-4 holo-perspective-stage">
          
          {/* 全息研报大标题 */}
          <h2 className="holo-dot-matrix-title text-lg sm:text-2xl md:text-4xl font-extrabold tracking-wide leading-snug max-w-3xl mb-2 select-none">
            {scrambledTitle}
          </h2>

          {/* 全息英文副标题 */}
          {news.englishTitle && (
            <p className="holo-sub-glow text-xs sm:text-sm tracking-[0.24em] uppercase mb-5 select-none">
              {news.englishTitle}
            </p>
          )}

          {/* 浮空纯光研报正文 */}
          <div className="w-full max-w-3xl space-y-3.5 text-left select-none relative">
            
            {/* 顶部生成控制提示条 */}
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1 px-1">
              <span className="text-cyan-400/90 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                HOLOGRAPHIC_GENERATIVE_STREAM // GEMINI 3.8 FLASH
              </span>
              <button 
                type="button"
                onClick={finishHoloGenerationImmediately} 
                className="text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer bg-slate-900/60 px-2 py-0.5 rounded border border-slate-700/50"
              >
                ⚡ 极速呈现 (SKIP)
              </button>
            </div>

            {/* 左右与中轴全息透视引导虚线导轨 */}
            <div className="absolute inset-x-0 sm:-inset-x-1 md:-inset-x-3 lg:-inset-x-5 -top-6 -bottom-6 pointer-events-none z-0 overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 820 400" fill="none" preserveAspectRatio="none">
                <line x1="8" y1="400" x2="8" y2="0" stroke="#00f0ff" stroke-width="1.2" stroke-dasharray="6 6" stroke-opacity="0.45"/>
                <line x1="812" y1="400" x2="812" y2="0" stroke="#00f0ff" stroke-width="1.2" stroke-dasharray="6 6" stroke-opacity="0.45"/>
                <line x1="410" y1="400" x2="410" y2="0" stroke="#00f0ff" stroke-width="1" stroke-dasharray="4 8" stroke-opacity="0.25"/>
              </svg>
            </div>

            {/* 3 块 3D 浮空等宽自适应毛玻璃窗格 */}
            <div className="relative z-10 space-y-4 w-full">
              {sections.map((sec, idx) => {
                const pState = paneState[idx] || { materialized: true, text: sec.text, hasLaser: false };
                return (
                  <div 
                    key={idx} 
                    className={`holo-section-card-3d w-full h-auto transition-all ${
                      !pState.materialized ? 'holo-pane-waiting' : 'holo-pane-materializing'
                    }`}
                  >
                    {/* 激光扫描线动效 */}
                    {pState.hasLaser && <div className="holo-scanline-laser" />}

                    {/* 窗格顶栏标签与编号 */}
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-cyan-950/40 border border-cyan-400/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#00f0ff] animate-pulse"></span>
                        <span className="font-mono text-xs font-bold text-cyan-200 tracking-wider">
                          【{sec.tag}】
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-cyan-300/70 tracking-widest bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-500/20">
                        TRANSLUCENT_GLASS // 0{idx + 1}
                      </span>
                    </div>

                    {/* 窗格内正文 */}
                    <p className="holo-body-floating text-xs sm:text-sm md:text-[14px] text-slate-100 leading-relaxed font-sans select-none">
                      {pState.text || sec.text}
                      {isGeneratingHolo && idx === sections.length - 1 && <span className="holo-typing-cursor"></span>}
                    </p>
                  </div>
                );
              })}
            </div>

          </div>

          {/* 浮空遥测数据仪表槽 */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:gap-3 font-mono text-[10px] sm:text-xs select-none holo-telemetry-dock-3d max-w-full px-2">
            <div className="px-3 py-1 bg-cyan-950/60 border border-cyan-500/40 rounded-lg text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.2)]">
              <span className="text-slate-400 mr-1.5">置信度:</span>
              <strong className="font-bold text-white font-mono">{displayedScore || Math.round(news.sentimentScore * 100)}%</strong>
            </div>
            <div className="px-3 py-1 bg-cyan-950/60 border border-cyan-500/40 rounded-lg text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              <span className="text-slate-400 mr-1.5">市场研判:</span>
              <strong className="font-bold font-mono">{news.sentimentScore > 0 ? 'BULLISH' : 'BEARISH'} ({scoreFormatted})</strong>
            </div>
            <div className="px-3 py-1 bg-cyan-950/60 border border-cyan-500/40 rounded-lg text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
              <span className="text-slate-400 mr-1.5">信源网络:</span>
              <strong className="font-bold text-white font-mono">{news.source}</strong>
            </div>
          </div>

        </div>

        {/* 3. 底部：物理级斜切金属发射底座装置 + 圆形透镜 + 向上喷射的体积光锥 */}
        <div className="relative w-full flex flex-col items-center mt-4 z-10">
          
          {/* 向上扩散的立体体积光锥 */}
          <div className={`holo-stage-volumetric-beam ${isGeneratingHolo ? 'holo-beam-igniting' : ''}`}></div>

          {/* 空间透视地面雷达环网 */}
          <div className="holo-ground-perspective-grid"></div>

          {/* 左右两侧全息透视引导光线 */}
          <div className="holo-perspective-guide-lines">
            <svg viewBox="0 0 780 440" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="390" y1="435" x2="60" y2="20" stroke="#00f0ff" stroke-width="1.2" stroke-opacity="0.35" stroke-dasharray="6 6"/>
              <line x1="390" y1="435" x2="720" y2="20" stroke="#00f0ff" stroke-width="1.2" stroke-opacity="0.35" stroke-dasharray="6 6"/>
              <line x1="390" y1="435" x2="390" y2="40" stroke="#00f0ff" stroke-width="0.8" stroke-opacity="0.2" stroke-dasharray="3 8"/>
            </svg>
          </div>

          {/* 物理级斜切金属发射底座装置 */}
          <div className="relative w-[280px] xs:w-[340px] sm:w-[420px] max-w-[92vw] h-[64px] flex items-center justify-center">
            
            {/* 斜切梯形外壳 */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#2d3748] via-[#1a202c] to-[#0d1117] rounded-sm shadow-[0_20px_40px_rgba(0,0,0,0.9),0_0_35px_rgba(0,240,255,0.35)] border-t border-slate-500/60" style={{ clipPath: 'polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%)' }}>
              <div className="absolute inset-x-8 bottom-2 h-2.5 flex items-center justify-between px-4 border-t border-cyan-500/20">
                <span className="w-1.5 h-1 bg-cyan-400/80 rounded-xs"></span>
                <span className="w-12 h-[2px] bg-slate-600"></span>
                <span className="w-1.5 h-1 bg-cyan-400/80 rounded-xs"></span>
              </div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-5 bg-[#111827] border-t border-x border-slate-600 flex items-center justify-center">
                <div className="w-10 h-1 bg-cyan-400/90 shadow-[0_0_6px_#00f0ff]"></div>
              </div>
            </div>

            {/* 顶部发光透镜孔径 */}
            <div className="absolute -top-3 w-[180px] xs:w-[220px] sm:w-[260px] h-[28px] rounded-[50%] bg-gradient-to-r from-cyan-500 via-white to-cyan-500 p-[1.5px] shadow-[0_0_30px_#00f0ff,0_0_60px_rgba(0,240,255,0.85)] z-20">
              <div className="w-full h-full rounded-[50%] bg-[radial-gradient(ellipse_at_50%_50%,#ffffff_0%,#00f0ff_50%,#006688_100%)] flex items-center justify-center">
                <div className="w-[70%] h-[60%] rounded-[50%] bg-white shadow-[0_0_15px_#ffffff]"></div>
              </div>
            </div>

            {/* 水平强光耀斑 */}
            <div className="absolute -top-1 w-[280px] xs:w-[380px] sm:w-[480px] max-w-[95vw] h-[3px] bg-gradient-to-r from-transparent via-[#00f0ff] through-white to-transparent pointer-events-none shadow-[0_0_15px_#00f0ff,0_0_30px_#00f0ff] z-30"></div>

          </div>

          {/* 控制台水平暗金属桌面基座与暖色 LED 标志灯 */}
          <div className="relative w-full max-w-4xl h-[16px] bg-gradient-to-b from-[#1e293b] via-[#0f172a] to-[#020617] border-t-2 border-slate-700/80 shadow-[0_-5px_20px_rgba(0,0,0,0.8)] flex items-center justify-between px-3 sm:px-8">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-1 rounded-sm bg-amber-400 shadow-[0_0_6px_#f59e0b]"></span>
              <span className="text-[8px] font-mono text-slate-500">STATION_DOCK_L</span>
            </div>
            <div className="w-1/2 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"></div>
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] font-mono text-slate-500">OPTICAL_LINK_R</span>
              <span className="w-2 h-1 rounded-sm bg-amber-400 shadow-[0_0_6px_#f59e0b]"></span>
            </div>
          </div>

        </div>

        {/* 分享弹窗 */}
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          news={news}
          onShowToast={onShowToast}
        />
      </div>
    );
  }

  // =========================================================================
  // 方案 B: 波普潮玩多巴胺漫画风研报视窗 (Pop Comic-Sheet Dossier)
  // =========================================================================
  if (isPopDopamine) {
    return (
      <div 
        className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-5 lg:p-8 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      >
        <div 
          className="bg-white border-[4px] border-slate-900 shadow-[12px_12px_0px_0px_#111827] rounded-3xl p-6 sm:p-8 max-w-3xl w-full relative my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 右上角趣味贴纸 */}
          <div className="absolute -top-3 -right-3 z-20 pop-sticker">
            <span className="bg-yellow-300 border-2 border-slate-900 shadow-[3px_3px_0px_0px_#111827] text-slate-900 font-['Fredoka'] font-black text-xs px-3.5 py-1 rounded-xl block">
              POP! DOSSIER
            </span>
          </div>

          {/* 顶栏控制 */}
          <div className="flex items-center justify-between pb-4 border-b-2 border-slate-900 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-400 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#111827] rounded-xl flex items-center justify-center font-black text-lg rotate-[-3deg]">
                ⚡
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-['Fredoka'] text-sm sm:text-base font-bold text-slate-900">POP INTELLIGENCE // 24H DOSSIER</span>
                  <span className="bg-pink-500 text-white font-black text-[10px] px-2 py-0.5 rounded-full border border-slate-900">
                    🏷️ {catMeta.label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">潮玩多巴胺 · 24H 深度研报全文</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={handleToggleBookmark} 
                className={`pop-btn p-2 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_#111827] cursor-pointer text-xs font-black ${
                  currentBookmarked ? 'bg-pink-500 text-white' : 'bg-pink-100 text-pink-600'
                }`}
                title="收藏"
              >
                ❤️
              </button>
              <button 
                type="button"
                onClick={handleShare}
                className="pop-btn p-2 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_#111827] bg-violet-100 hover:bg-violet-200 text-violet-700 cursor-pointer text-xs"
                title="分享"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
              <button 
                type="button"
                onClick={onClose} 
                className="pop-btn w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#111827] flex items-center justify-center font-black text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          {/* 标题系统 */}
          <h2 className="text-lg sm:text-2xl font-extrabold text-slate-900 leading-snug tracking-tight mb-2 font-['Plus_Jakarta_Sans']">
            {news.title}
          </h2>
          {news.englishTitle && (
            <p className="text-xs text-slate-500 font-semibold mb-5 font-['Plus_Jakarta_Sans']">
              {news.englishTitle}
            </p>
          )}

          {/* 3 块暖调微窗格 */}
          <div className="space-y-3.5 mb-6">
            {sections.map((sec, idx) => (
              <div key={idx} className="bg-amber-50/80 border-2 border-slate-900 shadow-[3px_3px_0px_0px_#111827] rounded-2xl p-4 sm:p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-yellow-300 border border-slate-900 text-xs font-black text-slate-900 shadow-[1px_1px_0px_0px_#111827]">
                    <span>【{sec.tag}】</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 font-mono">
                    POP_PANEL // 0{idx + 1}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-['Plus_Jakarta_Sans']">
                  {sec.text}
                </p>
              </div>
            ))}
          </div>

          {/* 底部信息与完成查阅 */}
          <div className="pt-4 border-t-2 border-slate-900 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 sm:gap-5">
              <div>
                <span className="text-slate-500 font-semibold mr-1">置信度:</span>
                <span className="font-extrabold text-pink-600 font-mono">{Math.round(news.sentimentScore * 100)}%</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold mr-1">信源:</span>
                <span className="font-bold text-slate-800">{news.source}</span>
              </div>
            </div>
            <button 
              type="button"
              onClick={onClose} 
              className="pop-btn bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold text-xs px-6 py-2 rounded-xl border-2 border-slate-900 shadow-[3px_3px_0px_0px_#111827] cursor-pointer font-['Fredoka']"
            >
              完成查阅 (Done)
            </button>
          </div>
        </div>

        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          news={news}
          onShowToast={onShowToast}
        />
      </div>
    );
  }

  // =========================================================================
  // 方案 C: 白色 iOS 流体透明玻璃研报弹窗 (Apple VisionOS Glass Dossier)
  // =========================================================================
  return (
    <div 
      id="glass-dossier-modal" 
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-5 lg:p-8 bg-slate-900/35 backdrop-blur-2xl animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="ios-modal-window max-w-3xl w-full p-6 sm:p-8 relative my-auto shadow-2xl rounded-[12px] bg-white/85 backdrop-blur-2xl border border-white/95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部控制栏 */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/60 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 border border-white/40 text-white font-bold flex items-center justify-center text-sm shadow-[0_4px_12px_rgba(37,99,235,0.3)]">
              
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 tracking-wider font-sans">APPLE VISION DOSSIER</span>
                <span className="text-[10px] font-semibold bg-blue-500/10 text-blue-600 px-2.5 py-0.5 rounded-full border border-blue-500/20 uppercase font-mono">
                  [{news.category} // {news.impactLevel}]
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">iOS 18 液态白玻璃 · 研报深度解构全文</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={handleToggleBookmark} 
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                currentBookmarked 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                  : 'bg-white/70 hover:bg-white text-slate-700 border-white/80 shadow-sm'
              }`}
            >
              <span>⭐</span>
              <span>{currentBookmarked ? '已收藏' : '收藏'}</span>
            </button>
            <button 
              type="button"
              onClick={handleShare}
              className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all cursor-pointer"
              title="分享"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button 
              type="button"
              onClick={onClose} 
              className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 text-slate-600 flex items-center justify-center text-sm transition-all cursor-pointer font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 标题与副标题 */}
        <h2 className="text-lg sm:text-2xl font-bold text-slate-900 leading-snug tracking-tight mb-2 font-sans">
          {news.title}
        </h2>
        {news.englishTitle && (
          <p className="text-xs text-slate-500 font-medium mb-5">
            {news.englishTitle}
          </p>
        )}

        {/* 3 块白色流体毛玻璃窗格 (8px 微圆角) */}
        <div className="space-y-3.5 mb-6">
          {sections.map((sec, idx) => (
            <div key={idx} className="ios-modal-pane p-4 sm:p-5 w-full bg-white/65 rounded-[8px] border border-white/85 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  <span>【{sec.tag}】</span>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 font-mono">
                  FROSTED_GLASS // 0{idx + 1}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
                {sec.text}
              </p>
            </div>
          ))}
        </div>

        {/* 底部 iOS 遥测栏 */}
        <div className="pt-4 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">置信度:</span>
              <span className="font-bold text-blue-600 font-mono">{Math.round(news.sentimentScore * 100)}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">市场研判:</span>
              <span className="font-bold text-emerald-600 font-mono">{news.sentimentScore > 0 ? 'BULLISH' : 'BEARISH'} ({scoreFormatted})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">信源:</span>
              <span className="font-bold text-slate-700">{news.source}</span>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-5 py-2 rounded-full shadow-[0_4px_14px_rgba(37,99,235,0.3)] active:scale-95 transition-all cursor-pointer"
          >
            完成阅读
          </button>
        </div>
      </div>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        news={news}
        onShowToast={onShowToast}
      />
    </div>
  );
};

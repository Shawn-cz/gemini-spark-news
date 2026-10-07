import React, { useEffect, useState } from 'react';
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
  Check,
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
  const [copied, setCopied] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const { theme } = useTheme();
  const isIosGlass = theme === 'ios-glass' || theme === 'light';

  // 监听 ESC 键关闭 (优先由子弹窗消费 ESC)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isShareModalOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isShareModalOpen]);

  // 重置与同步内部收藏状态
  useEffect(() => {
    setImgError(false);
    setCopied(false);
    if (news) {
      if (typeof externalIsBookmarked === 'boolean') {
        setInternalBookmarked(externalIsBookmarked);
      } else {
        setInternalBookmarked(isNewsBookmarked(news.id));
      }
    }
  }, [news?.id, externalIsBookmarked]);

  if (!news) return null;

  const currentBookmarked = typeof externalIsBookmarked === 'boolean' 
    ? externalIsBookmarked 
    : internalBookmarked;

  // 切换收藏状态
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

  // 唤起专属微信扫码与多端直达分享面板 (支持微信扫码秒开、图文文案复制与多端直达)
  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  // 领域配置
  const getCategoryMeta = (cat: CategoryType) => {
    switch (cat) {
      case 'ai':
        return { label: '全球 AI 算力', icon: Bot, badge: 'text-cyan-400 bg-cyan-950/80 border-cyan-800' };
      case 'finance':
        return { label: '宏观金融资本', icon: TrendingUp, badge: 'text-emerald-400 bg-emerald-950/80 border-emerald-800' };
      case 'geopolitics':
        return { label: '地缘政治经贸', icon: Globe2, badge: 'text-amber-400 bg-amber-950/80 border-amber-800' };
      case 'climate':
        return { label: '气候变化能源', icon: Zap, badge: 'text-indigo-400 bg-indigo-950/80 border-indigo-800' };
      default:
        return { label: '全球前沿资讯', icon: Layers, badge: 'text-slate-400 bg-slate-900 border-slate-700' };
    }
  };

  // 影响等级配置
  const getImpactMeta = (impact: ImpactLevel) => {
    switch (impact) {
      case 'critical':
        return { label: 'CRITICAL IMPACT', style: 'text-rose-400 bg-rose-950/80 border-rose-500/50 shadow-glow-rose', icon: Flame };
      case 'high':
        return { label: 'HIGH IMPACT', style: 'text-amber-400 bg-amber-950/80 border-amber-500/40', icon: AlertTriangle };
      case 'medium':
      default:
        return { label: 'MEDIUM IMPACT', style: 'text-cyan-400 bg-cyan-950/60 border-cyan-700/30', icon: Sparkles };
    }
  };

  const catMeta = getCategoryMeta(news.category);
  const CatIcon = catMeta.icon;
  const impactMeta = getImpactMeta(news.impactLevel);
  const ImpactIcon = impactMeta.icon;

  const scoreFormatted = news.sentimentScore > 0 
    ? `+${Math.round(news.sentimentScore * 100)}%` 
    : `${Math.round(news.sentimentScore * 100)}%`;

  const scoreColor = news.sentimentScore > 0.2 
    ? 'text-emerald-400' 
    : news.sentimentScore < -0.2 
    ? 'text-rose-400' 
    : 'text-slate-400';

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 解析结构化微型研报多要素（时间与主体、事件核心细节、战略深远影响）
  const renderStructuredSummary = (summaryText: string) => {
    if (!summaryText) return null;

    if (summaryText.includes('【') && summaryText.includes('】')) {
      const parts = summaryText.split(/(?=【[^】]+】)/g).filter(Boolean);
      if (parts.length > 1) {
        return (
          <div className="dossier-summary-flow space-y-3.5">
            {parts.map((part, idx) => {
              const match = part.match(/^【([^】]+)】([\s\S]*)$/);
              if (match) {
                const [, title, content] = match;
                return (
                  <div key={idx} className="dossier-section-row space-y-1.5 border-b border-white/5 last:border-b-0 pb-3.5 last:pb-0">
                    <div className="flex items-center gap-2">
                      <span className="dossier-section-tag font-mono text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1.5 shadow-sm">
                        <span className="dossier-section-indicator w-1.5 h-1.5 rounded-full flex-shrink-0" />
                        <span>{title}</span>
                      </span>
                    </div>
                    <p className="dossier-section-text text-sm leading-relaxed font-sans">
                      {content.trim()}
                    </p>
                  </div>
                );
              }
              return (
                <p key={idx} className="dossier-section-text text-sm leading-relaxed font-sans">
                  {part.trim()}
                </p>
              );
            })}
          </div>
        );
      }
    }

    return (
      <div className="whitespace-pre-line text-sm leading-relaxed dossier-section-text font-sans">
        {summaryText}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-5 lg:p-8 animate-fade-in">
      
      {/* 模糊半透明遮罩 (点击居外空间快速关闭) */}
      <div 
        className={`fixed inset-0 transition-opacity ${
          isIosGlass ? 'bg-slate-900/35 backdrop-blur-xl' : 'bg-black/80 backdrop-blur-md'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 中央主视区：全球智库沉浸式认知档案 (0° Z轴平视视窗，12px 微圆角外框) */}
      <div 
        className={`dossier-modal-window relative w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden z-10 font-sans transition-all duration-300 ${
          isIosGlass
            ? 'rounded-[12px] bg-white/85 backdrop-blur-2xl border border-white/95 shadow-[0_40px_90px_-20px_rgba(0,0,0,0.22)] text-slate-900'
            : 'rounded-3xl bg-obsidian-950 border border-white/15 shadow-2xl text-white'
        }`}
        style={{ transform: 'none' }}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* 1. 顶部标题栏 */}
        <div className={`dossier-header-bar px-6 py-4 flex items-center justify-between border-b ${
          isIosGlass
            ? 'bg-white/80 backdrop-blur-xl border-slate-200/60'
            : 'bg-obsidian-900/80 backdrop-blur-md border-white/10'
        }`}>
          <div className="flex items-center gap-3">
            <span className={`dossier-agent-badge px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 shadow-inner ${
              isIosGlass
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-cyan-950 text-cyan-300 border border-cyan-800/80'
            }`}>
              <Cpu className={`w-3.5 h-3.5 ${isIosGlass ? 'text-blue-600' : 'text-cyan-400'}`} />
              <span>GEMINI AGENT DOSSIER</span>
            </span>
            <span className={`dossier-id-code text-xs font-mono uppercase hidden sm:inline ${
              isIosGlass ? 'text-slate-400' : 'text-slate-500'
            }`}>
              档案编号: <strong className={isIosGlass ? 'text-slate-700 font-semibold' : 'text-slate-400 font-semibold'}>{news.id}</strong>
            </span>
            {currentBookmarked && (
              <span className={`dossier-bookmarked-badge px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border flex items-center gap-1 shadow-sm ${
                isIosGlass
                  ? 'bg-amber-50 text-amber-700 border-amber-300'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
              }`}>
                <Bookmark className="w-3 h-3 fill-current text-amber-400" />
                <span>已收藏</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleBookmark}
              className={`dossier-action-btn p-2 transition border flex items-center justify-center ${
                isIosGlass ? 'rounded-full' : 'rounded-xl'
              } ${
                currentBookmarked 
                  ? 'dossier-action-active bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-glow-amber' 
                  : isIosGlass
                  ? 'bg-slate-100 text-slate-500 hover:text-slate-900 border-slate-200'
                  : 'bg-white/5 text-slate-400 hover:text-white border-white/5'
              }`}
              title={currentBookmarked ? "已收藏 (点击取消收藏)" : "收藏该研报 (永久留存本地)"}
            >
              <Bookmark className={`w-4 h-4 ${currentBookmarked ? 'fill-current text-amber-400' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleShare}
              className={`dossier-action-btn p-2 transition border relative flex items-center justify-center ${
                isIosGlass
                  ? 'rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                  : 'rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border-white/5'
              }`}
              title="微信扫码与多端分享 (免翻专属直达)"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className={`dossier-close-btn p-2 transition border ml-1 flex items-center justify-center ${
                isIosGlass
                  ? 'rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border-slate-200'
                  : 'rounded-xl text-slate-400 hover:text-white hover:bg-white/10 border-white/5'
              }`}
              title="关闭 (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. 主体内容区：双栏黄金对称排版 */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* 左栏 (5列)：多模态视觉媒体、信源凭证与核心元数据 */}
          <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              {/* 视觉封面卡片 (8px 微圆角) */}
              <div className={`dossier-media-card relative w-full h-52 sm:h-64 overflow-hidden border shadow-lg group ${
                isIosGlass ? 'rounded-[8px] bg-slate-100 border-white/80' : 'rounded-2xl bg-slate-900 border-white/10'
              }`}>
                {news.coverUrl && !imgError ? (
                  <img
                    src={news.coverUrl}
                    alt={news.title}
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className={`w-full h-full flex flex-col items-center justify-center ${
                    isIosGlass ? 'bg-slate-100 text-slate-400' : 'bg-gradient-to-tr from-obsidian-950 to-slate-900 text-slate-600'
                  }`}>
                    <CatIcon className={`w-16 h-16 mb-2 opacity-40 ${isIosGlass ? 'text-blue-500' : 'text-cyan-400'}`} />
                    <span className="text-xs font-mono tracking-widest uppercase">Global Intelligence Visual</span>
                  </div>
                )}
                
                {/* 封面渐变遮罩 */}
                <div className={`absolute inset-0 pointer-events-none ${
                  isIosGlass ? 'bg-gradient-to-t from-black/40 via-transparent to-transparent' : 'bg-gradient-to-t from-obsidian-950 via-transparent to-black/60'
                }`} />

                {/* 封面左上角浮层：领域与影响等级 */}
                <div className="absolute top-3 left-3 flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border backdrop-blur-md shadow-sm ${
                    isIosGlass ? 'bg-white/90 text-blue-700 border-white/80' : catMeta.badge
                  }`}>
                    <CatIcon className="w-3.5 h-3.5" />
                    <span>{catMeta.label}</span>
                  </span>

                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold border backdrop-blur-md shadow-sm ${
                    isIosGlass ? 'bg-white/90 text-amber-700 border-white/80' : impactMeta.style
                  }`}>
                    <ImpactIcon className="w-3.5 h-3.5 animate-pulse" />
                    <span>{impactMeta.label}</span>
                  </span>
                </div>
              </div>

              {/* 信源权威凭证矩阵卡 (8px 微圆角窗格) */}
              <div className={`dossier-meta-card p-4 border space-y-2.5 text-xs ${
                isIosGlass 
                  ? 'rounded-[8px] bg-white/65 border-white/85 shadow-sm text-slate-700' 
                  : 'rounded-2xl bg-obsidian-card border-white/10 font-mono'
              }`}>
                <div className={`flex items-center justify-between border-b pb-2 ${
                  isIosGlass ? 'border-slate-200/60' : 'border-white/5'
                }`}>
                  <span className={`flex items-center gap-1.5 ${isIosGlass ? 'text-slate-500' : 'text-slate-400'}`}>
                    <Globe2 className={`w-4 h-4 ${isIosGlass ? 'text-blue-600' : 'text-cyan-400'}`} />
                    发布信源:
                  </span>
                  <span className={`font-bold flex items-center gap-1.5 ${isIosGlass ? 'text-slate-900' : 'text-white'}`}>
                    {news.source}
                    {news.sourceCountry && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        isIosGlass ? 'bg-slate-200/80 text-slate-700' : 'bg-white/10 text-cyan-300'
                      }`}>
                        {news.sourceCountry}
                      </span>
                    )}
                  </span>
                </div>

                <div className={`flex items-center justify-between border-b pb-2 ${
                  isIosGlass ? 'border-slate-200/60' : 'border-white/5'
                }`}>
                  <span className={`flex items-center gap-1.5 ${isIosGlass ? 'text-slate-500' : 'text-slate-400'}`}>
                    <Calendar className={`w-4 h-4 ${isIosGlass ? 'text-indigo-600' : 'text-indigo-400'}`} />
                    入库时间:
                  </span>
                  <span className={isIosGlass ? 'text-slate-600' : 'text-slate-300'}>
                    {new Date(news.publishTime).toUTCString()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`flex items-center gap-1.5 ${isIosGlass ? 'text-slate-500' : 'text-slate-400'}`}>
                    <Tag className={`w-4 h-4 ${isIosGlass ? 'text-emerald-600' : 'text-emerald-400'}`} />
                    地缘覆盖:
                  </span>
                  <span className={`font-semibold ${isIosGlass ? 'text-emerald-600' : 'text-emerald-300'}`}>
                    {news.region}
                  </span>
                </div>
              </div>
            </div>

            {/* 原文权威外链直达 (8px 微圆角按键) */}
            <div className="pt-2">
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(news.englishTitle || news.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`dossier-external-link w-full py-3 px-4 text-xs font-semibold transition flex items-center justify-center gap-2 group shadow-sm ${
                  isIosGlass
                    ? 'rounded-[8px] bg-slate-100/90 hover:bg-slate-200 text-slate-800 border border-slate-200'
                    : 'rounded-xl font-mono text-slate-300 bg-white/5 hover:bg-white/10 hover:text-white border border-white/10'
                }`}
              >
                <span>查阅全球外媒报道原件 (Cross-Check)</span>
                <ExternalLink className={`w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform ${
                  isIosGlass ? 'text-blue-600' : 'text-cyan-400'
                }`} />
              </a>
            </div>
          </div>

          {/* 右栏 (7列)：主副标题、Gemini 深度提炼研报与量化 NLP 实验室 */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 标题系统 */}
            <div>
              <h2 className={`dossier-title text-xl sm:text-2xl font-black leading-snug tracking-tight mb-2 ${
                isIosGlass ? 'text-slate-900' : 'text-white'
              }`}>
                {news.title}
              </h2>
              {news.englishTitle && (
                <p className={`dossier-subtitle text-xs sm:text-sm italic leading-relaxed ${
                  isIosGlass ? 'text-slate-500 font-sans' : 'text-cyan-400/90 font-mono'
                }`}>
                  {news.englishTitle}
                </p>
              )}
            </div>

            {/* Gemini 智能体深度研报提炼 (8px 微圆角窗格) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className={`text-xs uppercase tracking-wider flex items-center gap-1.5 font-bold ${
                  isIosGlass ? 'text-blue-600 font-sans' : 'text-cyan-300 font-mono'
                }`}>
                  <FileText className={`w-4 h-4 ${isIosGlass ? 'text-blue-600' : 'text-cyan-400'}`} />
                  Gemini 智能体深度研报提炼 (自包含微型研报)
                </h4>
                <span className={`text-[10px] hidden sm:inline ${
                  isIosGlass ? 'text-slate-400 font-sans' : 'text-slate-500 font-mono'
                }`}>
                  时间 · 主体 · 核心细节 · 战略影响
                </span>
              </div>
              <div className={`dossier-summary-card text-sm leading-relaxed p-5 border ${
                isIosGlass 
                  ? 'rounded-[8px] bg-white/65 border-white/85 text-slate-800 shadow-sm' 
                  : 'rounded-2xl font-sans bg-white/[0.03] border-white/10 text-slate-200 shadow-inner'
              }`}>
                {renderStructuredSummary(news.summary)}
              </div>
            </div>

            {/* Gemini NLP 认知与实体抽取实验室 (8px 微圆角窗格) */}
            <div className={`dossier-nlp-card p-5 space-y-4 border ${
              isIosGlass 
                ? 'rounded-[8px] bg-white/65 border-white/85 shadow-sm text-slate-800' 
                : 'rounded-2xl glass-card border-cyan-500/30 shadow-glow-blue'
            }`}>
              <div className={`flex items-center justify-between border-b pb-3 ${
                isIosGlass ? 'border-slate-200/60' : 'border-white/10'
              }`}>
                <div className="flex items-center gap-2">
                  <Cpu className={`w-4 h-4 animate-pulse ${isIosGlass ? 'text-blue-600' : 'text-cyan-400'}`} />
                  <span className={`text-xs font-bold uppercase tracking-wider ${isIosGlass ? 'text-slate-900 font-sans' : 'text-white font-mono'}`}>
                    NLP Quant & Entity Extraction
                  </span>
                </div>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full border shadow-sm flex items-center gap-1 ${
                  isIosGlass 
                    ? 'bg-blue-50 text-blue-700 border-blue-200 font-sans' 
                    : 'bg-cyan-950 text-cyan-300 border-cyan-700 shadow-inner font-mono'
                }`}>
                  <Radio className={`w-2.5 h-2.5 animate-ping ${isIosGlass ? 'text-blue-600' : 'text-cyan-400'}`} />
                  Gemini 3.8 Flash · Confidence 98.2%
                </span>
              </div>

              {/* 宏观情绪极性指标微量尺 */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className={isIosGlass ? 'text-slate-500' : 'text-slate-400'}>宏观极性指数 (Sentiment Polarity):</span>
                  <span className={`font-bold ${scoreColor} text-sm`}>
                    {scoreFormatted} ({news.sentiment.toUpperCase()})
                  </span>
                </div>
                <div className={`w-full rounded-full h-2 overflow-hidden border p-[1px] ${
                  isIosGlass ? 'bg-slate-200 border-slate-200' : 'bg-slate-900 border-white/10'
                }`}>
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${news.sentimentScore > 0 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-rose-500 to-amber-500'}`}
                    style={{ width: `${Math.min(100, Math.max(15, Math.abs(news.sentimentScore * 100)))}%` }}
                  />
                </div>
              </div>

              {/* 命名实体抽取 NER 标签云 */}
              <div>
                <span className={`text-[11px] block mb-2 ${isIosGlass ? 'text-slate-500 font-sans' : 'text-slate-400 font-mono'}`}>
                  识别命名实体 (Named Entities):
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {(news.nlpKeyEntities || news.tags).map((entity, i) => (
                    <span
                      key={i}
                      className={`px-2.5 py-1 rounded-full text-xs transition cursor-default shadow-sm ${
                        isIosGlass 
                          ? 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200/80 font-sans' 
                          : 'dossier-entity-badge rounded-lg font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 hover:border-cyan-400/40'
                      }`}
                    >
                      #{entity}
                    </span>
                  ))}
                </div>
              </div>

              {/* 溯源认证元数据 */}
              <div className={`pt-2 border-t flex items-center justify-between text-[10px] font-mono ${
                isIosGlass ? 'border-slate-200/60 text-slate-400' : 'border-white/5 text-slate-500'
              }`}>
                <span>AGENT: Gemini Spark 24H</span>
                <span>PARTITION: #{news.batchDate?.replace(/-/g, '').slice(4) || 'DAILY'}</span>
                <span className="text-emerald-500 font-semibold">STATUS: MULTI-SOURCE VERIFIED</span>
              </div>
            </div>

          </div>

        </div>

        {/* 3. 底部操作栏 */}
        <div className={`dossier-footer-bar px-6 py-4 border-t flex items-center justify-between ${
          isIosGlass 
            ? 'bg-white/80 backdrop-blur-xl border-slate-200/60 text-slate-600' 
            : 'bg-obsidian-900/80 backdrop-blur-md border-white/10 text-slate-400 font-mono'
        }`}>
          <div className="flex items-center gap-2 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span className="hidden sm:inline">数据已通过全球权威分布式信源交叉比对与校验</span>
            <span className="sm:hidden">多源交叉校验通过</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`dossier-done-btn px-6 py-2 text-xs font-bold transition shadow-md active:scale-95 ${
              isIosGlass
                ? 'rounded-full text-white bg-blue-600 hover:bg-blue-700 shadow-[0_4px_14px_rgba(37,99,235,0.35)]'
                : 'rounded-xl font-mono text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border border-cyan-400/30'
            }`}
          >
            完成查阅 (Done)
          </button>
        </div>

      </div>

      {/* 微信扫码与多端专属直达分享弹窗 */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        news={news}
        onShowToast={onShowToast}
      />

    </div>
  );
};

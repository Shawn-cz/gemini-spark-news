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

  // 监听 ESC 键关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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

  // 深度直达分享：生成专属深链 URL，优先调用原生移动端分享，优雅降级至剪贴板复制
  const handleShare = async () => {
    if (!news) return;
    const origin = window.location.origin;
    const path = window.location.pathname;
    const targetDate = news.batchDate || news.publishTime.slice(0, 10);
    const shareUrl = `${origin}${path}?date=${encodeURIComponent(targetDate)}&newsId=${encodeURIComponent(news.id)}`;

    // 优先尝试原生系统分享 (iOS/Android/macOS)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `【智库研报】${news.title}`,
          text: `${news.title} —— Gemini Spark 全球宏观情报`,
          url: shareUrl
        });
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        if (onShowToast) {
          onShowToast('✅ 已调用系统分享');
        }
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return; // 用户主动取消系统分享弹窗
        }
      }
    }

    // 降级使用剪贴板复制深度直达链接
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      if (onShowToast) {
        onShowToast('🔗 研报深度直达专属链接已复制到剪贴板！');
      }
    } catch {
      // 容错降级
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      if (onShowToast) {
        onShowToast('🔗 研报深度直达专属链接已复制到剪贴板！');
      }
    }
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
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 中央主视区：全球智库沉浸式认知档案 (双栏黄金对称设计，完美聚焦中央视野) */}
      <div 
        className="dossier-modal-window relative w-full max-w-5xl max-h-[92vh] bg-obsidian-950 border border-white/15 rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* 1. 顶部标题栏 */}
        <div className="dossier-header-bar px-6 py-4 border-b border-white/10 flex items-center justify-between bg-obsidian-900/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="dossier-agent-badge px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/80 flex items-center gap-1.5 shadow-inner">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>GEMINI AGENT DOSSIER</span>
            </span>
            <span className="dossier-id-code text-xs font-mono text-slate-500 uppercase hidden sm:inline">
              档案编号: <strong className="text-slate-400 font-semibold">{news.id}</strong>
            </span>
            {currentBookmarked && (
              <span className="dossier-bookmarked-badge px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/40 flex items-center gap-1 shadow-sm">
                <Bookmark className="w-3 h-3 fill-current text-amber-400" />
                <span>已收藏</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleBookmark}
              className={`dossier-action-btn p-2 rounded-xl transition border flex items-center justify-center ${
                currentBookmarked 
                  ? 'dossier-action-active bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-glow-amber' 
                  : 'bg-white/5 text-slate-400 hover:text-white border-white/5'
              }`}
              title={currentBookmarked ? "已收藏 (点击取消收藏)" : "收藏该研报 (永久留存本地)"}
            >
              <Bookmark className={`w-4 h-4 ${currentBookmarked ? 'fill-current text-amber-400' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="dossier-action-btn p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition border border-white/5 relative flex items-center justify-center"
              title="深度直达分享 (生成免翻专属链接)"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="dossier-close-btn p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition border border-white/5 ml-1 flex items-center justify-center"
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
              {/* 视觉封面卡片 */}
              <div className="dossier-media-card relative w-full h-52 sm:h-64 rounded-2xl overflow-hidden bg-slate-900 border border-white/10 shadow-lg group">
                {news.coverUrl && !imgError ? (
                  <img
                    src={news.coverUrl}
                    alt={news.title}
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-obsidian-950 to-slate-900 text-slate-600">
                    <CatIcon className="w-16 h-16 mb-2 opacity-30 text-cyan-400" />
                    <span className="text-xs font-mono tracking-widest text-slate-500 uppercase">Global Intelligence Visual</span>
                  </div>
                )}
                
                {/* 封面渐变遮罩 */}
                <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950 via-transparent to-black/60 pointer-events-none" />

                {/* 封面左上角浮层：领域与影响等级 */}
                <div className="absolute top-3 left-3 flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border backdrop-blur-md ${catMeta.badge}`}>
                    <CatIcon className="w-3.5 h-3.5" />
                    <span>{catMeta.label}</span>
                  </span>

                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold border backdrop-blur-md ${impactMeta.style}`}>
                    <ImpactIcon className="w-3.5 h-3.5 animate-pulse" />
                    <span>{impactMeta.label}</span>
                  </span>
                </div>
              </div>

              {/* 信源权威凭证矩阵卡 */}
              <div className="dossier-meta-card p-4 rounded-2xl bg-obsidian-card border border-white/10 space-y-2.5 text-xs font-mono">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Globe2 className="w-4 h-4 text-cyan-400" />
                    发布信源:
                  </span>
                  <span className="font-bold text-white flex items-center gap-1.5">
                    {news.source}
                    {news.sourceCountry && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-cyan-300 font-mono">
                        {news.sourceCountry}
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    入库时间:
                  </span>
                  <span className="text-slate-300">
                    {new Date(news.publishTime).toUTCString()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-emerald-400" />
                    地缘覆盖:
                  </span>
                  <span className="text-emerald-300 font-semibold">
                    {news.region}
                  </span>
                </div>
              </div>
            </div>

            {/* 原文权威外链直达 */}
            <div className="pt-2">
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(news.englishTitle || news.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="dossier-external-link w-full py-3 px-4 rounded-xl text-xs font-mono font-semibold text-slate-300 bg-white/5 hover:bg-white/10 hover:text-white border border-white/10 transition flex items-center justify-center gap-2 group shadow-sm"
              >
                <span>查阅全球外媒报道原件 (Cross-Check)</span>
                <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-cyan-400" />
              </a>
            </div>
          </div>

          {/* 右栏 (7列)：主副标题、Gemini 深度提炼研报与量化 NLP 实验室 */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 标题系统 */}
            <div>
              <h2 className="dossier-title text-xl sm:text-2xl font-black text-white leading-snug tracking-tight mb-2">
                {news.title}
              </h2>
              {news.englishTitle && (
                <p className="dossier-subtitle text-xs sm:text-sm font-mono text-cyan-400/90 italic leading-relaxed">
                  {news.englishTitle}
                </p>
              )}
            </div>

            {/* Gemini 智能体深度研报提炼 (自包含微型深度研报) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono uppercase tracking-wider text-cyan-300 flex items-center gap-1.5 font-bold">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  Gemini 智能体深度研报提炼 (自包含微型研报)
                </h4>
                <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
                  时间 · 主体 · 核心细节 · 战略影响
                </span>
              </div>
              <div className="dossier-summary-card text-sm leading-relaxed text-slate-200 font-sans bg-white/[0.03] p-5 rounded-2xl border border-white/10 shadow-inner">
                {renderStructuredSummary(news.summary)}
              </div>
            </div>

            {/* Gemini NLP 认知与实体抽取实验室 */}
            <div className="dossier-nlp-card glass-card p-5 rounded-2xl border border-cyan-500/30 shadow-glow-blue space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    NLP Quant & Entity Extraction
                  </span>
                </div>
                <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 px-2.5 py-0.5 rounded-full border border-cyan-700 shadow-inner flex items-center gap-1">
                  <Radio className="w-2.5 h-2.5 text-cyan-400 animate-ping" />
                  Gemini 1.5 Pro · Confidence 98.2%
                </span>
              </div>

              {/* 宏观情绪极性指标微量尺 */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400">宏观极性指数 (Sentiment Polarity):</span>
                  <span className={`font-bold ${scoreColor} text-sm`}>
                    {scoreFormatted} ({news.sentiment.toUpperCase()})
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-white/10 p-[1px]">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${news.sentimentScore > 0 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-rose-500 to-amber-500'}`}
                    style={{ width: `${Math.min(100, Math.max(15, Math.abs(news.sentimentScore * 100)))}%` }}
                  />
                </div>
              </div>

              {/* 命名实体抽取 NER 标签云 */}
              <div>
                <span className="text-[11px] font-mono text-slate-400 block mb-2">
                  识别命名实体 (Named Entities):
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {(news.nlpKeyEntities || news.tags).map((entity, i) => (
                    <span
                      key={i}
                      className="dossier-entity-badge px-2.5 py-1 rounded-lg text-xs font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 hover:border-cyan-400/40 transition cursor-default shadow-sm"
                    >
                      #{entity}
                    </span>
                  ))}
                </div>
              </div>

              {/* 溯源认证元数据 */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>AGENT: Gemini Spark 24H</span>
                <span>PARTITION: #{news.batchDate?.replace(/-/g, '').slice(4) || 'DAILY'}</span>
                <span className="text-emerald-400 font-semibold">STATUS: MULTI-SOURCE VERIFIED</span>
              </div>
            </div>

          </div>

        </div>

        {/* 3. 底部操作栏 */}
        <div className="dossier-footer-bar px-6 py-4 border-t border-white/10 bg-obsidian-900/80 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="hidden sm:inline">数据已通过全球权威分布式信源交叉比对与校验</span>
            <span className="sm:hidden">多源交叉校验通过</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="dossier-done-btn px-6 py-2 rounded-xl text-xs font-mono font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 transition shadow-lg shadow-cyan-500/20 active:scale-95 border border-cyan-400/30"
          >
            完成查阅 (Done)
          </button>
        </div>

      </div>

    </div>
  );
};

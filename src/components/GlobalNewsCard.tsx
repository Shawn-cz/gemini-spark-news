import React, { useState } from 'react';
import { 
  Bot, 
  TrendingUp, 
  Globe2, 
  Zap, 
  AlertTriangle, 
  Flame, 
  Layers, 
  ExternalLink,
  Calendar,
  Sparkles,
  Bookmark,
  ArrowRight
} from 'lucide-react';
import { GlobalNewsItem, CategoryType, ImpactLevel } from '../types/news';
import { useTheme } from '../context/ThemeContext';

interface GlobalNewsCardProps {
  news: GlobalNewsItem;
  onClick: () => void;
  isHero?: boolean;
  isBookmarked?: boolean;
  onToggleBookmark?: (news: GlobalNewsItem) => void;
}

export const GlobalNewsCard: React.FC<GlobalNewsCardProps> = ({ 
  news, 
  onClick,
  isHero = false,
  isBookmarked = false,
  onToggleBookmark
}) => {
  const [imgError, setImgError] = useState(false);
  const { theme } = useTheme();
  const isIosGlass = theme === 'ios-glass' || theme === 'light';

  // 领域图标与色彩配置
  const getCategoryMeta = (cat: CategoryType) => {
    switch (cat) {
      case 'ai':
        return { label: '全球 AI 算力', icon: Bot, badge: 'text-cyan-400 bg-cyan-950/70 border-cyan-800/60' };
      case 'finance':
        return { label: '宏观金融', icon: TrendingUp, badge: 'text-emerald-400 bg-emerald-950/70 border-emerald-800/60' };
      case 'geopolitics':
        return { label: '地缘经贸', icon: Globe2, badge: 'text-amber-400 bg-amber-950/70 border-amber-800/60' };
      case 'climate':
        return { label: '气候能源', icon: Zap, badge: 'text-indigo-400 bg-indigo-950/70 border-indigo-800/60' };
      default:
        return { label: '全球动态', icon: Layers, badge: 'text-slate-400 bg-slate-900 border-slate-700' };
    }
  };

  // 影响等级配置
  const getImpactMeta = (impact: ImpactLevel) => {
    switch (impact) {
      case 'critical':
        return { 
          label: 'CRITICAL IMPACT', 
          style: 'text-rose-400 bg-rose-950/80 border-rose-500/50 shadow-glow-rose',
          icon: Flame 
        };
      case 'high':
        return { 
          label: 'HIGH IMPACT', 
          style: 'text-amber-400 bg-amber-950/80 border-amber-500/40',
          icon: AlertTriangle 
        };
      case 'medium':
      default:
        return { 
          label: 'MEDIUM IMPACT', 
          style: 'text-cyan-400 bg-cyan-950/60 border-cyan-700/30',
          icon: Sparkles 
        };
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

  const formatPublishTime = (timeStr: string) => {
    try {
      const d = new Date(timeStr);
      return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC';
    } catch {
      return timeStr;
    }
  };

  if (isIosGlass) {
    const catStyle = 
      news.category === 'ai' ? 'text-blue-600 bg-blue-50/90 border-blue-200/80' :
      news.category === 'finance' ? 'text-emerald-600 bg-emerald-50/90 border-emerald-200/80' :
      news.category === 'geopolitics' ? 'text-amber-600 bg-amber-50/90 border-amber-200/80' :
      news.category === 'climate' ? 'text-indigo-600 bg-indigo-50/90 border-indigo-200/80' :
      'text-slate-600 bg-slate-100/90 border-slate-200/80';

    const impactStyle =
      news.impactLevel === 'critical' ? 'text-rose-600 bg-rose-50/90 border-rose-200/80' :
      news.impactLevel === 'high' ? 'text-amber-600 bg-amber-50/90 border-amber-200/80' :
      'text-blue-600 bg-blue-50/90 border-blue-200/80';

    return (
      <article
        onClick={onClick}
        className={`ios-glass-card rounded-[10px] overflow-hidden cursor-pointer flex flex-col justify-between group relative transition-all duration-300 border border-white/85 bg-white/75 backdrop-blur-xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.06),0_1px_3px_0_rgba(0,0,0,0.02)] hover:shadow-[0_20px_45px_-12px_rgba(37,99,235,0.14)] hover:bg-white/90 hover:-translate-y-1 ${
          isHero ? 'md:col-span-2 md:row-span-2' : ''
        }`}
      >
        {/* 顶部环境流体反光细线 */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none" />

        {/* 顶部媒体流展示 (8px 微圆角内嵌式画幅) */}
        <div className={`relative overflow-hidden rounded-[8px] bg-slate-100 mx-3.5 mt-3.5 border border-white/60 ${isHero ? 'h-60 sm:h-72' : 'h-40'}`}>
          {news.coverUrl && !imgError ? (
            <img
              src={news.coverUrl}
              alt={news.title}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 will-change-transform"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-slate-100 to-slate-200 text-slate-400">
              <CatIcon className="w-10 h-10 mb-1 opacity-40 text-blue-500" />
              <span className="text-[10px] font-sans font-medium tracking-wider text-slate-400 uppercase">Vision Intelligence</span>
            </div>
          )}

          {/* 左上角：领域与影响等级徽标 */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border backdrop-blur-md whitespace-nowrap shadow-sm ${catStyle}`}>
              <CatIcon className="w-3 h-3 flex-shrink-0" />
              <span>{catMeta.label}</span>
            </span>

            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border backdrop-blur-md whitespace-nowrap shadow-sm ${impactStyle}`}>
              <ImpactIcon className="w-3 h-3 flex-shrink-0" />
              <span>{impactMeta.label}</span>
            </span>
          </div>

          {/* 右上角：全球情绪极性微量尺 */}
          <div className="absolute top-2.5 right-2.5 bg-white/80 backdrop-blur-md border border-white/60 px-2 py-0.5 rounded-full flex items-center gap-1 font-mono text-[10px] shadow-sm">
            <span className="text-slate-400 text-[9px]">NLP:</span>
            <span className={`font-bold ${news.sentimentScore > 0 ? 'text-emerald-600' : news.sentimentScore < 0 ? 'text-rose-600' : 'text-slate-600'}`}>
              {scoreFormatted}
            </span>
          </div>

          {/* 底部浮层：媒体源与时间 */}
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-xs font-sans">
            <div className="flex items-center gap-1.5 bg-white/80 px-2.5 py-0.5 rounded-full backdrop-blur-md border border-white/60 shadow-sm text-slate-800 text-[11px] font-medium">
              <span>{news.source}</span>
              {news.sourceCountry && (
                <span className="text-[10px] px-1 rounded bg-slate-200/80 text-slate-600 font-mono">
                  {news.sourceCountry}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 text-[11px] text-slate-600 bg-white/80 px-2.5 py-0.5 rounded-full backdrop-blur-md border border-white/60 shadow-sm">
              <Calendar className="w-3 h-3 text-blue-600" />
              <span>{formatPublishTime(news.publishTime)}</span>
            </div>
          </div>
        </div>

        {/* 卡片主体内容 */}
        <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
          <div>
            {/* 中文主标题 */}
            <h3 className={`font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug mb-1 line-clamp-2 ${
              isHero ? 'text-base sm:text-lg' : 'text-sm'
            }`}>
              {news.title}
            </h3>

            {/* 英文副标题 */}
            {news.englishTitle && (
              <p className="text-[11px] font-sans text-slate-500 line-clamp-1 italic mb-1.5">
                {news.englishTitle}
              </p>
            )}

            {/* 摘要 (8px 微圆角流体框) */}
            <div className={`bg-slate-900/[0.02] border border-slate-200/60 rounded-[8px] p-2.5 my-2 text-slate-600 text-xs leading-relaxed ${
              isHero ? 'line-clamp-3' : 'line-clamp-2'
            }`}>
              {news.summary}
            </div>
          </div>

          {/* 底部操作区：单一“查看详情”按钮 (符合需求：红框内容太冗长，只要写“查看详情”就行) */}
          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
            {/* Spark 实体标签 */}
            <div className="flex items-center gap-1 overflow-hidden">
              {(news.nlpKeyEntities || news.tags).slice(0, 2).map((entity, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-full text-[10px] font-sans font-medium text-slate-500 bg-slate-100/80 border border-slate-200/60 truncate"
                >
                  #{entity}
                </span>
              ))}
            </div>

            {/* 操作区 */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {onToggleBookmark && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleBookmark(news);
                  }}
                  className={`p-1.5 rounded-full transition-all flex items-center justify-center ${
                    isBookmarked
                      ? 'text-amber-500 bg-amber-50 border border-amber-300 shadow-sm'
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 border border-transparent'
                  }`}
                  title={isBookmarked ? "已收藏 (点击取消)" : "收藏该研报"}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current text-amber-500' : ''}`} />
                </button>
              )}

              {/* 单一简约“查看详情”胶囊按键 */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
                className="px-3.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-medium text-xs shadow-[0_4px_12px_rgba(37,99,235,0.28)] transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer"
              >
                <span>查看详情</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      onClick={onClick}
      className={`glass-card glass-card-hover rounded-2xl overflow-hidden cursor-pointer flex flex-col justify-between group relative border border-white/10 ${
        isHero ? 'md:col-span-2 md:row-span-2 bg-gradient-to-br from-obsidian-card to-obsidian-950/90' : ''
      }`}
    >
      {/* 顶部媒体流展示 (Hero 模式大图，普通卡片紧凑图) */}
      <div className={`relative w-full bg-slate-900 card-media-frame ${isHero ? 'h-64 sm:h-72' : 'h-40'}`}>
        {news.coverUrl && !imgError ? (
          <img
            src={news.coverUrl}
            alt={news.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100 will-change-transform"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-obsidian-950 to-slate-900 text-slate-600">
            <CatIcon className="w-12 h-12 mb-1 opacity-30 text-cyan-400" />
            <span className="text-[11px] font-mono tracking-widest text-slate-500 uppercase">Global Ingestion</span>
          </div>
        )}

        {/* 顶部环境渐变蒙层 (向下延伸 2px，彻底阻断任何缩放底边缘漏色) */}
        <div className="absolute inset-0 -bottom-1 bg-gradient-to-t from-obsidian-950 via-transparent to-black/60 pointer-events-none"></div>

        {/* 左上角：领域与影响等级徽标 */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
          <span className={`card-category-badge card-cat-${news.category} inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border backdrop-blur-md whitespace-nowrap flex-shrink-0 ${catMeta.badge}`}>
            <CatIcon className="w-3 h-3 flex-shrink-0" />
            <span className="whitespace-nowrap">{catMeta.label}</span>
          </span>

          <span className={`card-impact-badge card-impact-${news.impactLevel} inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border backdrop-blur-md whitespace-nowrap flex-shrink-0 ${impactMeta.style}`}>
            <ImpactIcon className="w-3 h-3 animate-pulse flex-shrink-0" />
            <span className="whitespace-nowrap">{impactMeta.label}</span>
          </span>
        </div>

        {/* 右上角：全球情绪极性微量尺 */}
        <div className="card-score-badge absolute top-3 right-3 bg-black/70 backdrop-blur-md border border-white/10 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-mono text-[11px] whitespace-nowrap flex-shrink-0">
          <span className="text-slate-400 text-[10px] whitespace-nowrap">NLP SCORE:</span>
          <span className={`font-bold whitespace-nowrap ${scoreColor}`}>{scoreFormatted}</span>
        </div>

        {/* 底部浮层：媒体源、国别与时钟 */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-slate-300 font-mono">
          <div className="card-source-pill flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-md backdrop-blur-md border border-white/5">
            <span className="font-bold text-white tracking-wide">{news.source}</span>
            {news.sourceCountry && (
              <span className="card-source-country text-[10px] px-1 py-0.2 rounded bg-white/10 text-slate-300 font-mono">
                {news.sourceCountry}
              </span>
            )}
          </div>

          <div className="card-date-pill flex items-center gap-1 text-[11px] text-slate-400 bg-black/60 px-2 py-1 rounded-md backdrop-blur-md border border-white/5">
            <Calendar className="w-3 h-3 text-cyan-400" />
            <span>{formatPublishTime(news.publishTime)}</span>
          </div>
        </div>
      </div>

      {/* 卡片主体内容 (建立独立 z-10 层级与负外边距无缝覆盖，杜绝底层图层穿透) */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between relative z-10 bg-inherit -mt-px">
        <div>
          {/* 中文主标题 (严格限制两行省略，防长文本撑破屏幕) */}
          <h3 className={`card-title font-bold text-slate-100 group-hover:text-cyan-300 transition-colors leading-snug mb-1.5 line-clamp-2 break-words ${
            isHero ? 'text-base sm:text-lg' : 'text-sm'
          }`}>
            {news.title}
          </h3>

          {/* 英文副标题 (国际化原源) */}
          {news.englishTitle && (
            <p className="card-subtitle text-[11px] font-mono text-slate-400/90 line-clamp-1 italic mb-2.5 tracking-tight">
              {news.englishTitle}
            </p>
          )}

          {/* 摘要 */}
          <p className={`card-summary text-xs text-slate-400 leading-relaxed ${isHero ? 'line-clamp-3 mb-4' : 'line-clamp-2 mb-3'}`}>
            {news.summary}
          </p>
        </div>

        {/* 底部实体标签与展开触发指引 */}
        <div className="card-footer-divider pt-3 border-t border-white/5 flex items-center justify-between gap-2">
          {/* Spark NLP 实体标签 */}
          <div className="flex items-center gap-1.5 flex-wrap overflow-hidden">
            {(news.nlpKeyEntities || news.tags).slice(0, 3).map((entity, i) => (
              <span
                key={i}
                className="card-entity-tag px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-white/[0.04] border border-white/5 truncate max-w-[110px]"
              >
                #{entity}
              </span>
            ))}
          </div>

          {/* 操作区：快捷收藏与查看研报微链接 */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {onToggleBookmark && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleBookmark(news);
                }}
                className={`card-bookmark-btn p-1.5 rounded-lg transition-all flex items-center justify-center ${
                  isBookmarked
                    ? 'text-amber-400 bg-amber-500/15 border border-amber-500/40 shadow-sm'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'
                }`}
                title={isBookmarked ? "已收藏 (点击取消)" : "收藏该研报"}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current text-amber-400' : ''}`} />
              </button>
            )}

            {/* 查看研报微链接 */}
            <div className="card-action-link text-[11px] font-mono text-cyan-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1 flex-shrink-0 whitespace-nowrap">
              <span className="whitespace-nowrap">深度解析</span>
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
            </div>
          </div>
        </div>

      </div>
    </article>
  );
};

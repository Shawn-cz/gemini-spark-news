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
  Sparkles
} from 'lucide-react';
import { GlobalNewsItem, CategoryType, ImpactLevel } from '../types/news';

interface GlobalNewsCardProps {
  news: GlobalNewsItem;
  onClick: () => void;
  isHero?: boolean;
}

export const GlobalNewsCard: React.FC<GlobalNewsCardProps> = ({ 
  news, 
  onClick,
  isHero = false 
}) => {
  const [imgError, setImgError] = useState(false);

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

  return (
    <article
      onClick={onClick}
      className={`glass-card glass-card-hover rounded-2xl overflow-hidden cursor-pointer flex flex-col justify-between group relative border border-white/10 ${
        isHero ? 'md:col-span-2 md:row-span-2 bg-gradient-to-br from-obsidian-card to-obsidian-950/90' : ''
      }`}
    >
      {/* 顶部媒体流展示 (Hero 模式大图，普通卡片紧凑图) */}
      <div className={`relative w-full bg-slate-900 overflow-hidden ${isHero ? 'h-64 sm:h-72' : 'h-40'}`}>
        {news.coverUrl && !imgError ? (
          <img
            src={news.coverUrl}
            alt={news.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-obsidian-950 to-slate-900 text-slate-600">
            <CatIcon className="w-12 h-12 mb-1 opacity-30 text-cyan-400" />
            <span className="text-[11px] font-mono tracking-widest text-slate-500 uppercase">Global Ingestion</span>
          </div>
        )}

        {/* 顶部环境渐变蒙层 */}
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950 via-transparent to-black/60 pointer-events-none"></div>

        {/* 左上角：领域与影响等级徽标 */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border backdrop-blur-md ${catMeta.badge}`}>
            <CatIcon className="w-3 h-3" />
            <span>{catMeta.label}</span>
          </span>

          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border backdrop-blur-md ${impactMeta.style}`}>
            <ImpactIcon className="w-3 h-3 animate-pulse" />
            <span>{impactMeta.label}</span>
          </span>
        </div>

        {/* 右上角：全球情绪极性微量尺 */}
        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md border border-white/10 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-mono text-[11px]">
          <span className="text-slate-400 text-[10px]">NLP SCORE:</span>
          <span className={`font-bold ${scoreColor}`}>{scoreFormatted}</span>
        </div>

        {/* 底部浮层：媒体源、国别与时钟 */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-slate-300 font-mono">
          <div className="flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-md backdrop-blur-md border border-white/5">
            <span className="font-bold text-white tracking-wide">{news.source}</span>
            {news.sourceCountry && (
              <span className="text-[10px] px-1 py-0.2 rounded bg-white/10 text-slate-300 font-mono">
                {news.sourceCountry}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-400 bg-black/60 px-2 py-1 rounded-md backdrop-blur-md border border-white/5">
            <Calendar className="w-3 h-3 text-cyan-400" />
            <span>{formatPublishTime(news.publishTime)}</span>
          </div>
        </div>
      </div>

      {/* 卡片主体内容 */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* 中文主标题 (严格限制两行省略，防长文本撑破屏幕) */}
          <h3 className={`font-bold text-slate-100 group-hover:text-cyan-300 transition-colors leading-snug mb-1.5 line-clamp-2 break-words ${
            isHero ? 'text-base sm:text-lg' : 'text-sm'
          }`}>
            {news.title}
          </h3>

          {/* 英文副标题 (国际化原源) */}
          {news.englishTitle && (
            <p className="text-[11px] font-mono text-slate-400/90 line-clamp-1 italic mb-2.5 tracking-tight">
              {news.englishTitle}
            </p>
          )}

          {/* 摘要 */}
          <p className={`text-xs text-slate-400 leading-relaxed ${isHero ? 'line-clamp-3 mb-4' : 'line-clamp-2 mb-3'}`}>
            {news.summary}
          </p>
        </div>

        {/* 底部实体标签与展开触发指引 */}
        <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
          {/* Spark NLP 实体标签 */}
          <div className="flex items-center gap-1.5 flex-wrap overflow-hidden">
            {(news.nlpKeyEntities || news.tags).slice(0, 3).map((entity, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-white/[0.04] border border-white/5 truncate max-w-[110px]"
              >
                #{entity}
              </span>
            ))}
          </div>

          {/* 查看研报微链接 */}
          <div className="text-[11px] font-mono text-cyan-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1 flex-shrink-0">
            <span>深度解析</span>
            <ExternalLink className="w-3 h-3" />
          </div>
        </div>

      </div>
    </article>
  );
};

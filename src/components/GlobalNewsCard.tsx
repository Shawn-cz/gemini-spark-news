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
  const isPopDopamine = theme === 'pop-dopamine' || theme === 'dopamine';
  const isCyberHud = theme === 'cyber-hud' || theme === 'dark' || (!isIosGlass && !isPopDopamine);

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
          <div className={`flex flex-col ${isHero ? 'flex-1' : ''}`}>
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

            {/* 摘要 (8px 微圆角流体框：将 line-clamp 放置于内部 p 标签彻底杜绝边框切断半行文字 Bug，同时 Hero 卡片支持 flex-1 自适应拉伸填充) */}
            <div className={`bg-slate-900/[0.02] border border-slate-200/60 rounded-[8px] p-2.5 my-2 ${
              isHero ? 'flex-1 flex flex-col justify-center my-3' : ''
            }`}>
              <p className={`text-slate-600 text-xs leading-relaxed m-0 ${
                isHero ? 'line-clamp-4 sm:line-clamp-6' : 'line-clamp-2'
              }`}>
                {news.summary}
              </p>
            </div>
          </div>

          {/* 底部操作区：单一“查看详情”按钮 (符合需求：红框内容太冗长，只要写“查看详情”就行) */}
          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
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

  // 方案 B: 波普潮玩多巴胺 (Pop Dopamine Art) 专属卡片架构
  if (isPopDopamine) {
    const badgeText = news.impactLevel === 'critical' ? '🔥 行业里程碑' : news.impactLevel === 'high' ? '⚡ 研报必读' : '✨ 深度发现';

    return (
      <article
        onClick={onClick}
        className={`bg-white border border-slate-900 shadow-[0_0_0_2px_#0f172a,6px_6px_0px_0px_#111827] rounded-3xl p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_0_0_2px_#0f172a,10px_10px_0px_0px_#111827] text-slate-900 relative group overflow-hidden cursor-pointer ${
          isHero ? 'md:col-span-2 md:row-span-2' : ''
        }`}
      >
        {/* 右上角倾斜趣味潮玩贴纸 */}
        <div className="absolute -top-1 -right-1 z-20 pop-sticker">
          <span className="bg-yellow-300 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#111827] text-slate-900 font-['Fredoka'] font-black text-[11px] px-3 py-1 rounded-lg block">
            {badgeText}
          </span>
        </div>

        <div className={`flex flex-col ${isHero ? 'flex-1' : ''}`}>
          {/* 拍立得式粗黑边框封面图 */}
          <div className={`relative w-full rounded-2xl overflow-hidden border-[2.5px] border-slate-900 shadow-[3px_3px_0px_0px_#111827] mb-4 bg-slate-100 ${
            isHero ? 'h-56 sm:h-64' : 'h-48'
          }`}>
            {news.coverUrl && !imgError ? (
              <img
                src={news.coverUrl}
                alt={news.title}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-500">
                <CatIcon className="w-12 h-12 mb-1 opacity-40 text-pink-500" />
                <span className="text-[11px] font-['Fredoka'] font-bold text-slate-600 uppercase">POP INTELLIGENCE</span>
              </div>
            )}
            <div className="absolute bottom-2 left-2 bg-slate-900/90 text-white font-['Fredoka'] text-[11px] font-bold px-2.5 py-0.5 rounded-lg border border-slate-700">
              🏷️ {catMeta.label}
            </div>
          </div>

          {/* 纯正波普字系主标题 */}
          <h3 className={`font-extrabold text-slate-900 leading-snug tracking-tight mb-1.5 font-['Plus_Jakarta_Sans'] hover:text-pink-600 transition-colors line-clamp-2 ${
            isHero ? 'text-lg sm:text-xl' : 'text-base'
          }`}>
            {news.title}
          </h3>

          {/* 英文副标题 */}
          {news.englishTitle && (
            <h4 className="text-xs font-semibold text-slate-600 mb-3 leading-relaxed line-clamp-1">
              {news.englishTitle}
            </h4>
          )}

          {/* 暖调淡黄摘要窗格：将 line-clamp 放置于内部 p 标签彻底杜绝底边截断半行文字 Bug */}
          <div className={`bg-amber-50/60 p-3 rounded-xl border border-amber-200/80 mb-4 ${
            isHero ? 'flex-1 flex flex-col justify-center my-2' : ''
          }`}>
            <p className={`text-xs text-slate-700 leading-relaxed font-normal m-0 ${
              isHero ? 'line-clamp-4 sm:line-clamp-6' : 'line-clamp-2'
            }`}>
              {news.summary}
            </p>
          </div>
        </div>

        {/* 底部波普弹润交互底栏 */}
        <div className="pt-3 border-t-2 border-slate-200 flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 font-['Plus_Jakarta_Sans'] truncate mr-2">
            📡 {news.source} · {formatPublishTime(news.publishTime)}
          </span>
          <div className="flex items-center gap-2 flex-shrink-0">
            {onToggleBookmark && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleBookmark(news);
                }}
                className={`pop-btn p-2 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_#111827] cursor-pointer ${
                  isBookmarked
                    ? 'bg-pink-500 text-white font-black'
                    : 'bg-pink-100 hover:bg-pink-200 text-pink-600 font-black'
                }`}
                title={isBookmarked ? "取消收藏" : "收藏"}
              >
                ❤️
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              className="pop-btn bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold text-xs px-3.5 py-1.5 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_#111827] cursor-pointer font-['Fredoka'] flex items-center gap-1"
            >
              <span>解读全文 →</span>
            </button>
          </div>
        </div>
      </article>
    );
  }

  // 方案 A: 赛博战术极客 HUD (Cyber Tactical HUD) 专属卡片架构
  return (
    <article
      onClick={onClick}
      className={`bg-slate-900/85 border border-cyan-500/40 hover:border-cyan-400/90 rounded-2xl p-5 shadow-[0_0_20px_rgba(0,240,255,0.12)] hover:shadow-[0_0_30px_rgba(0,240,255,0.35)] transition-all duration-300 flex flex-col justify-between cyber-corner-bracket group cursor-pointer ${
        isHero ? 'md:col-span-2 md:row-span-2' : ''
      }`}
    >
      <div className={`flex flex-col ${isHero ? 'flex-1' : ''}`}>
        {/* 顶部战术情报标签栏 */}
        <div className="flex items-center justify-between font-mono text-[10px] text-cyan-400 mb-3">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse flex-shrink-0"></span>
            <span className="font-bold tracking-wider font-mono">[ID: SPARK-00{news.id}]</span>
            <span className="text-cyan-300/60 font-mono">//</span>
            <span className="text-cyan-300 font-semibold truncate">{catMeta.label}</span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              3D HOLO READY
            </span>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold uppercase">
              {news.impactLevel}
            </span>
          </div>
        </div>

        {/* 高清封面图 (纯净高清大图，全局取消十字准心) */}
        <div className={`relative w-full rounded-xl overflow-hidden mb-4 bg-slate-950 border border-cyan-500/30 ${
          isHero ? 'h-56 sm:h-64' : 'h-44'
        }`}>
          {news.coverUrl && !imgError ? (
            <img
              src={news.coverUrl}
              alt={news.title}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-cyan-400">
              <CatIcon className="w-10 h-10 mb-1 opacity-40" />
              <span className="text-[10px] font-mono tracking-widest text-cyan-500/70 uppercase">TACTICAL INTEL FEED</span>
            </div>
          )}
          <div className="absolute bottom-1.5 left-2 bg-slate-950/80 border border-cyan-400/50 px-2 py-0.5 rounded text-[8px] font-mono text-cyan-300 backdrop-blur-sm">
            RAW INTEL FEED // 100% HI-RES
          </div>
        </div>

        {/* 标题与副标题 */}
        <h3 className={`font-bold text-white leading-snug tracking-wide mb-1.5 font-['Chakra_Petch'] group-hover:text-cyan-200 transition-colors line-clamp-2 ${
          isHero ? 'text-lg sm:text-xl' : 'text-base'
        }`}>
          {news.title}
        </h3>
        {news.englishTitle && (
          <h4 className="text-[11px] font-mono text-cyan-300/80 mb-3 leading-tight tracking-tight line-clamp-1">
            {news.englishTitle}
          </h4>
        )}

        {/* 研报核心摘要预览 */}
        <div className={`${isHero ? 'flex-1 flex flex-col justify-center my-2' : 'mb-4'}`}>
          <p className={`text-xs text-slate-300 leading-relaxed font-sans m-0 ${
            isHero ? 'line-clamp-4 sm:line-clamp-6' : 'line-clamp-2'
          }`}>
            {news.summary}
          </p>
        </div>
      </div>

      {/* 一体化遥测与操作底栏 */}
      <div className="pt-3 border-t border-cyan-500/30 flex items-center justify-between font-mono text-[10px] gap-2 mt-auto">
        <div className="flex items-center gap-2 min-w-0">
          <div className="py-1 px-2 bg-cyan-950/60 border border-cyan-500/40 rounded flex items-center gap-1.5 shrink-0">
            <span className="text-slate-400 text-[8px]">置信度</span>
            <span className="text-cyan-300 font-bold font-mono text-xs">{scoreFormatted}</span>
          </div>
          <span className="text-slate-400 truncate text-[11px] font-mono">
            {news.source} · {formatPublishTime(news.publishTime)}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {onToggleBookmark && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark(news);
              }}
              className={`p-1.5 rounded-lg border transition-all flex items-center justify-center cursor-pointer ${
                isBookmarked
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-slate-950/60 text-slate-400 hover:text-cyan-300 border-cyan-500/30'
              }`}
              title={isBookmarked ? "取消收藏" : "收藏研报"}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current text-amber-400' : ''}`} />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-slate-950 font-bold text-xs px-3.5 py-1.5 rounded-lg transition-all shadow-[0_0_15px_rgba(0,240,255,0.6)] active:scale-95 flex items-center justify-center cursor-pointer flex-shrink-0 font-mono"
          >
            <span>查看详情</span>
          </button>
        </div>
      </div>
    </article>
  );
};

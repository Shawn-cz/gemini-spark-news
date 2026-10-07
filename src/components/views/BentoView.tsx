import React from 'react';
import { GlobalNewsItem } from '../../types/news';
import { GlobalNewsCard } from '../GlobalNewsCard';
import { Activity, Flame, ShieldAlert, Cpu, SearchX } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface BentoViewProps {
  items: GlobalNewsItem[];
  loading: boolean;
  onSelectNews: (news: GlobalNewsItem) => void;
  onResetFilter?: () => void;
  bookmarkedIdSet?: Set<string>;
  onToggleBookmark?: (news: GlobalNewsItem) => void;
}

export const BentoView: React.FC<BentoViewProps> = ({
  items,
  loading,
  onSelectNews,
  onResetFilter,
  bookmarkedIdSet,
  onToggleBookmark
}) => {
  const { theme } = useTheme();
  const isIosGlass = theme === 'ios-glass' || theme === 'light';

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className={`md:col-span-2 md:row-span-2 h-96 ${isIosGlass ? 'rounded-[10px] bg-white/70' : 'rounded-2xl glass-card'} animate-pulse`}></div>
        <div className={`h-64 ${isIosGlass ? 'rounded-[10px] bg-white/70' : 'rounded-2xl glass-card'} animate-pulse`}></div>
        <div className={`h-64 ${isIosGlass ? 'rounded-[10px] bg-white/70' : 'rounded-2xl glass-card'} animate-pulse`}></div>
        <div className={`h-64 ${isIosGlass ? 'rounded-[10px] bg-white/70' : 'rounded-2xl glass-card'} animate-pulse`}></div>
        <div className={`h-64 ${isIosGlass ? 'rounded-[10px] bg-white/70' : 'rounded-2xl glass-card'} animate-pulse`}></div>
        <div className={`h-64 ${isIosGlass ? 'rounded-[10px] bg-white/70' : 'rounded-2xl glass-card'} animate-pulse`}></div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={`p-12 text-center max-w-lg mx-auto my-12 border ${
        isIosGlass ? 'rounded-[10px] bg-white/80 border-slate-200 text-slate-800 shadow-sm' : 'rounded-2xl glass-card border-white/10'
      }`}>
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 text-slate-500">
          <SearchX className={`w-8 h-8 ${isIosGlass ? 'text-blue-600' : 'text-cyan-400'}`} />
        </div>
        <h3 className={`text-base font-bold mb-1 ${isIosGlass ? 'text-slate-900 font-sans' : 'text-white font-mono'}`}>未检索到全球匹配情报</h3>
        <p className={`text-xs mb-6 leading-relaxed ${isIosGlass ? 'text-slate-500 font-sans' : 'text-slate-400 font-mono'}`}>
          在当前领域或检索词下暂无入库数据，请调整分类或重置筛选。
        </p>
        {onResetFilter && (
          <button
            type="button"
            onClick={onResetFilter}
            className={`px-4 py-2 text-xs font-semibold rounded-full transition shadow-sm ${
              isIosGlass 
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20' 
                : 'text-cyan-300 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 font-mono'
            }`}
          >
            重置所有检索条件
          </button>
        )}
      </div>
    );
  }

  // 挑选第一条重大突发作为 Hero，其余作为子卡片
  const [heroNews, ...otherNews] = items;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* 1. Bento Hero 卡片 (2列宽，大画幅) */}
        {heroNews && (
          <GlobalNewsCard
            news={heroNews}
            onClick={() => onSelectNews(heroNews)}
            isHero={true}
            isBookmarked={bookmarkedIdSet?.has(heroNews.id)}
            onToggleBookmark={onToggleBookmark}
          />
        )}

        {/* 2. Bento 全球智库微状态雷达 Widget (10px 微圆角窗格) */}
        <div className={`bento-radar-widget p-5 flex flex-col justify-between transition-all duration-300 ${
          isIosGlass
            ? 'ios-glass-card rounded-[10px] bg-white/75 backdrop-blur-xl border border-white/85 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.06)] text-slate-800'
            : 'glass-card rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-obsidian-card via-obsidian-950 to-cyan-950/20'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className={`bento-radar-title text-xs font-bold flex items-center gap-1.5 uppercase ${
                isIosGlass ? 'text-blue-600 font-sans' : 'text-cyan-400 font-mono'
              }`}>
                <Activity className={`w-4 h-4 ${isIosGlass ? 'text-blue-600' : 'text-cyan-400'}`} />
                Global Sector Heat
              </span>
              <span className={`bento-radar-pulse w-2 h-2 rounded-full animate-ping ${
                isIosGlass ? 'bg-blue-600' : 'bg-cyan-400'
              }`}></span>
            </div>

            <div className="space-y-2 text-xs">
              <div className={`bento-radar-item flex justify-between items-center p-2 rounded-[8px] ${
                isIosGlass ? 'bg-slate-100/70 border border-slate-200/60 text-slate-800' : 'bg-white/[0.03] border border-white/5 text-slate-300 font-mono'
              }`}>
                <span className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-rose-500" />
                  航道与地缘溢价指数
                </span>
                <span className="text-rose-500 font-bold">+18.4%</span>
              </div>
              <div className={`bento-radar-item flex justify-between items-center p-2 rounded-[8px] ${
                isIosGlass ? 'bg-slate-100/70 border border-slate-200/60 text-slate-800' : 'bg-white/[0.03] border border-white/5 text-slate-300 font-mono'
              }`}>
                <span className="flex items-center gap-1.5">
                  <Cpu className={`w-3.5 h-3.5 ${isIosGlass ? 'text-blue-600' : 'text-cyan-400'}`} />
                  AI 算力与 SMR 核电配售
                </span>
                <span className={`font-bold ${isIosGlass ? 'text-blue-600' : 'text-cyan-400'}`}>CRITICAL</span>
              </div>
              <div className={`bento-radar-item flex justify-between items-center p-2 rounded-[8px] ${
                isIosGlass ? 'bg-slate-100/70 border border-slate-200/60 text-slate-800' : 'bg-white/[0.03] border border-white/5 text-slate-300 font-mono'
              }`}>
                <span className="flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                  跨半导体出口管制协调
                </span>
                <span className="text-amber-500 font-bold">MONITORING</span>
              </div>
            </div>
          </div>

          <div className={`bento-radar-footer mt-4 pt-3 border-t text-[10px] font-mono flex justify-between ${
            isIosGlass ? 'border-slate-200/60 text-slate-400' : 'border-white/5 text-slate-500'
          }`}>
            <span>PIPELINE: GEMINI AGENT #01</span>
            <span>REASONING: ACTIVE</span>
          </div>
        </div>

        {/* 3. 其余情报卡片 */}
        {otherNews.map((news) => (
          <GlobalNewsCard
            key={news.id}
            news={news}
            onClick={() => onSelectNews(news)}
            isBookmarked={bookmarkedIdSet?.has(news.id)}
            onToggleBookmark={onToggleBookmark}
          />
        ))}

      </div>
    </div>
  );
};

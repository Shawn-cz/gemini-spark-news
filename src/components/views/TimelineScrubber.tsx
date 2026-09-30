import React, { useState, useMemo } from 'react';
import { GlobalNewsItem, CategoryType, SentimentType } from '../../types/news';
import { GlobalNewsCard } from '../GlobalNewsCard';
import { Clock, Globe, Filter, RotateCcw, CheckCircle2 } from 'lucide-react';

interface TimelineScrubberProps {
  items: GlobalNewsItem[];
  loading: boolean;
  onSelectNews: (news: GlobalNewsItem) => void;
  bookmarkedIdSet?: Set<string>;
  onToggleBookmark?: (news: GlobalNewsItem) => void;
  activeCategory?: CategoryType;
  activeSentiment?: SentimentType | 'all';
  searchValue?: string;
  totalBatchCount?: number;
  onResetFilters?: () => void;
  onResetCategory?: () => void;
}

const CATEGORY_NAMES: Record<string, string> = {
  ai: '全球 AI 算力',
  finance: '宏观金融',
  geopolitics: '地缘经贸',
  climate: '气候能源',
  bookmarks: '我的收藏'
};

const SENTIMENT_NAMES: Record<string, string> = {
  positive: '正面发展',
  neutral: '中性观察',
  negative: '风险预警'
};

export const TimelineScrubber: React.FC<TimelineScrubberProps> = ({
  items,
  loading,
  onSelectNews,
  bookmarkedIdSet,
  onToggleBookmark,
  activeCategory,
  activeSentiment,
  searchValue,
  totalBatchCount,
  onResetFilters,
  onResetCategory
}) => {
  // 当前时间窗口筛选 (0-24小时，或者 'all')
  const [session, setSession] = useState<'all' | 'asia' | 'europe' | 'us'>('all');
  const [scrubHour, setScrubHour] = useState<number>(24); // 24 表示全天

  // 计算当前全局生效的多维筛选条件
  const activeFilters = useMemo(() => {
    const list: string[] = [];
    if (activeCategory && activeCategory !== 'all') {
      list.push(CATEGORY_NAMES[activeCategory] || activeCategory);
    }
    if (activeSentiment && activeSentiment !== 'all') {
      list.push(SENTIMENT_NAMES[activeSentiment] || activeSentiment);
    }
    if (searchValue && searchValue.trim()) {
      list.push(`检索: "${searchValue.trim()}"`);
    }
    return list;
  }, [activeCategory, activeSentiment, searchValue]);

  const isFiltered = activeFilters.length > 0;
  const handleReset = onResetFilters || onResetCategory;

  // 根据发布时间过滤
  const filteredTimelineItems = useMemo(() => {
    let list = [...items].sort(
      (a, b) => new Date(a.publishTime).getTime() - new Date(b.publishTime).getTime()
    );

    if (session === 'asia') {
      list = list.filter((i) => {
        const h = new Date(i.publishTime).getUTCHours();
        return h >= 0 && h < 8;
      });
    } else if (session === 'europe') {
      list = list.filter((i) => {
        const h = new Date(i.publishTime).getUTCHours();
        return h >= 8 && h < 16;
      });
    } else if (session === 'us') {
      list = list.filter((i) => {
        const h = new Date(i.publishTime).getUTCHours();
        return h >= 14 && h < 22;
      });
    } else if (scrubHour < 24) {
      list = list.filter((i) => {
        const h = new Date(i.publishTime).getUTCHours();
        return h <= scrubHour;
      });
    }

    return list;
  }, [items, session, scrubHour]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-16 glass-card rounded-2xl animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 glass-card rounded-2xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* 24小时时空滑块与时区快捷切换栏 */}
      <div className="timeline-scrubber-card glass-card p-5 rounded-2xl border border-cyan-500/20 shadow-glow-blue space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock className="timeline-clock-icon w-5 h-5 text-cyan-400 animate-pulse" />
            <div>
              <h4 className="timeline-title text-xs font-mono font-bold text-white uppercase tracking-wider">
                24H Spatio-Temporal Timeline Scrubber
              </h4>
              <p className="timeline-subtitle text-[11px] text-slate-400 font-mono">
                拖动时间轴回放全天各主要金融中心与前沿实验室情报涌现时序
              </p>
            </div>
          </div>

          {/* 全球时段预设胶囊 */}
          <div className="timeline-presets-container inline-flex bg-obsidian-950 p-1 rounded-xl border border-white/5 gap-1 text-xs font-mono">
            <button
              type="button"
              onClick={() => { setSession('all'); setScrubHour(24); }}
              className={`timeline-preset-btn px-3 py-1 rounded-lg transition ${
                session === 'all' && scrubHour === 24
                  ? 'timeline-preset-btn-active bg-cyan-500 text-obsidian-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              全天 24H 连续流
            </button>
            <button
              type="button"
              onClick={() => { setSession('asia'); }}
              className={`timeline-preset-btn px-3 py-1 rounded-lg transition ${
                session === 'asia' ? 'timeline-preset-btn-active bg-cyan-500 text-obsidian-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              亚太时段 (00:00-08:00 UTC)
            </button>
            <button
              type="button"
              onClick={() => { setSession('europe'); }}
              className={`timeline-preset-btn px-3 py-1 rounded-lg transition ${
                session === 'europe' ? 'timeline-preset-btn-active bg-cyan-500 text-obsidian-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              欧洲时段 (08:00-16:00 UTC)
            </button>
            <button
              type="button"
              onClick={() => { setSession('us'); }}
              className={`timeline-preset-btn px-3 py-1 rounded-lg transition ${
                session === 'us' ? 'timeline-preset-btn-active bg-cyan-500 text-obsidian-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              美洲时段 (14:00-22:00 UTC)
            </button>
          </div>
        </div>

        {/* 时空轴全景感知状态条 (过滤中/未过滤均有清晰状态呈现) */}
        <div className={`timeline-filter-banner flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl border ${
          isFiltered 
            ? 'timeline-filter-banner-active bg-cyan-950/40 border-cyan-500/30 text-cyan-300' 
            : 'timeline-filter-banner-idle bg-white/[0.03] border-white/10 text-slate-300'
        }`}>
          <div className="flex items-center gap-2 min-w-0">
            {isFiltered ? (
              <Filter className="timeline-filter-icon w-3.5 h-3.5 flex-shrink-0 text-cyan-400" />
            ) : (
              <CheckCircle2 className="timeline-filter-idle-icon w-3.5 h-3.5 flex-shrink-0 text-emerald-400" />
            )}
            <div className="text-xs font-mono min-w-0 leading-relaxed">
              {isFiltered ? (
                <>
                  <span className="opacity-90">当前时空轴处于过滤中：</span>
                  <span className="timeline-filter-target font-bold ml-1 text-white">
                    {activeFilters.join(' · ')}
                  </span>
                  <span className="timeline-filter-count ml-1 text-slate-400 whitespace-nowrap">
                    （{items.length} / {totalBatchCount ?? 12} 篇）
                  </span>
                </>
              ) : (
                <>
                  <span className="opacity-90">全天全领域连续流就绪：</span>
                  <span className="timeline-filter-target font-bold ml-1 text-white">已收录完整 {items.length} 篇战略研报</span>
                  <span className="text-[11px] text-slate-400 ml-2 hidden sm:inline">（全部 12 篇满配呈现，可拖动时间轴或点击时区切片）</span>
                </>
              )}
            </div>
          </div>
          {isFiltered && handleReset && (
            <button
              type="button"
              onClick={handleReset}
              className="timeline-filter-reset-btn inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex-shrink-0 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-200 border border-cyan-400/30 active:scale-95 transition"
            >
              <span>点击展示全部研报 ({totalBatchCount ?? 12} 篇)</span>
              <RotateCcw className="w-3 h-3 flex-shrink-0" />
            </button>
          )}
        </div>

        {/* 交互时间滑块 */}
        <div className="space-y-1 pt-2">
          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>00:00 UTC (Tokyo)</span>
            <span className="timeline-cutoff-text text-cyan-400 font-bold">
              {scrubHour === 24 ? '显示全天 (24:00)' : `截止至 ${String(scrubHour).padStart(2, '0')}:00 UTC 汇入事件`}
            </span>
            <span>24:00 UTC (New York)</span>
          </div>
          <input
            type="range"
            min="1"
            max="24"
            value={scrubHour}
            onChange={(e) => {
              setSession('all');
              setScrubHour(Number(e.target.value));
            }}
            className="timeline-slider w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>
      </div>

      {/* 时空卡片列表 */}
      {filteredTimelineItems.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-slate-400 font-mono space-y-4">
          <p>所选时段暂无符合条件的事件涌现，请滑动时间标尺或选择全天流。</p>
          {handleReset && (
            <div>
              <button
                type="button"
                onClick={handleReset}
                className="timeline-filter-reset-btn inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono font-bold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-200 border border-cyan-400/30 transition active:scale-95 shadow-md"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>重置为全部领域 ({totalBatchCount ?? 12} 篇)</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="timeline-axis relative pl-6 sm:pl-8 border-l border-cyan-500/20 space-y-8 my-6">
          {filteredTimelineItems.map((news) => {
            const timeStr = new Date(news.publishTime).toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'UTC'
            }) + ' UTC';

            return (
              <div key={news.id} className="relative group">
                {/* 时间轴发光小锚点 */}
                <div className="timeline-node-dot absolute -left-[31px] sm:-left-[39px] top-6 w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-obsidian-950 shadow-glow-blue group-hover:scale-125 transition-transform"></div>
                
                {/* 时间标签 */}
                <div className="timeline-tag flex items-center gap-2 mb-2 font-mono text-xs text-cyan-400">
                  <Globe className="w-3.5 h-3.5" />
                  <span className="font-bold">{timeStr}</span>
                  <span className="text-slate-500">|</span>
                  <span className="text-slate-400">{news.region}</span>
                </div>

                <div className="max-w-2xl">
                  <GlobalNewsCard
                    news={news}
                    onClick={() => onSelectNews(news)}
                    isBookmarked={bookmarkedIdSet?.has(news.id)}
                    onToggleBookmark={onToggleBookmark}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

import React from 'react';
import { 
  Bot, 
  TrendingUp, 
  Globe2, 
  Zap, 
  LayoutGrid, 
  Columns3, 
  Clock3, 
  Search, 
  Calendar,
  Layers
} from 'lucide-react';
import { CategoryType, ViewMode, SentimentType, GlobalNewsStats } from '../types/news';

interface GlobalCategoryBarProps {
  selectedCategory: CategoryType;
  onSelectCategory: (cat: CategoryType) => void;
  viewMode: ViewMode;
  onSelectViewMode: (mode: ViewMode) => void;
  selectedSentiment: SentimentType | 'all';
  onSelectSentiment: (sentiment: SentimentType | 'all') => void;
  selectedDate: string;
  availableDates: string[];
  onSelectDate: (date: string) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  stats: GlobalNewsStats | null;
}

export const GlobalCategoryBar: React.FC<GlobalCategoryBarProps> = ({
  selectedCategory,
  onSelectCategory,
  viewMode,
  onSelectViewMode,
  selectedSentiment,
  onSelectSentiment,
  selectedDate,
  availableDates,
  onSelectDate,
  searchValue,
  onSearchChange,
  stats
}) => {
  const categories = [
    { key: 'all' as const, label: '全部领域', icon: Layers, count: stats?.total ?? 0 },
    { key: 'ai' as const, label: '全球 AI & 算力', icon: Bot, count: stats?.categoryCounts.ai ?? 0 },
    { key: 'finance' as const, label: '宏观金融 & 资本', icon: TrendingUp, count: stats?.categoryCounts.finance ?? 0 },
    { key: 'geopolitics' as const, label: '地缘政治 & 经贸', icon: Globe2, count: stats?.categoryCounts.geopolitics ?? 0 },
    { key: 'climate' as const, label: '气候变化 & 能源', icon: Zap, count: stats?.categoryCounts.climate ?? 0 },
  ];

  const viewModes = [
    { key: 'bento' as const, label: 'Bento 智库看板', icon: LayoutGrid },
    { key: 'matrix' as const, label: '四象限流', icon: Columns3 },
    { key: 'timeline' as const, label: '24H 时空轨迹', icon: Clock3 },
  ];

  const sentiments = [
    { key: 'all' as const, label: '全部情绪', count: stats?.total ?? 0, color: 'text-slate-300' },
    { key: 'positive' as const, label: '正面发展', count: stats?.positive ?? 0, color: 'text-emerald-400' },
    { key: 'neutral' as const, label: '中性观察', count: stats?.neutral ?? 0, color: 'text-slate-400' },
    { key: 'negative' as const, label: '风险预警', count: stats?.negative ?? 0, color: 'text-rose-400' },
  ];

  return (
    <div className="space-y-3 mb-6">
      
      {/* 第一行：领域胶囊切换与右侧视图模式切换 (Bento/Matrix/Timeline) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        
        {/* 4大领域胶囊 */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            const Icon = cat.icon;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => onSelectCategory(cat.key)}
                className={`category-pill-btn inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  isSelected
                    ? 'category-pill-selected bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-glow-blue font-semibold'
                    : 'category-pill-unselected bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08] border border-white/5'
                }`}
              >
                <Icon className={`category-pill-icon w-3.5 h-3.5 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{cat.label}</span>
                <span className={`category-pill-count px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                  isSelected ? 'bg-cyan-400/20 text-cyan-200' : 'bg-white/5 text-slate-500'
                }`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 3 种新奇视图模式切换 */}
        <div className="viewmode-container inline-flex bg-obsidian-card p-1 rounded-xl border border-white/10 self-start lg:self-auto shadow-inner">
          {viewModes.map((vm) => {
            const isSelected = viewMode === vm.key;
            const Icon = vm.icon;
            return (
              <button
                key={vm.key}
                type="button"
                onClick={() => onSelectViewMode(vm.key)}
                className={`viewmode-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? 'viewmode-btn-active bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{vm.label}</span>
              </button>
            );
          })}
        </div>

      </div>

      {/* 第二行：批次历史日期、情绪快速滤镜与检索框 */}
      <div className="glass-card p-3 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        <div className="flex items-center gap-3 flex-wrap">
          {/* 历史日期切换 */}
          <div className="filter-date-label flex items-center gap-1.5 text-xs font-mono text-slate-400">
            <Calendar className="filter-date-icon w-3.5 h-3.5 text-cyan-400" />
            <span>批次日期:</span>
          </div>

          <div className="filter-date-container inline-flex bg-obsidian-950 p-0.5 rounded-lg border border-white/5">
            {availableDates.map((date, idx) => {
              const isSelected = selectedDate === date;
              const isToday = idx === 0;
              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => onSelectDate(date)}
                  className={`filter-date-btn px-2.5 py-1 rounded-md text-xs font-mono transition-all ${
                    isSelected
                      ? 'filter-date-btn-active bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{isToday ? `今日 (${date})` : date}</span>
                  {isToday && (
                    <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 情绪滤镜 */}
          <div className="filter-sentiment-container hidden sm:flex items-center gap-1 pl-2 border-l border-white/10">
            {sentiments.map((s) => {
              const isSelected = selectedSentiment === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => onSelectSentiment(s.key)}
                  className={`filter-sentiment-btn px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                    isSelected
                      ? 'filter-sentiment-btn-active bg-white/10 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <span className={`filter-sentiment-label filter-sentiment-${s.key} ${s.color}`}>{s.label}</span>
                  <span className="ml-1 font-mono text-[10px] text-slate-500 filter-sentiment-count">({s.count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 全球多语种检索框 */}
        <div className="relative w-full md:w-64">
          <Search className="category-search-icon w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="检索全球实体、机构或标签..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="category-search-input w-full pl-8 pr-3 py-1.5 text-xs bg-obsidian-950/80 border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 text-slate-200 placeholder-slate-500 transition font-mono"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="category-search-clear absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
            >
              ×
            </button>
          )}
        </div>

      </div>

    </div>
  );
};

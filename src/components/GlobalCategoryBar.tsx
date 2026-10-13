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
  Layers, 
  Bookmark 
} from 'lucide-react';
import { CategoryType, ViewMode, SentimentType, GlobalNewsStats } from '../types/news';
import { useTheme } from '../context/ThemeContext';

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
  bookmarkCount?: number;
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
  stats,
  bookmarkCount = 0
}) => {
  const { theme } = useTheme();
  const isIosGlass = theme === 'ios-glass' || theme === 'light';

  const isPopDopamine = theme === 'pop-dopamine' || theme === 'dopamine';
  const isCyberHud = theme === 'cyber-hud' || theme === 'dark' || (!isIosGlass && !isPopDopamine);

  const categories = [
    { key: 'all' as const, label: isCyberHud ? '[01] 全部领域' : '全部领域', icon: Layers, count: stats?.total ?? 0 },
    { key: 'ai' as const, label: isCyberHud ? '[02] 全球 AI 算力' : '全球 AI 算力', icon: Bot, count: stats?.categoryCounts.ai ?? 0 },
    { key: 'finance' as const, label: isCyberHud ? '[03] 宏观金融' : '宏观金融', icon: TrendingUp, count: stats?.categoryCounts.finance ?? 0 },
    { key: 'geopolitics' as const, label: isCyberHud ? '[04] 地缘经贸' : '地缘经贸', icon: Globe2, count: stats?.categoryCounts.geopolitics ?? 0 },
    { key: 'climate' as const, label: isCyberHud ? '[05] 气候能源' : '气候能源', icon: Zap, count: stats?.categoryCounts.climate ?? 0 },
    { key: 'bookmarks' as const, label: isCyberHud ? '[06] 我的收藏' : '我的收藏', icon: Bookmark, count: bookmarkCount, isBookmark: true },
  ];

  const viewModes = [
    { key: 'bento' as const, label: 'Bento 看板', icon: LayoutGrid },
    { key: 'matrix' as const, label: '四象限流', icon: Columns3 },
    { key: 'timeline' as const, label: '24H 时空轴', icon: Clock3 },
  ];

  const sentiments = [
    { key: 'all' as const, label: '全部情绪', count: stats?.total ?? 0, color: 'text-slate-300' },
    { key: 'positive' as const, label: '正面发展', count: stats?.positive ?? 0, color: 'text-emerald-400' },
    { key: 'neutral' as const, label: '中性观察', count: stats?.neutral ?? 0, color: 'text-slate-400' },
    { key: 'negative' as const, label: '风险预警', count: stats?.negative ?? 0, color: 'text-rose-400' },
  ];

  return (
    <div className="space-y-3 mb-6">
      
      {/* 第一行：全量领域与收藏胶囊栏 (6 颗胶囊独享整行，彻底杜绝任何右侧视图按钮挤压与遮挡) */}
      <div className="category-scroll-container w-full flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none min-w-0">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.key;
          const Icon = cat.icon;
          const isBm = (cat as any).isBookmark;

          const selectedStyle = isIosGlass
            ? isBm
              ? 'category-pill-selected category-pill-bookmarks bg-amber-500 text-white border border-amber-500 shadow-md font-semibold'
              : 'category-pill-selected bg-blue-600 text-white border border-blue-600 shadow-md font-semibold'
            : isPopDopamine
            ? isBm
              ? 'pop-btn bg-yellow-400 text-slate-900 border-[2px] border-slate-900 shadow-[2px_2px_0px_0px_#111827] font-bold font-[\'Fredoka\']'
              : 'pop-btn bg-pink-500 text-white border-[2px] border-slate-900 shadow-[2px_2px_0px_0px_#111827] font-bold font-[\'Fredoka\']'
            : isBm
            ? 'category-pill-selected category-pill-bookmarks bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-glow-amber font-semibold font-mono'
            : 'category-pill-selected bg-cyan-500 text-slate-950 font-bold border border-cyan-400 shadow-[0_0_10px_#00f0ff] font-mono';

          const unselectedStyle = isIosGlass
            ? isBm
              ? 'category-pill-unselected bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 hover:text-amber-950 shadow-sm font-semibold'
              : 'category-pill-unselected bg-white text-slate-900 border border-slate-300 hover:bg-white hover:text-slate-950 shadow-sm font-semibold'
            : isPopDopamine
            ? 'pop-btn bg-slate-100 text-slate-800 border-[2px] border-slate-900 shadow-[2px_2px_0px_0px_#111827] font-[\'Fredoka\']'
            : isBm
            ? 'category-pill-unselected bg-amber-950/20 text-amber-400/80 hover:text-amber-300 hover:bg-amber-950/40 border border-amber-700/30 font-mono'
            : 'category-pill-unselected bg-slate-950 text-cyan-400 border border-cyan-500/30 hover:border-cyan-400 font-mono';

          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => onSelectCategory(cat.key)}
              className={`category-pill-btn inline-flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 ${
                isPopDopamine ? 'rounded-xl' : 'rounded-lg'
              } text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all ${
                isSelected ? selectedStyle : unselectedStyle
              }`}
            >
              <Icon className={`category-pill-icon w-3.5 h-3.5 flex-shrink-0 ${
                isSelected 
                  ? isIosGlass ? 'text-white' : isPopDopamine ? 'text-slate-900' : 'text-slate-950'
                  : isIosGlass ? (isBm ? 'text-amber-700' : 'text-slate-700') : isPopDopamine ? 'text-slate-700' : 'text-cyan-400'
              }`} />
              <span className={isSelected ? 'text-white font-bold' : (isIosGlass ? 'text-slate-900 font-semibold' : '')}>{cat.label}</span>
              <span className={`category-pill-count px-1.5 py-0.2 rounded-md text-[10px] font-mono flex-shrink-0 ${
                isSelected 
                  ? isIosGlass ? 'bg-white/25 text-white font-bold' : isPopDopamine ? 'bg-white/40 text-slate-900 font-bold' : 'bg-slate-950/30 text-slate-950 font-bold'
                : isIosGlass ? (isBm ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300' : 'bg-slate-100 text-slate-800 font-bold border border-slate-300') : isPopDopamine ? 'bg-slate-200 text-slate-700' : 'bg-cyan-500/10 text-cyan-300'
              }`}>
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 第二行：情绪快速滤镜、3 种视图模式切换 (Bento/Matrix/Timeline) 与全站检索框 */}
      <div className={`p-2 sm:p-2.5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
        isIosGlass
          ? 'bg-white/80 border border-slate-200/80 shadow-sm'
          : isPopDopamine
          ? 'bg-white border-[3px] border-slate-900 shadow-[4px_4px_0px_0px_#111827] rounded-2xl'
          : 'bg-slate-900/80 border border-cyan-500/40 rounded-xl'
      }`}>
        
        {/* 情绪滤镜 (全端可用，水平平滑滚动) */}
        <div className="filter-sentiment-container flex items-center gap-1.5 overflow-x-auto scrollbar-none min-w-0 py-0.5">
          {sentiments.map((s) => {
            const isSelected = selectedSentiment === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => onSelectSentiment(s.key)}
                className={`filter-sentiment-btn px-2.5 py-1 ${isPopDopamine ? 'rounded-xl' : 'rounded-lg'} text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all ${
                  isSelected
                    ? isIosGlass
                      ? 'filter-sentiment-btn-active bg-blue-50 text-blue-700 font-bold border border-blue-200 shadow-sm'
                      : isPopDopamine
                      ? 'pop-btn bg-yellow-400 text-slate-900 font-bold border-2 border-slate-900 shadow-[2px_2px_0px_0px_#111827] font-[\'Fredoka\']'
                      : 'filter-sentiment-btn-active bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/50 shadow-[0_0_10px_rgba(0,240,255,0.2)] font-mono'
                    : isIosGlass
                    ? 'filter-sentiment-btn-inactive text-slate-600 hover:text-slate-900'
                    : isPopDopamine
                    ? 'pop-btn bg-slate-100 text-slate-700 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#111827] font-[\'Fredoka\']'
                    : 'filter-sentiment-btn-inactive text-slate-400 hover:text-cyan-300 border border-transparent font-mono'
                }`}
              >
                <span className={`filter-sentiment-label filter-sentiment-${s.key}`}>{s.label}</span>
                <span className={`ml-1 font-mono text-[10px] filter-sentiment-count ${isIosGlass && !isSelected ? 'text-slate-500' : ''}`}>({s.count})</span>
              </button>
            );
          })}
        </div>

        {/* 右侧工具组：3 种视图模式切换 (Bento/Matrix/Timeline) + 检索框 */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap flex-shrink-0">
          {/* 3 种视图模式切换 */}
          <div className={`viewmode-container inline-flex p-1 rounded-xl flex-shrink-0 transition-colors ${
            isIosGlass ? 'bg-white/80 border border-slate-200/80 shadow-sm' : isPopDopamine ? 'bg-white border-[2.5px] border-slate-900 shadow-[3px_3px_0px_0px_#111827]' : 'bg-obsidian-card border border-white/10 shadow-inner'
          }`}>
            {viewModes.map((vm) => {
              const isSelected = viewMode === vm.key;
              const Icon = vm.icon;
              return (
                <button
                  key={vm.key}
                  type="button"
                  onClick={() => onSelectViewMode(vm.key)}
                  className={`viewmode-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    isSelected
                      ? isIosGlass
                        ? 'viewmode-btn-active bg-blue-600 text-white shadow-md font-semibold'
                        : isPopDopamine
                        ? 'viewmode-btn-active bg-pink-500 text-white shadow-md font-bold'
                        : 'viewmode-btn-active bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md font-semibold'
                      : isIosGlass
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="whitespace-nowrap">{vm.label}</span>
                </button>
              );
            })}
          </div>

          {/* 全球多语种检索框 */}
          <div className="relative w-full sm:w-56 flex-shrink-0">
            <Search className={`category-search-icon w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${
              isIosGlass ? 'text-slate-500' : isPopDopamine ? 'text-slate-700' : 'text-cyan-400'
            }`} />
            <input
              type="text"
              placeholder={isCyberHud ? "[QUERY: SEARCH]..." : "检索实体或标签..."}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className={`category-search-input w-full pl-8 pr-3 py-1.5 text-xs rounded-lg focus:outline-none transition font-mono ${
                isIosGlass
                  ? 'bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-1 focus:ring-blue-500/40 focus:border-blue-500 shadow-inner'
                  : isPopDopamine
                  ? 'bg-white border-2 border-slate-900 shadow-[2px_2px_0px_0px_#111827] text-slate-900 placeholder-slate-400 font-[\'Plus_Jakarta_Sans\'] rounded-xl'
                  : 'bg-slate-950/80 border border-cyan-500/40 text-cyan-200 placeholder-cyan-500/40 focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-400 font-mono'
              }`}
            />
            {searchValue && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className={`category-search-clear absolute right-2.5 top-1/2 -translate-y-1/2 text-xs transition ${
                  isIosGlass ? 'text-slate-400 hover:text-slate-700' : isPopDopamine ? 'text-slate-500 hover:text-black font-bold' : 'text-cyan-400 hover:text-cyan-200 font-mono'
                }`}
              >
                ×
              </button>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

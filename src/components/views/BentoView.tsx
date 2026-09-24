import React from 'react';
import { GlobalNewsItem } from '../../types/news';
import { GlobalNewsCard } from '../GlobalNewsCard';
import { Activity, Flame, ShieldAlert, Cpu, SearchX } from 'lucide-react';

interface BentoViewProps {
  items: GlobalNewsItem[];
  loading: boolean;
  onSelectNews: (news: GlobalNewsItem) => void;
  onResetFilter?: () => void;
}

export const BentoView: React.FC<BentoViewProps> = ({
  items,
  loading,
  onSelectNews,
  onResetFilter
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-2 md:row-span-2 h-96 glass-card rounded-2xl animate-pulse"></div>
        <div className="h-64 glass-card rounded-2xl animate-pulse"></div>
        <div className="h-64 glass-card rounded-2xl animate-pulse"></div>
        <div className="h-64 glass-card rounded-2xl animate-pulse"></div>
        <div className="h-64 glass-card rounded-2xl animate-pulse"></div>
        <div className="h-64 glass-card rounded-2xl animate-pulse"></div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center max-w-lg mx-auto my-12 border border-white/10">
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 text-slate-500">
          <SearchX className="w-8 h-8 text-cyan-400" />
        </div>
        <h3 className="text-base font-bold text-white mb-1 font-mono">未检索到全球匹配情报</h3>
        <p className="text-xs text-slate-400 mb-6 font-mono">
          在当前领域或检索词下暂无入库数据，请调整分类或重置筛选。
        </p>
        {onResetFilter && (
          <button
            type="button"
            onClick={onResetFilter}
            className="px-4 py-2 text-xs font-mono font-semibold text-cyan-300 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 rounded-xl transition"
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
          />
        )}

        {/* 2. Bento 全球智库微状态雷达 Widget */}
        <div className="glass-card p-5 rounded-2xl flex flex-col justify-between border border-cyan-500/20 bg-gradient-to-br from-obsidian-card via-obsidian-950 to-cyan-950/20">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5 uppercase">
                <Activity className="w-4 h-4 text-cyan-400" />
                Global Sector Heat
              </span>
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            </div>
            <p className="text-xs text-slate-400 font-mono mb-4 leading-relaxed">
              Gemini Spark 智能体全天候检索并提炼覆盖全球 24 时区算力集群、央行利率决策、关键航道与能源转型动态。
            </p>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center p-2 rounded-lg bg-white/[0.03] border border-white/5">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  航道与地缘溢价指数
                </span>
                <span className="text-rose-400 font-bold">+18.4%</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-white/[0.03] border border-white/5">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  AI 算力与 SMR 核电配售
                </span>
                <span className="text-cyan-400 font-bold">CRITICAL</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-white/[0.03] border border-white/5">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  跨半导体出口管制协调
                </span>
                <span className="text-amber-400 font-bold">MONITORING</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 text-[10px] font-mono text-slate-500 flex justify-between">
            <span>PIPELINE: SPARK CLUSTER #04</span>
            <span>ACCELERATED: ACTIVE</span>
          </div>
        </div>

        {/* 3. 其余情报卡片 */}
        {otherNews.map((news) => (
          <GlobalNewsCard
            key={news.id}
            news={news}
            onClick={() => onSelectNews(news)}
          />
        ))}

      </div>
    </div>
  );
};

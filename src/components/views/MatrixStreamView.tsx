import React from 'react';
import { GlobalNewsItem } from '../../types/news';
import { GlobalNewsCard } from '../GlobalNewsCard';
import { Bot, TrendingUp, Globe2, Zap } from 'lucide-react';

interface MatrixStreamViewProps {
  items: GlobalNewsItem[];
  loading: boolean;
  onSelectNews: (news: GlobalNewsItem) => void;
}

export const MatrixStreamView: React.FC<MatrixStreamViewProps> = ({
  items,
  loading,
  onSelectNews
}) => {
  const lanes = [
    {
      category: 'ai' as const,
      title: '全球 AI & 前沿算力',
      icon: Bot,
      color: 'text-cyan-400',
      badge: 'border-cyan-500/30 bg-cyan-950/40 text-cyan-300'
    },
    {
      category: 'finance' as const,
      title: '宏观金融 & 资本市场',
      icon: TrendingUp,
      color: 'text-emerald-400',
      badge: 'border-emerald-500/30 bg-emerald-950/40 text-emerald-300'
    },
    {
      category: 'geopolitics' as const,
      title: '地缘政治 & 经贸走廊',
      icon: Globe2,
      color: 'text-amber-400',
      badge: 'border-amber-500/30 bg-amber-950/40 text-amber-300'
    },
    {
      category: 'climate' as const,
      title: '气候变化 & 能源转型',
      icon: Zap,
      color: 'text-indigo-400',
      badge: 'border-indigo-500/30 bg-indigo-950/40 text-indigo-300'
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-4">
            <div className="h-10 glass-card rounded-xl animate-pulse"></div>
            <div className="h-60 glass-card rounded-xl animate-pulse"></div>
            <div className="h-60 glass-card rounded-xl animate-pulse"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
      {lanes.map((lane) => {
        const laneItems = items.filter((it) => it.category === lane.category);
        const Icon = lane.icon;

        return (
          <div key={lane.category} className="space-y-3.5 flex flex-col">
            
            {/* 泳道标题栏 */}
            <div className={`p-3 rounded-xl border flex items-center justify-between glass-card ${lane.badge}`}>
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${lane.color}`} />
                <span className="text-xs font-bold font-mono tracking-tight text-white">
                  {lane.title}
                </span>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-white">
                {laneItems.length}
              </span>
            </div>

            {/* 该泳道下的情报卡片流 */}
            <div className="space-y-3.5">
              {laneItems.length === 0 ? (
                <div className="glass-card rounded-xl p-6 text-center text-xs text-slate-500 font-mono border border-white/5">
                  暂无匹配动态
                </div>
              ) : (
                laneItems.map((news) => (
                  <GlobalNewsCard
                    key={news.id}
                    news={news}
                    onClick={() => onSelectNews(news)}
                  />
                ))
              )}
            </div>

          </div>
        );
      })}
    </div>
  );
};

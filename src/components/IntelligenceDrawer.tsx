import React, { useEffect } from 'react';
import { 
  X, 
  Cpu, 
  Activity, 
  Tag, 
  ShieldCheck, 
  Share2, 
  Calendar, 
  Globe2,
  Bookmark
} from 'lucide-react';
import { GlobalNewsItem } from '../types/news';

interface IntelligenceDrawerProps {
  news: GlobalNewsItem | null;
  onClose: () => void;
}

export const IntelligenceDrawer: React.FC<IntelligenceDrawerProps> = ({ news, onClose }) => {
  // 监听 ESC 键关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!news) return null;

  const scoreFormatted = news.sentimentScore > 0 
    ? `+${Math.round(news.sentimentScore * 100)}%` 
    : `${Math.round(news.sentimentScore * 100)}%`;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* 模糊半透明遮罩 */}
      <div 
        className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-obsidian-950/95 border-l border-white/10 shadow-2xl flex flex-col justify-between overflow-y-auto">
          
          {/* 抽屉顶部标头 */}
          <div className="p-6 border-b border-white/10 sticky top-0 bg-obsidian-950/95 backdrop-blur-md z-10">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
                  SPARK NLP DOSSIER
                </span>
                <span className="text-xs font-mono text-slate-400 uppercase">
                  ID: {news.id}
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 抽屉正文内容 */}
          <div className="p-6 space-y-6 flex-1">
            
            {/* 标题与国际化副标题 */}
            <div>
              <h2 className="text-xl font-black text-white leading-snug tracking-tight mb-2">
                {news.title}
              </h2>
              {news.englishTitle && (
                <p className="text-xs font-mono text-cyan-400/90 italic leading-relaxed">
                  {news.englishTitle}
                </p>
              )}
            </div>

            {/* 媒体源与发布元数据条 */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-obsidian-card border border-white/5 text-xs font-mono">
              <div className="flex items-center gap-2 text-slate-300">
                <Globe2 className="w-4 h-4 text-cyan-400" />
                <span>来源: <strong className="text-white">{news.source}</strong> ({news.sourceCountry})</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>发布: {new Date(news.publishTime).toUTCString()}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Tag className="w-4 h-4 text-indigo-400" />
                <span>区域: <strong className="text-white">{news.region}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Activity className="w-4 h-4 text-amber-400" />
                <span>影响等级: <strong className="text-white uppercase">{news.impactLevel}</strong></span>
              </div>
            </div>

            {/* 核心资讯深度摘要 */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                Spark 精炼深度研报摘要
              </h4>
              <p className="text-sm text-slate-200 leading-relaxed bg-white/[0.02] p-4 rounded-xl border border-white/5 font-sans">
                {news.summary}
              </p>
            </div>

            {/* Spark NLP 情绪极性与实体挖掘卡片 */}
            <div className="glass-card p-5 rounded-2xl border border-cyan-500/20 shadow-glow-blue space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono font-bold text-white uppercase">NLP Quant & Entity Extraction</span>
                </div>
                <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800">
                  Confidence 96.8%
                </span>
              </div>

              {/* 情绪分量分析 */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">宏观极性指数 (Sentiment Polarity):</span>
                  <span className={news.sentimentScore > 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                    {scoreFormatted} ({news.sentiment.toUpperCase()})
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-white/5">
                  <div
                    className={`h-full rounded-full ${news.sentimentScore > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                    style={{ width: `${Math.min(100, Math.max(15, Math.abs(news.sentimentScore * 100)))}%` }}
                  ></div>
                </div>
              </div>

              {/* 核心实体词云 */}
              <div>
                <span className="text-[11px] font-mono text-slate-400 block mb-2">识别命名实体 (Named Entities):</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {(news.nlpKeyEntities || news.tags).map((entity, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg text-xs font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                    >
                      {entity}
                    </span>
                  ))}
                </div>
              </div>

              {/* Spark 任务溯源信息 */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>BATCH: {news.batchId || 'spark_global_24h'}</span>
                <span>PARTITION: #0824</span>
                <span>STATUS: AUDITED</span>
              </div>
            </div>

          </div>

          {/* 底部操作区 */}
          <div className="p-6 border-t border-white/10 bg-obsidian-950/95 sticky bottom-0 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>数据已通过多源交叉校验</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition border border-white/5"
                title="收藏资讯"
              >
                <Bookmark className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition border border-white/5"
                title="分享情报"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition font-mono shadow-md"
              >
                完成查阅
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

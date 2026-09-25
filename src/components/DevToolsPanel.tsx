import React, { useState, useEffect } from 'react';
import { 
  X, 
  Database, 
  Zap, 
  RotateCw, 
  AlertTriangle, 
  Clock, 
  Bug, 
  Layers, 
  Flame, 
  CheckCircle2, 
  Radio, 
  ShieldCheck 
} from 'lucide-react';
import { fetchHealthInfo, HealthInfo } from '../services/api';
import { BatchStatusType, GlobalNewsItem } from '../types/news';

interface DevToolsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onToggleStatus: (status?: BatchStatusType) => void;
  onTriggerSilentSync: () => void;
  onInjectNews: (mockItem: GlobalNewsItem) => void;
  onSimulateError: (message: string) => void;
  onSimulateEmpty: () => void;
  currentStatus: string | undefined;
  silentCountdown: number;
}

export const DevToolsPanel: React.FC<DevToolsPanelProps> = ({
  isOpen,
  onClose,
  onToggleStatus,
  onTriggerSilentSync,
  onInjectNews,
  onSimulateError,
  onSimulateEmpty,
  currentStatus,
  silentCountdown
}) => {
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  const checkHealth = async () => {
    setIsChecking(true);
    const start = performance.now();
    try {
      const data = await fetchHealthInfo();
      setLatency(Math.round(performance.now() - start));
      setHealth(data);
    } catch (e: any) {
      setLatency(null);
      setHealth({
        mode: 'LOCAL_FALLBACK',
        isMongoConnected: false,
        mongoConfigured: false,
        errorMessage: e.message
      });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkHealth();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 1. 注入极端长标题新闻 (检验两行截断 line-clamp-2 契约)
  const injectUltraLongTitleNews = () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const mockItem: GlobalNewsItem = {
      id: `dev-long-${Date.now()}`,
      title: "【调试测试-超长极端标题检验】多国人工智能安全峰会与国际电联联合发布前沿大模型主权主控系统性风险与不可逆推理跃迁合规问询审查备忘录要求所有部署在关键基础设施的通用自主系统执行物理隔离与跨数据中心熔断审计防范越权代码溢出破坏全球金融与电网结算安全",
      englishTitle: "UN & G7 AI Safety Forum Issues Mandatory Kill-Switch Mandates for Frontier Autonomous Models",
      source: "Reuters DevTools",
      sourceCountry: "US",
      category: "ai",
      region: "Global",
      impactLevel: "high",
      summary: "本条为开发者面板注入的极端长标题测试数据，用于验证前端排版契约：标题必须严格在第二行末尾处截断并呈现省略号（line-clamp-2 break-words），绝不可撑破黑曜石卡片外框或引起多列网格高度异常。",
      tags: ["长标题防御", "UI契约测试", "排版检验"],
      sentiment: "negative",
      sentimentScore: -0.65,
      nlpKeyEntities: ["AI Safety Forum", "Kill-Switch", "ITU", "Audit Mandate"],
      coverUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60",
      publishTime: new Date().toISOString(),
      batchDate: todayStr
    };
    onInjectNews(mockItem);
  };

  // 2. 注入突发重大 Critical 新闻 (检验 Bento Hero 重排置顶契约)
  const injectCriticalHeroNews = () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const mockItem: GlobalNewsItem = {
      id: `dev-hero-${Date.now()}`,
      title: "【突发重大-Hero重排检验】全球三大央行联合启动紧急流动性支持机制，跨大西洋离岸美元掉期利率出现历史级异动",
      englishTitle: "Global Central Banks Activate Coordinated Liquidity Lines as Cross-Currency Basis Widens",
      source: "Bloomberg DevTools",
      sourceCountry: "US",
      category: "finance",
      region: "North America",
      impactLevel: "critical",
      summary: "本条为开发者面板注入的重大突发（Critical Impact）情报，用于验证 Bento 智库视觉契约：拥有 critical 属性的情报必须自动抢占首位双列宽幅 Hero 大卡，并激活动态脉冲发光边框，原 Hero 卡片平滑降级至后续标准栅格。",
      tags: ["突发Hero", "流动性互换", "Bento视觉契约"],
      sentiment: "positive",
      sentimentScore: 0.92,
      nlpKeyEntities: ["Federal Reserve", "ECB", "BOJ", "Liquidity Swap"],
      coverUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=60",
      publishTime: new Date().toISOString(),
      batchDate: todayStr
    };
    onInjectNews(mockItem);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* 半透明遮罩 */}
      <div 
        className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-screen max-w-md bg-obsidian-950 border-l border-cyan-500/30 shadow-2xl flex flex-col justify-between overflow-y-auto z-10 font-mono text-xs text-slate-300">
        
        {/* 顶部标题 */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-obsidian-900/80 sticky top-0 backdrop-blur-md z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800">
              <Bug className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                全栈开发者调试套件
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700">
                  DEVTOOLS
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                双模数据源、状态机切换与视觉契约注入
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 调试功能区 */}
        <div className="p-5 space-y-5 flex-1 overflow-y-auto">
          
          {/* 1. 底层数据源状态探针 */}
          <div className="p-4 rounded-xl bg-obsidian-card border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-bold text-white flex items-center gap-1.5 uppercase text-[11px]">
                <Database className="w-4 h-4 text-cyan-400" />
                底层数据源模式 (Data Source)
              </span>
              <button
                type="button"
                onClick={checkHealth}
                disabled={isChecking}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <RotateCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
                <span>探针检测</span>
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">当前模式:</span>
                {health?.mode === 'MONGODB_ATLAS' ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    MONGODB ATLAS (云端模式)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    LOCAL FALLBACK (双模本地降级)
                  </span>
                )}
              </div>

              <div className="flex justify-between items-center text-slate-400">
                <span>API 探针往返时延:</span>
                <span className="text-cyan-300">{latency ? `${latency} ms` : '-'}</span>
              </div>

              <div className="flex justify-between items-center text-slate-400">
                <span>MONGO_URI 环境变量:</span>
                <span className={health?.mongoConfigured ? "text-emerald-400 font-bold" : "text-slate-500"}>
                  {health?.mongoConfigured ? '已配置' : '未配置 (走本地文件)'}
                </span>
              </div>
            </div>
          </div>

          {/* 2. 状态机一键调试器 */}
          <div className="p-4 rounded-xl bg-obsidian-card border border-white/10 space-y-2.5">
            <span className="font-bold text-white flex items-center gap-1.5 uppercase text-[11px] border-b border-white/10 pb-2 block">
              <Zap className="w-4 h-4 text-amber-400" />
              业务状态机快速切换 (State Switcher)
            </span>
            <p className="text-[11px] text-slate-400">
              当前状态: <strong className="text-cyan-300">{currentStatus || 'COMPLETED'}</strong>
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onToggleStatus('COMPLETED')}
                className="p-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-800 text-emerald-300 flex items-center justify-center gap-1.5 transition text-left"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>置为已完成</span>
              </button>
              <button
                type="button"
                onClick={() => onToggleStatus('RUNNING')}
                className="p-2 rounded-lg bg-amber-950/60 hover:bg-amber-900/80 border border-amber-800 text-amber-300 flex items-center justify-center gap-1.5 transition text-left"
              >
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>置为计算中(雷达)</span>
              </button>
              <button
                type="button"
                onClick={onSimulateEmpty}
                className="p-2 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-800 text-cyan-300 flex items-center justify-center gap-1.5 transition text-left"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>模拟空数据态</span>
              </button>
              <button
                type="button"
                onClick={() => onSimulateError('模拟 500: API Gateway Internal Server Error')}
                className="p-2 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800 text-rose-300 flex items-center justify-center gap-1.5 transition text-left"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>模拟接口 500 异常</span>
              </button>
            </div>
          </div>

          {/* 3. 30 秒静默轮询仪表盘 */}
          <div className="p-4 rounded-xl bg-obsidian-card border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-bold text-white flex items-center gap-1.5 uppercase text-[11px]">
                <Radio className="w-4 h-4 text-indigo-400" />
                30s 定时静默轮询引擎
              </span>
              <span className="text-[10px] text-cyan-400 animate-pulse">
                POLLING ACTIVE
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>距离下次自动静默拉取:</span>
              <span className="text-sm font-bold text-cyan-300">{silentCountdown} 秒</span>
            </div>
            <button
              type="button"
              onClick={onTriggerSilentSync}
              className="w-full py-2 rounded-lg bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-700 text-indigo-200 font-semibold flex items-center justify-center gap-2 transition active:scale-95"
            >
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
              <span>立即触发静默同步 (Abort 竞态检验)</span>
            </button>
          </div>

          {/* 4. 前端效果契约检验与极端数据注入 */}
          <div className="p-4 rounded-xl bg-obsidian-card border border-white/10 space-y-2.5">
            <span className="font-bold text-white flex items-center gap-1.5 uppercase text-[11px] border-b border-white/10 pb-2 block">
              <Flame className="w-4 h-4 text-rose-400" />
              前端效果契约检验 (Contract Injection)
            </span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              向当前大屏注入特定极端测试条目，肉眼审查防御性排版与动态网格契约：
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={injectUltraLongTitleNews}
                className="w-full py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-left flex items-center justify-between transition"
              >
                <span>🧪 注入 100 字超长标题新闻</span>
                <span className="text-[10px] text-cyan-400">两行截断契约</span>
              </button>
              <button
                type="button"
                onClick={injectCriticalHeroNews}
                className="w-full py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-left flex items-center justify-between transition"
              >
                <span>🔥 注入 Critical 重大突发事件</span>
                <span className="text-[10px] text-rose-400">Bento Hero 重排契约</span>
              </button>
            </div>
          </div>

        </div>

        {/* 底部信息 */}
        <div className="p-4 border-t border-white/10 bg-obsidian-900/60 text-[11px] text-slate-500 flex justify-between items-center">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>DEVTOOLS HARNESS v1.0</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-white/10 text-white hover:bg-white/20 transition"
          >
            收起面板
          </button>
        </div>

      </div>
    </div>
  );
};

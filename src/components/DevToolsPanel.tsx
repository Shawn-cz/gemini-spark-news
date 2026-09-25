import React, { useState, useEffect, useRef } from 'react';
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
  ShieldCheck,
  Sparkles,
  Cpu,
  Terminal,
  Play,
  Trash2
} from 'lucide-react';
import { 
  fetchHealthInfo, 
  HealthInfo, 
  fetchSparkModels, 
  selectSparkModel, 
  triggerSparkGenerate, 
  SparkModelOption 
} from '../services/api';
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

  // Gemini Spark 智能体状态
  const [models, setModels] = useState<SparkModelOption[]>([
    {
      id: 'gemini-3.8-flash',
      name: 'Gemini 3.8 Flash',
      description: '主力工作马 · 1M 上下文 · 亚秒级联网感知与多语种结构化提炼',
      tier: 'DEFAULT_WORKHORSE',
      isDefault: true
    },
    {
      id: 'gemini-3.1-pro',
      name: 'Gemini 3.1 Pro',
      description: '深度推理候选 · 复杂因果分析与学术级推演',
      tier: 'DEEP_REASONING',
      isDefault: false
    }
  ]);
  const [activeModel, setActiveModel] = useState<string>('gemini-3.8-flash');
  const [isSwitchingModel, setIsSwitchingModel] = useState<boolean>(false);
  const [isTriggering, setIsTriggering] = useState<boolean>(false);
  const [sparkLogs, setSparkLogs] = useState<Array<{ id: number; timestamp: string; text: string; type?: 'info' | 'progress' | 'success' | 'error' }>>([]);
  const logIdCounter = useRef<number>(1);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const addLog = (text: string, type: 'info' | 'progress' | 'success' | 'error' = 'info') => {
    const timeStr = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    const id = logIdCounter.current++;
    setSparkLogs(prev => [...prev.slice(-49), { id, timestamp: timeStr, text, type }]);
  };

  const loadSparkModels = async () => {
    try {
      const data = await fetchSparkModels();
      if (data?.available?.length) {
        setModels(data.available);
      }
      if (data?.current) {
        setActiveModel(data.current);
      }
    } catch (e: any) {
      console.warn('[DevTools] 获取模型失败:', e.message);
    }
  };

  const handleSelectModel = async (modelId: string) => {
    if (modelId === activeModel || isSwitchingModel || isTriggering) return;
    setIsSwitchingModel(true);
    try {
      await selectSparkModel(modelId);
      setActiveModel(modelId);
      addLog(`模型已成功热切换为 [${modelId}]`, 'info');
    } catch (err: any) {
      addLog(`模型切换失败: ${err.message}`, 'error');
    } finally {
      setIsSwitchingModel(false);
    }
  };

  const handleTriggerGenerate = async () => {
    if (isTriggering) return;
    setIsTriggering(true);
    const todayStr = new Date().toISOString().slice(0, 10);
    addLog(`🚀 发起生产流指令: 目标日期 [${todayStr}], 激活模型 [${activeModel}]`, 'info');
    try {
      const res = await triggerSparkGenerate(todayStr);
      addLog(`生产任务已响应: ${res.message || '执行成功'}`, 'success');
    } catch (err: any) {
      addLog(`触发生成失败: ${err.message}`, 'error');
      setIsTriggering(false);
    }
  };

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [sparkLogs]);

  const checkHealth = async () => {
    setIsChecking(true);
    const start = performance.now();
    try {
      const data = await fetchHealthInfo();
      setLatency(Math.round(performance.now() - start));
      setHealth(data);
      if (data.activeModel) {
        setActiveModel(data.activeModel);
      }
      if (data.scheduler) {
        setIsTriggering(Boolean(data.scheduler.isGenerating));
      }
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
      loadSparkModels();

      const es = new EventSource('/api/spark/stream');
      es.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const isCompleted = payload.type === 'COMPLETED' || payload.stage === 'COMPLETED';

          if (isCompleted) {
            addLog(`✅ 批次简报生产闭环达成: ${payload.message || '归档完成'}`, 'success');
            setIsTriggering(false);
          } else if (payload.type === 'PROGRESS') {
            setIsTriggering(true);
            addLog(`[${payload.stage}] (${payload.progress}%) ${payload.message}`, 'progress');
          } else if (payload.type === 'CONNECTED') {
            addLog(`推流通道握手就绪: 客户端 #${payload.clientId}`, 'info');
          } else if (payload.type === 'ERROR') {
            addLog(`❌ 调度异常: ${payload.message}`, 'error');
            setIsTriggering(false);
          }
        } catch {
          // ignore
        }
      };

      es.onerror = () => {
        addLog('SSE 连接中断，正在自动重连...', 'error');
      };

      return () => {
        es.close();
      };
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
          
          {/* 0. Gemini Spark 智能体控制舱 (Autonomous Agent Core) */}
          <div className="p-4 rounded-xl bg-obsidian-card border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)] space-y-3">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
              <span className="font-bold text-white flex items-center gap-1.5 uppercase text-[11px]">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                Gemini Spark 智能体控制舱
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700">
                ACTIVE: {activeModel}
              </span>
            </div>

            {/* 模型热切换卡片列表 */}
            <div className="space-y-1.5">
              <div className="text-[10px] text-slate-400 flex items-center justify-between">
                <span>官方认证模型切换 (Hot Swap):</span>
                {isSwitchingModel && <span className="text-cyan-400 animate-pulse">正在热切换...</span>}
              </div>
              <div className="grid grid-cols-1 gap-2">
                {models.map((m) => {
                  const isCurrent = m.id === activeModel;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleSelectModel(m.id)}
                      disabled={isSwitchingModel || isTriggering}
                      className={`p-2.5 rounded-lg border text-left transition flex items-start justify-between ${
                        isCurrent
                          ? 'bg-cyan-950/60 border-cyan-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'
                      } ${isTriggering ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <div className="space-y-1 flex-1 pr-2">
                        <div className="flex items-center gap-2">
                          <Cpu className={`w-3.5 h-3.5 ${isCurrent ? 'text-cyan-400' : 'text-slate-500'}`} />
                          <span className="font-bold text-xs">{m.name}</span>
                          {m.isDefault ? (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                              推荐工作马
                            </span>
                          ) : (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-bold">
                              深度推演
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight">
                          {m.description}
                        </p>
                      </div>
                      <div className="pt-0.5">
                        <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          isCurrent ? 'border-cyan-400 bg-cyan-400/20' : 'border-slate-600'
                        }`}>
                          {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 立即调度生产流按钮 */}
            <button
              type="button"
              onClick={handleTriggerGenerate}
              disabled={isTriggering}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-cyan-900/40 active:scale-98 disabled:opacity-50"
            >
              {isTriggering ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin text-cyan-200" />
                  <span>智能体生产中 (5 阶段推流)...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current text-cyan-200" />
                  <span>立即调度 Gemini Spark 生产流</span>
                </>
              )}
            </button>

            {/* 实时 SSE 日志终端 */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Terminal className="w-3 h-3 text-emerald-400" />
                  实时推流监视终端 (SSE Stream Monitor)
                </span>
                {sparkLogs.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSparkLogs([])}
                    className="text-slate-500 hover:text-slate-300 flex items-center gap-0.5 text-[9px]"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                    <span>清空</span>
                  </button>
                )}
              </div>
              <div 
                ref={logContainerRef}
                className="bg-black/80 rounded-lg p-2 font-mono text-[10px] text-slate-300 max-h-32 overflow-y-auto space-y-1 border border-white/10"
              >
                {sparkLogs.length === 0 ? (
                  <div className="text-slate-600 italic py-1">等待推流事件中...</div>
                ) : (
                  sparkLogs.map((log) => (
                    <div key={log.id} className="leading-tight flex items-start gap-1.5">
                      <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                      <span className={
                        log.type === 'error' ? 'text-rose-400 font-semibold' :
                        log.type === 'success' ? 'text-emerald-400 font-semibold' :
                        log.type === 'progress' ? 'text-cyan-300' : 'text-slate-300'
                      }>
                        {log.text}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

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

          {/* 3. 智能事件驱动同步引擎仪表盘 */}
          <div className="p-4 rounded-xl bg-obsidian-card border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-bold text-white flex items-center gap-1.5 uppercase text-[11px]">
                <Radio className="w-4 h-4 text-indigo-400" />
                智能事件驱动同步引擎
              </span>
              <span className={`text-[10px] font-bold ${currentStatus === 'RUNNING' ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`}>
                {currentStatus === 'RUNNING' ? 'POLLING (30s)' : 'ZERO-IDLE (已休眠)'}
              </span>
            </div>
            {currentStatus === 'RUNNING' ? (
              <div className="flex items-center justify-between text-slate-400">
                <span>生成中 · 倒计时感知:</span>
                <span className="text-sm font-bold text-amber-300">{silentCountdown} 秒</span>
              </div>
            ) : (
              <div className="space-y-1 text-slate-400 text-[11px]">
                <div className="flex items-center justify-between">
                  <span>当前轮询策略:</span>
                  <span className="text-emerald-400 font-semibold">0 轮询休眠中 (省流零开销)</span>
                </div>
                <p className="text-[10px] text-slate-500">
                  ⚡ 唤醒机制: 切回本标签页、系统时间跨天或手动点击同步时按需感知
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={onTriggerSilentSync}
              className="w-full py-2 rounded-lg bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-700 text-indigo-200 font-semibold flex items-center justify-center gap-2 transition active:scale-95"
            >
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
              <span>立即手动触发静默同步 (Abort 竞态检验)</span>
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

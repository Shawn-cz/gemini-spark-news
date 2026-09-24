import React, { useState } from 'react';
import { X, FileCode, CheckCircle2, AlertCircle, Copy, HelpCircle, Loader2 } from 'lucide-react';
import { saveBriefing } from '../services/api';

interface ImportBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (date: string) => void;
  currentDate: string;
}

export const ImportBriefingModal: React.FC<ImportBriefingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentDate
}) => {
  const [date, setDate] = useState<string>(currentDate || '2026-09-24');
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showPromptTip, setShowPromptTip] = useState<boolean>(false);
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);

  if (!isOpen) return null;

  const samplePrompt = `你是一个全球宏观与前沿科技战略智库首席分析师。请针对过去 24 小时全球发生的重大事件，全网检索权威信源（Reuters, Bloomberg, FT, Nature, WSJ 等），严格按以下 JSON 格式输出一份结构化的每日深度新闻简报。

【输出要求】
1. 只输出合法、纯净的 JSON 数据，代码块使用 \`\`\`json 包裹，不要输出任何寒暄或前言。
2. 覆盖四大领域：ai（前沿算力）、finance（宏观金融）、geopolitics（地缘经贸）、climate（气候能源）。
3. 严格生成 8-12 条高质量全球要闻：
   - 【配额限制】climate（气候能源）类严格控制在 1-2 条；
   - 【重点倾斜】剩余全部条目（约 7-10 条）分配给 ai、finance、geopolitics 三大领域；
   - 挑选 1 条影响最深远的全球突发事件设为 "impactLevel": "critical"，其余为 "high" 或 "medium"。
4. 情感极性评分 sentimentScore 介于 -1.0 到 +1.0 之间。
5. 命名实体 nlpKeyEntities 提取 3-5 个核心词。

【JSON 模板】
{
  "batchStatus": {
    "status": "COMPLETED",
    "statusText": "已完成归档",
    "generatedTime": "${date} 02:30:00 UTC",
    "nextScheduleTime": "明日 02:30:00 UTC",
    "progress": 100,
    "currentStage": "Gemini 1.5 智能体多源交叉校验完成"
  },
  "items": [
    {
      "id": "gemini-${date}-001",
      "title": "中文核心标题（30-50字内）",
      "englishTitle": "English Title",
      "source": "Reuters",
      "sourceCountry": "US",
      "category": "ai",
      "region": "North America",
      "impactLevel": "critical",
      "summary": "150-200 字深度摘要，包含核心事实、因果推演与宏观影响。",
      "tags": ["AI", "算力"],
      "sentiment": "positive",
      "sentimentScore": 0.85,
      "nlpKeyEntities": ["OpenAI", "Anthropic"],
      "coverUrl": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60",
      "publishTime": "${date}T08:00:00Z"
    }
  ]
}`;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(samplePrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleImport = async () => {
    setError(null);
    if (!content.trim()) {
      setError('请粘贴 Gemini 生成的简报内容');
      return;
    }

    let parsedData: any;
    try {
      let cleaned = content.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      parsedData = JSON.parse(cleaned);
    } catch (e: any) {
      setError(`JSON 解析失败，请确认内容为有效 JSON: ${e.message}`);
      return;
    }

    setIsLoading(true);
    try {
      await saveBriefing(date, parsedData);
      setIsLoading(false);
      onSuccess(date);
      onClose();
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || '保存入库失败');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* 遮罩 */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* 模态卡片 */}
      <div className="relative w-full max-w-2xl bg-obsidian-950 border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden z-10 animate-fade-in flex flex-col max-h-[90vh]">
        
        {/* 标题栏 */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-obsidian-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                导入 Gemini Spark 简报产物
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700 font-mono">
                  HOT INGESTION
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                直接粘贴 Gemini 定时任务生成的输出，系统将自动校验并秒级上屏
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

        {/* 表单内容 */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 font-mono text-xs">
          
          {/* 日期选择与提示词指南折叠 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-3">
              <label className="text-slate-300 font-medium whitespace-nowrap">
                简报归档日期:
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-obsidian-900 border border-white/10 rounded-lg px-3 py-1.5 text-cyan-300 text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowPromptTip(!showPromptTip)}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 text-xs transition"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{showPromptTip ? '收起 Prompt 推荐模板' : '查看 Gemini 任务 Prompt 模板'}</span>
            </button>
          </div>

          {/* Prompt 模板展开区 */}
          {showPromptTip && (
            <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/30 space-y-2.5">
              <div className="flex items-center justify-between text-cyan-300 font-bold">
                <span>推荐填入 Gemini 定时任务的提示词 (Prompt):</span>
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="px-2.5 py-1 rounded-lg bg-cyan-900/80 hover:bg-cyan-800 text-cyan-200 border border-cyan-700 flex items-center gap-1.5 transition active:scale-95"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedPrompt ? '已复制！' : '一键复制 Prompt'}</span>
                </button>
              </div>
              <pre className="text-[11px] text-slate-300 bg-black/50 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-48 border border-white/5">
                {samplePrompt}
              </pre>
            </div>
          )}

          {/* 粘贴输入框 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-slate-400">
              <label htmlFor="briefing-content">
                粘贴 Gemini 生成的简报内容 (支持包含 ```json 代码块):
              </label>
              <span className="text-[11px] text-slate-500">
                支持完整对象或纯数组
              </span>
            </div>
            <textarea
              id="briefing-content"
              rows={10}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="在此粘贴从 Gemini 对话框中复制的内容...例如：
{
  &quot;batchStatus&quot;: { ... },
  &quot;items&quot;: [ ... ]
}"
              className="w-full bg-obsidian-900 border border-white/10 rounded-xl p-3.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500 leading-relaxed resize-none font-mono"
            />
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

        </div>

        {/* 底部按钮栏 */}
        <div className="p-4 border-t border-white/10 bg-obsidian-900/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
            保存后将自动归档至 data/briefings/{date}.json
          </span>
          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-mono text-slate-400 hover:text-white hover:bg-white/5 transition"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={isLoading}
              className="px-5 py-2 rounded-xl text-xs font-mono font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 transition shadow-lg flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>校验保存中...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>解析并同步入库</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

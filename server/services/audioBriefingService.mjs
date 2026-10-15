import { getDailyNobelQuote } from './nobelQuoteService.mjs';
import { getNewsList, getBatchStatus } from '../repository.mjs';

/**
 * 将整段播报文本智能拆分为句子数组 (Web Speech 队列接力朗读，防范 Chrome 15s 中断 Bug)
 */
export function splitIntoSentences(text = '') {
  if (typeof text !== 'string') return [];
  const segments = text
    .split(/([。！？；\n]+)/)
    .reduce((acc, curr, idx, arr) => {
      if (idx % 2 === 0 && curr.trim()) {
        const punctuation = arr[idx + 1] || '。';
        const cleaned = (curr.trim() + punctuation.trim()).replace(/\n+/g, ' ');
        if (cleaned.length > 0) {
          acc.push(cleaned);
        }
      }
      return acc;
    }, []);

  return segments.length > 0 ? segments : [text.trim()];
}

/**
 * 自动合成单日 3 分钟《智库早茶》结构化播报文稿
 */
export async function generateDailyAudioBriefing(date = new Date().toISOString().slice(0, 10)) {
  const [newsData, batchStatus] = await Promise.all([
    getNewsList({ date, pageSize: 50 }),
    getBatchStatus(date)
  ]);

  const items = newsData.items || [];
  const nobel = (batchStatus && batchStatus.nobelQuote) || getDailyNobelQuote(date);

  // 优先挑选 critical 与 high 级别焦点研报，最多 3 篇
  const criticalItems = items.filter(i => i.impactLevel === 'critical');
  const highItems = items.filter(i => i.impactLevel === 'high');
  const otherItems = items.filter(i => i.impactLevel !== 'critical' && i.impactLevel !== 'high');

  const top3 = [...criticalItems, ...highItems, ...otherItems].slice(0, 3);

  const [year, month, day] = date.split('-');
  const formattedYear = year || '2026';
  const formattedMonth = parseInt(month || '10', 10);
  const formattedDay = parseInt(day || '15', 10);

  const title = `Gemini Spark 每日智库早茶 · ${formattedYear}年${formattedMonth}月${formattedDay}日`;

  const intro = `各位战略决策者，早上好！今天是 ${formattedYear} 年 ${formattedMonth} 月 ${formattedDay} 日。欢迎收听 Gemini Spark 每日 3 分钟宏观智库早茶。在过去 24 小时里，全球宏观政经与科技前沿涌现了多项关键拐点信号，我们将为您快速梳理最具影响力的三大核心洞察。`;

  const sections = top3.map((item, idx) => {
    const catLabel = item.category === 'ai' ? '人工智能' : item.category === 'finance' ? '宏观金融' : item.category === 'geopolitics' ? '地缘格局' : '气候能源';
    const sentimentLabel = item.sentiment === 'positive' ? '积极看多' : item.sentiment === 'negative' ? '避险谨慎' : '中性观望';
    const summaryClean = (item.summary || '').replace(/[【】]/g, '');
    const scriptText = `第${idx + 1}条焦点，关注${catLabel}领域：${item.title}。来自${item.source || '全球权威智库'}的研报指出：${summaryClean}。该事件影响等级为${(item.impactLevel || 'high').toUpperCase()}，市场研判倾向上呈现${sentimentLabel}态势。`;
    return {
      newsId: item.id,
      category: item.category,
      headline: item.title,
      source: item.source,
      scriptText
    };
  });

  const outro = `今日早茶的最后，与您共勉一则诺贝尔文学奖大师哲思。${nobel.year}获得者${nobel.author}在其代表作《${nobel.work}》中写道：${nobel.zh}。感谢您的收听，祝您今天决策清晰、洞见先机！`;

  const fullScript = [intro, ...sections.map(s => s.scriptText), outro].join('\n\n');
  const sentences = splitIntoSentences(fullScript);

  // 估算时长：中文朗读标准语速约 3.5 字/秒 (210 字/分钟)
  const totalChars = fullScript.replace(/\s+/g, '').length;
  const estimatedDurationSeconds = Math.max(60, Math.round(totalChars / 3.5));

  return {
    date,
    title,
    estimatedDurationSeconds,
    intro,
    sections,
    outro,
    sentences,
    fullScript,
    nobelQuote: nobel,
    generatedAt: new Date().toISOString()
  };
}

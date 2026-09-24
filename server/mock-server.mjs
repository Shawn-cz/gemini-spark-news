import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BRIEFINGS_DIR = path.resolve(__dirname, '../data/briefings');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// 全球化智库多维语料库 (涵盖 AI算力、全球金融、地缘政治、气候变化 4 大前沿领域)
const GLOBAL_CORPUS = [
  // 1. 全球 AI 与前沿算力 (AI & Compute)
  {
    title: "OpenAI 与 Anthropic 新一代前沿模型评测曝光：自主智能体推理跃迁与安全红线对决，多国跨部门监管机构联合下发高风险算法披露问询函以防范系统性代码自主失控与越权漏洞隐患",
    englishTitle: "Next-Gen Frontier Models Benchmarks Leaked: Autonomous Agent Reasoning vs Safety Guardrails",
    source: "Reuters",
    sourceCountry: "US",
    category: "ai",
    region: "North America",
    impactLevel: "critical",
    summary: "据路透社援引硅谷独家测试备忘录，新一代前沿架构在多步复杂软件工程与科研假设推演任务中达成 82% 自主解决率，但多国政府监管机构对其可能外溢的代码利用能力提出更严格的披露要求。",
    tags: ["OpenAI", "Anthropic", "自主智能体", "模型安全"],
    sentiment: "positive",
    sentimentScore: 0.76,
    nlpKeyEntities: ["OpenAI", "Anthropic", "Autonomous Agents", "Safety Audit"],
    coverUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60"
  },
  {
    title: "台积电 2nm 试产良率超预期，英伟达 Blackwell Ultra 获优先晶圆配额",
    englishTitle: "TSMC N2 Trial Yield Surpasses Target, Securing First Wafer Allocations for NVIDIA Blackwell Ultra",
    source: "Bloomberg",
    sourceCountry: "US",
    category: "ai",
    region: "Asia-Pacific",
    impactLevel: "high",
    summary: "彭博供应链智库获悉，台积电新竹与高雄研发中心的 2nm GAA (全环绕栅极) 节点良品率突破 65% 拐点，超微半导体与英伟达已锁定 2026 年下半年首批先进制程产能，全球算力争夺进入物理尺度极限战。",
    tags: ["TSMC", "NVIDIA", "2nm晶圆", "AI芯片"],
    sentiment: "positive",
    sentimentScore: 0.82,
    nlpKeyEntities: ["TSMC", "NVIDIA", "Blackwell Ultra", "GAA Transistors"],
    coverUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=60"
  },
  {
    title: "DeepMind 与多国实验室联合发布通用材料生成模型，攻克室温超导候选物筛选",
    englishTitle: "DeepMind and International Labs Unveil Universal Materials Model for Superconductor Candidates",
    source: "Nature",
    sourceCountry: "UK",
    category: "ai",
    region: "Global",
    impactLevel: "high",
    summary: "《自然》杂志刊登重磅成果，研究团队利用晶体对称性扩散变换器，对超过 220 万种高压结晶态结构进行高通量虚拟合成，将新型低能耗储能材料的筛选效率提升四个数量级。",
    tags: ["DeepMind", "AI4Science", "超导材料", "Nature"],
    sentiment: "positive",
    sentimentScore: 0.88,
    nlpKeyEntities: ["DeepMind", "Nature", "Materials Genome", "Quantum Crystals"],
    coverUrl: "https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=800&auto=format&fit=crop&q=60"
  },
  {
    title: "欧盟《人工智能法案》进入全面落地审查期，跨国科技巨头合规成本或翻倍",
    englishTitle: "EU AI Act Enforcement Audits Begin with High-Risk Foundation Models Facing Scrutiny",
    source: "Financial Times",
    sourceCountry: "EU",
    category: "ai",
    region: "Europe",
    impactLevel: "medium",
    summary: "英国《金融时报》报道，布鲁塞尔监管办公室正式向在欧运营的 8 家全球大模型供应商发出高风险算法技术档案问询函，要求详细说明训练语料来源、碳足迹及系统性风险应急熔断机制。",
    tags: ["欧盟法案", "AI合规", "系统性风险", "科技反垄断"],
    sentiment: "neutral",
    sentimentScore: -0.12,
    nlpKeyEntities: ["European Commission", "EU AI Act", "Algorithmic Transparency"],
    coverUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=60"
  },

  // 2. 全球金融与宏观资本 (Global Finance & Macro)
  {
    title: "美联储 FOMC 点阵图偏向渐进降息，华尔街重新评估美元流动性拐点",
    englishTitle: "Fed Dot Plot Signals Cautious Easing Path as Wall Street Reprices Global Liquidity",
    source: "The Wall Street Journal",
    sourceCountry: "US",
    category: "finance",
    region: "North America",
    impactLevel: "critical",
    summary: "华尔街日报指出，鉴于美国劳动力市场韧性与核心服务业通胀黏性，美联储决策层在年内降息节奏上分歧显现，全球主权债券收益率曲线倒挂程度进一步收窄，跨境套息资金加速再平衡。",
    tags: ["美联储", "FOMC点阵图", "美元流动性", "美债收益率"],
    sentiment: "neutral",
    sentimentScore: 0.15,
    nlpKeyEntities: ["Federal Reserve", "FOMC", "Jerome Powell", "Treasury Yields"],
    coverUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=60"
  },
  {
    title: "日本央行加息预期引发全球套利交易平仓隐忧，亚太主权基金增持实物黄金",
    englishTitle: "BOJ Rate Hike Prospects Trigger Carry Trade Unwinding Fears; Sovereign Funds Turn to Gold",
    source: "Bloomberg",
    sourceCountry: "US",
    category: "finance",
    region: "Asia-Pacific",
    impactLevel: "high",
    summary: "日元汇率波动率走阔，市场对零利率时代终结的外溢反应愈发敏感。彭博统计显示，中东与东南亚主权财富基金连续第四周增持黄金现货及短期国债以对冲汇率敞口。",
    tags: ["日本央行", "日元套利", "黄金储备", "主权基金"],
    sentiment: "negative",
    sentimentScore: -0.45,
    nlpKeyEntities: ["Bank of Japan", "Yen Carry Trade", "Gold Reserves", "FX Hedging"],
    coverUrl: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&auto=format&fit=crop&q=60"
  },
  {
    title: "全球主权与私人信贷机构竞购 AI 基础设施资产，专项算力债券发行规模破千亿",
    englishTitle: "Private Credit Funds Flock to AI Infrastructure with $100B in Data Center Debt Pipelines",
    source: "Financial Times",
    sourceCountry: "UK",
    category: "finance",
    region: "Global",
    impactLevel: "medium",
    summary: "在超大规模云厂商加速资本开支背景下，黑石与博枫等另类资产管理巨头正将数据中心电网配套与液冷机房打包为高评级资产支持证券，基础设施私募信贷年化溢价创三年新高。",
    tags: ["私市信贷", "AI基建", "资产证券化", "算力资本"],
    sentiment: "positive",
    sentimentScore: 0.62,
    nlpKeyEntities: ["Blackstone", "Brookfield", "Data Center Debt", "Alternative Assets"],
    coverUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&auto=format&fit=crop&q=60"
  },

  // 3. 地缘政治与国际经贸 (Geopolitics & Security)
  {
    title: "红海与苏伊士航道安全溢价推升全球集装箱综合运价 18%，欧洲供应链面临再调度",
    englishTitle: "Red Sea Transit Disruptions Drive Global Freight Rates Up 18% Forcing Route Diversions",
    source: "Reuters",
    sourceCountry: "UK",
    category: "geopolitics",
    region: "Middle East",
    impactLevel: "critical",
    summary: "路透社海事追踪数据显示，好望角绕航使得远东至欧洲往返航行周期平均增加 12~14 天，航运公司额外燃油附加费及战争险保费上调，给欧洲制造业核心零部件的准时化生产（JIT）带来严峻挑战。",
    tags: ["红海局势", "海运运价", "供应链安全", "好望角绕航"],
    sentiment: "negative",
    sentimentScore: -0.78,
    nlpKeyEntities: ["Red Sea", "Suez Canal", "Maersk", "Global Logistics"],
    coverUrl: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&auto=format&fit=crop&q=60"
  },
  {
    title: "美欧启动新一轮关键技术出口管制政策磋商，重点涉及半导体材料与量子计算",
    englishTitle: "US and EU Coordinate on Next-Tier Export Controls Targeting Advanced Materials and Quantum",
    source: "Foreign Affairs",
    sourceCountry: "US",
    category: "geopolitics",
    region: "Global",
    impactLevel: "high",
    summary: "《外交事务》专栏分析指出，多边技术联盟正从单一硬件成品管控延伸至上游极紫外光刻辅料、高端有机硅基板及量子纠缠测量装置，全球高科技产业链的‘友岸外包’重组正在进一步制度化。",
    tags: ["出口管制", "半导体材料", "量子科技", "地缘科技战"],
    sentiment: "neutral",
    sentimentScore: -0.32,
    nlpKeyEntities: ["Export Controls", "Quantum Computing", "Friend-shoring", "EUV Materials"],
    coverUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=60"
  },
  {
    title: "金砖国家扩容后财金高官会议探讨本币结算网，降低对传统 SWIFT 渠道依赖度",
    englishTitle: "Expanded BRICS Summit Debates Local Currency Clearing Network to Diversify Beyond SWIFT",
    source: "Bloomberg",
    sourceCountry: "US",
    category: "geopolitics",
    region: "Global",
    impactLevel: "high",
    summary: "新兴市场主要贸易伙伴就构建去中心化跨境多边清算机制展开第二阶段闭门测试，数字本币在能源贸易结算中的比重过去 12 个月提升至 31%。",
    tags: ["金砖峰会", "去美元化", "跨境清算", "本币结算"],
    sentiment: "neutral",
    sentimentScore: 0.08,
    nlpKeyEntities: ["BRICS Network", "Local Currencies", "SWIFT Alternative", "Trade Settlement"],
    coverUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=60"
  },

  // 4. 气候变化与能源转型 (Climate Change & Energy Transition)
  {
    title: "超大规模科技巨头签署千兆瓦级核能直购长协，小型模块化反应堆 (SMR) 商业化提速",
    englishTitle: "Tech Hyperscalers Ink Multi-Gigawatt SMR Nuclear Contracts to Power Zero-Carbon AI Clusters",
    source: "The Wall Street Journal",
    sourceCountry: "US",
    category: "climate",
    region: "North America",
    impactLevel: "critical",
    summary: "华尔街日报披露，微软、亚马逊与谷歌相继与新一代核动力开发商锁定长期供电协议，以确保百兆瓦级 AI 智算中心获得 24/7 不间断零碳基荷电力，核电正在从冷门公用事业跃升为前沿科技底座支撑。",
    tags: ["小型核电SMR", "零碳电力", "AI算力能耗", "能源转型"],
    sentiment: "positive",
    sentimentScore: 0.81,
    nlpKeyEntities: ["Small Modular Reactors", "Hyperscalers", "Zero-Carbon Grid", "Constellation Energy"],
    coverUrl: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800&auto=format&fit=crop&q=60"
  },
  {
    title: "哥白尼气候服务局发布极端气候通报：全球连续两季地表均温偏离历史基准",
    englishTitle: "Copernicus Climate Service Confirms Record-Breaking Global Surface Temperatures",
    source: "Nature Climate",
    sourceCountry: "EU",
    category: "climate",
    region: "Global",
    impactLevel: "high",
    summary: "根据最新卫星高光谱观测数据，极地冰盖消融速率与地中海海表温度异常创下六十年统计极值，水资源短缺对南部内陆农业灌溉与水力发电出力的制约加剧，多国呼吁强化韧性防灾基金部署。",
    tags: ["全球变暖", "哥白尼计划", "极端天气", "气候防灾"],
    sentiment: "negative",
    sentimentScore: -0.84,
    nlpKeyEntities: ["Copernicus Climate", "Surface Temperature", "Ice Sheet Melting", "Climate Resilience"],
    coverUrl: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&auto=format&fit=crop&q=60"
  },
  {
    title: "国际能源署 (IEA) 2026 全球电网报告：储能装机与高压直流互联成为消纳瓶颈突破口",
    englishTitle: "IEA Grid Outlook: Energy Storage and HVDC Interconnectors Key to Renewable Bottlenecks",
    source: "Reuters",
    sourceCountry: "France",
    category: "climate",
    region: "Europe",
    impactLevel: "high",
    summary: "IEA 指出，尽管太阳能与风电装机复合增速超 25%，但传统输电网接入排队时间长达 4~6 年。跨区域特高压直流与固态长时储能项目的投资复合增速正在迎来政策拐点。",
    tags: ["国际能源署", "电网改造", "特高压直流", "长时储能"],
    sentiment: "positive",
    sentimentScore: 0.65,
    nlpKeyEntities: ["IEA", "Renewable Grids", "HVDC Systems", "Grid Bottleneck"],
    coverUrl: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&auto=format&fit=crop&q=60"
  }
];

// 生成指定日期的全球批次数据 (模拟时区发布时间与批次归属)
function createGlobalDailyBatch(dateStr, offsetDays = 0) {
  return GLOBAL_CORPUS.map((item, index) => {
    // 模拟全天 24 小时各时区时间点 (从 01:00 到 23:00)
    const hour = String(Math.floor((index * 1.7) % 24)).padStart(2, '0');
    const minute = String((index * 17) % 60).padStart(2, '0');
    return {
      ...item,
      id: `global-${dateStr}-${index + 1}`,
      title: offsetDays === 0 ? item.title : `[往期智库] ${item.title}`,
      publishTime: `${dateStr}T${hour}:${minute}:00Z`,
      batchDate: dateStr,
      batchId: `spark_global_24h_${dateStr.replace(/-/g, '')}`
    };
  });
}

// 动态检索 data/briefings 目录中的日期与历史归档
function getAvailableDates() {
  const dates = new Set(['2026-09-24', '2026-09-23', '2026-09-22', '2026-09-21']);
  if (fs.existsSync(BRIEFINGS_DIR)) {
    try {
      const files = fs.readdirSync(BRIEFINGS_DIR);
      for (const file of files) {
        const match = file.match(/^(\d{4}-\d{2}-\d{2})\.json$/);
        if (match) {
          dates.add(match[1]);
        }
      }
    } catch (e) {
      console.error('Failed to read briefings directory:', e);
    }
  }
  return Array.from(dates).sort().reverse();
}

// 动态读取指定日期的 Gemini Spark 简报
function getBriefingForDate(date) {
  const filePath = path.join(BRIEFINGS_DIR, `${date}.json`);
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return { items: parsed, batchStatus: null };
      }
      if (parsed && Array.isArray(parsed.items)) {
        return { items: parsed.items, batchStatus: parsed.batchStatus || null };
      }
    } catch (e) {
      console.error(`Failed to parse briefing for date ${date}:`, e);
    }
  }
  return null;
}

let batchStatusMap = {
  '2026-09-24': {
    status: 'COMPLETED',
    statusText: '已完成归档',
    generatedTime: '2026-09-24 02:30:00 UTC',
    nextScheduleTime: '明日 02:30:00 UTC (2026-09-25 02:30)',
    estimatedRemainingMinutes: 0,
    progress: 100,
    currentStage: 'Gemini Spark 智能体 24H 简报生成与交叉校验完成'
  },
  '2026-09-23': {
    status: 'COMPLETED',
    statusText: '已归档',
    generatedTime: '2026-09-23 02:30:00 UTC',
    nextScheduleTime: '2026-09-24 02:30:00 UTC',
    estimatedRemainingMinutes: 0,
    progress: 100,
    currentStage: 'Gemini 智能体历史简报归档'
  },
  '2026-09-22': {
    status: 'COMPLETED',
    statusText: '已归档',
    generatedTime: '2026-09-22 02:30:00 UTC',
    nextScheduleTime: '2026-09-23 02:30:00 UTC',
    estimatedRemainingMinutes: 0,
    progress: 100,
    currentStage: 'Gemini 智能体历史简报归档'
  },
  '2026-09-21': {
    status: 'COMPLETED',
    statusText: '已归档',
    generatedTime: '2026-09-21 02:30:00 UTC',
    nextScheduleTime: '2026-09-22 02:30:00 UTC',
    estimatedRemainingMinutes: 0,
    progress: 100,
    currentStage: 'Gemini 智能体历史简报归档'
  }
};

let newsStore = {
  '2026-09-24': createGlobalDailyBatch('2026-09-24', 0),
  '2026-09-23': createGlobalDailyBatch('2026-09-23', 1),
  '2026-09-22': createGlobalDailyBatch('2026-09-22', 2),
  '2026-09-21': createGlobalDailyBatch('2026-09-21', 3),
};

// 接口 1: 获取全球批次监控与情绪极性指标
app.get('/api/spark/batch-status', (req, res) => {
  const { date = '2026-09-24' } = req.query;
  const briefing = getBriefingForDate(date);
  const allDates = getAvailableDates();

  let statusInfo = batchStatusMap[date];
  if (briefing && briefing.batchStatus) {
    statusInfo = { ...briefing.batchStatus };
  } else if (!statusInfo) {
    statusInfo = briefing ? {
      status: 'COMPLETED',
      statusText: '已完成归档',
      generatedTime: `${date} 02:30:00 UTC`,
      nextScheduleTime: '明日 02:30:00 UTC',
      estimatedRemainingMinutes: 0,
      progress: 100,
      currentStage: 'Gemini Spark 智能体简报归档入库'
    } : {
      status: 'PENDING',
      statusText: '排队调度中',
      generatedTime: '-',
      nextScheduleTime: '明日 02:30:00 UTC',
      estimatedRemainingMinutes: 45,
      progress: 0,
      currentStage: '等待 Gemini Spark 简报摄入'
    };
  }

  const currentNews = statusInfo.status === 'COMPLETED' 
    ? (briefing ? briefing.items : (newsStore[date] || []))
    : [];
  
  // 计算宏观情绪极性指标 (-100 到 +100)
  let sentimentIndex = 0;
  if (currentNews.length > 0) {
    const totalScore = currentNews.reduce((acc, curr) => acc + (curr.sentimentScore || 0), 0);
    sentimentIndex = Math.round((totalScore / currentNews.length) * 100);
  }

  res.json({
    code: 200,
    message: 'success',
    data: {
      queryDate: date,
      isToday: date === allDates[0],
      scheduleInterval: '每 24 小时由 Gemini Spark 生成一次 (每天 02:00-02:30 UTC)',
      scheduleCron: '0 2 * * *',
      availableDates: allDates,
      totalArchivedDays: allDates.length,
      ...statusInfo,
      batchNewsCount: currentNews.length,
      globalSentimentIndex: sentimentIndex // 全球情绪极性指标
    }
  });
});

// 接口 2: 获取全球资讯 (支持 category、sentiment、search、分页)
app.get('/api/news', (req, res) => {
  const {
    date = '2026-09-24',
    category = 'all',
    sentiment = 'all',
    search = '',
    page = 1,
    pageSize = 12
  } = req.query;

  const briefing = getBriefingForDate(date);
  let statusInfo = batchStatusMap[date];
  if (briefing && briefing.batchStatus) {
    statusInfo = briefing.batchStatus;
  }
  const isRunningOrPending = statusInfo && statusInfo.status !== 'COMPLETED';

  if (isRunningOrPending) {
    return res.json({
      code: 200,
      message: 'Gemini Spark 简报仍在生成中',
      data: {
        items: [],
        pagination: { page: 1, pageSize: Number(pageSize), total: 0, totalPages: 0 },
        batchStatus: statusInfo,
        stats: {
          total: 0,
          positive: 0,
          neutral: 0,
          negative: 0,
          avgSentimentScore: 0,
          categoryCounts: { ai: 0, finance: 0, geopolitics: 0, climate: 0 },
          batchDate: date
        }
      }
    });
  }

  let rawList = briefing ? [...briefing.items] : [...(newsStore[date] || [])];

  // 全量分类统计
  const total = rawList.length;
  const positive = rawList.filter(i => i.sentiment === 'positive').length;
  const neutral = rawList.filter(i => i.sentiment === 'neutral').length;
  const negative = rawList.filter(i => i.sentiment === 'negative').length;
  const avgSentimentScore = total > 0 
    ? Number((rawList.reduce((acc, cur) => acc + cur.sentimentScore, 0) / total).toFixed(2))
    : 0;

  const categoryCounts = {
    ai: rawList.filter(i => i.category === 'ai').length,
    finance: rawList.filter(i => i.category === 'finance').length,
    geopolitics: rawList.filter(i => i.category === 'geopolitics').length,
    climate: rawList.filter(i => i.category === 'climate').length,
  };

  // 1. 领域过滤
  let items = rawList;
  if (category && category !== 'all') {
    items = items.filter(i => i.category === category);
  }

  // 2. 情感过滤
  if (sentiment && sentiment !== 'all') {
    items = items.filter(i => i.sentiment === sentiment);
  }

  // 3. 搜索匹配 (中英文标题、来源、摘要、标签、实体)
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    items = items.filter(i => 
      i.title.toLowerCase().includes(q) ||
      (i.englishTitle && i.englishTitle.toLowerCase().includes(q)) ||
      i.summary.toLowerCase().includes(q) ||
      i.source.toLowerCase().includes(q) ||
      i.tags.some(t => t.toLowerCase().includes(q)) ||
      (i.nlpKeyEntities && i.nlpKeyEntities.some(e => e.toLowerCase().includes(q)))
    );
  }

  // 4. 排序：影响力越高的在前，再按时间倒序
  items.sort((a, b) => {
    const weight = { critical: 3, high: 2, medium: 1 };
    const wDiff = (weight[b.impactLevel] || 0) - (weight[a.impactLevel] || 0);
    if (wDiff !== 0) return wDiff;
    return new Date(b.publishTime).getTime() - new Date(a.publishTime).getTime();
  });

  // 5. 分页
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const sizeNum = Math.max(1, parseInt(pageSize, 10) || 12);
  const filteredTotal = items.length;
  const totalPages = Math.ceil(filteredTotal / sizeNum) || 1;
  const startIndex = (pageNum - 1) * sizeNum;
  const paginatedItems = items.slice(startIndex, startIndex + sizeNum);

  res.json({
    code: 200,
    message: 'success',
    data: {
      items: paginatedItems,
      pagination: {
        page: pageNum,
        pageSize: sizeNum,
        total: filteredTotal,
        totalPages
      },
      batchStatus: statusInfo || { status: 'COMPLETED', statusText: '已完成' },
      stats: {
        total,
        positive,
        neutral,
        negative,
        avgSentimentScore,
        categoryCounts,
        batchDate: date
      }
    }
  });
});

// 接口 3: 调试模拟 - 切换批次状态
app.post('/api/spark/toggle-status', (req, res) => {
  const { date = '2026-09-24', status } = req.body;
  if (!batchStatusMap[date]) {
    return res.status(404).json({ code: 404, message: 'Date not found' });
  }

  if (status) {
    if (status === 'RUNNING') {
      batchStatusMap[date] = {
        ...batchStatusMap[date],
        status: 'RUNNING',
        statusText: '计算生成中',
        estimatedRemainingMinutes: 18,
        progress: 68,
        currentStage: '阶段 3/4: Gemini 1.5 全球多源交叉校验与结构化提取'
      };
    } else {
      batchStatusMap[date] = {
        ...batchStatusMap[date],
        status: 'COMPLETED',
        statusText: '已完成归档',
        generatedTime: `${date} 02:30:00 UTC`,
        estimatedRemainingMinutes: 0,
        progress: 100,
        currentStage: 'Gemini Spark 智能体 24H 简报生成完成'
      };
    }
  } else {
    const cur = batchStatusMap[date].status;
    const next = cur === 'COMPLETED' ? 'RUNNING' : 'COMPLETED';
    return app.handle({ ...req, body: { date, status: next } }, res);
  }

  res.json({
    code: 200,
    message: `已将 [${date}] 简报状态更新为: ${batchStatusMap[date].statusText}`,
    data: batchStatusMap[date]
  });
});

app.listen(PORT, () => {
  console.log(`[Gemini Spark Intelligence API] Running on http://localhost:${PORT}`);
});

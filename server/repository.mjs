import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { NewsItemModel } from './models/NewsItem.mjs';
import { BatchStatusModel } from './models/BatchStatus.mjs';
import { GLOBAL_CORPUS, createGlobalDailyBatch } from './corpus.mjs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BRIEFINGS_DIR = path.resolve(__dirname, '../data/briefings');

// 内存中的降级存储 (仅在本地模式且无物理文件时使用)
const memoryNewsStore = {
  '2026-09-24': createGlobalDailyBatch('2026-09-24', 0),
  '2026-09-23': createGlobalDailyBatch('2026-09-23', 1),
  '2026-09-22': createGlobalDailyBatch('2026-09-22', 2),
  '2026-09-21': createGlobalDailyBatch('2026-09-21', 3),
};

const memoryBatchStatusMap = {
  '2026-09-24': {
    status: 'COMPLETED',
    statusText: '已完成归档',
    generatedTime: '2026-09-24 08:30:00',
    nextScheduleTime: '明日 08:30:00 (每日晨报)',
    estimatedRemainingMinutes: 0,
    progress: 100,
    currentStage: 'Gemini Spark 智能体 24H 简报生成与交叉校验完成'
  },
  '2026-09-23': {
    status: 'COMPLETED',
    statusText: '已归档',
    generatedTime: '2026-09-23 08:30:00',
    nextScheduleTime: '2026-09-24 08:30:00',
    estimatedRemainingMinutes: 0,
    progress: 100,
    currentStage: 'Gemini 智能体历史简报归档'
  },
  '2026-09-22': {
    status: 'COMPLETED',
    statusText: '已归档',
    generatedTime: '2026-09-22 08:30:00',
    nextScheduleTime: '2026-09-23 08:30:00',
    estimatedRemainingMinutes: 0,
    progress: 100,
    currentStage: 'Gemini 智能体历史简报归档'
  },
  '2026-09-21': {
    status: 'COMPLETED',
    statusText: '已归档',
    generatedTime: '2026-09-21 08:30:00',
    nextScheduleTime: '2026-09-22 08:30:00',
    estimatedRemainingMinutes: 0,
    progress: 100,
    currentStage: 'Gemini 智能体历史简报归档'
  }
};

// 状态标记
let isMongoConnected = false;
let mongoErrorMessage = null;

/**
 * 尝试连接 MongoDB (双模启动)
 */
export async function initDatabase() {
  const uri = process.env.MONGO_URI;
  if (!uri || !uri.trim()) {
    console.log('[Repository] ℹ️  未检测到 MONGO_URI，系统以【LOCAL_FALLBACK (本地文件/语料模式)】平稳运行');
    isMongoConnected = false;
    return false;
  }

  try {
    console.log('[Repository] 🔄 正在连接 MongoDB Atlas 云数据库...');
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });
    isMongoConnected = true;
    mongoErrorMessage = null;
    console.log('[Repository] ✅ 成功连通 MongoDB Atlas 云数据库！当前运行于【MONGODB_ATLAS】模式');

    mongoose.connection.on('disconnected', () => {
      console.warn('[Repository] ⚠️ MongoDB 连接断开，系统已自动平滑降级至【LOCAL_FALLBACK】');
      isMongoConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('[Repository] 🔄 MongoDB 重新连通，恢复【MONGODB_ATLAS】模式');
      isMongoConnected = true;
    });

    return true;
  } catch (err) {
    isMongoConnected = false;
    mongoErrorMessage = err.message;
    console.warn(`[Repository] ⚠️ MongoDB 连接失败: ${err.message}`);
    console.log('[Repository] 🛡️ 启用双模防灾降级：已自动切换至【LOCAL_FALLBACK (本地文件模式)】，业务不受影响');
    return false;
  }
}

/**
 * 获取当前底层数据源模式与健康信息
 */
export function getDataSourceInfo() {
  return {
    mode: isMongoConnected ? 'MONGODB_ATLAS' : 'LOCAL_FALLBACK',
    isMongoConnected,
    mongoConfigured: Boolean(process.env.MONGO_URI?.trim()),
    errorMessage: mongoErrorMessage
  };
}

/**
 * 动态读取本地 data/briefings 目录中的文件
 */
function readLocalBriefingFile(date) {
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
      console.error(`[Repository] 读取本地简报文件异常 (${date}):`, e);
    }
  }
  return null;
}

/**
 * 获取所有可用历史归档日期
 */
export async function getAvailableDates() {
  const dateSet = new Set(['2026-09-24', '2026-09-23', '2026-09-22', '2026-09-21']);

  // 1. 本地目录中的日期文件
  if (fs.existsSync(BRIEFINGS_DIR)) {
    try {
      const files = fs.readdirSync(BRIEFINGS_DIR);
      for (const file of files) {
        const match = file.match(/^(\d{4}-\d{2}-\d{2})\.json$/);
        if (match) dateSet.add(match[1]);
      }
    } catch (err) {
      console.error('[Repository] 扫描本地 briefings 目录失败:', err);
    }
  }

  // 2. 若连通 MongoDB，聚合数据库中的日期
  if (isMongoConnected) {
    try {
      const dbDates = await NewsItemModel.distinct('batchDate');
      for (const d of dbDates) {
        if (d) dateSet.add(d);
      }
    } catch (err) {
      console.error('[Repository] 查询 MongoDB 日期列表异常:', err);
    }
  }

  return Array.from(dateSet).sort().reverse();
}

/**
 * 聚合可用简报日期列表（支持 MongoDB Atlas 与 本地文件/内存双模降级）
 * 返回严格降序排列且无重复的日期数组
 */
export async function getAvailableBriefingDates() {
  const dateSet = new Set();

  // 1. 如果已连通 MongoDB，尝试从数据库聚合
  if (isMongoConnected) {
    try {
      const dbDates = await NewsItemModel.distinct('batchDate');
      if (Array.isArray(dbDates)) {
        dbDates.forEach(d => {
          if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
            dateSet.add(d);
          }
        });
      }
    } catch (err) {
      console.warn('[Repository] 从 MongoDB 获取 batchDate 失败，继续读取本地文件:', err.message);
    }
  }

  // 2. 读取本地物理磁盘 data/briefings 目录中的 YYYY-MM-DD.json
  try {
    if (fs.existsSync(BRIEFINGS_DIR)) {
      const files = fs.readdirSync(BRIEFINGS_DIR);
      files.forEach(file => {
        const match = file.match(/^(\d{4}-\d{2}-\d{2})\.json$/);
        if (match) {
          dateSet.add(match[1]);
        }
      });
    }
  } catch (err) {
    console.warn('[Repository] 读取 BRIEFINGS_DIR 异常:', err.message);
  }

  // 3. 读取内存降级存储中的日期
  Object.keys(memoryNewsStore).forEach(d => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      dateSet.add(d);
    }
  });

  // 4. 排序：严格时间降序 (从最新到最早)
  const sortedDates = Array.from(dateSet).sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));

  // 兜底保护：若全空则提供今天
  if (sortedDates.length === 0) {
    const today = new Date().toISOString().slice(0, 10);
    sortedDates.push(today);
  }

  return {
    dates: sortedDates,
    latestDate: sortedDates[0],
    totalDates: sortedDates.length
  };
}

/**
 * 获取指定日期的批次监控状态
 */
export async function getBatchStatus(date = '2026-09-24') {
  const allDates = await getAvailableDates();

  // A. MongoDB 模式
  if (isMongoConnected) {
    try {
      let statusDoc = await BatchStatusModel.findOne({ date }).lean();
      const newsItems = await NewsItemModel.find({ batchDate: date }).lean();

      let sentimentIndex = 0;
      if (newsItems.length > 0) {
        const totalScore = newsItems.reduce((acc, curr) => acc + (curr.sentimentScore || 0), 0);
        sentimentIndex = Math.round((totalScore / newsItems.length) * 100);
      }

      if (!statusDoc) {
        statusDoc = {
          date,
          status: newsItems.length > 0 ? 'COMPLETED' : 'PENDING',
          statusText: newsItems.length > 0 ? '已完成归档' : '排队调度中',
          generatedTime: newsItems.length > 0 ? `${date} 08:30:00` : '',
          nextScheduleTime: '明日 08:30:00 (每日晨报)',
          scheduleInterval: '每 24 小时由 Gemini Spark 生成一次 (每天 08:30 AM 晨报)',
          scheduleCron: '30 8 * * *',
          estimatedRemainingMinutes: 0,
          progress: newsItems.length > 0 ? 100 : 0,
          currentStage: newsItems.length > 0 ? 'Gemini Spark 智能体 24H 简报归档完成' : '等待调度'
        };
      }

      return {
        queryDate: date,
        isToday: date === allDates[0],
        scheduleInterval: statusDoc.scheduleInterval || '每 24 小时由 Gemini Spark 生成一次 (每天 08:30 AM 晨报)',
        scheduleCron: statusDoc.scheduleCron || '30 8 * * *',
        availableDates: allDates,
        totalArchivedDays: allDates.length,
        ...statusDoc,
        batchNewsCount: newsItems.length,
        globalSentimentIndex: sentimentIndex,
        dataSource: 'MONGODB_ATLAS'
      };
    } catch (err) {
      console.warn(`[Repository] MongoDB 查询批次状态失败 (${err.message})，降级至本地处理`);
    }
  }

  // B. 本地文件/内存降级模式
  const localBriefing = readLocalBriefingFile(date);
  let statusInfo = memoryBatchStatusMap[date];

  if (localBriefing && localBriefing.batchStatus) {
    statusInfo = { ...localBriefing.batchStatus };
  } else if (!statusInfo) {
    statusInfo = localBriefing ? {
      status: 'COMPLETED',
      statusText: '已完成归档',
      generatedTime: `${date} 08:30:00`,
      nextScheduleTime: '明日 08:30:00 (每日晨报)',
      estimatedRemainingMinutes: 0,
      progress: 100,
      currentStage: 'Gemini Spark 智能体简报归档入库'
    } : {
      status: 'PENDING',
      statusText: '排队调度中',
      generatedTime: '-',
      nextScheduleTime: '明日 08:30:00 (每日晨报)',
      estimatedRemainingMinutes: 45,
      progress: 0,
      currentStage: '等待 Gemini Spark 简报摄入'
    };
  }

  const currentNews = statusInfo.status === 'COMPLETED'
    ? (localBriefing ? localBriefing.items : (memoryNewsStore[date] || []))
    : [];

  let sentimentIndex = 0;
  if (currentNews.length > 0) {
    const totalScore = currentNews.reduce((acc, curr) => acc + (curr.sentimentScore || 0), 0);
    sentimentIndex = Math.round((totalScore / currentNews.length) * 100);
  }

  return {
    queryDate: date,
    isToday: date === allDates[0],
    scheduleInterval: '每 24 小时由 Gemini Spark 生成一次 (每天 08:30 AM 晨报)',
    scheduleCron: '30 8 * * *',
    availableDates: allDates,
    totalArchivedDays: allDates.length,
    ...statusInfo,
    batchNewsCount: currentNews.length,
    globalSentimentIndex: sentimentIndex,
    dataSource: 'LOCAL_FALLBACK'
  };
}

/**
 * 获取新闻列表（支持分类、情感、搜索、分页与统计）
 */
export async function getNewsList(params = {}) {
  const {
    date = '2026-09-24',
    category = 'all',
    sentiment = 'all',
    search = '',
    page = 1,
    pageSize = 12
  } = params;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const sizeNum = Math.max(1, parseInt(pageSize, 10) || 12);
  const statusInfo = await getBatchStatus(date);

  // 若批次仍处于计算中，返回空流
  if (statusInfo.status !== 'COMPLETED') {
    return {
      items: [],
      pagination: { page: 1, pageSize: sizeNum, total: 0, totalPages: 0 },
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
    };
  }

  // A. MongoDB 模式
  if (isMongoConnected) {
    try {
      const query = { batchDate: date };

      if (category && category !== 'all') {
        query.category = category;
      }
      if (sentiment && sentiment !== 'all') {
        query.sentiment = sentiment;
      }
      if (search && search.trim()) {
        const q = search.trim();
        query.$or = [
          { title: { $regex: q, $options: 'i' } },
          { englishTitle: { $regex: q, $options: 'i' } },
          { summary: { $regex: q, $options: 'i' } },
          { source: { $regex: q, $options: 'i' } },
          { tags: { $in: [new RegExp(q, 'i')] } },
          { nlpKeyEntities: { $in: [new RegExp(q, 'i')] } }
        ];
      }

      // 获取当前日期的全量统计
      const allDayNews = await NewsItemModel.find({ batchDate: date }).lean();
      const filteredTotal = await NewsItemModel.countDocuments(query);
      const totalPages = Math.ceil(filteredTotal / sizeNum) || 1;

      // 排序与分页：critical > high > medium
      const items = await NewsItemModel.find(query)
        .sort({ impactLevel: -1, publishTime: -1 })
        .skip((pageNum - 1) * sizeNum)
        .limit(sizeNum)
        .lean();

      const total = allDayNews.length;
      const positive = allDayNews.filter(i => i.sentiment === 'positive').length;
      const neutral = allDayNews.filter(i => i.sentiment === 'neutral').length;
      const negative = allDayNews.filter(i => i.sentiment === 'negative').length;
      const avgSentimentScore = total > 0
        ? Number((allDayNews.reduce((acc, cur) => acc + cur.sentimentScore, 0) / total).toFixed(2))
        : 0;

      const categoryCounts = {
        ai: allDayNews.filter(i => i.category === 'ai').length,
        finance: allDayNews.filter(i => i.category === 'finance').length,
        geopolitics: allDayNews.filter(i => i.category === 'geopolitics').length,
        climate: allDayNews.filter(i => i.category === 'climate').length,
      };

      return {
        items,
        pagination: {
          page: pageNum,
          pageSize: sizeNum,
          total: filteredTotal,
          totalPages
        },
        batchStatus: statusInfo,
        stats: {
          total,
          positive,
          neutral,
          negative,
          avgSentimentScore,
          categoryCounts,
          batchDate: date
        }
      };
    } catch (err) {
      console.warn(`[Repository] MongoDB 查询列表失败 (${err.message})，降级至本地处理`);
    }
  }

  // B. 本地文件/内存模式
  const localBriefing = readLocalBriefingFile(date);
  let rawList = localBriefing ? [...localBriefing.items] : [...(memoryNewsStore[date] || [])];

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

  let items = rawList;
  if (category && category !== 'all') {
    items = items.filter(i => i.category === category);
  }
  if (sentiment && sentiment !== 'all') {
    items = items.filter(i => i.sentiment === sentiment);
  }
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

  // 排序
  items.sort((a, b) => {
    const weight = { critical: 3, high: 2, medium: 1 };
    const wDiff = (weight[b.impactLevel] || 0) - (weight[a.impactLevel] || 0);
    if (wDiff !== 0) return wDiff;
    return new Date(b.publishTime).getTime() - new Date(a.publishTime).getTime();
  });

  const filteredTotal = items.length;
  const totalPages = Math.ceil(filteredTotal / sizeNum) || 1;
  const startIndex = (pageNum - 1) * sizeNum;
  const paginatedItems = items.slice(startIndex, startIndex + sizeNum);

  return {
    items: paginatedItems,
    pagination: {
      page: pageNum,
      pageSize: sizeNum,
      total: filteredTotal,
      totalPages
    },
    batchStatus: statusInfo,
    stats: {
      total,
      positive,
      neutral,
      negative,
      avgSentimentScore,
      categoryCounts,
      batchDate: date
    }
  };
}

/**
 * 保存/导入 Gemini Spark 简报
 */
export async function saveBriefing(date, rawData) {
  let parsed = rawData;
  if (typeof rawData === 'string') {
    let cleaned = rawData.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    parsed = JSON.parse(cleaned);
  }

  const items = Array.isArray(parsed) ? parsed : (parsed.items || []);
  const batchStatus = Array.isArray(parsed) ? null : (parsed.batchStatus || null);

  // 1. 物理文件持久化（备份保障，Serverless 只读环境容错）
  let targetFile = null;
  try {
    if (!fs.existsSync(BRIEFINGS_DIR)) {
      fs.mkdirSync(BRIEFINGS_DIR, { recursive: true });
    }
    targetFile = path.join(BRIEFINGS_DIR, `${date}.json`);
    fs.writeFileSync(targetFile, JSON.stringify(parsed, null, 2), 'utf-8');
  } catch (fsErr) {
    console.warn(`[Repository] 本地磁盘只读或无写权限 (Serverless 生产环境)，跳过本地文件备份: ${fsErr.message}`);
  }

  // 2. 若连通 MongoDB，同步写入云端数据库
  if (isMongoConnected) {
    try {
      // Upsert 批次状态
      if (batchStatus) {
        await BatchStatusModel.findOneAndUpdate(
          { date },
          { ...batchStatus, date },
          { upsert: true, new: true }
        );
      } else {
        await BatchStatusModel.findOneAndUpdate(
          { date },
          {
            date,
            status: 'COMPLETED',
            statusText: '已完成归档',
            generatedTime: `${date} 08:30:00`,
            nextScheduleTime: '明日 08:30:00 (每日晨报)',
            batchNewsCount: items.length
          },
          { upsert: true, new: true }
        );
      }

      // 清除当天旧数据并批量插入
      await NewsItemModel.deleteMany({ batchDate: date });
      if (items.length > 0) {
        const docs = items.map((it, idx) => ({
          ...it,
          id: it.id || `gemini-${date}-${String(idx + 1).padStart(3, '0')}`,
          batchDate: date,
          source: it.source || 'Gemini Spark Intelligence',
          sourceCountry: it.sourceCountry || '全球',
          region: it.region || '全球',
          publishTime: it.publishTime || `${date} 08:30:00`,
          category: it.category || 'ai',
          impactLevel: it.impactLevel || 'high',
          sentiment: it.sentiment || 'neutral',
          sentimentScore: typeof it.sentimentScore === 'number' ? it.sentimentScore : 0
        }));
        await NewsItemModel.insertMany(docs);
      }
      console.log(`[Repository] 🚀 成功将 [${date}] ${items.length} 篇资讯同步写入 MongoDB Atlas！`);
    } catch (err) {
      console.error(`[Repository] 写入 MongoDB 失败 (${err.message})，本地文件已保存。`);
    }
  }

  return {
    date,
    filePath: targetFile,
    itemCount: items.length,
    savedToMongo: isMongoConnected
  };
}

/**
 * 切换状态调试
 */
export async function toggleBatchStatus(date = '2026-09-24', targetStatus) {
  let cur = memoryBatchStatusMap[date];
  const next = targetStatus || (cur?.status === 'COMPLETED' ? 'RUNNING' : 'COMPLETED');

  const updated = next === 'RUNNING' ? {
    status: 'RUNNING',
    statusText: '计算生成中',
    estimatedRemainingMinutes: 18,
    progress: 68,
    currentStage: '阶段 3/4: Gemini Spark 全球多源交叉校验与结构化提炼'
  } : {
    status: 'COMPLETED',
    statusText: '已完成归档',
    generatedTime: `${date} 08:30:00`,
    estimatedRemainingMinutes: 0,
    progress: 100,
    currentStage: 'Gemini Spark 智能体 24H 简报生成完成'
  };

  memoryBatchStatusMap[date] = {
    ...memoryBatchStatusMap[date],
    ...updated
  };

  if (isMongoConnected) {
    try {
      await BatchStatusModel.findOneAndUpdate({ date }, updated, { upsert: true });
    } catch (e) {
      console.error('[Repository] 更新 MongoDB 状态失败:', e);
    }
  }

  return memoryBatchStatusMap[date];
}

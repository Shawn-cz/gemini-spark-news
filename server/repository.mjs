import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { NewsItemModel } from './models/NewsItem.mjs';
import { BatchStatusModel } from './models/BatchStatus.mjs';
import { getDailyNobelQuote } from './services/nobelQuoteService.mjs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BRIEFINGS_DIR = path.resolve(__dirname, '../data/briefings');

// 内存中的动态存储与运行时缓存
const memoryNewsStore = {};
const memoryBatchStatusMap = {};

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
      syncLocalBriefingsToDatabase().catch(e => console.warn('[Repository] 自动同步本地简报异常:', e.message));
    });

    // 连通后立即执行本地未入库历史简报的幂等自动同步
    syncLocalBriefingsToDatabase().catch(e => console.warn('[Repository] 自动同步本地简报异常:', e.message));

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
 * 自动同步本地 briefings 目录下存在但 MongoDB 中尚未录入的历史或最新简报
 */
export async function syncLocalBriefingsToDatabase() {
  if (!isMongoConnected) return;
  try {
    if (!fs.existsSync(BRIEFINGS_DIR)) return;
    const files = fs.readdirSync(BRIEFINGS_DIR);
    for (const file of files) {
      const match = file.match(/^(\d{4}-\d{2}-\d{2})\.json$/);
      if (!match) continue;
      const date = match[1];
      const count = await NewsItemModel.countDocuments({ batchDate: date });
      if (count === 0) {
        const localData = readLocalBriefingFile(date);
        if (localData && Array.isArray(localData.items) && localData.items.length > 0) {
          console.log(`[Repository] 🚀 自动同步本地简报至 MongoDB Atlas: ${date} (${localData.items.length} 篇)`);
          await saveBriefing(date, {
            items: localData.items,
            batchStatus: localData.batchStatus || {
              date,
              status: 'COMPLETED',
              statusText: '已完成归档',
              generatedTime: `${date} 08:30:00`,
              nextScheduleTime: '明日 08:30:00 (每日晨报)',
              progress: 100,
              currentStage: 'Gemini Spark 智能体 24H 简报归档完成'
            },
            nobelQuote: localData.nobelQuote
          });
        }
      }
    }
  } catch (err) {
    console.warn('[Repository] 自动同步本地简报至 MongoDB Atlas 异常:', err.message);
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
      const nobelQuote = (parsed && parsed.nobelQuote) || getDailyNobelQuote(date);
      if (Array.isArray(parsed)) {
        return { items: parsed, batchStatus: null, nobelQuote };
      }
      if (parsed && Array.isArray(parsed.items)) {
        return { items: parsed.items, batchStatus: parsed.batchStatus || null, nobelQuote };
      }
    } catch (e) {
      console.error(`[Repository] 读取本地简报文件异常 (${date}):`, e);
    }
  }
  return null;
}

/**
 * 获取所有可用历史归档日期 (统一数据源)
 */
export async function getAvailableDates() {
  const res = await getAvailableBriefingDates();
  return res.dates;
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
          try {
            const content = fs.readFileSync(path.join(BRIEFINGS_DIR, file), 'utf-8');
            const parsed = JSON.parse(content);
            const items = Array.isArray(parsed) ? parsed : (parsed?.items || []);
            if (items.length > 0) {
              dateSet.add(match[1]);
            }
          } catch {
            // 忽略损坏的文件
          }
        }
      });
    }
  } catch (err) {
    console.warn('[Repository] 读取 BRIEFINGS_DIR 异常:', err.message);
  }

  // 3. 读取内存降级存储中的有效日期
  Object.keys(memoryNewsStore).forEach(d => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(d) && Array.isArray(memoryNewsStore[d]) && memoryNewsStore[d].length > 0) {
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

let cachedArchiveManifest = null;
let manifestCacheTimestamp = 0;
const MANIFEST_CACHE_TTL = 60 * 1000; // 60秒有效

/**
 * 主动使归档索引缓存失效 (在保存新简报或更新批次时调用)
 */
export function invalidateArchiveManifestCache() {
  cachedArchiveManifest = null;
  manifestCacheTimestamp = 0;
}

/**
 * 获取轻量级归档索引清单 (按年月预聚合与毫秒级内存缓存)
 */
export async function getArchiveManifest() {
  const now = Date.now();
  if (cachedArchiveManifest && (now - manifestCacheTimestamp) < MANIFEST_CACHE_TTL) {
    return cachedArchiveManifest;
  }

  const { dates, latestDate, totalDates } = await getAvailableBriefingDates();
  const yearSet = new Set();
  const monthMapByYear = {};
  const totalCountByYear = {};

  for (const d of dates) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) continue;
    const [year, month] = d.split('-');
    yearSet.add(year);
    totalCountByYear[year] = (totalCountByYear[year] || 0) + 1;

    if (!monthMapByYear[year]) monthMapByYear[year] = {};
    monthMapByYear[year][month] = (monthMapByYear[year][month] || 0) + 1;
  }

  const years = Array.from(yearSet).sort((a, b) => b.localeCompare(a));
  const formattedMonthMap = {};
  for (const y of years) {
    const months = Object.keys(monthMapByYear[y] || {}).sort((a, b) => b.localeCompare(a));
    formattedMonthMap[y] = months.map(m => ({
      month: m,
      label: `${parseInt(m, 10)}月`,
      count: monthMapByYear[y][m]
    }));
  }

  cachedArchiveManifest = {
    availableDates: dates,
    latestDate,
    totalArchivedDays: totalDates,
    years,
    monthMapByYear: formattedMonthMap,
    totalCountByYear,
    lastUpdated: new Date().toISOString()
  };
  manifestCacheTimestamp = now;

  return cachedArchiveManifest;
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

      const isFallback = (statusDoc.status !== 'COMPLETED' || newsItems.length === 0) && allDates.length > 0 && allDates[0] !== date;
      const effectiveDate = isFallback ? allDates[0] : date;

      return {
        queryDate: date,
        isToday: date === allDates[0],
        isFallback,
        effectiveDate,
        fallbackNotice: isFallback ? `[${date}] 晨报正在深度提炼中，当前为您呈现最新一期已归档智库内参 [${effectiveDate}]` : null,
        scheduleInterval: statusDoc.scheduleInterval || '每 24 小时由 Gemini Spark 生成一次 (每天 08:30 AM 晨报)',
        scheduleCron: statusDoc.scheduleCron || '30 8 * * *',
        availableDates: allDates,
        totalArchivedDays: allDates.length,
        ...statusDoc,
        batchNewsCount: newsItems.length,
        globalSentimentIndex: sentimentIndex,
        nobelQuote: statusDoc.nobelQuote || getDailyNobelQuote(date),
        dataSource: 'MONGODB_ATLAS'
      };
    } catch (err) {
      console.warn(`[Repository] MongoDB 查询批次状态失败 (${err.message})，降级至本地处理`);
    }
  }

  // B. 本地文件/内存降级模式
  const localBriefing = readLocalBriefingFile(date);
  let statusInfo = memoryBatchStatusMap[date];

  if (!statusInfo && localBriefing && localBriefing.batchStatus) {
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

  const isFallback = (statusInfo.status !== 'COMPLETED' || currentNews.length === 0) && allDates.length > 0 && allDates[0] !== date;
  const effectiveDate = isFallback ? allDates[0] : date;

  return {
    queryDate: date,
    isToday: date === allDates[0],
    isFallback,
    effectiveDate,
    fallbackNotice: isFallback ? `[${date}] 晨报正在深度提炼中，当前为您呈现最新一期已归档智库内参 [${effectiveDate}]` : null,
    scheduleInterval: '每 24 小时由 Gemini Spark 生成一次 (每天 08:30 AM 晨报)',
    scheduleCron: '30 8 * * *',
    availableDates: allDates,
    totalArchivedDays: allDates.length,
    ...statusInfo,
    batchNewsCount: currentNews.length,
    globalSentimentIndex: sentimentIndex,
    nobelQuote: (localBriefing && localBriefing.nobelQuote) || statusInfo.nobelQuote || getDailyNobelQuote(date),
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

  // 若批次仍处于计算中，或所选日期暂无有效研报，面向读者大屏提供智能穿透保底 (Always-Available Result Fallback)
  if (statusInfo.status !== 'COMPLETED') {
    if (params.strictDate === 'true' || params.strictDate === true) {
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

    // 智能穿透保底：获取系统内最近一期拥有完整资讯的有效归档日期
    const available = await getAvailableBriefingDates();
    const fallbackDate = available.dates.find(d => d !== date) || available.latestDate;
    if (fallbackDate && fallbackDate !== date) {
      const fallbackResult = await getNewsList({ ...params, date: fallbackDate, strictDate: true });
      if (fallbackResult.items && fallbackResult.items.length > 0) {
        return {
          ...fallbackResult,
          batchStatus: {
            ...statusInfo,
            isFallback: true,
            effectiveDate: fallbackDate,
            requestedDate: date,
            fallbackNotice: `[${date}] 晨报正在深度提炼中，当前为您呈现最新一期已归档智库内参 [${fallbackDate}]`
          }
        };
      }
    }
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
      let allDayNews = await NewsItemModel.find({ batchDate: date }).lean();

      if (allDayNews.length === 0 && params.strictDate !== 'true' && params.strictDate !== true) {
        // 如果 MongoDB 中无数据，先看本地文件是否存在
        const localBriefing = readLocalBriefingFile(date);
        if (localBriefing && Array.isArray(localBriefing.items) && localBriefing.items.length > 0) {
          // 本地存在，立刻同步进 MongoDB
          syncLocalBriefingsToDatabase().catch(() => {});
          // 降级至本地模式直接读取
          allDayNews = localBriefing.items;
        } else {
          // 本地也没有，穿透到最近有效归档
          const available = await getAvailableBriefingDates();
          const fallbackDate = available.dates.find(d => d !== date) || available.latestDate;
          if (fallbackDate && fallbackDate !== date) {
            const fallbackResult = await getNewsList({ ...params, date: fallbackDate, strictDate: true });
            if (fallbackResult.items && fallbackResult.items.length > 0) {
              return {
                ...fallbackResult,
                batchStatus: {
                  ...statusInfo,
                  isFallback: true,
                  effectiveDate: fallbackDate,
                  requestedDate: date,
                  fallbackNotice: `[${date}] 晨报正在深度提炼中，当前为您呈现最新一期已归档智库内参 [${fallbackDate}]`
                }
              };
            }
          }
        }
      }

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
        nobelQuote: (statusInfo && statusInfo.nobelQuote) || getDailyNobelQuote(date),
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

  if (rawList.length === 0 && params.strictDate !== 'true' && params.strictDate !== true) {
    const available = await getAvailableBriefingDates();
    const fallbackDate = available.dates.find(d => d !== date) || available.latestDate;
    if (fallbackDate && fallbackDate !== date) {
      const fallbackResult = await getNewsList({ ...params, date: fallbackDate, strictDate: true });
      if (fallbackResult.items && fallbackResult.items.length > 0) {
        return {
          ...fallbackResult,
          batchStatus: {
            ...statusInfo,
            isFallback: true,
            effectiveDate: fallbackDate,
            requestedDate: date,
            fallbackNotice: `[${date}] 晨报正在深度提炼中，当前为您呈现最新一期已归档智库内参 [${fallbackDate}]`
          }
        };
      }
    }
  }

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
    nobelQuote: (localBriefing && localBriefing.nobelQuote) || (statusInfo && statusInfo.nobelQuote) || getDailyNobelQuote(date),
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
 * 根据研报唯一 ID 检索单篇深度研报档案 (Deep-Linking 专属直达支持)
 */
export async function getNewsById(id) {
  if (!id || typeof id !== 'string') return null;
  const targetId = id.trim();

  // 1. 若连通 MongoDB，优先直接按 ID 精准查询
  if (isMongoConnected) {
    try {
      const doc = await NewsItemModel.findOne({ id: targetId }).lean();
      if (doc) return doc;
    } catch (err) {
      console.warn(`[Repository] MongoDB 按 ID 查询失败 (${err.message})，降级至本地缓存检索`);
    }
  }

  // 2. 检索内存中的所有日期批次
  for (const date of Object.keys(memoryNewsStore)) {
    const list = memoryNewsStore[date] || [];
    const item = list.find(it => it.id === targetId);
    if (item) return item;
  }

  // 3. 扫描本地 data/briefings 目录中的各期归档文件
  if (fs.existsSync(BRIEFINGS_DIR)) {
    try {
      const files = fs.readdirSync(BRIEFINGS_DIR);
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        const filePath = path.join(BRIEFINGS_DIR, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed.items)) {
          const item = parsed.items.find(it => it.id === targetId);
          if (item) return item;
        }
      }
    } catch (err) {
      console.warn('[Repository] 本地扫描查找研报 ID 异常:', err.message);
    }
  }

  return null;
}

/**
 * 跨越所有历史归档批次执行全文深度检索 (Zero-Dead-End 二级穿透)
 */
export async function searchCrossArchiveNews({ query = '', limit = 20 } = {}) {
  const trimmed = (typeof query === 'string' ? query.trim() : '');
  if (!trimmed) {
    return { query: '', total: 0, items: [] };
  }

  const qLower = trimmed.toLowerCase();
  const maxLimit = Math.min(Math.max(1, parseInt(limit, 10) || 20), 50);

  // A. MongoDB Atlas 模式
  if (isMongoConnected) {
    try {
      const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      const docs = await NewsItemModel.find({
        $or: [
          { title: regex },
          { englishTitle: regex },
          { summary: regex },
          { tags: regex },
          { nlpKeyEntities: regex }
        ]
      })
      .sort({ batchDate: -1, publishTime: -1 })
      .limit(maxLimit)
      .lean();

      const items = docs.map(d => ({
        ...d,
        briefingDate: d.batchDate || d.publishTime?.slice(0, 10) || ''
      }));

      return { query: trimmed, total: items.length, items };
    } catch (err) {
      console.warn(`[Repository] 跨期搜索 MongoDB 失败 (${err.message})，降级为本地`);
    }
  }

  // B. 本地文件/内存降级模式
  const { dates } = await getAvailableBriefingDates();
  const matched = [];

  for (const d of dates) {
    const local = readLocalBriefingFile(d);
    const list = local ? local.items : (memoryNewsStore[d] || []);
    for (const item of list) {
      const matchTitle = typeof item.title === 'string' && item.title.toLowerCase().includes(qLower);
      const matchEnTitle = typeof item.englishTitle === 'string' && item.englishTitle.toLowerCase().includes(qLower);
      const matchSummary = typeof item.summary === 'string' && item.summary.toLowerCase().includes(qLower);
      const matchTags = Array.isArray(item.tags) && item.tags.some(t => typeof t === 'string' && t.toLowerCase().includes(qLower));
      const matchEntities = Array.isArray(item.nlpKeyEntities) && item.nlpKeyEntities.some(e => typeof e === 'string' && e.toLowerCase().includes(qLower));

      if (matchTitle || matchEnTitle || matchSummary || matchTags || matchEntities) {
        matched.push({
          ...item,
          briefingDate: item.batchDate || d
        });
        if (matched.length >= maxLimit) break;
      }
    }
    if (matched.length >= maxLimit) break;
  }

  return { query: trimmed, total: matched.length, items: matched };
}

/**
 * 规范化标题用于去重（去除 [往期智库]、标点符号、空白字符并转小写）
 */
export function normalizeNewsTitle(title) {
  return (title || '')
    .replace(/^\[往期智库\]\s*/, '')
    .replace(/[\s\p{P}\p{S}]/gu, '')
    .toLowerCase();
}

/**
 * 获取指定研报在全部历史批次中的“演化脉络”关联事件时间轴 (Event Threading)
 */
export async function getNewsEventTimeline(newsId) {
  if (!newsId || typeof newsId !== 'string') {
    return { targetId: newsId || '', relatedEvents: [] };
  }
  const cleanId = newsId.trim();

  // 1. 获取目标研报详情
  let targetItem = null;
  if (isMongoConnected) {
    try {
      targetItem = await NewsItemModel.findOne({ id: cleanId }).lean();
    } catch (err) {
      console.warn(`[Repository] MongoDB 获取目标研报失败 (${err.message})`);
    }
  }

  if (!targetItem) {
    targetItem = await getNewsById(cleanId);
  }

  if (!targetItem) {
    return { targetId: cleanId, targetTitle: '', relatedEvents: [] };
  }

  const targetEntities = new Set((targetItem.nlpKeyEntities || []).map(e => String(e).toLowerCase().trim()));
  const targetTags = new Set((targetItem.tags || []).map(t => String(t).toLowerCase().trim()));
  const targetCategory = targetItem.category;
  const targetNormTitle = normalizeNewsTitle(targetItem.title);

  const candidateEvents = [];

  // 2. 跨批次匹配候选研报
  if (isMongoConnected) {
    try {
      const allDocs = await NewsItemModel.find({ id: { $ne: cleanId } }).lean();
      for (const item of allDocs) {
        // 核心去重 1：严禁与目标研报自身同名（即便存在历史跨天克隆或 [往期智库] 前缀）
        const itemNormTitle = normalizeNewsTitle(item.title);
        if (itemNormTitle === targetNormTitle) continue;

        let score = 0;
        const matchedEntities = [];

        // 实体匹配：权重 5
        for (const e of (item.nlpKeyEntities || [])) {
          const eLower = String(e).toLowerCase().trim();
          if (targetEntities.has(eLower)) {
            score += 5;
            matchedEntities.push(e);
          }
        }

        // 标签匹配：权重 3
        for (const t of (item.tags || [])) {
          const tLower = String(t).toLowerCase().trim();
          if (targetTags.has(tLower)) {
            score += 3;
          }
        }

        // 领域匹配：权重 1
        if (item.category === targetCategory) {
          score += 1;
        }

        if (score >= 3) {
          candidateEvents.push({
            id: item.id,
            title: item.title,
            englishTitle: item.englishTitle,
            category: item.category,
            impactLevel: item.impactLevel,
            sentiment: item.sentiment,
            sentimentScore: item.sentimentScore,
            briefingDate: item.batchDate || item.publishTime?.slice(0, 10) || '',
            publishTime: item.publishTime,
            relevanceScore: score,
            matchedEntities: Array.from(new Set(matchedEntities))
          });
        }
      }
    } catch (err) {
      console.warn(`[Repository] MongoDB 关联时间轴匹配失败 (${err.message})，降级为本地扫描`);
    }
  }

  // 若 MongoDB 未命中或处于本地模式
  if (candidateEvents.length === 0) {
    const { dates } = await getAvailableBriefingDates();
    for (const d of dates) {
      const briefing = readLocalBriefingFile(d);
      const items = briefing ? briefing.items : (memoryNewsStore[d] || []);
      for (const item of items) {
        if (item.id === cleanId) continue;

        // 核心去重 1：严禁与目标自身同名
        const itemNormTitle = normalizeNewsTitle(item.title);
        if (itemNormTitle === targetNormTitle) continue;

        let score = 0;
        const matchedEntities = [];

        for (const e of (item.nlpKeyEntities || [])) {
          const eLower = String(e).toLowerCase().trim();
          if (targetEntities.has(eLower)) {
            score += 5;
            matchedEntities.push(e);
          }
        }

        for (const t of (item.tags || [])) {
          const tLower = String(t).toLowerCase().trim();
          if (targetTags.has(tLower)) {
            score += 3;
          }
        }

        if (item.category === targetCategory) {
          score += 1;
        }

        if (score >= 3) {
          candidateEvents.push({
            id: item.id,
            title: item.title,
            englishTitle: item.englishTitle,
            category: item.category,
            impactLevel: item.impactLevel,
            sentiment: item.sentiment,
            sentimentScore: item.sentimentScore,
            briefingDate: item.batchDate || d,
            publishTime: item.publishTime,
            relevanceScore: score,
            matchedEntities: Array.from(new Set(matchedEntities))
          });
        }
      }
    }
  }

  // 3. 先按相关度得分排序
  candidateEvents.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // 核心去重 2：候选事件列表内部去重（相同标题仅保留相关度最高的一条，严禁在脉络中多条重复列出）
  const deduplicatedEvents = [];
  const seenCandidateTitles = new Set();

  for (const event of candidateEvents) {
    const norm = normalizeNewsTitle(event.title);
    if (!seenCandidateTitles.has(norm)) {
      seenCandidateTitles.add(norm);
      deduplicatedEvents.push(event);
      if (deduplicatedEvents.length >= 4) break;
    }
  }

  // 4. 用户指示加固：对 Top 4 结果进行二次时间排序 (按 briefingDate 降序排列)，确保时间轴连贯无跳跃
  deduplicatedEvents.sort((a, b) => b.briefingDate.localeCompare(a.briefingDate));

  return {
    targetId: cleanId,
    targetTitle: targetItem.title,
    targetDate: targetItem.batchDate || targetItem.publishTime?.slice(0, 10) || '',
    relatedEvents: deduplicatedEvents
  };
}

/**
 * 获取过去指定天数内已归档发表的所有研报标题清单（用于 Gemini Spark 每日生成排重防撞）
 */
export async function getRecentNewsTitles(days = 14) {
  const { dates } = await getAvailableBriefingDates();
  const targetDates = dates.slice(0, days);
  const titles = new Set();

  if (isMongoConnected) {
    try {
      const items = await NewsItemModel.find({ batchDate: { $in: targetDates } }, 'title').lean();
      for (const it of items) {
        if (it && it.title) titles.add(it.title.trim());
      }
      return Array.from(titles);
    } catch (e) {
      console.warn(`[Repository] MongoDB 获取排重标题清单失败: ${e.message}`);
    }
  }

  // 本地模式扫描
  for (const d of targetDates) {
    const briefing = readLocalBriefingFile(d);
    const items = briefing ? briefing.items : (memoryNewsStore[d] || []);
    for (const it of items) {
      if (it && it.title) titles.add(it.title.trim());
    }
  }

  return Array.from(titles);
}

/**
 * 跨期宏观情绪指数与核心板块热度趋势聚合 (Macro Pulse 心电图)
 */
export async function getMacroPulseTrends(days = 7) {
  const { dates } = await getAvailableBriefingDates();
  const parsedDays = parseInt(days, 10);
  const targetDays = isNaN(parsedDays) ? 7 : Math.min(Math.max(1, parsedDays), 14);
  const selectedDates = dates.slice(0, targetDays).reverse(); // 严格时间正序排列以供图表从左到右绘制

  const trends = [];

  for (const d of selectedDates) {
    let items = [];

    if (isMongoConnected) {
      try {
        items = await NewsItemModel.find({ batchDate: d }).lean();
      } catch (err) {
        console.warn(`[Repository] MongoDB 获取 [${d}] 批次聚合失败 (${err.message})，降级为本地`);
        isMongoConnected = false;
      }
    }

    if (items.length === 0) {
      const briefing = readLocalBriefingFile(d);
      items = briefing ? briefing.items : (memoryNewsStore[d] || []);
    }

    let positive = 0, neutral = 0, negative = 0, totalScore = 0;
    const catCounts = { ai: 0, finance: 0, geopolitics: 0, climate: 0 };

    for (const item of items) {
      if (item.sentiment === 'positive') positive++;
      else if (item.sentiment === 'negative') negative++;
      else neutral++;

      totalScore += (typeof item.sentimentScore === 'number' ? item.sentimentScore : 0);
      if (item.category && item.category in catCounts) {
        catCounts[item.category]++;
      }
    }

    const total = items.length;
    const avgScore = total > 0 ? (totalScore / total) : 0;
    // 将 -1 ~ +1 映射为 0 ~ 100 指数 (0分对应50)
    const sentimentIndex = Math.min(100, Math.max(0, Math.round(50 + (avgScore * 50))));

    trends.push({
      date: d,
      total,
      avgSentimentScore: Number(avgScore.toFixed(2)),
      sentimentIndex,
      distribution: { positive, neutral, negative },
      categoryCounts: catCounts
    });
  }

  if (trends.length === 0) {
    const today = new Date().toISOString().slice(0, 10);
    trends.push({
      date: today,
      total: 0,
      avgSentimentScore: 0,
      sentimentIndex: 50,
      distribution: { positive: 0, neutral: 0, negative: 0 },
      categoryCounts: { ai: 0, finance: 0, geopolitics: 0, climate: 0 }
    });
  }

  const latestIndex = trends[trends.length - 1].sentimentIndex;
  const prevIndex = trends.length > 1 ? trends[trends.length - 2].sentimentIndex : latestIndex;
  const delta = Number((latestIndex - prevIndex).toFixed(1));

  return {
    days: trends.length,
    trends,
    summary: {
      latestIndex,
      deltaFromPrevious: delta,
      overallMood: latestIndex >= 60 ? '积极向好' : latestIndex <= 40 ? '避险谨慎' : '平衡中性'
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
  const nobelQuote = (parsed && parsed.nobelQuote) ? parsed.nobelQuote : getDailyNobelQuote(date);

  const payloadToSave = Array.isArray(parsed)
    ? { batchDate: date, items: parsed, nobelQuote }
    : { ...parsed, nobelQuote };

  // 更新内存中的降级存储
  memoryNewsStore[date] = items;
  memoryBatchStatusMap[date] = {
    date,
    status: batchStatus?.status || 'COMPLETED',
    statusText: batchStatus?.statusText || '已完成归档',
    generatedTime: batchStatus?.generatedTime || `${date} 08:30:00`,
    nextScheduleTime: batchStatus?.nextScheduleTime || '明日 08:30:00 (每日晨报)',
    progress: typeof batchStatus?.progress === 'number' ? batchStatus.progress : 100,
    currentStage: batchStatus?.currentStage || 'Gemini Spark 智能体 24H 简报生成与交叉校验完成',
    batchNewsCount: items.length,
    nobelQuote
  };

  // 1. 物理文件持久化（备份保障，Serverless 只读环境容错）
  let targetFile = null;
  try {
    if (!fs.existsSync(BRIEFINGS_DIR)) {
      fs.mkdirSync(BRIEFINGS_DIR, { recursive: true });
    }
    targetFile = path.join(BRIEFINGS_DIR, `${date}.json`);
    fs.writeFileSync(targetFile, JSON.stringify(payloadToSave, null, 2), 'utf-8');
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
          { ...batchStatus, date, nobelQuote },
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
            batchNewsCount: items.length,
            nobelQuote
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

  // 主动刷新轻量归档清单缓存
  invalidateArchiveManifestCache();

  return {
    date,
    filePath: targetFile,
    itemCount: items.length,
    savedToMongo: isMongoConnected,
    nobelQuote
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

  // 同时也同步更新本地文件，确保无论是否连接 Mongo 都保持状态一致
  const filePath = path.join(BRIEFINGS_DIR, `${date}.json`);
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object') {
        parsed.batchStatus = { ...(parsed.batchStatus || {}), ...updated, date };
        fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2), 'utf-8');
      }
    } catch (e) {
      console.error('[Repository] 更新本地简报文件状态异常:', e);
    }
  }

  invalidateArchiveManifestCache();

  return memoryBatchStatusMap[date];
}

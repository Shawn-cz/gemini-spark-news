import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { apiRateLimiter, adminRateLimiter } from './middleware/rateLimiter.mjs';
import { adminAuthGuard, safeCompare, getEffectiveAdminKey } from './middleware/adminAuth.mjs';
import {
  initDatabase,
  getDataSourceInfo,
  getBatchStatus,
  getNewsList,
  getNewsById,
  saveBriefing,
  toggleBatchStatus,
  getAvailableBriefingDates
} from './repository.mjs';
import {
  getActiveModel,
  setActiveModel,
  getAvailableModels
} from './services/geminiSparkAgent.mjs';
import {
  addSSEClient,
  removeSSEClient,
  broadcastSSEMessage
} from './services/sseManager.mjs';
import {
  triggerGenerationPipeline,
  getSchedulerStatus,
  startDailyScheduler
} from './services/scheduler.mjs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  frameguard: { action: 'deny' },
  hidePoweredBy: true
}));

const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // 允许任何无 origin 请求 (同源/服务端/curl)、所有 .vercel.app 域名、本地开发域名、以及显式配置的域名
    if (!origin || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    try {
      const url = new URL(origin);
      if (
        url.hostname === 'localhost' ||
        url.hostname === '127.0.0.1' ||
        url.hostname.endsWith('.vercel.app') ||
        allowedOrigins.includes(origin) ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true);
      }
    } catch {
      // url parse fallback
    }
    return callback(null, true); // 开放公网大屏只读 API 跨域放行
  },
  credentials: true
}));

app.use(express.json());
app.use(express.text({ type: ['text/plain', 'text/markdown'], limit: '2mb' }));
app.use('/api', apiRateLimiter);

// 接口 0: 健康检查与云原生容器探针 (PaaS Liveness & Readiness Probe)
app.get('/api/health', (req, res) => {
  const schedulerStatus = getSchedulerStatus();
  const activeModel = getActiveModel();
  const dataSource = getDataSourceInfo();
  res.json({
    code: 200,
    status: 'UP',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    activeModel,
    scheduler: {
      status: schedulerStatus.isGenerating ? 'generating' : 'idle',
      lastBatchDate: schedulerStatus.currentGeneratingDate ?? null,
      nextScheduleTime: '08:30 (每日晨报)'
    },
    data: {
      ...dataSource,
      scheduler: schedulerStatus,
      activeModel
    }
  });
});

// 接口 1: 获取全球批次监控与情绪极性指标
app.get('/api/spark/batch-status', async (req, res) => {
  try {
    const { date = '2026-09-24' } = req.query;
    const data = await getBatchStatus(date);
    res.json({
      code: 200,
      message: 'success',
      data
    });
  } catch (err) {
    console.error('[API] /api/spark/batch-status error:', err);
    res.status(500).json({ code: 500, message: err.message });
  }
});

// 接口 1.5: 获取系统内所有可用简报日期列表
app.get('/api/spark/available-dates', async (req, res) => {
  try {
    const data = await getAvailableBriefingDates();
    res.json({
      code: 200,
      message: 'success',
      data
    });
  } catch (err) {
    console.error('[API] /api/spark/available-dates error:', err);
    res.status(500).json({ code: 500, message: err.message });
  }
});

// 接口 2: 获取全球资讯 (支持 category、sentiment、search、分页与统计)
app.get('/api/news', async (req, res) => {
  try {
    const data = await getNewsList(req.query);
    res.json({
      code: 200,
      message: 'success',
      data
    });
  } catch (err) {
    console.error('[API] /api/news error:', err);
    res.status(500).json({ code: 500, message: err.message });
  }
});

// 接口 2.1: 按 ID 获取单篇全球智库研报档案 (Deep-Linking 专属直达支持)
app.get('/api/news/:id', async (req, res) => {
  try {
    const item = await getNewsById(req.params.id);
    if (!item) {
      return res.status(404).json({
        code: 404,
        message: '未找到指定研报档案',
        data: null
      });
    }
    res.json({
      code: 200,
      message: 'success',
      data: item
    });
  } catch (err) {
    console.error('[API] /api/news/:id error:', err);
    res.status(500).json({ code: 500, message: err.message });
  }
});

// 接口 3: 调试模拟 - 切换批次状态 (COMPLETED <-> RUNNING)
app.post('/api/spark/toggle-status', async (req, res) => {
  try {
    const { date = '2026-09-24', status } = req.body;
    const updated = await toggleBatchStatus(date, status);
    res.json({
      code: 200,
      message: `已将 [${date}] 简报状态更新为: ${updated.statusText}`,
      data: updated
    });
  } catch (err) {
    console.error('[API] /api/spark/toggle-status error:', err);
    res.status(500).json({ code: 500, message: err.message });
  }
});

// 接口 4: 保存/导入指定日期的 Gemini Spark 简报
app.post('/api/briefings/save', async (req, res) => {
  try {
    const { date, data } = req.body;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ code: 400, message: '日期格式必须为 YYYY-MM-DD' });
    }
    if (!data) {
      return res.status(400).json({ code: 400, message: '简报数据不能为空' });
    }

    const result = await saveBriefing(date, data);
    res.json({
      code: 200,
      message: `成功保存 [${date}] 简报`,
      data: result
    });
  } catch (err) {
    console.error('[API] /api/briefings/save error:', err);
    res.status(500).json({ code: 500, message: `保存失败: ${err.message}` });
  }
});

/**
 * 广播 SSE 事件辅助函数
 */
function broadcastSSEEvent(type, payload) {
  broadcastSSEMessage({
    type,
    ...(typeof payload === 'object' ? payload : { data: payload })
  });
}

/**
 * 智能提取并清洗 Gemini 产出的文本或对象
 */
function extractAndParseBriefingPayload(body) {
  if (!body) throw new Error('请求体不能为空');

  // 1. 如果直接传入合法的简报对象且包含 items
  if (typeof body === 'object' && Array.isArray(body.items)) {
    return body;
  }

  // 2. 如果包含 rawContent 或 body 本身是字符串
  let text = typeof body === 'string' ? body : (body.rawContent || body.content || '');
  if (!text || typeof text !== 'string') {
    throw new Error('未提供有效的 JSON 对象或文本内容');
  }

  // 3. 提取 ```json 代码块
  const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = text.match(jsonBlockRegex);
  const targetJsonStr = match ? match[1].trim() : text.trim();

  // 4. 解析 JSON
  try {
    const parsed = JSON.parse(targetJsonStr);
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('解析结果不是有效的 JSON 对象');
    }
    return parsed;
  } catch (err) {
    throw new Error(`JSON 解析失败: ${err.message}`);
  }
}

// 接口 4.5: 专为 Gemini Spark 定时智能体设计的外部 Webhook 自动摄取端点
app.post('/api/spark/webhook/ingest', adminRateLimiter, async (req, res) => {
  // 双模鉴权：支持 Header 'X-Admin-Key' 与 Query '?key='
  const clientKey = req.headers['x-admin-key'] || req.query.key;
  const configuredKey = getEffectiveAdminKey();

  if (!configuredKey || typeof configuredKey !== 'string') {
    return res.status(500).json({ code: 500, message: '服务器未配置 ADMIN_KEY' });
  }

  if (!clientKey || typeof clientKey !== 'string') {
    return res.status(401).json({ code: 401, message: '缺少鉴权密钥 (X-Admin-Key 或 ?key=)' });
  }

  if (!safeCompare(clientKey.trim(), configuredKey.trim())) {
    return res.status(401).json({ code: 401, message: '鉴权密钥无效' });
  }

  let parsedData;
  let targetDate;

  // 阶段 1: 载荷提取、解析与格式校验 (失败统一返回 HTTP 400)
  try {
    parsedData = extractAndParseBriefingPayload(req.body);

    if (!Array.isArray(parsedData.items) || parsedData.items.length === 0) {
      return res.status(400).json({ code: 400, message: '简报数据必须包含至少一条 items 资讯' });
    }

    // 自动推导批次归档日期
    targetDate = (typeof req.body === 'object' && req.body !== null ? req.body.date : undefined) || parsedData.date;
    if (!targetDate && parsedData.batchStatus?.generatedTime) {
      const match = parsedData.batchStatus.generatedTime.match(/^\d{4}-\d{2}-\d{2}/);
      if (match) targetDate = match[0];
    }
    if (!targetDate && parsedData.items[0]?.publishTime) {
      const match = parsedData.items[0].publishTime.match(/^\d{4}-\d{2}-\d{2}/);
      if (match) targetDate = match[0];
    }
    if (!targetDate) {
      targetDate = new Date().toISOString().slice(0, 10);
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      return res.status(400).json({ code: 400, message: `日期格式错误: ${targetDate}，必须为 YYYY-MM-DD` });
    }
  } catch (err) {
    console.error('[Webhook] Ingest parse/validation error:', err);
    return res.status(400).json({ code: 400, message: err.message });
  }

  // 阶段 2: 数据入库持久化与全网客户端推流 (失败统一返回 HTTP 500)
  try {
    // 持久化落盘 (自动写入 MongoDB Atlas 及本地双写保底)
    const saveResult = await saveBriefing(targetDate, parsedData);

    // 通过 SSE 向全网在线客户端广播更新事件
    broadcastSSEEvent('COMPLETED', {
      type: 'COMPLETED',
      stage: 'COMPLETED',
      progress: 100,
      message: `Gemini Spark [${targetDate}] 最新简报已成功摄取入库`,
      data: {
        date: targetDate,
        total: parsedData.items.length,
        source: 'webhook'
      }
    });

    return res.json({
      code: 200,
      message: `[${targetDate}] Gemini Spark 简报摄取成功并已广播`,
      data: {
        date: targetDate,
        total: parsedData.items.length,
        saveResult
      }
    });
  } catch (err) {
    console.error('[Webhook] Ingest persistence/server error:', err);
    return res.status(500).json({ code: 500, message: `简报摄取入库失败: ${err.message}` });
  }
});

// 接口 5: 获取可用 Gemini 模型列表与当前激活模型
app.get('/api/spark/models', (req, res) => {
  res.json({
    code: 200,
    message: 'success',
    data: {
      current: getActiveModel(),
      available: getAvailableModels()
    }
  });
});

// 接口 6: 热切换当前使用的 Gemini 模型
app.post('/api/spark/models/select', adminRateLimiter, adminAuthGuard, (req, res) => {
  try {
    const { model } = req.body || {};
    if (!model) {
      return res.status(400).json({ code: 400, message: '缺少 model 参数' });
    }
    const result = setActiveModel(model);
    res.json({
      code: 200,
      message: `模型已热切换为: ${model}`,
      data: result
    });
  } catch (err) {
    res.status(400).json({ code: 400, message: err.message });
  }
});

// 接口 7: 手动触发 Gemini Spark 生产流
app.post('/api/spark/trigger-generate', adminRateLimiter, adminAuthGuard, async (req, res) => {
  try {
    const { date = new Date().toISOString().slice(0, 10) } = req.body || {};
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ code: 400, message: '日期格式错误，必须为 YYYY-MM-DD' });
    }
    const result = await triggerGenerationPipeline(date);
    if (result.conflict) {
      return res.status(409).json({ code: 409, message: result.message, data: result });
    }
    res.json({
      code: 200,
      message: `[${date}] 简报生成成功`,
      data: result
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: `生成失败: ${err.message}` });
  }
});

// 接口 7.5: 专为 Vercel Cron 及定时调度设计的云端自动化触发端点 (支持 GET，匹配 Vercel Cron 规范)
app.get('/api/spark/cron', async (req, res) => {
  const clientKey = req.query.key || req.headers['x-admin-key'];
  const configuredKey = getEffectiveAdminKey();
  const isVercelCron = req.headers['x-vercel-cron'] === '1' || req.headers['user-agent']?.includes('vercel-cron');

  // 安全校验：放行 Vercel 官方定时唤醒机制 或 携带有效密钥的外部请求
  if (!isVercelCron) {
    if (!clientKey || !safeCompare(clientKey.trim(), configuredKey.trim())) {
      return res.status(401).json({ code: 401, message: 'Cron 触发密钥无效或未授权' });
    }
  }

  try {
    const targetDate = req.query.date || new Date().toISOString().slice(0, 10);
    console.log(`[Cron] ⏰ 接收到定时调度任务，准备生成 [${targetDate}] 晨报...`);
    const result = await triggerGenerationPipeline(targetDate);
    return res.json({
      code: 200,
      message: `[${targetDate}] Vercel Cron 定时生成任务执行成功`,
      data: result
    });
  } catch (err) {
    console.error('[Cron] 定时调度失败:', err);
    return res.status(500).json({ code: 500, message: `Cron 任务异常: ${err.message}` });
  }
});

// 接口 8: 原生 SSE 实时流推流端点
app.get('/api/spark/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const clientId = addSSEClient(res);
  console.log(`[SSE] 客户端 #${clientId} 已挂载推流通道`);

  req.on('close', () => {
    removeSSEClient(clientId);
    console.log(`[SSE] 客户端 #${clientId} 断开连接`);
  });
});

// 针对未匹配的 /api/* 路由统一返回规范 JSON 404
app.all('/api/*', (req, res) => {
  res.status(404).json({
    code: 404,
    message: `API 接口不存在: ${req.method} ${req.originalUrl || req.url}`,
    timestamp: new Date().toISOString()
  });
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '..', 'dist');

if (process.env.NODE_ENV === 'production') {
  if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    console.warn('[GATEWAY WARNING] 生产环境已就绪，但未检测到前端构建产物 dist/ 目录！');
  }
}

export { app };

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (isDirectRun && process.env.NODE_ENV !== 'test') {
  initDatabase().finally(() => {
    startDailyScheduler();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[Gemini Spark Intelligence API] Running on http://0.0.0.0:${PORT} (env: ${process.env.NODE_ENV || 'development'})`);
    });
  });
}

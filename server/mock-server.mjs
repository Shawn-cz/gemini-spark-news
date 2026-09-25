import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import {
  initDatabase,
  getDataSourceInfo,
  getBatchStatus,
  getNewsList,
  saveBriefing,
  toggleBatchStatus
} from './repository.mjs';
import {
  getActiveModel,
  setActiveModel,
  getAvailableModels
} from './services/geminiSparkAgent.mjs';
import {
  addSSEClient,
  removeSSEClient
} from './services/sseManager.mjs';
import {
  triggerGenerationPipeline,
  getSchedulerStatus,
  startDailyScheduler
} from './services/scheduler.mjs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// 接口 0: 健康检查与底层数据源探针
app.get('/api/health', (req, res) => {
  res.json({
    code: 200,
    message: 'ok',
    data: {
      ...getDataSourceInfo(),
      scheduler: getSchedulerStatus(),
      activeModel: getActiveModel()
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
app.post('/api/spark/models/select', (req, res) => {
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
app.post('/api/spark/trigger-generate', async (req, res) => {
  try {
    const { date = new Date().toISOString().slice(0, 10) } = req.body || {};
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

// 接口 8: 原生 SSE 实时流推流端点
app.get('/api/spark/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const clientId = addSSEClient(res);
  console.log(`[SSE] 客户端 #${clientId} 已挂载推流通道`);

  req.on('close', () => {
    removeSSEClient(clientId);
    console.log(`[SSE] 客户端 #${clientId} 断开连接`);
  });
});

export { app };

if (process.env.NODE_ENV !== 'test') {
  initDatabase().finally(() => {
    startDailyScheduler();
    app.listen(PORT, () => {
      console.log(`[Gemini Spark Intelligence API] Running on http://localhost:${PORT}`);
    });
  });
}

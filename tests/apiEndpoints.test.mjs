import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import http from 'node:http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 确保在导入 mock-server 之前设置 NODE_ENV=test，防止独立监听端口
process.env.NODE_ENV = 'test';
const { app } = await import('../server/mock-server.mjs');
const { getEffectiveAdminKey } = await import('../server/middleware/adminAuth.mjs');
const adminKey = getEffectiveAdminKey();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BRIEFINGS_DIR = path.resolve(__dirname, '../data/briefings');

// 顶层异步启动测试服务 (监听临时可用端口 0)
const server = http.createServer(app);
await new Promise((resolve) => {
  server.listen(0, '127.0.0.1', resolve);
});
const port = server.address().port;
const baseUrl = `http://127.0.0.1:${port}`;

after(async () => {
  await new Promise((resolve) => {
    server.close(resolve);
  });
});

test('API Endpoints - GET /api/spark/models 返回 200 与可用模型列表', async () => {
  const res = await fetch(`${baseUrl}/api/spark/models`);
  assert.equal(res.status, 200);

  const json = await res.json();
  assert.equal(json.code, 200);
  assert.equal(json.message, 'success');
  assert.ok(json.data.current, '应当存在 current 字段');
  assert.ok(Array.isArray(json.data.available), 'available 应当是数组');
  assert.ok(json.data.available.length >= 2, '应当提供官方认证模型');

  const modelIds = json.data.available.map((m) => m.id);
  assert.ok(modelIds.includes('gemini-3.8-flash'));
  assert.ok(modelIds.includes('gemini-3.1-pro'));
});

test('API Endpoints - POST /api/spark/models/select 热切换模型并拒绝非法模型', async () => {
  // 1. 成功切换到 gemini-3.1-pro
  const switchRes = await fetch(`${baseUrl}/api/spark/models/select`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Key': adminKey
    },
    body: JSON.stringify({ model: 'gemini-3.1-pro' })
  });
  assert.equal(switchRes.status, 200);
  const switchData = await switchRes.json();
  assert.equal(switchData.code, 200);
  assert.equal(switchData.data.model.id, 'gemini-3.1-pro');

  // 验证当前模型状态已被同步
  const verifyRes = await fetch(`${baseUrl}/api/spark/models`);
  const verifyData = await verifyRes.json();
  assert.equal(verifyData.data.current, 'gemini-3.1-pro');

  // 2. 拒绝不支持的非法模型 (返回 400)
  const invalidRes = await fetch(`${baseUrl}/api/spark/models/select`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Key': adminKey
    },
    body: JSON.stringify({ model: 'unknown-future-model' })
  });
  assert.equal(invalidRes.status, 400);
  const invalidData = await invalidRes.json();
  assert.equal(invalidData.code, 400);
  assert.ok(invalidData.message.includes('不支持') || invalidData.message.includes('非法'));

  // 3. 拒绝缺少 model 参数的请求 (返回 400)
  const missingRes = await fetch(`${baseUrl}/api/spark/models/select`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Key': adminKey
    },
    body: JSON.stringify({})
  });
  assert.equal(missingRes.status, 400);

  // 4. 切回默认模型 gemini-3.8-flash
  const resetRes = await fetch(`${baseUrl}/api/spark/models/select`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Key': adminKey
    },
    body: JSON.stringify({ model: 'gemini-3.8-flash' })
  });
  assert.equal(resetRes.status, 200);
});

test('API Endpoints - POST /api/spark/trigger-generate 触发生成工作流并返回 200', async () => {
  const targetDate = '2026-09-25';
  const briefingFile = path.join(BRIEFINGS_DIR, `${targetDate}.json`);
  const originalContent = fs.existsSync(briefingFile) ? fs.readFileSync(briefingFile, 'utf-8') : null;

  try {
    const res = await fetch(`${baseUrl}/api/spark/trigger-generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': adminKey
      },
      body: JSON.stringify({ date: targetDate })
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.code, 200);
    assert.equal(json.data.success, true);
    assert.equal(json.data.date, targetDate);
    assert.ok(json.data.itemCount >= 8);
  } finally {
    if (originalContent !== null) {
      fs.writeFileSync(briefingFile, originalContent, 'utf-8');
    } else if (fs.existsSync(briefingFile)) {
      fs.unlinkSync(briefingFile);
    }
  }
});

test('API Endpoints - GET /api/spark/stream 建立 SSE 连接并接收初始 CONNECTED 事件', async () => {
  await new Promise((resolve, reject) => {
    const req = http.get(`${baseUrl}/api/spark/stream`, (res) => {
      assert.equal(res.statusCode, 200);
      assert.ok(res.headers['content-type'].includes('text/event-stream'));

      let handled = false;
      res.on('data', (chunk) => {
        if (handled) return;
        const text = chunk.toString();
        if (text.includes('CONNECTED')) {
          handled = true;
          const line = text.split('\n\n')[0].replace(/^data: /, '').trim();
          const payload = JSON.parse(line);
          assert.equal(payload.type, 'CONNECTED');
          assert.ok(payload.clientId);
          assert.equal(payload.message, 'Gemini Spark SSE Stream Connected');

          // 断开连接以测试清理逻辑
          req.destroy();
          resolve();
        }
      });
    });

    req.on('error', (err) => {
      if (req.destroyed) return;
      reject(err);
    });
  });
});

test('API Endpoints - GET /api/health 返回完整容器健康探针与调度状态', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);

  const json = await res.json();
  assert.equal(json.code, 200);
  assert.equal(json.status, 'UP');
  assert.equal(json.version, '1.0.0');
  assert.ok(typeof json.environment === 'string');
  assert.ok(typeof json.uptime === 'number');
  assert.ok(json.timestamp);
  assert.ok(json.activeModel);
  assert.ok(json.scheduler);
  assert.ok(['generating', 'idle'].includes(json.scheduler.status));

  // 兼顾已有契约
  assert.ok(json.data.mode);
  assert.ok(json.data.activeModel);
  assert.ok(json.data.scheduler);
  assert.equal(typeof json.data.scheduler.isGenerating, 'boolean');
});

test('API Endpoints - GET /api/news/:id 支持单篇研报精准直达查询 (Deep-Linking)', async () => {
  // 1. 先从列表获取一个有效的新闻条目 ID
  const listRes = await fetch(`${baseUrl}/api/news?date=2026-09-24`);
  assert.equal(listRes.status, 200);
  const listJson = await listRes.json();
  assert.ok(listJson.data.items.length > 0);
  const targetItem = listJson.data.items[0];

  // 2. 测试通过 ID 查询该条研报
  const itemRes = await fetch(`${baseUrl}/api/news/${targetItem.id}`);
  assert.equal(itemRes.status, 200);
  const itemJson = await itemRes.json();
  assert.equal(itemJson.code, 200);
  assert.equal(itemJson.data.id, targetItem.id);
  assert.equal(itemJson.data.title, targetItem.title);

  // 3. 测试不存在的 ID 返回 404
  const notFoundRes = await fetch(`${baseUrl}/api/news/non-existent-id-99999`);
  assert.equal(notFoundRes.status, 404);
  const notFoundJson = await notFoundRes.json();
  assert.equal(notFoundJson.code, 404);
});

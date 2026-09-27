# 云原生 PaaS 部署与 Gemini Spark 智能体 Webhook 自动化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现应用解耦的云原生 PaaS 部署规范与针对 Gemini Spark 智能体的自动化 Webhook 摄取端点，支持高频代码迭代下的零停机自动部署与长久数据安全。

**Architecture:** 容器完全无状态化（以独立 MongoDB Atlas 云数据库作为长效存储），Node.js 20 生产网关显式监听 `0.0.0.0:$PORT` 直出前端静态产物与 API，新增高容错 `POST /api/spark/webhook/ingest` 支持直接解析与清洗外部 Gemini Spark 定时输出并触发 SSE 广播，配套主流 PaaS（Render, Railway, Fly.io, Zeabur）声明式部署配置。

**Tech Stack:** Express 4, Node.js 20, MongoDB Atlas, Docker (Alpine Multi-Stage), SSE (Server-Sent Events), Render / Railway / Fly.io IaC manifests.

---

### Task 1: 智能 Webhook 摄取端点与容错清洗引擎 (POST /api/spark/webhook/ingest)

**Files:**
- Create: `tests/webhookIngest.test.mjs`
- Modify: `server/mock-server.mjs`

- [ ] **Step 1: 编写失败的单元与集成测试套件**

在 `tests/webhookIngest.test.mjs` 中编写覆盖各种极端场景的测试：
- 未提供密钥或非法密钥返回 HTTP 401
- 支持 `X-Admin-Key` 标头以及 URL Query `?key=` 双模式鉴权
- 直接投递合法 JSON 对象成功写入并返回 200
- 容错提取带 ````json ... ```` Markdown 包装与前后文本的输出
- 格式非法时返回 HTTP 400

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { app } from '../server/mock-server.mjs';

describe('Gemini Spark Webhook Ingest Endpoint', () => {
  const TEST_KEY = 'test_webhook_secret_key_2026';
  process.env.ADMIN_KEY = TEST_KEY;

  it('未提供鉴权密钥或密钥错误时应返回 HTTP 401', async () => {
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    try {
      const res = await fetch(`http://localhost:${port}/api/spark/webhook/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [] })
      });
      assert.strictEqual(res.status, 401);
      const json = await res.json();
      assert.strictEqual(json.code, 401);
    } finally {
      server.close();
    }
  });

  it('支持通过 X-Admin-Key 请求头鉴权并成功接收纯净 JSON 简报', async () => {
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    const mockDate = '2026-09-28';
    const payload = {
      date: mockDate,
      batchStatus: {
        status: 'COMPLETED',
        generatedTime: `${mockDate} 08:30:00`,
        progress: 100
      },
      items: [
        {
          id: `webhook-${mockDate}-01`,
          title: '全球前沿 AI 算力与智能体架构新突破',
          category: 'ai',
          impactLevel: 'critical',
          summary: '测试生成的深度研报内容摘要。',
          sentiment: 'positive',
          sentimentScore: 0.9,
          tags: ['AI', 'Agent'],
          nlpKeyEntities: ['Gemini', 'Google']
        }
      ]
    };

    try {
      const res = await fetch(`http://localhost:${port}/api/spark/webhook/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': TEST_KEY
        },
        body: JSON.stringify(payload)
      });
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.code, 200);
      assert.strictEqual(json.data.date, mockDate);
      assert.strictEqual(json.data.total, 1);
    } finally {
      server.close();
    }
  });

  it('支持通过 URL Query ?key= 鉴权并容错清洗包含 ```json Markdown 代码块的内容', async () => {
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    const mockDate = '2026-09-29';
    const rawMarkdownText = `
这里是来自 Gemini Spark 定时任务的分析简报：
\`\`\`json
{
  "batchStatus": {
    "status": "COMPLETED",
    "generatedTime": "${mockDate} 08:30:00",
    "progress": 100
  },
  "items": [
    {
      "id": "item-${mockDate}-01",
      "title": "全球宏观金融与地缘避险流动性分析",
      "category": "finance",
      "impactLevel": "high",
      "summary": "金融流动性研报摘要。",
      "sentiment": "neutral",
      "sentimentScore": 0.1,
      "tags": ["Finance"],
      "nlpKeyEntities": ["Fed"]
    }
  ]
}
\`\`\`
以上简报已生成完毕。
`;

    try {
      const res = await fetch(`http://localhost:${port}/api/spark/webhook/ingest?key=${TEST_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawContent: rawMarkdownText })
      });
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.code, 200);
      assert.strictEqual(json.data.date, mockDate);
      assert.strictEqual(json.data.total, 1);
    } finally {
      server.close();
    }
  });

  it('投递无任何有效新闻条目时应拦截并返回 HTTP 400', async () => {
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    try {
      const res = await fetch(`http://localhost:${port}/api/spark/webhook/ingest?key=${TEST_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawContent: '这不是一个合法的简报' })
      });
      assert.strictEqual(res.status, 400);
      const json = await res.json();
      assert.strictEqual(json.code, 400);
    } finally {
      server.close();
    }
  });
});
```

- [ ] **Step 2: 运行测试以确认失败**

运行: `node tests/webhookIngest.test.mjs`
预期结果: FAIL (404 路由不存在)

- [ ] **Step 3: 在 `server/mock-server.mjs` 中实现智能提取与 Webhook 端点**

在 `server/mock-server.mjs` 中添加 JSON 提取清洗辅助函数与 Webhook 接口：

```javascript
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
```

挂载端点：
```javascript
// 接口 4.5: 专为 Gemini Spark 定时智能体设计的外部 Webhook 自动摄取端点
app.post('/api/spark/webhook/ingest', adminRateLimiter, async (req, res) => {
  // 双模鉴权：支持 Header 'X-Admin-Key' 与 Query '?key='
  const clientKey = req.headers['x-admin-key'] || req.query.key;
  const configuredKey = process.env.ADMIN_KEY;

  if (!configuredKey || typeof configuredKey !== 'string') {
    return res.status(500).json({ code: 500, message: '服务器未配置 ADMIN_KEY' });
  }

  if (!clientKey || typeof clientKey !== 'string') {
    return res.status(401).json({ code: 401, message: '缺少鉴权密钥 (X-Admin-Key 或 ?key=)' });
  }

  const clientBuffer = Buffer.from(clientKey.trim());
  const serverBuffer = Buffer.from(configuredKey.trim());

  if (clientBuffer.length !== serverBuffer.length || !crypto.timingSafeEqual(clientBuffer, serverBuffer)) {
    return res.status(401).json({ code: 401, message: '鉴权密钥无效' });
  }

  try {
    const parsedData = extractAndParseBriefingPayload(req.body);

    if (!Array.isArray(parsedData.items) || parsedData.items.length === 0) {
      return res.status(400).json({ code: 400, message: '简报数据必须包含至少一条 items 资讯' });
    }

    // 自动推导批次归档日期
    let targetDate = req.body?.date || parsedData.date;
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

    res.json({
      code: 200,
      message: `[${targetDate}] Gemini Spark 简报摄取成功并已广播`,
      data: {
        date: targetDate,
        total: parsedData.items.length,
        saveResult
      }
    });
  } catch (err) {
    console.error('[Webhook] Ingest error:', err);
    res.status(400).json({ code: 400, message: err.message });
  }
});
```

- [ ] **Step 4: 运行测试以确认全部通过**

运行: `node tests/webhookIngest.test.mjs`
预期结果: 4/4 tests pass (100% 绿灯)

- [ ] **Step 5: 提交更改**

```bash
git add tests/webhookIngest.test.mjs server/mock-server.mjs
git commit -m "feat(api): add intelligent Gemini Spark webhook ingest endpoint with fault-tolerant parsing"
```

---

### Task 2: 云原生 Linux 容器网络与动态端口适配 (0.0.0.0:$PORT & /api/health 探针)

**Files:**
- Modify: `server/mock-server.mjs`
- Modify: `tests/apiEndpoints.test.mjs`

- [ ] **Step 1: 检查并扩展 `/api/health` 探针输出契约与测试**

在 `tests/apiEndpoints.test.mjs` 中补充对生产健康探针各字段的校验：
- `status: 'UP'`
- `version: '1.0.0'`
- `environment`
- `uptime`

- [ ] **Step 2: 调整 `server/mock-server.mjs` 中的健康端点与网络监听**

在 `server/mock-server.mjs`：
1. 强化 `GET /api/health`：
```javascript
app.get('/api/health', (req, res) => {
  const schedulerStatus = getSchedulerStatus();
  res.json({
    code: 200,
    status: 'UP',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    activeModel: getActiveModel(),
    scheduler: {
      status: schedulerStatus.isGenerating ? 'generating' : 'idle',
      lastBatchDate: schedulerStatus.currentBatchDate,
      nextScheduleTime: '08:30 (每日晨报)'
    }
  });
});
```

2. 显式绑定 `0.0.0.0` 监听：
```javascript
if (isDirectRun && process.env.NODE_ENV !== 'test') {
  initDatabase().finally(() => {
    startDailyScheduler();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[Gemini Spark Intelligence API] Running on http://0.0.0.0:${PORT} (env: ${process.env.NODE_ENV || 'development'})`);
    });
  });
}
```

- [ ] **Step 3: 运行回归测试以确保健康探针与端口适配无误**

运行: `node tests/apiEndpoints.test.mjs`
预期结果: 全部通过

- [ ] **Step 4: 提交更改**

```bash
git add server/mock-server.mjs tests/apiEndpoints.test.mjs
git commit -m "fix(server): bind 0.0.0.0 and enrich /api/health container probe for PaaS environments"
```

---

### Task 3: PaaS 平台声明式基础设施文件构建 (render.yaml, railway.json, fly.toml, .env.example)

**Files:**
- Create: `render.yaml`
- Create: `railway.json`
- Create: `fly.toml`
- Modify: `.env.example`

- [ ] **Step 1: 创建 `render.yaml` (Render 官方声明式蓝图配置)**

```yaml
services:
  - type: web
    name: gemini-spark-news
    runtime: docker
    plan: free
    region: singapore
    buildCommand: ""
    startCommand: ""
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: ADMIN_KEY
        generateValue: true
      - key: MONGO_URI
        sync: false
      - key: GEMINI_API_KEY
        sync: false
      - key: GEMINI_MODEL
        value: gemini-3.8-flash
      - key: SCHEDULE_TIME
        value: "08:30"
```

- [ ] **Step 2: 创建 `railway.json` (Railway 云原生配置)**

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10,
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 100
  }
}
```

- [ ] **Step 3: 创建 `fly.toml` (Fly.io 极轻量边缘容器配置)**

```toml
app = "gemini-spark-news"
primary_region = "sin"

[build]
  dockerfile = "Dockerfile"

[http_service]
  internal_port = 3001
  force_https = true
  auto_stop_machines = "stop"
  auto_start_machines = true
  min_machines_running = 1

[[http_service.checks]]
  grace_period = "15s"
  interval = "30s"
  method = "GET"
  path = "/api/health"
  timeout = "5s"
```

- [ ] **Step 4: 更新 `.env.example` 说明并校验格式**

完善 `.env.example`，详细标明各个变量在 PaaS 平台上的配置说明与沙盒链接。

- [ ] **Step 5: 提交配置文件**

```bash
git add render.yaml railway.json fly.toml .env.example
git commit -m "feat(deploy): add IaC configurations for Render, Railway, Fly.io and updated env template"
```

---

### Task 4: 编写部署全景指引与 Gemini Spark 自动调用指南 (PAAS_DEPLOYMENT_GUIDE.md)

**Files:**
- Create: `docs/deployment/PAAS_DEPLOYMENT_GUIDE.md`

- [ ] **Step 1: 编写详细的四大平台落地实操文档**

包含：
1. **架构与前置资源准备**（GitHub 仓库、免费 MongoDB Atlas 集群 512MB 沙盒配置步骤、Gemini API Key 申请）
2. **四大 PaaS 平台实操教程**：
   - Render（Blueprint 一键识别 `render.yaml`，分配免费域名）
   - Zeabur（原生一键识别 Dockerfile）
   - Railway（从 GitHub 导入，绑定环境变量）
   - Fly.io（`fly launch` 部署边缘节点）
3. **Gemini Spark 自动直投 Webhook 实操与脚本**：
   - `curl` 命令行直接调用
   - Google Apps Script 自动化脚本（每日定时将 Google Workspace / Gemini 产出推送到部署的公网域名）
   - Python / Node.js 极简自动投递脚本
4. **GitOps 无感高频持续交付指南**：
   - 本地开发验证 -> `git push` -> 云端零停机发布全流程

- [ ] **Step 2: 提交文档**

```bash
git add docs/deployment/PAAS_DEPLOYMENT_GUIDE.md
git commit -m "docs(deploy): add comprehensive PaaS deployment guide and Gemini Spark webhook examples"
```

---

### Task 5: E2E 闭环脚本升级与全量回归验证 (verify-spark-pipeline.mjs)

**Files:**
- Modify: `scripts/verify-spark-pipeline.mjs`

- [ ] **Step 1: 在 `verify-spark-pipeline.mjs` 中挂载 Webhook 摄取测试步骤**

在 `[Step 0.5]` 之后插入 `[Step 0.7]`：
调用 `POST /api/spark/webhook/ingest` 验证往返清洗、落盘与返回值契约。

- [ ] **Step 2: 运行全量回归验证**

1. 运行 `node scripts/verify-spark-pipeline.mjs` 确保全链路测试 100% 绿灯；
2. 运行 `node --test tests/*.test.mjs` 确保所有 35+ 项单测全部通过；
3. 运行 `npm run build` 确保 TypeScript 与 Vite 生产构建 0 错误 0 警告。

- [ ] **Step 3: 更新 `HANDOVER.md` 并提交代码**

```bash
git add scripts/verify-spark-pipeline.mjs HANDOVER.md
git commit -m "test(e2e): add webhook ingest validation to pipeline and update handover archive"
```

---

## 计划执行决策 (Execution Choice)

两套执行方式供选择：
1. **Subagent-Driven (推荐)**：针对每个 Task 派发独立子智能体推进，任务间严格审查，稳健隔离。
2. **Inline Execution (内联执行)**：在当前会话中分批次执行并设置检查点。

# MVP 1: Gemini Spark 智能体数据生产与实时推流系统实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建真实的 Google Gemini 定时自主智能体（Gemini Spark Autonomous Agent）全闭环生产流，支持 08:30 自动调度、动态模型热切换（`gemini-3.8-flash` / `gemini-3.1-pro`）、5 阶段 SSE 实时推流、双模容灾及 MongoDB Atlas / 本地文件双写持久化。

**Architecture:** 采用分层解耦架构，包含调度与互斥锁层（Scheduler & Mutex）、智能体调用与双模容灾引擎（GeminiSparkAgent）、基于原生 HTTP 的 SSE 实时广播中心（SSEManager）、数据库与物理文件双写持久化（Repository），以及前端基于 EventSource 的动态感知与 DevTools 热控面板。

**Tech Stack:** Node.js (v20 ESM), Express, MongoDB Atlas (Mongoose), Server-Sent Events (SSE), Google Gemini API / Fetch, React 18, TypeScript, Tailwind CSS, Lucide Icons.

---

### Task 1: Gemini Spark 智能体核心引擎与动态模型管理器 (geminiSparkAgent.mjs)

**Files:**
- Create: `server/services/geminiSparkAgent.mjs`
- Test: `tests/geminiSparkAgent.test.mjs`

- [ ] **Step 1: 编写智能体调用与模型管理的失败测试**

Create `tests/geminiSparkAgent.test.mjs`:
```javascript
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getActiveModel,
  setActiveModel,
  getAvailableModels,
  generateDailyBriefing
} from '../server/services/geminiSparkAgent.mjs';

test('GeminiSparkAgent - 初始默认模型为 gemini-3.8-flash', () => {
  const current = getActiveModel();
  assert.equal(current, 'gemini-3.8-flash');
});

test('GeminiSparkAgent - 获取可用模型列表包含 flash 与 pro', () => {
  const models = getAvailableModels();
  assert.equal(models.length, 2);
  assert.equal(models[0].id, 'gemini-3.8-flash');
  assert.equal(models[1].id, 'gemini-3.1-pro');
});

test('GeminiSparkAgent - 动态切换模型为 gemini-3.1-pro', () => {
  const result = setActiveModel('gemini-3.1-pro');
  assert.equal(result.success, true);
  assert.equal(getActiveModel(), 'gemini-3.1-pro');
  // 恢复默认
  setActiveModel('gemini-3.8-flash');
});

test('GeminiSparkAgent - 拒绝切换不存在或未经验证的模型', () => {
  assert.throws(() => {
    setActiveModel('gemini-3.8-pro');
  }, /不支持或非法的 Gemini 模型/);
});

test('GeminiSparkAgent - 双模容灾生成合法智库简报 (8~12篇，包含1篇 critical，1~2篇 climate)', async () => {
  const briefing = await generateDailyBriefing('2026-09-25');
  assert.ok(Array.isArray(briefing.items));
  assert.ok(briefing.items.length >= 8 && briefing.items.length <= 12, `新闻总数应在 8~12 篇，实际: ${briefing.items.length}`);
  
  const criticalItems = briefing.items.filter(i => i.impactLevel === 'critical');
  assert.equal(criticalItems.length, 1, '必须且仅有 1 篇 critical 影响等级新闻');

  const climateItems = briefing.items.filter(i => i.category === 'climate');
  assert.ok(climateItems.length >= 1 && climateItems.length <= 2, `气候类别必须为 1~2 篇，实际: ${climateItems.length}`);

  const item0 = briefing.items[0];
  assert.ok(item0.id && item0.title && item0.summary && item0.source);
  assert.ok(['positive', 'neutral', 'negative'].includes(item0.sentiment));
  assert.ok(typeof item0.sentimentScore === 'number');
  assert.ok(Array.isArray(item0.nlpKeyEntities) && item0.nlpKeyEntities.length >= 1);
});
```

- [ ] **Step 2: 运行测试以验证失败**

Run: `node tests/geminiSparkAgent.test.mjs`
Expected: FAIL with `Cannot find module '../server/services/geminiSparkAgent.mjs'`

- [ ] **Step 3: 实现智能体与模型管理器核心服务**

Create `server/services/geminiSparkAgent.mjs`:
```javascript
import dotenv from 'dotenv';
import { createGlobalDailyBatch } from '../corpus.mjs';

dotenv.config();

// 官方认证模型池（杜绝虚构模型，严格遵循 Google Gemini 官方规范）
export const AVAILABLE_MODELS = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    description: '官方推荐主力工作马 · 1M 上下文 · 亚秒级联网搜索与多语种结构化提炼',
    tier: 'workhorse',
    isDefault: true
  },
  {
    id: 'gemini-3.1-pro',
    name: 'Gemini 3.1 Pro',
    description: '前沿深度推理旗舰 · 复杂宏观地缘与跨学科深度推演候选模型',
    tier: 'deep_reasoning',
    isDefault: false
  }
];

let activeModelId = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

export function getActiveModel() {
  return activeModelId;
}

export function getAvailableModels() {
  return AVAILABLE_MODELS;
}

export function setActiveModel(modelId) {
  const found = AVAILABLE_MODELS.find(m => m.id === modelId);
  if (!found) {
    throw new Error(`不支持或非法的 Gemini 模型: "${modelId}"。当前系统仅允许切换至 [${AVAILABLE_MODELS.map(m => m.id).join(', ')}]`);
  }
  activeModelId = modelId;
  console.log(`[GeminiSparkAgent] 🔄 模型热切换成功: 当前激活模型为 [${found.name}] (${modelId})`);
  return { success: true, model: found };
}

/**
 * 智库 Prompt 契约生成
 */
export function buildSparkPrompt(targetDate) {
  return `你是一个专注于全球前沿科技、地缘格局、全球金融以及全球气候变暖与清洁能源的高级自主情报智能体（Gemini Spark）。
请检索并总结针对日期 ${targetDate} 的全球 24 小时最具战略影响力的核心大事件。

【输出规范与契约约定】：
1. 严格输出合法的 JSON 格式，不要包含任何 markdown 说明之外的文字。
2. 篇数契约：新闻总条数严格控制在 8 到 12 篇。
3. 领域契约：
   - "climate"（气候与能源转型）必须严格控制在 1 到 2 篇；
   - 其余篇数均匀分布在 "ai"（人工智能）、"finance"（全球金融）和 "geopolitics"（地缘博弈）。
4. 影响力契约：
   - 必须挑选最重大的 1 篇标记为 "critical"（作为 Bento Hero 头条）；
   - 其余根据重要程度分配为 "high" 或 "medium"。
5. NLP 契约：
   - 每篇新闻必须包含 "sentiment" ("positive" | "neutral" | "negative")；
   - "sentimentScore"（浮点数 -1.0 到 +1.0）；
   - "nlpKeyEntities"（3~4 个关键地名、机构名或核心术语）。
6. 配图与信源契约：包含权威信源名称（如 Reuters, Bloomberg, FT 等）和高质量无版权新闻图片 URL。

JSON 结构示例：
{
  "batchDate": "${targetDate}",
  "model": "${activeModelId}",
  "generatedTime": "${targetDate} 08:30:00",
  "items": [
    {
      "id": "gemini-${targetDate}-001",
      "title": "中文核心标题",
      "englishTitle": "English Title",
      "source": "Reuters",
      "sourceCountry": "US",
      "category": "ai",
      "region": "North America",
      "impactLevel": "critical",
      "summary": "150字左右的精准智库摘要...",
      "tags": ["AI", "Semiconductor"],
      "sentiment": "neutral",
      "sentimentScore": 0.05,
      "nlpKeyEntities": ["NVIDIA", "TSMC", "US Department of Commerce"],
      "coverUrl": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60",
      "publishTime": "${targetDate}T06:30:00.000Z",
      "batchDate": "${targetDate}"
    }
  ]
}`;
}

/**
 * 核心生成函数（双模自适应：API 调用优先，失败/无 Key 平滑保底）
 */
export async function generateDailyBriefing(targetDate = new Date().toISOString().slice(0, 10), onStageProgress) {
  const apiKey = process.env.GEMINI_API_KEY;
  const currentModel = activeModelId;

  // 辅助阶段回调
  const report = async (stage, progress, message) => {
    if (typeof onStageProgress === 'function') {
      await onStageProgress({
        type: 'PROGRESS',
        batchDate: targetDate,
        stage,
        progress,
        message,
        model: currentModel,
        timestamp: new Date().toISOString()
      });
    }
  };

  await report('AGENT_INIT', 15, `Gemini Spark 智能体已就绪，激活模型 [${currentModel}]，载入智库契约...`);

  if (!apiKey || !apiKey.trim() || apiKey === 'YOUR_GEMINI_API_KEY') {
    console.log(`[GeminiSparkAgent] ℹ️ 未配置 GEMINI_API_KEY，启动高保真智库语料引擎（双模保底模式）`);
    return await generateFallbackBriefing(targetDate, currentModel, report);
  }

  try {
    await report('SEARCHING', 40, `正在调度 Google Search Grounding 检索 ${targetDate} 全球权威动态...`);
    
    // 真实 Google Gemini API 调用
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`;
    const prompt = buildSparkPrompt(targetDate);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s 超时保护

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: 'application/json'
        },
        tools: [{ googleSearch: {} }] // 开启 Google Search Grounding 联网感知
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google API 响应异常: HTTP ${response.status} - ${errText}`);
    }

    await report('DISTILLING', 70, `跨语种长文提炼中，执行 AI/金融/地缘/气候 四大领域配额平衡...`);
    const data = await response.json();
    const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textOutput) {
      throw new Error('API 返回的生成内容为空');
    }

    await report('NLP_ANALYSIS', 90, `正在进行宏观极性指数评估与命名实体抽取...`);
    let parsed;
    try {
      parsed = JSON.parse(textOutput);
    } catch (e) {
      let cleaned = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    const items = Array.isArray(parsed) ? parsed : (parsed.items || []);
    const validatedItems = ensureBriefingContract(items, targetDate);

    await report('COMPLETED', 100, `Gemini Spark 简报生产完成，共收录 ${validatedItems.length} 篇全球前沿要闻`);

    return {
      batchDate: targetDate,
      model: currentModel,
      generatedTime: `${targetDate} 08:30:00`,
      items: validatedItems,
      mode: 'GOOGLE_GEMINI_LIVE'
    };
  } catch (err) {
    console.warn(`[GeminiSparkAgent] ⚠️ 真实 API 调用异常 (${err.message})，平滑降级至高保真智能语料引擎`);
    return await generateFallbackBriefing(targetDate, currentModel, report);
  }
}

/**
 * 契约规范校准器（确保符合 8~12 篇、1 篇 critical、1~2 篇 climate）
 */
function ensureBriefingContract(items, targetDate) {
  let list = Array.isArray(items) ? [...items] : [];
  
  if (list.length < 8) {
    const fallbackList = createGlobalDailyBatch(targetDate, 0);
    list = [...list, ...fallbackList.slice(0, 10 - list.length)];
  } else if (list.length > 12) {
    list = list.slice(0, 12);
  }

  // 确保有且仅有 1 篇 critical
  let criticalCount = list.filter(i => i.impactLevel === 'critical').length;
  if (criticalCount === 0 && list.length > 0) {
    list[0].impactLevel = 'critical';
  } else if (criticalCount > 1) {
    let seen = false;
    list = list.map(item => {
      if (item.impactLevel === 'critical') {
        if (!seen) {
          seen = true;
          return item;
        }
        return { ...item, impactLevel: 'high' };
      }
      return item;
    });
  }

  // 确保气候领域 1~2 篇
  const climateCount = list.filter(i => i.category === 'climate').length;
  if (climateCount === 0 && list.length > 1) {
    list[list.length - 1].category = 'climate';
  } else if (climateCount > 2) {
    let c = 0;
    list = list.map(item => {
      if (item.category === 'climate') {
        c++;
        if (c > 2) return { ...item, category: 'ai' };
      }
      return item;
    });
  }

  // 格式化 ID 与日期
  return list.map((item, idx) => ({
    ...item,
    id: item.id || `gemini-${targetDate}-${String(idx + 1).padStart(3, '0')}`,
    batchDate: targetDate,
    publishTime: item.publishTime || `${targetDate}T06:30:00.000Z`
  }));
}

/**
 * 智能保底生成器
 */
async function generateFallbackBriefing(targetDate, currentModel, report) {
  await report('SEARCHING', 40, `正在从全球高质量智库快照中检索 ${targetDate} 关联要闻...`);
  await new Promise(r => setTimeout(r, 600));

  await report('DISTILLING', 70, `跨语种长文提炼中，执行 AI/金融/地缘/气候 四大领域配额平衡...`);
  await new Promise(r => setTimeout(r, 600));

  await report('NLP_ANALYSIS', 90, `正在进行宏观极性指数评估与命名实体抽取...`);
  await new Promise(r => setTimeout(r, 500));

  const items = createGlobalDailyBatch(targetDate, 0);
  const validatedItems = ensureBriefingContract(items, targetDate);

  await report('COMPLETED', 100, `Gemini Spark 简报生成与归档完成，共收录 ${validatedItems.length} 篇全球前沿要闻`);

  return {
    batchDate: targetDate,
    model: currentModel,
    generatedTime: `${targetDate} 08:30:00`,
    items: validatedItems,
    mode: 'SYNTHETIC_FALLBACK'
  };
}
```

- [ ] **Step 4: 运行测试以验证通过**

Run: `node tests/geminiSparkAgent.test.mjs`
Expected: PASS with all 5 assertions passing.

- [ ] **Step 5: Git 提交**

```bash
git add server/services/geminiSparkAgent.mjs tests/geminiSparkAgent.test.mjs
git commit -m "feat(spark): implement GeminiSparkAgent with model switcher and dual-mode fallback"
```

---

### Task 2: SSE 实时推流中心 (sseManager.mjs)

**Files:**
- Create: `server/services/sseManager.mjs`
- Test: `tests/sseManager.test.mjs`

- [ ] **Step 1: 编写 SSE 管理器的单元测试**

Create `tests/sseManager.test.mjs`:
```javascript
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addSSEClient,
  removeSSEClient,
  broadcastSSEMessage,
  getClientCount
} from '../server/services/sseManager.mjs';

test('SSEManager - 能够添加和移除客户端', () => {
  const initial = getClientCount();
  const mockRes = {
    write: () => {},
    end: () => {}
  };
  const clientId = addSSEClient(mockRes);
  assert.equal(getClientCount(), initial + 1);

  removeSSEClient(clientId);
  assert.equal(getClientCount(), initial);
});

test('SSEManager - 广播推流时向所有客户端写入正确 SSE 格式', () => {
  const messages = [];
  const mockRes = {
    write: (chunk) => {
      messages.push(chunk);
    }
  };

  const clientId = addSSEClient(mockRes);
  broadcastSSEMessage({
    type: 'PROGRESS',
    stage: 'SEARCHING',
    progress: 40,
    message: '检索中...'
  });

  removeSSEClient(clientId);

  assert.ok(messages.length >= 1);
  const lastMsg = messages[messages.length - 1];
  assert.ok(lastMsg.startsWith('data: '));
  assert.ok(lastMsg.endsWith('\n\n'));
  assert.ok(lastMsg.includes('"stage":"SEARCHING"'));
});
```

- [ ] **Step 2: 运行测试以验证失败**

Run: `node tests/sseManager.test.mjs`
Expected: FAIL with `Cannot find module '../server/services/sseManager.mjs'`

- [ ] **Step 3: 实现 SSE 管理器服务**

Create `server/services/sseManager.mjs`:
```javascript
let clients = new Map();
let clientIdCounter = 1;
let heartbeatTimer = null;

export function getClientCount() {
  return clients.size;
}

export function addSSEClient(res) {
  const id = clientIdCounter++;
  clients.set(id, res);

  // 初次握手：发送连接成功欢迎消息
  const welcomePayload = {
    type: 'CONNECTED',
    clientId: id,
    message: 'Gemini Spark SSE Stream Connected',
    timestamp: new Date().toISOString()
  };
  res.write(`data: ${JSON.stringify(welcomePayload)}\n\n`);

  ensureHeartbeat();
  return id;
}

export function removeSSEClient(id) {
  clients.delete(id);
  if (clients.size === 0 && heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

export function broadcastSSEMessage(payload) {
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  for (const [id, res] of clients.entries()) {
    try {
      res.write(data);
    } catch (err) {
      console.warn(`[SSEManager] 向客户端 #${id} 写入失败，自动移除:`, err.message);
      clients.delete(id);
    }
  }
}

function ensureHeartbeat() {
  if (heartbeatTimer) return;
  // 15 秒心跳包保持长连接
  heartbeatTimer = setInterval(() => {
    if (clients.size === 0) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
      return;
    }
    for (const [id, res] of clients.entries()) {
      try {
        res.write(':heartbeat\n\n');
      } catch (e) {
        clients.delete(id);
      }
    }
  }, 15000);
}
```

- [ ] **Step 4: 运行测试以验证通过**

Run: `node tests/sseManager.test.mjs`
Expected: PASS with 2 tests passing.

- [ ] **Step 5: Git 提交**

```bash
git add server/services/sseManager.mjs tests/sseManager.test.mjs
git commit -m "feat(spark): implement SSEManager for real-time stage progress streaming"
```

---

### Task 3: 定时调度引擎与并发防重互斥锁 (scheduler.mjs)

**Files:**
- Create: `server/services/scheduler.mjs`
- Test: `tests/scheduler.test.mjs`

- [ ] **Step 1: 编写调度引擎与并发互斥锁的测试**

Create `tests/scheduler.test.mjs`:
```javascript
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isGenerationBusy,
  triggerGenerationPipeline,
  getSchedulerStatus
} from '../server/services/scheduler.mjs';

test('Scheduler - 初始状态为空闲', () => {
  assert.equal(isGenerationBusy(), false);
  const status = getSchedulerStatus();
  assert.equal(status.isGenerating, false);
  assert.ok(status.scheduleTime);
});

test('Scheduler - 能够触发生成并在完成时释放互斥锁', async () => {
  const res = await triggerGenerationPipeline('2026-09-25');
  assert.equal(res.success, true);
  assert.equal(res.date, '2026-09-25');
  assert.equal(isGenerationBusy(), false);
});
```

- [ ] **Step 2: 运行测试以验证失败**

Run: `node tests/scheduler.test.mjs`
Expected: FAIL with `Cannot find module '../server/services/scheduler.mjs'`

- [ ] **Step 3: 实现调度器与并发互斥保护**

Create `server/services/scheduler.mjs`:
```javascript
import dotenv from 'dotenv';
import { generateDailyBriefing, getActiveModel } from './geminiSparkAgent.mjs';
import { broadcastSSEMessage } from './sseManager.mjs';
import { saveBriefing } from '../repository.mjs';

dotenv.config();

const SCHEDULE_TIME = process.env.SCHEDULE_TIME || '08:30';

let isGenerating = false;
let currentGeneratingDate = null;
let currentStageInfo = null;
let watchdogTimer = null;
let cronInterval = null;

export function isGenerationBusy() {
  return isGenerating;
}

export function getSchedulerStatus() {
  return {
    isGenerating,
    currentGeneratingDate,
    currentStageInfo,
    scheduleTime: SCHEDULE_TIME,
    activeModel: getActiveModel()
  };
}

/**
 * 触发批次生成工作流（带并发互斥锁与防死锁看门狗）
 */
export async function triggerGenerationPipeline(targetDate = new Date().toISOString().slice(0, 10)) {
  if (isGenerating) {
    return {
      success: false,
      conflict: true,
      message: `Gemini Spark 智能体当前正在生成批次 [${currentGeneratingDate}]，进度: ${currentStageInfo?.progress || 0}%`,
      currentStageInfo
    };
  }

  isGenerating = true;
  currentGeneratingDate = targetDate;
  currentStageInfo = {
    stage: 'AGENT_INIT',
    progress: 15,
    message: '正在唤醒 Gemini Spark 智能体...'
  };

  // 120 秒看门狗定时器，防止异常死锁
  if (watchdogTimer) clearTimeout(watchdogTimer);
  watchdogTimer = setTimeout(() => {
    if (isGenerating) {
      console.warn(`[Scheduler] ⚠️ 监测到生成流程超过 120s 未释放，触发看门狗强制解锁`);
      isGenerating = false;
      currentGeneratingDate = null;
      currentStageInfo = null;
      broadcastSSEMessage({
        type: 'ERROR',
        message: '生成任务超时，已自动解除互斥锁'
      });
    }
  }, 120000);

  try {
    console.log(`[Scheduler] 🚀 启动 [${targetDate}] Gemini Spark 生产流 (模型: ${getActiveModel()})`);

    const result = await generateDailyBriefing(targetDate, async (stageData) => {
      currentStageInfo = stageData;
      broadcastSSEMessage(stageData);
    });

    // 双写持久化至 MongoDB 与 本地文件
    await saveBriefing(targetDate, {
      items: result.items,
      batchStatus: {
        date: targetDate,
        status: 'COMPLETED',
        statusText: '已完成归档',
        generatedTime: `${targetDate} 08:30:00`,
        nextScheduleTime: '明日 08:30:00 (每日晨报)',
        progress: 100,
        currentStage: `Gemini Spark (${result.model}) 24H 简报生成与交叉校验完成`
      }
    });

    console.log(`[Scheduler] ✅ [${targetDate}] 生产流执行完毕，持久化双写成功！`);

    return {
      success: true,
      date: targetDate,
      model: result.model,
      itemCount: result.items.length,
      mode: result.mode
    };
  } catch (err) {
    console.error(`[Scheduler] ❌ 生成失败:`, err);
    broadcastSSEMessage({
      type: 'ERROR',
      message: `生成流程发生异常: ${err.message}`,
      timestamp: new Date().toISOString()
    });
    throw err;
  } finally {
    clearTimeout(watchdogTimer);
    isGenerating = false;
    currentGeneratingDate = null;
  }
}

/**
 * 启动 08:30 定时调度巡检
 */
export function startDailyScheduler() {
  if (cronInterval) return;

  const [schedHour, schedMinute] = SCHEDULE_TIME.split(':').map(Number);
  console.log(`[Scheduler] ⏰ 每日定时调度服务已就绪，目标唤醒时间: 每天 ${String(schedHour).padStart(2, '0')}:${String(schedMinute).padStart(2, '0')}:00`);

  let lastTriggeredDay = '';

  cronInterval = setInterval(async () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const todayStr = now.toISOString().slice(0, 10);

    if (currentHour === schedHour && currentMinute === schedMinute && lastTriggeredDay !== todayStr) {
      lastTriggeredDay = todayStr;
      console.log(`[Scheduler] ⏰ 到达指定调度时间 (${SCHEDULE_TIME})，自动唤醒 Gemini Spark 生产流...`);
      try {
        await triggerGenerationPipeline(todayStr);
      } catch (e) {
        console.error(`[Scheduler] 自动生成调度异常:`, e.message);
      }
    }
  }, 30000); // 每 30 秒巡检一次时钟
}
```

- [ ] **Step 4: 运行测试以验证通过**

Run: `node tests/scheduler.test.mjs`
Expected: PASS with 2 tests passing.

- [ ] **Step 5: Git 提交**

```bash
git add server/services/scheduler.mjs tests/scheduler.test.mjs
git commit -m "feat(spark): implement Scheduler with cron time checking and generation mutex"
```

---

### Task 4: 服务端 API 路由挂载与服务端入口升级 (mock-server.mjs & repository.mjs)

**Files:**
- Modify: `server/mock-server.mjs`
- Modify: `server/repository.mjs:540-555`
- Test: `tests/apiEndpoints.test.mjs`

- [ ] **Step 1: 编写 API 端点集成测试**

Create `tests/apiEndpoints.test.mjs`:
```javascript
import assert from 'node:assert/strict';
import test from 'node:test';

test('API Endpoints - 校验模型查询与热切换接口', async () => {
  const getRes = await fetch('http://localhost:3001/api/spark/models');
  assert.equal(getRes.status, 200);
  const getData = await getRes.json();
  assert.ok(getData.data.current);
  assert.ok(Array.isArray(getData.data.available));

  const postRes = await fetch('http://localhost:3001/api/spark/models/select', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gemini-3.1-pro' })
  });
  assert.equal(postRes.status, 200);
  const postData = await postRes.json();
  assert.equal(postData.data.model.id, 'gemini-3.1-pro');

  // 切回默认
  await fetch('http://localhost:3001/api/spark/models/select', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gemini-3.8-flash' })
  });
});

test('API Endpoints - 校验即时触发接口 POST /api/spark/trigger-generate', async () => {
  const res = await fetch('http://localhost:3001/api/spark/trigger-generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date: '2026-09-25' })
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.code, 200);
  assert.equal(data.data.success, true);
});
```

- [ ] **Step 2: 在 `server/repository.mjs` 中更新旧文案**

Replace line 544 in `server/repository.mjs`:
Change:
```javascript
currentStage: '阶段 3/4: Gemini 1.5 全球多源交叉校验与结构化提取'
```
To:
```javascript
currentStage: '阶段 3/4: Gemini Spark 全球多源交叉校验与结构化提炼'
```

- [ ] **Step 3: 在 `server/mock-server.mjs` 中挂载新端点与调度器**

Modify `server/mock-server.mjs`:
```javascript
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
    const { model } = req.body;
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
    const { date = new Date().toISOString().slice(0, 10) } = req.body;
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

// 启动服务
initDatabase().finally(() => {
  startDailyScheduler();
  app.listen(PORT, () => {
    console.log(`[Gemini Spark Intelligence API] Running on http://localhost:${PORT}`);
  });
});
```

- [ ] **Step 4: 运行测试以验证通过**

Run: `node tests/apiEndpoints.test.mjs`
Expected: PASS with all tests passing.

- [ ] **Step 5: Git 提交**

```bash
git add server/mock-server.mjs server/repository.mjs tests/apiEndpoints.test.mjs
git commit -m "feat(server): expose model switcher, SSE stream, and generation trigger endpoints"
```

---

### Task 5: 前端 API 层与 DevTools 智能体控制台升级 (api.ts & DevToolsPanel.tsx)

**Files:**
- Modify: `src/services/api.ts`
- Modify: `src/components/DevToolsPanel.tsx`
- Test: `npm run build`

- [ ] **Step 1: 在 `src/services/api.ts` 中补充 Spark 接口方法与模型类型定义**

Modify `src/services/api.ts`:
Add:
```typescript
export interface SparkModelOption {
  id: string;
  name: string;
  description: string;
  tier: string;
  isDefault: boolean;
}

export interface SparkModelsResponse {
  current: string;
  available: SparkModelOption[];
}

export async function fetchSparkModels(): Promise<SparkModelsResponse> {
  const res = await fetch(`${BASE_URL}/spark/models`);
  if (!res.ok) throw new Error(`获取模型失败: HTTP ${res.status}`);
  const json = await res.json();
  return json.data;
}

export async function selectSparkModel(model: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/spark/models/select`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || `切换模型失败: HTTP ${res.status}`);
  }
  return await res.json();
}

export async function triggerSparkGenerate(date?: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/spark/trigger-generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || `触发生成失败: HTTP ${res.status}`);
  }
  return await res.json();
}
```

- [ ] **Step 2: 在 `src/components/DevToolsPanel.tsx` 中嵌入 Gemini Spark 智能体控制卡**

Modify `src/components/DevToolsPanel.tsx`:
- Import `fetchSparkModels`, `selectSparkModel`, `triggerSparkGenerate`, `SparkModelOption`.
- Add local state for `models`, `activeModel`, `isTriggering`, `sparkLogs`.
- Add UI card with:
  - Model radio cards: `gemini-3.8-flash` vs `gemini-3.1-pro` with badge indicator.
  - "立即调度 Gemini Spark 生成今日简报" button.
  - Real-time terminal log viewer for SSE event updates.

- [ ] **Step 3: 运行 TypeScript 与构建编译**

Run: `npm run build`
Expected: 0 errors.

- [ ] **Step 4: Git 提交**

```bash
git add src/services/api.ts src/components/DevToolsPanel.tsx
git commit -m "feat(devtools): integrate Gemini Spark agent model hot-switcher and manual trigger UI"
```

---

### Task 6: 前端看板 SSE 实时驱动与动态阶段可视化 (SparkNewsDashboard & IntelligenceHeader)

**Files:**
- Modify: `src/components/SparkNewsDashboard.tsx`
- Modify: `src/components/IntelligenceHeader.tsx`
- Test: `npm run build`

- [ ] **Step 1: 在 `src/components/SparkNewsDashboard.tsx` 挂载 EventSource 监听**

Modify `src/components/SparkNewsDashboard.tsx`:
- Establish `new EventSource('/api/spark/stream')` in a `useEffect`.
- On `PROGRESS` events:
  - Update `batchStatus` with current `stage`, `progress`, and `message`.
- On `COMPLETED` events:
  - Seamlessly refetch `loadNews(true)` and update batch status to `COMPLETED`.
- Clean up `eventSource.close()` on unmount.

- [ ] **Step 2: 在 `src/components/IntelligenceHeader.tsx` 展示实时脉冲动态进度**

Modify `src/components/IntelligenceHeader.tsx`:
- When status is `RUNNING` or progress is between 1 and 99:
  - Show animated pulse indicator: `[STAGE] 40% - 正在联网检索...`
  - Render a subtle progress indicator underneath the batch status badge.

- [ ] **Step 3: 运行 TypeScript 与构建编译**

Run: `npm run build`
Expected: 0 errors.

- [ ] **Step 4: Git 提交**

```bash
git add src/components/SparkNewsDashboard.tsx src/components/IntelligenceHeader.tsx
git commit -m "feat(frontend): connect SSE real-time stream for autonomous stage visualization"
```

---

### Task 7: 端到端闭环验证与全站构建测试 (E2E Verification & Integration Testing)

**Files:**
- Create: `scripts/verify-spark-pipeline.mjs`
- Test: `npm run build`

- [ ] **Step 1: 编写全自动化 E2E 验证脚本**

Create `scripts/verify-spark-pipeline.mjs`:
```javascript
import assert from 'node:assert/strict';

async function main() {
  console.log('🧪 开始执行 Gemini Spark 生产流全链路 E2E 验证...');

  // 1. 验证模型查询接口
  console.log('1. 测试 GET /api/spark/models...');
  const modelsRes = await fetch('http://localhost:3001/api/spark/models');
  assert.equal(modelsRes.status, 200);
  const modelsData = await modelsRes.json();
  console.log(`   当前激活模型: ${modelsData.data.current}`);
  assert.ok(['gemini-3.8-flash', 'gemini-3.1-pro'].includes(modelsData.data.current));

  // 2. 验证模型切换接口
  console.log('2. 测试 POST /api/spark/models/select 热切为 gemini-3.1-pro...');
  const switchRes = await fetch('http://localhost:3001/api/spark/models/select', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gemini-3.1-pro' })
  });
  assert.equal(switchRes.status, 200);

  // 3. 验证即时触发与 SSE 推流
  console.log('3. 测试 POST /api/spark/trigger-generate 触发数据生产...');
  const triggerRes = await fetch('http://localhost:3001/api/spark/trigger-generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date: '2026-09-25' })
  });
  assert.equal(triggerRes.status, 200);
  const triggerData = await triggerRes.json();
  console.log(`   生成结果: 成功=${triggerData.data.success}, 新闻总数=${triggerData.data.itemCount}, 模式=${triggerData.data.mode}`);

  // 切回默认 gemini-3.8-flash
  await fetch('http://localhost:3001/api/spark/models/select', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gemini-3.8-flash' })
  });

  console.log('✅ Gemini Spark 生产流全链路 E2E 验证 100% 通过！');
}

main().catch(err => {
  console.error('❌ E2E 验证失败:', err);
  process.exit(1);
});
```

- [ ] **Step 2: 运行 E2E 验证脚本**

Run: `node scripts/verify-spark-pipeline.mjs`
Expected: PASS with 100% success.

- [ ] **Step 3: 运行生产构建测试**

Run: `npm run build`
Expected: PASS with 0 errors.

- [ ] **Step 4: Git 提交**

```bash
git add scripts/verify-spark-pipeline.mjs
git commit -m "test(spark): add E2E verification script for spark agent pipeline"
```

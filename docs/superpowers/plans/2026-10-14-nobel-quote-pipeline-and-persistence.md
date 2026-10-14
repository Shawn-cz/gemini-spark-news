# 诺奖名言每日自动化更新与持久化存储流水线 · 实施计划
(Nobel Quote Daily Pipeline & Dual-Mode Persistence Implementation Plan)

> **前置规范**：[`docs/superpowers/specs/2026-10-14-nobel-quote-pipeline-and-persistence-design.md`](file:///e:/antigravity项目/资讯前端/docs/superpowers/specs/2026-10-14-nobel-quote-pipeline-and-persistence-design.md)

---

### Task 1: 编写诺奖名言持久化与调度单元测试套件 (TDD)

**Files:**
- Create: `tests/nobelQuotePersistence.test.mjs`

- [x] **Step 1: 编写单元测试套件**
  覆盖以下核心用例：
  1. `getDailyNobelQuote`: 验证相同日期下返回的名言完全一致（幂等性），且不同日期能根据哈希正确命中不同大师作品；
  2. `saveBriefing`: 验证当传入包含自定义 `nobelQuote` 时完整落盘，当未传入时自动补齐当天确定性名言；
  3. `getBatchStatus` / `getNewsList`: 验证读取已归档简报时，准确返回与简报绑定的 `nobelQuote`；
  4. Webhook 摄取: 验证 `POST /api/spark/webhook/ingest` 支持自定义 `nobelQuote` 注入与广播。

- [x] **Step 2: 运行测试验证**
  运行：`node tests/nobelQuotePersistence.test.mjs`

- [x] **Step 3: 提交初始测试代码**
  ```bash
  git add tests/nobelQuotePersistence.test.mjs
  git commit -m "test(nobel): add unit test suite for nobel quote persistence and pipeline"
  ```

---

### Task 2: 改造服务端持久化引擎、调度流水线与 Webhook 摄取端点

**Files:**
- Modify: `server/repository.mjs`
- Modify: `server/services/scheduler.mjs`
- Modify: `server/mock-server.mjs`

- [x] **Step 1: 升级 `server/repository.mjs`**
  - 在 `saveBriefing(date, rawData)` 中，确保本地 JSON 与 MongoDB Atlas 同步保存 `nobelQuote`，并且返回值包含 `nobelQuote: persistedQuote`；
  - 在 `getBatchStatus` 与 `getNewsList` 中，确保读取本地文件或 MongoDB 数据库中的真实归档名言，无损平滑降级。

- [x] **Step 2: 升级 `server/services/scheduler.mjs`**
  - 在 `triggerGenerationPipeline(targetDate)` 中，把 `nobelQuote` 显式写入 `saveBriefing` 载荷；
  - 在广播 `COMPLETED` SSE 事件时，携带 `nobelQuote`。

- [x] **Step 3: 升级 `server/mock-server.mjs` Webhook 端点**
  - 在 `POST /api/spark/webhook/ingest` 中，支持读取 `req.body.nobelQuote` 或 `parsedData.nobelQuote`；
  - 广播 SSE 事件中携带最终入库的 `nobelQuote`。

- [x] **Step 4: 运行单元测试验证**
  运行：`node tests/nobelQuotePersistence.test.mjs`

- [x] **Step 5: 提交服务端实现代码**
  ```bash
  git add server/repository.mjs server/services/scheduler.mjs server/mock-server.mjs
  git commit -m "feat(nobel): implement dual-mode persistence and scheduler pipeline for nobel quotes"
  ```

---

### Task 3: 前端 SSE 实时推流监听集成与全量回归测试

**Files:**
- Modify: `src/components/SparkNewsDashboard.tsx`

- [x] **Step 1: 完善前端 SSE 事件中 `nobelQuote` 的即时响应**
  - 在 `SparkNewsDashboard.tsx` 监听 `COMPLETED` 事件时，若 `event.data.nobelQuote` 存在且当期批次匹配，立即通过 `setNobelQuote(event.data.nobelQuote)` 实现无感流式更新。

- [x] **Step 2: 执行全量测试套件回归**
  运行：
  - `node --test tests/nobelQuotePersistence.test.mjs tests/dateGrouping.test.mjs tests/webhookIngest.test.mjs tests/availableDates.test.mjs tests/apiEndpoints.test.mjs tests/adminAuth.test.mjs tests/rateLimiter.test.mjs tests/serverSecurityIntegration.test.mjs tests/sseManager.test.mjs tests/scheduler.test.mjs`
  - `npm run build`

- [x] **Step 3: 提交并完成交付**
  ```bash
  git add src/components/SparkNewsDashboard.tsx docs/superpowers/plans/2026-10-14-nobel-quote-pipeline-and-persistence.md
  git commit -m "feat(dashboard): integrate nobel quote SSE live streaming and complete persistence pipeline"
  ```

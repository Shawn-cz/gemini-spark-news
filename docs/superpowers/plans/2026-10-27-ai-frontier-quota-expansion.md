# AI 领域采集扩容与大型 AI 公司新动态深潜契约 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将每日简报采集总容量从 12 篇扩充至 16 篇（其中 AI 领域从 4 篇扩充至 8 篇，占 50%），建立大型 AI 公司“新模型发布、Agent 产品演进、重大开源突破与架构创新、商业化落地与天价融资并购”四维子配额契约，并实时生成今日最新批次同步上线。

**Architecture:** 在 `server/corpus.mjs` 扩充 4 篇大型 AI 公司深度研报使保底语料达到 16 篇（8 AI）；在 `server/services/geminiSparkAgent.mjs` 升级 `buildSparkPrompt`（注入 8 篇 AI 四维子配额与重点大厂名单）及 `ensureBriefingContract`（升级为 16 篇满配校准）；更新单元与 E2E 测试断言，并调用真实 Gemini API 生成 `2026-10-27` 批次写入 MongoDB Atlas 与本地归档。

**Tech Stack:** Node.js (ESM), Google Gemini API (`gemini-flash-latest`), MongoDB Atlas (Mongoose), React 19 + TypeScript + Vite.

---

### Task 1: 升级 TDD 单元测试断言（12 篇 -> 16 篇 & AI 四维大厂动态提示词校验）

**Files:**
- Modify: `tests/geminiSparkAgent.test.mjs:35-65`

- [ ] **Step 1: 修改 `tests/geminiSparkAgent.test.mjs` 中的 Prompt 与生成篇数断言**
- [ ] **Step 2: 运行测试确认在未改实现前处于预期失败状态 (Red)**

---

### Task 2: 扩容 `server/corpus.mjs` 全球智库语料库（新增 4 篇大型 AI 公司前沿动态至 16 篇）

**Files:**
- Modify: `server/corpus.mjs:1-75`

- [ ] **Step 1: 在 `GLOBAL_CORPUS` 的 AI 板块新增 4 篇涵盖大模型发布、Agent 演进、开源架构创新、融资商业化的深度研报**

---

### Task 3: 升级 `server/services/geminiSparkAgent.mjs` 的 Prompt 契约与 16 篇校准器

**Files:**
- Modify: `server/services/geminiSparkAgent.mjs:65-118`
- Modify: `server/services/geminiSparkAgent.mjs:245-340`

- [ ] **Step 1: 在 `buildSparkPrompt` 中将总篇数升级为 16 篇（AI 8 篇），并写入大型 AI 公司名单与“2+2+2+2”四维子配额契约**
- [ ] **Step 2: 在 `ensureBriefingContract` 中将补齐/截断容量升级为 16 篇，并保障 AI 领域配额**
- [ ] **Step 3: 运行单元测试 `node --test tests/geminiSparkAgent.test.mjs` 验证通过 (Green)**

---

### Task 4: 更新全链路验证脚本并调用真实 Gemini 生成今日最新 16 篇批次

**Files:**
- Modify: `scripts/verify-spark-pipeline.mjs:320-340`
- Create/Run: `scripts/generate-today-ai-batch.mjs`

- [ ] **Step 1: 更新 `scripts/verify-spark-pipeline.mjs` 中的篇数断言**
- [ ] **Step 2: 调用真实 Google Gemini API 生成今日（`2026-10-27`）16 篇最新研报（含 8 篇大型 AI 公司新动态）并双写持久化至 MongoDB Atlas 与 `data/briefings/2026-10-27.json`**
- [ ] **Step 3: 运行全套测试与 `npm run build` 验证 100% 绿灯**

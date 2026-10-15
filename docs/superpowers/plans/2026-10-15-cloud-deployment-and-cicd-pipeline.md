# MVP 6: 云端部署上线与 GitOps 流水线 (Cloud Deployment & CI/CD) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建《Gemini Spark News》的生产级自动化持续交付 (CI/CD) 流水线，标准化生产运行时脚本与容器规范，支持一键无缝托管至云端 PaaS 平台（Render / Railway / Zeabur / Fly.io），并打通线上自动化保活与外部 Gemini Spark 智能体 Webhook 直投。

**Architecture:** 
1. **持续集成 (CI)**：基于 GitHub Actions 自动化工作流，在代码提交至 `master` 时自动执行 TypeScript 强类型校验、生产打包、全量 17 套测试套件（63 项全绿回归）与容器健康探针校验；
2. **生产容器与运行时标准**：为 `package.json` 补充标准 `start`、`test`、`test:e2e` 与 `build` 闭环指令；优化多阶段 Alpine Dockerfile，实现 SPA 静态资源与 Node API 一体化零额外网络开销服务；
3. **云原生 PaaS 部署与免休眠保活**：适配 Render Blueprint (`render.yaml`) 与 Railway/Zeabur 容器编排，配合外部 Cron / GitHub Actions 定时保活，彻底杜绝 Free Tier 容器休眠导致的首次冷启动延迟；
4. **外部自动化直投打通**：为外部 Gemini Spark 智能体提供线上 Webhook 接入示例与验证脚本。

**Tech Stack:** GitHub Actions, Docker, Express 4, Vite 6, Node.js 20, MongoDB Atlas, PaaS (Render / Railway / Zeabur)

---

### Task 1: Package.json 脚本规范化与生产运行时指令闭环

**Files:**
- Modify: `package.json`

- [x] **Step 1: 补充标准 npm 脚本**
  在 `package.json` 的 `scripts` 节点中增加：
  - `"start": "node server/mock-server.mjs"`（云平台标准生产启动入口）
  - `"build": "tsc --noEmit && vite build"`（打包前强制执行 TypeScript 语法与类型严格检查）
  - `"test": "node --test tests/adminAuth.test.mjs tests/apiEndpoints.test.mjs tests/archiveManifest.test.mjs tests/availableDates.test.mjs tests/bookmarkStorage.test.mjs tests/clientBatchFiltering.test.mjs tests/crossArchiveSearch.test.mjs tests/dateGrouping.test.mjs tests/eventTimeline.test.mjs tests/geminiSparkAgent.test.mjs tests/macroPulse.test.mjs tests/nobelQuotePersistence.test.mjs tests/rateLimiter.test.mjs tests/scheduler.test.mjs tests/serverSecurityIntegration.test.mjs tests/sseManager.test.mjs tests/webhookIngest.test.mjs"`
  - `"test:e2e": "node scripts/verify-mvp5-features.mjs"`
- [x] **Step 2: 本地验证脚本命令**
  运行：`npm run build`
  运行：`npm test`
- [x] **Step 3: 提交改动**
  `git add package.json`
  `git commit -m "build: standardize npm scripts for production runtime and ci/cd"`

---

### Task 2: 搭建 GitHub Actions 持续集成与质量防护流水线 (.github/workflows/ci.yml)

**Files:**
- Create: `.github/workflows/ci.yml`

- [x] **Step 1: 编写 GitHub Actions 工作流配置文件**
  包含：
  - 触发分支：`push: branches: [ master ]` 与 `pull_request: branches: [ master ]`
  - 环境：`ubuntu-latest`，Node.js 20.x
  - 缓存策略：`actions/setup-node@v4` 配置 `cache: 'npm'` 极大缩减构建耗时
  - 校验步骤：
    1. 纯净依赖安装 `npm ci`
    2. 严格类型检查与生产构建 `npm run build`
    3. 全量单元测试与安全防护测试 `npm test`
    4. 后台启动服务并进行 `/api/health` 与 `/api/archive/manifest` 探针自检
- [x] **Step 2: 本地语法校验与工作流演练**
  确保 `.github/workflows/ci.yml` 缩进严格遵循 YAML 标准。
- [x] **Step 3: 提交改动**
  `git add .github/workflows/ci.yml`
  `git commit -m "ci: add github actions continuous integration workflow"`

---

### Task 3: 生产容器构建规范与云端运行时加固 (Dockerfile & server/mock-server.mjs)

**Files:**
- Modify: `Dockerfile`
- Modify: `server/mock-server.mjs`

- [x] **Step 1: 检查并加固 Dockerfile**
  - 确保 Stage 1 (builder) 包含 `npm ci` 与 `npm run build`；
  - 确保 Stage 2 (runner) 设置 `NODE_ENV=production`、`USER node` 最小特权账户；
  - 拷贝必要的 `dist`、`server`、`data`，创建日志与数据目录 `mkdir -p logs data/briefings && chown -R node:node /app`。
- [x] **Step 2: 生产环境 API 缓存与静态资源优化**
  在 `server/mock-server.mjs` 中为静态资源目录配置适当的 HTTP 缓存头（如 `maxAge: '1d'`），加速静态资源分发。
- [x] **Step 3: 本地构建与健康检查验证**
  运行 `npm run build` 确保无异常。
- [x] **Step 4: 提交改动**
  `git add Dockerfile server/mock-server.mjs`
  `git commit -m "chore(docker): optimize production container assets and caching"`

---

### Task 4: 自动化云端保活与定时抓取工作流 (.github/workflows/keepalive-and-sync.yml)

**Files:**
- Create: `.github/workflows/keepalive-and-sync.yml`

- [x] **Step 1: 编写免休眠保活与健康监测工作流**
  - 针对 Render / Fly.io 免费实例 15 分钟无请求自动休眠特性；
  - 通过 GitHub Actions 定时触发器（每 14 分钟执行一次 `curl -fsS https://${{ secrets.APP_HOST }}/api/health || exit 0`）；
  - 支持向用户配置的公网域名发起心跳脉冲，实现全天候 0 延迟首屏唤醒；
  - 提供开关保护（未配置 `APP_HOST` Secret 时安全跳过）。
- [x] **Step 2: 提交改动**
  `git add .github/workflows/keepalive-and-sync.yml`
  `git commit -m "ci: add cloud keepalive and heartbeat ping workflow"`

---

### Task 5: 云端上线实操指引与全链路验收 (HANDOVER.md & Deployment Walkthrough)

**Files:**
- Modify: `HANDOVER.md`
- Create: `docs/deployment/RENDER_ONE_CLICK_DEPLOY.md`

- [x] **Step 1: 编写 Render / Railway 极速 3 分钟一键部署指南**
  说明：
  1. 打开 Render.com -> New -> Blueprint；
  2. 关联当前 GitHub 仓库 `Shawn-cz/gemini-spark-news`；
  3. 填入 3 个环境变量：`MONGO_URI`（Atlas 连接串）、`GEMINI_API_KEY`、`ADMIN_KEY`；
  4. 点击 Apply，等待 2 分钟自动构建上线；
  5. 获取公网 HTTPS 地址。
- [x] **Step 2: 更新 HANDOVER.md 归档文档**
  记录 MVP 6 的 CI/CD 落地、测试命令标准化与生产上线指引。
- [x] **Step 3: 运行全量回归并推送到 GitHub 触发 Actions**
  运行 `npm run build` 与 `npm test`。
  推送至 `origin/master`。

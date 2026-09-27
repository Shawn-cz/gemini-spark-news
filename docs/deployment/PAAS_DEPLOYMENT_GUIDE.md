# Gemini Spark Intelligence —— 云原生 PaaS 部署全景与 Webhook 自动化指南

> 本指南面向希望将 **Gemini Spark Intelligence 资讯前端与后端网关** 部署到公网生产环境的开发者与运维团队。
> 通过计算与存储解耦架构，结合现代 PaaS 云平台（Render、Zeabur、Railway、Fly.io）的自动化托管能力，实现 **0 停机部署、0 运维负担、历史研报数据 0 丢失**。

---

## 目录 (Table of Contents)

1. [云原生无状态架构与数据安全策略](#1-云原生无状态架构与数据安全策略)
2. [前置资源准备（5分钟准备工作）](#2-前置资源准备5分钟准备工作)
   - [2.1 GitHub 代码仓库归档](#21-github-代码仓库归档)
   - [2.2 MongoDB Atlas 永久免费 M0 集群开通与网络授权](#22-mongodb-atlas-永久免费-m0-集群开通与网络授权)
   - [2.3 Google Gemini API Key 获取](#23-google-gemini-api-key-获取)
   - [2.4 生成高熵安全密钥 ADMIN_KEY](#24-生成高熵安全密钥-admin_key)
3. [四大主流 PaaS 平台零门槛托管实操](#3-四大主流-paas-平台零门槛托管实操)
   - [3.1 Render（强烈推荐 —— Blueprint 声明式一键上线）](#31-render强烈推荐--blueprint-声明式一键上线)
   - [3.2 Zeabur（亚太网络极速优化 / 极简一键直连）](#32-zeabur亚太网络极速优化--极简一键直连)
   - [3.3 Railway（云原生自动化构建 / 动态端口适配）](#33-railway云原生自动化构建--动态端口适配)
   - [3.4 Fly.io（全球边缘容器化部署）](#34-flyio全球边缘容器化部署)
4. [Gemini Spark 自动直投 Webhook 摄取端点深度指南](#4-gemini-spark-自动直投-webhook-摄取端点深度指南)
   - [4.1 摄取端点契约规范 (POST /api/spark/webhook/ingest)](#41-摄取端点契约规范-post-apisparkwebhookingest)
   - [4.2 双模安全鉴权机制](#42-双模安全鉴权机制)
   - [4.3 智能容错清洗引擎与推导规则](#43-智能容错清洗引擎与推导规则)
   - [4.4 全网 SSE 实时推流联动](#44-全网-sse-实时推流联动)
   - [4.5 生产级自动化多语言调用代码模板](#45-生产级自动化多语言调用代码模板)
     - [Template A: cURL 命令行直接投递 (Bash / Terminal)](#template-a-curl-命令行直接投递-bash--terminal)
     - [Template B: Google Apps Script (GAS) 定时调度脚本](#template-b-google-apps-script-gas-定时调度脚本)
     - [Template C: Python 3 自动化调用脚本 (requests)](#template-c-python-3-自动化调用脚本-requests)
     - [Template D: Node.js (ESM) 生产调用脚本 (原生 fetch)](#template-d-nodejs-esm-生产调用脚本-原生-fetch)
5. [GitOps 零停机持续交付工作流](#5-gitops-零停机持续交付工作流)
6. [常见问题排查与健康检查 (FAQ & Troubleshooting)](#6-常见问题排查与健康检查-faq--troubleshooting)

---

## 1. 云原生无状态架构与数据安全策略

现代 PaaS 托管平台（如 Render, Railway, Fly.io, Zeabur）均采用轻量化容器实例调度模式：
- **容器短暂性（Ephemeral Containers）**：每次触发 `git push` 重新发布、平台维护迁移节点、或免费容器因休眠唤醒而重启时，容器的本地文件系统均会被**彻底销毁并从零构建**。
- **痛点解决**：如果依赖本地 JSON 文件或 SQLite 作为单点存储，容器每次迭代更新部署都将导致所有历史简报被清空抹除。

为此，本项目全面践行 **12-Factor 云原生计算与存储解耦架构**：

```mermaid
flowchart TD
    subgraph ClientLayer ["客户端层 (Browser & Mobile)"]
        Browser["用户浏览器 / PWA"]
        SSEListener["SSE 实时事件接收器"]
    end

    subgraph PaaSLayer ["云原生无状态计算层 (Render / Zeabur / Railway / Fly.io)"]
        NginxOrNode["Node.js 20 生产网关 (0.0.0.0:$PORT)"]
        ViteSPA["静态前端 SPA (dist/)"]
        APIRouter["REST API & Webhook 路由"]
        SSEBroadcaster["SSE 广播流网关 (/api/spark/stream)"]
        
        NginxOrNode --> ViteSPA
        NginxOrNode --> APIRouter
        APIRouter --> SSEBroadcaster
    end

    subgraph StorageLayer ["长效持久化存储层 (Persistence)"]
        MongoAtlas[("MongoDB Atlas M0 云数据库<br/>(永久免费 / 跨部署长久留存)")]
        LocalBackup[("容器内临时文件双写保底<br/>(只读/开发回退)")]
    end

    subgraph UpstreamAI ["上游 AI 与外部自动化调度 (Gemini Spark)"]
        GoogleAI["Google Gemini 3.8 Flash / 3.1 Pro"]
        SchedulerGAS["Google Apps Script / Cron Job"]
        ExtAgent["外部自建 Agent / 爬虫任务"]
    end

    Browser -->|HTTP GET /| ViteSPA
    Browser -->|API 读写| APIRouter
    SSEBroadcaster -->|全网实时推流| SSEListener

    APIRouter -->|主存储: 永久读写归档| MongoAtlas
    APIRouter -.->|备用双写| LocalBackup

    SchedulerGAS -->|POST /api/spark/webhook/ingest| APIRouter
    ExtAgent -->|POST /api/spark/webhook/ingest| APIRouter
    APIRouter -->|API 调度调用| GoogleAI
```

### 核心设计原则
1. **容器无状态化（Stateless Container）**：代码更新部署任意多次，计算节点随生随灭，业务逻辑毫秒级启动。
2. **数据高可用与永久留存**：所有历史研报通过 Mongoose 自动双向持久化至托管于云端的 **MongoDB Atlas** 数据库集群。即使发生极端云服务商故障迁移，数据依然完整。
3. **本地降级容灾双保险**：若在离线开发、测试环境或网络断开未提供 `MONGO_URI` 时，系统将自动无感降级至本地 `data/briefings/*.json` 文件读写与 Mock 语料生成，确保开发无依赖、服务不崩溃。

---

## 2. 前置资源准备（5分钟准备工作）

在开始正式部署前，请准备好以下 4 项基础设施资源：

### 2.1 GitHub 代码仓库归档
确保您已将完整项目提交并推送至个人的 GitHub 私有或公开代码仓库：
```bash
git remote -v
# 确认本地代码已与 GitHub 关联并完成推送
git push origin master
```

### 2.2 MongoDB Atlas 永久免费 M0 集群开通与网络授权
MongoDB Atlas 官方提供**永久免费的 M0 沙盒集群（512MB 存储空间）**，对于每日一份精炼资讯的业务场景，足够存储 10 年以上的数据。

1. **注册与创建集群**：
   - 访问 [MongoDB Atlas 官网](https://www.mongodb.com/cloud/atlas) 并登录。
   - 创建新项目（Project），选择 **M0 Free** 计划。
   - 选择距离目标用户较近的云服务商区域（例如：AWS / Google Cloud 的 `Singapore (ap-southeast-1)` 或 `Tokyo`）。
2. **创建数据库读写账号 (Database Access)**：
   - 进入左侧导航栏 **Security -> Database Access**。
   - 点击 **Add New Database User**。
   - 认证方式选择 **Password**，设置用户名（如 `gemini_admin`）与强随机密码（如 `Pass_2026_SecureKey`）。
   - 角色权限保持默认的 `Read and write to any database` 即可。
3. **配置网络 IP 白名单 (Network Access) —— 关键步骤**：
   - 进入左侧导航栏 **Security -> Network Access**。
   - 点击 **Add IP Address**。
   - 选择 **Allow Access from Anywhere**（即设置为 `0.0.0.0/0`），然后确认保存。
   > [!IMPORTANT]
   > 为什么必须配置 `0.0.0.0/0`？
   > Render、Railway、Fly.io 等 PaaS 平台的应用容器运行在动态调度集群上，出口 IP 会随着节点弹性扩缩容或滚动更新动态变更。如果不开放 `0.0.0.0/0`，云端容器将无法通过鉴权连接数据库，抛出连接超时异常。
4. **获取数据库连接串 (Connection String)**：
   - 进入 **Databases** 列表，点击集群上的 **Connect** 按钮。
   - 选择 **Drivers**（Node.js），复制生成的连接 URI，格式形如：
     ```text
     mongodb+srv://gemini_admin:<password>@cluster0.abcde.mongodb.net/gemini_news?retryWrites=true&w=majority
     ```
   - 将其中的 `<password>` 替换为刚刚设置的真实数据库密码，数据库名称建议设为 `gemini_news`。

### 2.3 Google Gemini API Key 获取
用于驱动系统内置的每日晨报定时生成流及手动生成引擎：
1. 访问 [Google AI Studio](https://aistudio.google.com/)。
2. 点击 **Get API key**，创建一个新的 API Key。
3. 保存获取到的密文字符串（形如 `AIzaSy...`）。

### 2.4 生成高熵安全密钥 ADMIN_KEY
`ADMIN_KEY` 用于保护管理级敏感操作，包括模型切换、手动触发生成、以及最关键的 **Gemini Spark 外部 Webhook 摄取端点**。

在本地终端运行以下命令生成一个安全的 48 位 16 进制字符串：
```bash
# Linux / macOS / Git Bash
openssl rand -hex 24

# 或使用 Node.js 快速生成
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```
记下该字符串，例如：`8f3d61a29c12b7e5890df621a48c9034e71239bc412356ab`。

---

## 3. 四大主流 PaaS 平台零门槛托管实操

本项目已深度适配云原生 Linux 容器标准，根目录下已包含开箱即用的声明式基础设施配置文件：
- [`render.yaml`](file:///e:/antigravity%E9%A1%B9%E7%9B%AE/%E8%B5%84%E8%AE%AF%E5%89%8D%E7%AB%AF/render.yaml)
- [`railway.json`](file:///e:/antigravity%E9%A1%B9%E7%9B%AE/%E8%B5%84%E8%AE%AF%E5%89%8D%E7%AB%AF/railway.json)
- [`fly.toml`](file:///e:/antigravity%E9%A1%B9%E7%9B%AE/%E8%B5%84%E8%AE%AF%E5%89%8D%E7%AB%AF/fly.toml)
- [`Dockerfile`](file:///e:/antigravity%E9%A1%B9%E7%9B%AE/%E8%B5%84%E8%AE%AF%E5%89%8D%E7%AB%AF/Dockerfile)

您可以自由选择以下任意平台进行部署：

```
                    ┌─── 推荐指数 ★★★★★: Render (Blueprint 声明式配置，免配启动命令)
                    │
                    ├─── 推荐指数 ★★★★☆: Zeabur (亚太网络直连，免备案，延迟低)
选择 PaaS 托管平台 ──┤
                    ├─── 推荐指数 ★★★★☆: Railway (开发者友好，容器秒起，动态 $PORT)
                    │
                    └─── 推荐指数 ★★★☆☆: Fly.io (全球边缘轻量虚拟机，CLI 极客首选)
```

---

### 3.1 Render（强烈推荐 —— Blueprint 声明式一键上线）

Render 提供现代化的云原生应用托管，免费套餐包含 750 小时/月的容器时长以及免费全球 CDN。根目录下的 `render.yaml` 已预定义好完整的服务规范。

#### 部署步骤：
1. 打开并登录 [Render 控制台](https://dashboard.render.com/)。
2. 点击右上角 **New +**，选择 **Blueprint**。
3. 关联并授权您的 GitHub 代码仓库。
4. Render 会自动识别项目根目录下的 `render.yaml`，并列出即将创建的服务（`gemini-spark-news`）。
5. 在配置确认页面的 **Environment Variables** 表单中，填入必须的环境变量：
   - `MONGO_URI`: 您在 2.2 节中取得的 MongoDB Atlas 连接串。
   - `GEMINI_API_KEY`: 您在 2.3 节中取得的 Google Gemini API 密钥。
   - `ADMIN_KEY`: （系统若已自动生成可直接保留，或手动填入 2.4 节生成的密钥）。
6. 点击 **Apply** 开始构建。
   - Render 将执行多阶段 Docker 构建（Stage 1 构建 Vite 产物，Stage 2 组装生产镜像）。
   - 构建耗时约 2~3 分钟。
7. 构建完成后，Render 控制台顶部会呈现分配好的免费公网 HTTPS 域名：
   ```text
   https://gemini-spark-news-xxxx.onrender.com
   ```
8. 访问 `https://gemini-spark-news-xxxx.onrender.com/api/health`，若看到 `{"status":"UP"}`，表明部署圆满成功！

> [!TIP]
> **Render Free Tier 15分钟休眠保活机制与解决方案**：
> Render 的免费实例在连续 15 分钟无 HTTP 访问时会自动休眠。当有新请求进入时，冷启动唤醒通常需要 30~50 秒。
> - **优雅唤醒方案**：外部调度器（如 UptimeRobot、Cron-Job.org 或下文的 Google Apps Script）可配置每 10 分钟发起一次 `GET /api/health` 探针轻量请求，即可保持服务 7x24 小时恒定活跃且不耗费多余额度。

---

### 3.2 Zeabur（亚太网络极速优化 / 极简一键直连）

Zeabur 对亚太地区（新加坡、香港、台湾）用户访问极其友好，网络延迟极低，界面支持全中文。

#### 部署步骤：
1. 访问 [Zeabur 控制台](https://zeabur.com/) 并使用 GitHub 账号登录。
2. 创建一个新项目（New Project），选择 **Singapore** 或 **Hong Kong** 节点。
3. 点击 **Add Service -> Git Repository**，选中当前仓库。
4. Zeabur 会自动分析代码仓库并自动选择使用 `Dockerfile` 进行打包。
5. 进入该服务的 **Variables** 标签页，依次添加环境变量：
   - `PORT`: `3001`（或由平台自动分配）
   - `NODE_ENV`: `production`
   - `MONGO_URI`: `mongodb+srv://...`
   - `GEMINI_API_KEY`: `AIzaSy...`
   - `ADMIN_KEY`: 您的管理密钥
6. 进入 **Networking** 标签页，点击 **Generate Domain** 生成免费二级域名（例如 `xxx.zeabur.app`），亦可绑定自定义独立域名。
7. 部署完成后即可通过公网域名访问完整资讯平台。

---

### 3.3 Railway（云原生自动化构建 / 动态端口适配）

Railway 是现代开发者喜爱的平台，完全原生支持 `railway.json` 规范与动态 `$PORT` 注入。

#### 部署步骤：
1. 登录 [Railway 控制台](https://railway.com/)。
2. 点击 **New Project -> Deploy from GitHub repo**，选中当前仓库。
3. Railway 自动识别根目录的 `railway.json`，并将 Builder 指向 Dockerfile。
4. 点击进入服务，进入 **Variables** 配置页面：
   - `MONGO_URI`: MongoDB Atlas 连接串
   - `GEMINI_API_KEY`: Gemini API 密钥
   - `ADMIN_KEY`: 管理密钥
   - `NODE_ENV`: `production`
   *(注意：无需手动设定 PORT，Railway 会自动动态注入 `$PORT`，本项目代码中已自动读取适配)*
5. 进入 **Settings -> Networking -> Public Networking**，点击 **Generate Domain** 获得公网访问地址。
6. 健康探针（Healthcheck Path）已在 `railway.json` 中预设为 `/api/health`，构建完成后系统自动执行探活。

---

### 3.4 Fly.io（全球边缘容器化部署）

Fly.io 将容器直接打包为微型虚拟机运行在全球边缘节点。

#### 部署步骤：
1. 本地安装 [Fly.io CLI (`flyctl`)](https://fly.io/docs/hands-on/install-flyctl/) 并执行 `fly auth login`。
2. 在项目根目录下打开 `fly.toml`，将第 1 行的 `app = "gemini-spark-news"` 修改为您独有的全局应用名称（例如 `app = "my-gemini-news-2026"`，因为 Fly.io 应用名全局唯一）。
3. 导入加密环境变量（Secrets）：
   ```bash
   fly secrets set \
     MONGO_URI="mongodb+srv://gemini_admin:Pass_2026@cluster0.abcde.mongodb.net/gemini_news?retryWrites=true&w=majority" \
     ADMIN_KEY="your_secure_admin_key_here" \
     GEMINI_API_KEY="AIzaSyYourGeminiApiKeyHere"
   ```
4. 执行部署：
   ```bash
   fly deploy
   ```
5. 部署完成后，可通过 `fly open` 或访问 `https://<your-app-name>.fly.dev` 进入系统。

---

## 4. Gemini Spark 自动直投 Webhook 摄取端点深度指南

为了让外部自动化工作流（如 Google Apps Script、GitHub Actions、n8n、自动化爬虫、云函数或独立运行的 Gemini 调度脚本）能够免登录将每日生成的研报直接推送到系统中，平台专门设计了 **智能 Webhook 摄取端点**。

### 4.1 摄取端点契约规范 (POST /api/spark/webhook/ingest)

- **接口地址**：`POST /api/spark/webhook/ingest`
- **内容协议**：`Content-Type: application/json`
- **响应格式**：`application/json`

#### 投递载荷支持两种形式：

**形式 A：标准结构化 JSON 载荷（推荐）**
```json
{
  "date": "2026-09-28",
  "batchStatus": {
    "status": "COMPLETED",
    "generatedTime": "2026-09-28 08:30:00",
    "progress": 100
  },
  "items": [
    {
      "id": "spark-2026-09-28-01",
      "title": "全球 AI 算力与开源大模型全新范式演进",
      "category": "ai",
      "impactLevel": "critical",
      "summary": "分析师对最新基础模型算力集群能效与推理架构深度剖析...",
      "sentiment": "positive",
      "sentimentScore": 0.88,
      "tags": ["AI", "Agent", "Semiconductor"],
      "nlpKeyEntities": ["Google DeepMind", "Gemini", "NVIDIA"],
      "publishTime": "2026-09-28 08:00:00",
      "originalUrl": "https://example.com/news/1"
    }
  ]
}
```

**形式 B：大模型原生 Markdown 包装文本（超强容错）**
LLM 输出时经常夹带代码块标识 ````json ... ````，Webhook 引擎已内置状态机解析器，支持直接透传含有 Markdown 标记的内容：
```json
{
  "rawContent": "以下是今天的 Gemini Spark 晨报分析输出：\n```json\n{\n  \"batchStatus\": { \"status\": \"COMPLETED\" },\n  \"items\": [ ... ]\n}\n```\n分析完成。"
}
```

---

### 4.2 双模安全鉴权机制

为了应对不同外部调用环境的差异（部分 Webhook 平台或旧版无代码工具不支持配置自定义 HTTP Header），端点支持两种鉴权模式：

| 模式 | 配置方式 | 适用场景 |
| :--- | :--- | :--- |
| **请求头模式 (Header)** | `X-Admin-Key: <ADMIN_KEY>` | cURL、Node.js、Python、标准 HTTP Webhook 调用 |
| **URL 参数模式 (Query)** | `?key=<ADMIN_KEY>` | Google Apps Script、部分无代码平台、极简 GET/POST 触发器 |

服务端采用恒定时间比对（`crypto.timingSafeEqual`），彻底防御针对密钥的侧信道时序攻击（Timing Attacks）。若密钥缺失或不匹配，将返回统一的规范 401 拦截响应：
```json
{
  "code": 401,
  "message": "缺少鉴权密钥 (X-Admin-Key 或 ?key=)"
}
```

---

### 4.3 智能容错清洗引擎与推导规则

Webhook 接收到数据后，服务端流水线执行以下智能清洗：
1. **多重载荷探查**：优先提取 `req.body.items`；若不存在，扫描 `rawContent` 或 `content` 字符串，通过正则表达式 ```` ```(?:json)?\s*([\s\S]*?)\s*``` ```` 剔除 Markdown 伪代码块外壳，还原核心 JSON。
2. **日期自动推导策略（Smart Date Fallback）**：
   - 优先级 1：顶层显式传入的 `date` 字段（如 `"2026-09-28"`）；
   - 优先级 2：从 `batchStatus.generatedTime` 中智能正则提取 `YYYY-MM-DD`；
   - 优先级 3：从首条新闻的 `items[0].publishTime` 中正则提取 `YYYY-MM-DD`；
   - 优先级 4：若以上均不存在，默认采用系统当日的 UTC 日期。
3. **入库校验**：验证 `items` 必须为非空数组且日期符合标准 `YYYY-MM-DD`，否则返回 HTTP 400 及友好错误描述。

---

### 4.4 全网 SSE 实时推流联动

一旦数据校验通过并持久化入库，后端会立刻调用 SSE 广播网关（`broadcastSSEEvent`）：
- 向当前所有打开了前端页面的在线浏览器即刻广播 `COMPLETED` 事件；
- 前端页面**无需用户手动刷新**，即会自动呈现带有粒子动画与发光状态的全新简报卡片与最新批次条目。

---

### 4.5 生产级自动化多语言调用代码模板

以下提供 4 套经过严格验证的调用模板，您可以直接复制使用：

#### Template A: cURL 命令行直接投递 (Bash / Terminal)

**模式 1：通过 HTTP Header 鉴权**
```bash
curl -X POST https://your-app.onrender.com/api/spark/webhook/ingest \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: 8f3d61a29c12b7e5890df621a48c9034e71239bc412356ab" \
  -d '{
    "date": "2026-09-28",
    "batchStatus": {
      "status": "COMPLETED",
      "generatedTime": "2026-09-28 08:30:00",
      "progress": 100
    },
    "items": [
      {
        "id": "curl-demo-01",
        "title": "全球金融科技与多智能体系统协同报告",
        "category": "finance",
        "impactLevel": "high",
        "summary": "通过 cURL 自动投递的金融前沿情报。",
        "sentiment": "neutral",
        "sentimentScore": 0.0,
        "tags": ["Finance", "Agent"],
        "nlpKeyEntities": ["Federal Reserve", "Treasury"]
      }
    ]
  }'
```

**模式 2：通过 URL Query 参数鉴权**
```bash
curl -X POST "https://your-app.onrender.com/api/spark/webhook/ingest?key=8f3d61a29c12b7e5890df621a48c9034e71239bc412356ab" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"id":"01","title":"测试研报","category":"ai","impactLevel":"low","summary":"测试摘要","tags":["AI"]}]}'
```

---

#### Template B: Google Apps Script (GAS) 定时调度脚本

利用 Google 官方免费提供的 Google Apps Script，可以实现完全免服务器的每天定时拉取 Gemini 生成结果并自动推送到您的 PaaS 站点：

```javascript
/**
 * Google Apps Script 自动化每日简报投递任务
 * 
 * 部署指引:
 * 1. 访问 https://script.google.com/ 创建新项目
 * 2. 粘贴本代码，并在 Project Settings -> Script Properties 中配置:
 *    - TARGET_WEBHOOK_URL: 您的应用公网地址 (如 https://your-app.onrender.com/api/spark/webhook/ingest)
 *    - ADMIN_KEY: 您的 ADMIN_KEY
 *    - GEMINI_API_KEY: 您的 Google Gemini API 密钥
 * 3. 在左侧 Triggers (时钟图标) 中添加定时触发器:
 *    - 执行函数: triggerDailyGeminiBriefing
 *    - 事件源: Time-driven (时间驱动)
 *    - 类型: Day timer (特定时间段，如每日早晨 8:00 - 9:00)
 */

function triggerDailyGeminiBriefing() {
  const scriptProps = PropertiesService.getScriptProperties();
  const webhookUrl = scriptProps.getProperty('TARGET_WEBHOOK_URL');
  const adminKey = scriptProps.getProperty('ADMIN_KEY');
  const geminiApiKey = scriptProps.getProperty('GEMINI_API_KEY');

  if (!webhookUrl || !adminKey || !geminiApiKey) {
    Logger.log('❌ 错误: 缺少必要的 Script Properties 环境变量！');
    return;
  }

  const today = Utilities.formatDate(new Date(), 'GMT+8', 'yyyy-MM-dd');
  Logger.log(`🚀 开始执行 [${today}] 晨报自动化生产与直投...`);

  // 1. 调用 Gemini API 生成结构化数据
  const prompt = `请作为资深科技与宏观情报分析师，生成 ${today} 晨报。请严格返回一个 JSON 对象，结构包含:
{
  "date": "${today}",
  "batchStatus": { "status": "COMPLETED", "generatedTime": "${today} 08:30:00", "progress": 100 },
  "items": [
    {
      "id": "gas-${today}-01",
      "title": "新闻标题",
      "category": "ai",
      "impactLevel": "high",
      "summary": "精炼分析摘要（150字左右）",
      "sentiment": "positive",
      "sentimentScore": 0.8,
      "tags": ["AI", "Tech"],
      "nlpKeyEntities": ["Google", "DeepMind"],
      "publishTime": "${today} 08:00:00"
    }
  ]
}`;

  const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
  const geminiPayload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json"
    }
  };

  const geminiResponse = UrlFetchApp.fetch(geminiEndpoint, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(geminiPayload),
    muteHttpExceptions: true
  });

  if (geminiResponse.getResponseCode() !== 200) {
    Logger.log(`❌ Gemini 调用失败: ${geminiResponse.getContentText()}`);
    return;
  }

  const geminiJson = JSON.parse(geminiResponse.getContentText());
  const generatedText = geminiJson.candidates[0].content.parts[0].text;

  // 2. 通过 Webhook 将结果直投到 PaaS 服务
  const targetUrl = `${webhookUrl}?key=${encodeURIComponent(adminKey)}`;
  const webhookResponse = UrlFetchApp.fetch(targetUrl, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'X-Admin-Key': adminKey
    },
    payload: JSON.stringify({ rawContent: generatedText }),
    muteHttpExceptions: true
  });

  Logger.log(`📡 Webhook 响应码: ${webhookResponse.getResponseCode()}`);
  Logger.log(`📄 Webhook 响应内容: ${webhookResponse.getContentText()}`);
}
```

---

#### Template C: Python 3 自动化调用脚本 (requests)

适合作为本地定时脚本、Airflow DAG 或 GitHub Actions 工作流的一环：

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gemini Spark 资讯自动化推送脚本 (Python 3)
依赖安装: pip install requests
"""

import os
import sys
import json
from datetime import datetime
import requests

# 配置参数 (支持从系统环境变量读取)
BASE_URL = os.getenv("API_BASE_URL", "https://your-app.onrender.com")
ADMIN_KEY = os.getenv("ADMIN_KEY", "your_admin_secret_key_here")
INGEST_ENDPOINT = f"{BASE_URL.rstrip('/')}/api/spark/webhook/ingest"

def build_sample_briefing():
    today = datetime.now().strftime("%Y-%m-%d")
    now_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    return {
        "date": today,
        "batchStatus": {
            "status": "COMPLETED",
            "generatedTime": now_time,
            "progress": 100,
            "statusText": "自动化归档完成"
        },
        "items": [
            {
                "id": f"py-{today}-01",
                "title": "全球算力网络能效革命与大模型端侧部署突破",
                "category": "ai",
                "impactLevel": "critical",
                "summary": "分析表明低功耗边缘芯片与模型蒸馏技术的结合正快速降低企业级智能体运行成本。",
                "sentiment": "positive",
                "sentimentScore": 0.85,
                "tags": ["AI", "EdgeComputing", "Semiconductor"],
                "nlpKeyEntities": ["Google", "NVIDIA", "Qualcomm"],
                "publishTime": now_time,
                "originalUrl": "https://example.com/ai-report"
            }
        ]
    }

def push_briefing_to_webhook(payload):
    headers = {
        "Content-Type": "application/json",
        "X-Admin-Key": ADMIN_KEY
    }
    
    print(f"🔄 正在向 {INGEST_ENDPOINT} 推送数据...")
    try:
        response = requests.post(
            INGEST_ENDPOINT,
            headers=headers,
            json=payload,
            timeout=15
        )
        
        if response.status_code == 200:
            res_data = response.json()
            print("✅ 简报推送成功！")
            print(f"   - 归档批次: {res_data.get('data', {}).get('date')}")
            print(f"   - 录入条目: {res_data.get('data', {}).get('total')} 条")
            return True
        else:
            print(f"❌ 推送失败 [HTTP {response.status_code}]: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ 网络请求异常: {e}")
        return False

if __name__ == "__main__":
    briefing_data = build_sample_briefing()
    success = push_briefing_to_webhook(briefing_data)
    sys.exit(0 if success else 1)
```

---

#### Template D: Node.js (ESM) 生产调用脚本 (原生 fetch)

适用于 Node.js 18+ 或 Bun 环境，零第三方依赖：

```javascript
/**
 * Gemini Spark 资讯推送脚本 (Node.js ESM)
 * 运行方式: node pushBriefing.mjs
 */

const BASE_URL = process.env.API_BASE_URL || 'https://your-app.onrender.com';
const ADMIN_KEY = process.env.ADMIN_KEY || 'your_admin_secret_key_here';
const INGEST_URL = `${BASE_URL.replace(/\/+$/, '')}/api/spark/webhook/ingest`;

async function pushBriefing() {
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  const payload = {
    date: today,
    batchStatus: {
      status: 'COMPLETED',
      generatedTime: now,
      progress: 100
    },
    items: [
      {
        id: `node-${Date.now()}`,
        title: '自动化云原生可观测性架构演进趋势',
        category: 'cloud',
        impactLevel: 'medium',
        summary: '以 OpenTelemetry 与无状态微服务为代表的云原生监控框架成为主流方案。',
        sentiment: 'neutral',
        sentimentScore: 0.1,
        tags: ['Cloud', 'DevOps'],
        nlpKeyEntities: ['Kubernetes', 'Docker']
      }
    ]
  };

  console.log(`🚀 开始投递简报到: ${INGEST_URL}`);

  try {
    const res = await fetch(INGEST_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': ADMIN_KEY
      },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(`[HTTP ${res.status}] ${result.message || '请求失败'}`);
    }

    console.log('✅ 投递成功！返回数据:', result);
  } catch (err) {
    console.error('❌ 投递过程出现错误:', err.message);
    process.exit(1);
  }
}

pushBriefing();
```

---

## 5. GitOps 零停机持续交付工作流

结合无状态容器与 MongoDB Atlas 后，整个团队可以享受流畅现代的 **GitOps 自动化交付体验**：

```
[本地开发与单测]
     │ (npm run build && node --test)
     ▼
[代码提交] ────> git push origin master
                      │
                      ▼
               [PaaS Webhook 捕获代码变动]
                      │
                      ├─ 1. 拉取最新代码与 Dockerfile
                      ├─ 2. 自动化多阶段构建 (Vite 构建产物 + Node.js 镜像)
                      ├─ 3. 启动新版容器并监听动态 $PORT
                      ├─ 4. 执行 GET /api/health 健康探针探活
                      │
                      ▼
               [蓝绿 / 滚动无缝流量切换 (0 停机)]
                      │
                      ▼
        ┌─────────────────────────────┐
        │  旧版本容器安全销毁退出     │
        │  新版本容器接管所有公网流量 │
        │  MongoDB Atlas 历史研报 0 丢失 │
        └─────────────────────────────┘
```

### 日常迭代五步法：
1. **本地开发修改代码**（例如调整 UI 组件或扩展 API）。
2. **本地测试与构建验证**：
   ```bash
   # 1. 运行单测与集成测试
   node --test tests/*.test.mjs

   # 2. 运行生产静态资源构建
   npm run build
   ```
3. **提交并推送到远端仓库**：
   ```bash
   git add .
   git commit -m "feat(ui): 升级资讯详情面板交互样式"
   git push origin master
   ```
4. **云端全自动发布**：
   - PaaS 平台（Render / Railway / Zeabur / Fly.io）检测到代码推送，自动拉起多阶段 Docker 构建。
   - 探针通过 `/api/health` 确认服务存活后，执行毫秒级滚动替换。
5. **即刻查看最新效果**：
   - 访问公网域名直接使用新功能。
   - 之前由 Gemini Spark 摄取的全部历史数据无缝呈现，丝毫不受容器替换的影响。

---

## 6. 常见问题排查与健康检查 (FAQ & Troubleshooting)

### 6.1 如何利用 `/api/health` 自检容器状态？
访问 `https://your-domain.com/api/health`，标准健康响应格式如下：
```json
{
  "code": 200,
  "status": "UP",
  "version": "1.0.0",
  "environment": "production",
  "timestamp": "2026-09-27T12:00:00.000Z",
  "uptime": 3600.5,
  "activeModel": "gemini-3.8-flash",
  "scheduler": {
    "status": "idle",
    "lastBatchDate": "2026-09-27",
    "nextScheduleTime": "08:30 (每日晨报)"
  }
}
```
- **status 为 UP**：表明网关运转正常。
- **activeModel**：当前正在工作的 Gemini 模型。
- **scheduler**：表示内置调度器的当前任务状态（`idle` 空闲或 `generating` 正在分析生成）。

---

### 6.2 跨域问题排查 (CORS Blocked)
- **现象**：浏览器控制台提示 `Access to fetch at ... has been blocked by CORS policy`。
- **排查与解决**：
  1. 如果您的前端项目独立托管（例如前端在 Vercel/Netlify，后端在 Render），请检查服务端的 `CORS_ORIGIN` 环境变量。
  2. 在 PaaS 控制台中将 `CORS_ORIGIN` 设为您前端的准确域名，或包含多个域名（英文逗号分隔），例如：
     ```text
     CORS_ORIGIN=https://my-frontend.vercel.app,http://localhost:5173
     ```
  3. 保存环境变量后，PaaS 会自动热重启容器使配置生效。

---

### 6.3 MongoDB 连接超时或报错 (MongooseServerSelectionError)
- **现象**：服务端日志打印 `[Repository] ⚠️ MongoDB 连接断开，系统已自动平滑降级至【LOCAL_FALLBACK】` 或 `connection timed out`。
- **排查三要素**：
  1. **检查 IP 白名单（最常见）**：回到 MongoDB Atlas 控制台的 **Network Access**，核实白名单中是否存在 `0.0.0.0/0` 记录且状态为 `Active`。
  2. **检查密码特殊字符转义**：如果您的数据库密码包含特殊符号（如 `@`, `:`, `/`, `?`, `#` 等），必须进行 URL 编码（例如 `@` 应转义为 `%40`），否则会导致连接串语法解析错误。
  3. **检查连接串前缀**：必须使用标准的 `mongodb+srv://` 格式，并确保末尾带有 `?retryWrites=true&w=majority`。

---

### 6.4 Webhook 摄取鉴权失败 (HTTP 401 Unauthorized)
- **现象**：调用 `/api/spark/webhook/ingest` 返回 `{"code": 401, "message": "鉴权密钥无效"}`。
- **排查方法**：
  1. 检查调用方传递的 Key 与 PaaS 平台环境变量中配置的 `ADMIN_KEY` 是否完全一致（注意前后不要有空格或换行）。
  2. 确认请求头名称是否准确为 `X-Admin-Key`，或 URL Query 参数是否准确为 `?key=...`。
  3. 若在 Render 上启用了 `generateValue: true`，请先进入 Render 服务的 **Environment** 面板复制平台自动生成的高熵密文。

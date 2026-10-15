# Render 极速 3 分钟一键云端部署指引 (Render One-Click Blueprint Guide)

本文档面向希望将《Gemini Spark News 全球智库平台》快速部署至公网环境的开发者，提供基于 Render Blueprint (`render.yaml`) 的 3 分钟极速上线指南。

---

## 架构概览

```
  ┌─────────────────────────────────────────────────────────────┐
  │                      GitHub Repository                      │
  │                  (Shawn-cz/gemini-spark-news)               │
  └──────────────┬──────────────────────────────┬───────────────┘
                 │ git push (触发 CI)           │ Blueprint 自动同步
                 ▼                              ▼
  ┌──────────────────────────────┐ ┌────────────────────────────┐
  │      GitHub Actions CI       │ │     Render Cloud PaaS      │
  │  - tsc --noEmit 强类型检查   │ │  - 读取 render.yaml        │
  │  - 生产打包 (Vite Build)     │ │  - 构建 Alpine Linux 容器  │
  │  - 17 套测试套件 (63项测试)  │ │  - 端口动态适配 (0.0.0.0)  │
  │  - 探针可用性验证 (/api/...) │ │  - 分配免费 HTTPS 域名     │
  └──────────────┬───────────────┘ └────────────┬───────────────┘
                 │                              │
                 │ 每 14 分钟心跳保活脉冲       ▼
                 └────────────────────▶ [https://your-app.onrender.com]
                                                ▲
                                                │ 永久持久化存储
                                   ┌────────────┴───────────────┐
                                   │     MongoDB Atlas (M0)     │
                                   │  - 512MB 永久免费云数据库  │
                                   │  - 归档研报、全景脉冲数据  │
                                   └────────────────────────────┘
```

---

## 一、前置准备（2 分钟）

在开始部署前，请确保具备以下 3 个核心凭据：

1. **GitHub 代码仓库**：当前仓库 `Shawn-cz/gemini-spark-news`。
2. **MongoDB Atlas 免费集群 (M0)**：
   - 登录 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) 创建免费沙盒（永久 512MB 免费）；
   - 在 **Network Access** 中添加 IP 白名单：`0.0.0.0/0`（因为云端容器节点 IP 动态漂移）；
   - 在 **Database Access** 中创建读写账号与密码；
   - 获取连接串，格式形如：
     `mongodb+srv://<db_user>:<db_password>@cluster0.xxxx.mongodb.net/gemini_spark_news?retryWrites=true&w=majority`
3. **Google AI Studio Gemini API Key**：
   - 前往 [Google AI Studio](https://aistudio.google.com/) 免费获取 API Key。

---

## 二、Render 一键 Blueprint 部署实操（1 分钟）

1. **登录 Render 控制台**：访问 [dashboard.render.com](https://dashboard.render.com/)；
2. **新建 Blueprint 部署**：
   - 点击右上角 **New +** 按钮，选择 **Blueprint**；
   - 在仓库列表中搜索并关联 `gemini-spark-news`（或输入仓库 Git URL）；
   - Render 会自动识别根目录下的 `render.yaml` 基础设施声明文件；
3. **填写环境变量 (Environment Variables)**：
   - `MONGO_URI`: 粘贴上方准备好的 MongoDB Atlas 连接串；
   - `GEMINI_API_KEY`: 粘贴 Google Gemini API Key；
   - `ADMIN_KEY`: 输入自定义高熵密钥（如 `spark-intelligence-prod-key-2026`，用于后台管理与外部 Webhook 直投鉴权）；
4. **点击 Apply 开始自动构建**：
   - Render 将自动拉取代码、构建 Alpine 多阶段 Docker 镜像、执行编译并启动服务；
   - 约 1.5 ~ 2 分钟构建完成后，状态将变更为 **Live (Healthy)**；
   - 顶端将分配专属免费底层 HTTPS 域名（例如：`https://gemini-spark-news.onrender.com`），该域名作为后续自定义域名 DNS 解析的 CNAME 目标。

---

## 三、绑定自定义独立顶级域名（以 `shawn-news.top` 为例）

如果你已拥有个人独立顶级域名（如 `shawn-news.top`），**完全无需使用 Render 分配的二级域名**，按以下 2 步即可直接使用自己的顶级域名访问智库看板：

### 1. 在 Render 控制台添加自定义域名
1. 点击已部署的服务进入控制台，在左侧导航栏点击 **Settings**；
2. 滚动找到 **Custom Domains** 区域，点击 **Add Custom Domain**；
3. 输入你的域名：
   - 根域名：`shawn-news.top`
   - （可选）子域名：`www.shawn-news.top`
4. 点击 **Save**。Render 会自动为你**申请并管理免费的 SSL/TLS 证书（全自动 Let's Encrypt HTTPS）**。

### 2. 在域名 DNS 解析服务商（如腾讯云/阿里云/Cloudflare/DNSPod）添加解析记录
登录购买 `shawn-news.top` 的 DNS 控制台，添加 1~2 条解析记录：

| 记录类型 | 主机记录 | 记录值 (指向) | 说明 |
| :--- | :--- | :--- | :--- |
| **CNAME** (或 ALIAS/ANAME) | `@` (根域名) | `gemini-spark-news.onrender.com` (Render 提供的服务地址) | 访问 `https://shawn-news.top` |
| **CNAME** | `www` | `gemini-spark-news.onrender.com` | 访问 `https://www.shawn-news.top` |

> [!TIP]
> - 如果你的 DNS 服务商支持 **CNAME Flattening** 或 **ALIAS 记录**（如 Cloudflare、DNSPod、阿里云），可以直接将根域名 `@` CNAME 到 Render 地址；
> - 记录添加后，通常 1~5 分钟内生效。Render 自动完成 SSL 证书颁发后，状态即变为 **Verified**。

---

## 四、配置 GitHub Actions 14 分钟免休眠全天候保活

Render Free Tier 实例在连续 15 分钟无外部请求时会自动进入休眠状态（冷启动需 20~50 秒）。本项目内建了全自动心跳保活工作流：

1. 打开 GitHub 仓库页面，进入 **Settings** -> **Secrets and variables** -> **Actions**；
2. 点击 **New repository secret**，新增：
   - **Name**: `APP_HOST`
   - **Secret**: 直接填入你的独立域名 **`shawn-news.top`**；
3. 保存后，工作流 `.github/workflows/keepalive-and-sync.yml` 将每 14 分钟自动向 `https://shawn-news.top/api/health` 发起健康检查脉冲，彻底击穿休眠阈值，确保用户随时打开均享有 0 毫秒极速首屏！

---

## 五、外部 Gemini Spark 智能体 Webhook 直投调用

当线上服务就绪后，任何外部智能体、定时脚本或自动化平台（如 n8n、Zapier、GitHub Actions、Google Apps Script）均可直接将生成的研报推送到云端：

### 契约端点
- **URL**: `POST https://<your-render-domain>/api/spark/webhook/ingest`
- **鉴权标头**: `X-Admin-Key: <你设置的 ADMIN_KEY>`（亦支持 URL Query `?key=<ADMIN_KEY>`）

### cURL 示例
```bash
curl -X POST "https://gemini-spark-news.onrender.com/api/spark/webhook/ingest" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: YOUR_ADMIN_KEY" \
  -d '{
    "date": "2026-10-15",
    "batchStatus": {
      "status": "COMPLETED",
      "generatedTime": "2026-10-15 08:30:00",
      "progress": 100
    },
    "items": [
      {
        "id": "external-spark-01",
        "title": "全球算力重构与分布式智能体网络商用落地",
        "englishTitle": "Global Compute Restructuring & Distributed Agent Commercialization",
        "category": "ai",
        "impactLevel": "critical",
        "summary": "新一代多模态大模型与端侧推理架构实现历史性突破，全行业推理成本下降 80%。",
        "sentiment": "positive",
        "sentimentScore": 0.88,
        "source": "Gemini Global Intelligence",
        "tags": ["AI", "Compute", "Cloud"],
        "nlpKeyEntities": ["Gemini", "Atlas", "NVIDIA"]
      }
    ]
  }'
```

一旦投递成功，服务端将自动写入 MongoDB 云数据库，并通过 Server-Sent Events (SSE) 向所有在线访问者实时广播无感刷新！

---

## 五、日常维护与健康监测

- **服务健康探针**：`https://<your-domain>/api/health`（返回 MongoDB 状态、内存、运行时间）
- **归档索引探针**：`https://<your-domain>/api/archive/manifest`
- **本地回归测试**：在推送代码前运行 `npm run build && npm test` 确保 100% 绿灯。

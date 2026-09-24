# Gemini Spark 智库看板 · 全栈独立开发 MVP 演进规划与 To-Do List

> **开发模式**：全栈独立开发（Full-Stack Indie Development）  
> **核心原则**：渐进式演进、双模解耦（无 DB 时降级本地文件，有 DB 时平滑接管）、Bite-Sized 任务逐项推进  
> **生成时间**：2026-09-24  

---

## 🗺️ MVP 阶段分解全景图 (Roadmap)

```mermaid
flowchart TD
    MVP1["MVP 1: 视觉终端与本地轻量管道 (已完成 ✅)"]
    MVP2["MVP 2: Mongoose 数据建模与双模架构 (当前阶段 ⏳)"]
    MVP3["MVP 3: MongoDB Atlas 云数据库实操接入与联调"]
    MVP4["MVP 4: 数据库聚合分析与跨期智库增强"]
    MVP5["MVP 5: 生产打包、Docker 容器化与独立上线部署"]

    MVP1 --> MVP2 --> MVP3 --> MVP4 --> MVP5
```

---

## 📋 逐项推进 To-Do List

### ✅ MVP 1：前沿大屏与本地动态管道（已全部完成）
- [x] **1.1** 黑曜石暗黑玻璃拟态前端大屏设计（Tailwind + Lucide）
- [x] **1.2** 三大新奇交互视图：Bento 智库看板、四象限垂直泳道、24H 时空轨迹轴
- [x] **1.3** Gemini NLP 认知档案抽屉（模型血缘、命名实体抽取 NER、情绪极性连续评分）
- [x] **1.4** 工业级前端防御：30 秒后台静默轮询、AbortController 异步竞态消除、长标题 `line-clamp-2` 截断
- [x] **1.5** 本地动态简报目录热加载引擎（`data/briefings/*.json`）
- [x] **1.6** 前端右上角【📥 导入简报】一键粘贴解析弹窗与 API 保存端点
- [x] **1.7** 深度定制 Gemini Spark 任务 Prompt 模板：
  - 严格约束生成 **8-12 条** 新闻；
  - 配额限制：`climate` 气候类严格控制在 **1-2 条**；
  - 核心倾斜：剩余 **7-10 条** 全部分配给 `ai`（算力）、`finance`（宏观金融）、`geopolitics`（地缘经贸）。

---

### ⏳ MVP 2：Mongoose 建模与双模无感降级架构（进行中 / 下一步）
> **核心目标**：在您还未部署 MongoDB 云实例前，先把后端的**数据持久层骨架与抽象接口（Repository / ODM 层）** 搭建完毕，实现“有 DB 走云端，无 DB 走文件”，零报错零风险。

- [ ] **2.1 依赖安装与环境变量规范**
  - [ ] 安装 `mongoose` 与 `dotenv`；
  - [ ] 创建 `.env.example`，配置 `PORT=3001`、`MONGO_URI=`（留空或注释）；
  - [ ] 配置 `.gitignore` 确保真实的 `.env` 永远不被 Git 提交。
- [ ] **2.2 Mongoose Schema 建模与数据契约设计**
  - [ ] 编写 `server/models/NewsItem.mjs`（标题、外媒源、分类、影响等级、情绪分、NER 实体数组、复合索引）；
  - [ ] 编写 `server/models/BatchStatus.mjs`（日期、状态、全球情绪指数、当前阶段、更新时间戳）。
- [ ] **2.3 双模数据访问仓储层设计 (`server/repository.mjs`)**
  - [ ] 抽象统一的数据访问接口：`getNewsList()`, `getBatchStatus()`, `saveBriefing()`, `getAvailableDates()`；
  - [ ] 实现自动判断机制：检测到有效的 `MONGO_URI` 时连接数据库；若未配置或连接失败，**自动且平滑降级至本地 `data/briefings/` 静态引擎**。
- [ ] **2.4 历史数据种子工具 (`scripts/seed-mongo.mjs`)**
  - [ ] 编写种子填充脚本，支持一键将本地现有的多日智库历史样本批量写入 MongoDB。

---

### ⏳ MVP 3：MongoDB Atlas 云数据库实操接入与联调
> **核心目标**：协助您完成 MongoDB Atlas 免费云集群的开通，填入连接串，跑通真正的前后端云数据库联动。

- [ ] **3.1 MongoDB Atlas 免费 M0 集群创建指导**
  - [ ] 注册并创建免费集群（推荐选择离中国大陆较近的 AWS 新加坡/东京区）；
  - [ ] 创建数据库只读/读写账号，配置 Network Access 白名单（`0.0.0.0/0`）；
  - [ ] 获取形如 `mongodb+srv://user:pass@cluster.mongodb.net/gemini_news` 的连接串。
- [ ] **3.2 云端数据库连接与心跳健康检查**
  - [ ] 在 `.env` 中填入连接串，启动服务验证连接成功日志；
  - [ ] 增加 `/api/health` 探针接口，返回数据库连接状态与时延。
- [ ] **3.3 执行种子导入与端到端实测**
  - [ ] 运行 `node scripts/seed-mongo.mjs`，历史数据上云并在 Atlas 控制台查验；
  - [ ] 打开前端大屏，通过【📥 导入简报】新增一天简报，验证数据库实时写入与大屏刷新。

---

### ⏳ MVP 4：高级查询聚合与跨期智库分析
> **核心目标**：释放数据库的真实威力，提供纯文件系统无法轻易做到的深度智库分析功能。

- [ ] **4.1 跨期关键词全局全文检索**
  - [ ] 利用 MongoDB Text Index 建立多字段全文检索索引；
  - [ ] 支持用户在搜索框中跨所有历史天次检索“英伟达”、“台积电”、“霍尔木兹海峡”等关键事件。
- [ ] **4.2 全球宏观情绪历史走势折线分析（Aggregation Pipeline）**
  - [ ] 编写 MongoDB 聚合查询，统计过去 7 天 / 30 天每日全球情绪加权指数；
  - [ ] 在前端大屏增加“宏观情绪周期走势图”卡片。
- [ ] **4.3 研报一键导出功能**
  - [ ] 支持在前端大屏一键将当日全部精选简报导出为美观的 Markdown 晨报文本或 PDF，方便分发。

---

### ⏳ MVP 5：生产打包、容器化与独立部署上线
> **核心目标**：将应用打包为一个完整的工业级独立产品，支持在公网独立运行。

- [ ] **5.1 前后端同构一体化构建**
  - [ ] Express 静态托管生产构建产物 `dist/`，实现单端口 `3001` 同时承载前端页面与后端 API。
- [ ] **5.2 Docker 容器化打包**
  - [ ] 编写 `Dockerfile` 与 `.dockerignore`，支持单镜像跨平台运行；
  - [ ] 编写 `docker-compose.yml`（可选包含本地 MongoDB 备选方案）。
- [ ] **5.3 免费云端部署上线（如 Render / Fly.io / 个人云服务器）**
  - [ ] 提供一键部署指南，让您的智库看板拥有公网域名，支持手机随时查阅。

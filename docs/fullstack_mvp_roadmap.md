# Gemini Spark 智库看板 · 全栈独立开发 MVP 演进规划与 To-Do List

> **开发模式**：全栈独立开发（Full-Stack Indie Development）  
> **核心原则**：渐进式演进、双模解耦（无 DB 时降级本地文件，有 DB 时平滑接管）、视觉契约严谨、开发调试敏捷  
> **更新时间**：2026-09-24  

---

## 🗺️ MVP 阶段分解全景图 (Roadmap)

```mermaid
flowchart TD
    MVP1["MVP 1: 视觉终端与本地轻量管道 (已完成 ✅)"]
    MVP2["MVP 2: Mongoose 建模、前端效果契约与调试套件 (当前阶段 ⏳)"]
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

### ✅ MVP 2：Mongoose 建模、前端效果契约与调试套件（已全部完成）
> **核心目标**：
> 1. 在您还未部署 MongoDB 云实例前，先把后端的**数据持久层骨架与抽象接口（Repository / ODM 层）** 搭建完毕，实现“有 DB 走云端，无 DB 走文件”，零报错零风险；
> 2. **建立前端视觉与效果契约**，确保无论后端来自数据库还是文件，界面渲染与动效规范 100% 坚固一致；
> 3. **内置前端开发者调试工具箱 (DevTools)**，支持一键模拟各种网络与业务极端状态。

#### 2.A 后端数据建模与双模架构
- [x] **2.1 依赖安装与环境变量规范**
  - [x] 安装 `mongoose` 与 `dotenv`；
  - [x] 创建 `.env.example`，配置 `PORT=3001`、`MONGO_URI=`（留空或注释）；
  - [x] 配置 `.gitignore` 确保真实的 `.env` 永远不被 Git 提交。
- [x] **2.2 Mongoose Schema 建模与数据契约设计**
  - [x] 编写 `server/models/NewsItem.mjs`（标题、外媒源、分类、影响等级、情绪分、NER 实体数组、复合索引）；
  - [x] 编写 `server/models/BatchStatus.mjs`（日期、状态、全球情绪指数、当前阶段、更新时间戳）。
- [x] **2.3 双模数据访问仓储层设计 (`server/repository.mjs`)**
  - [x] 抽象统一的数据访问接口：`getNewsList()`, `getBatchStatus()`, `saveBriefing()`, `getAvailableDates()`；
  - [x] 实现自动判断机制：检测到有效的 `MONGO_URI` 时连接数据库；若未配置或连接失败，**自动且平滑降级至本地 `data/briefings/` 静态引擎**。
- [x] **2.4 历史数据种子工具 (`scripts/seed-mongo.mjs`)**
  - [x] 编写种子填充脚本，支持一键将本地现有的多日智库历史样本批量写入 MongoDB。

#### 2.B 前端效果契约 (Frontend Visual Effect Contracts)
- [x] **2.5 数据字段与视觉映射契约 (Field-to-Visual Contracts)**
  - [x] **色彩与领域契约**：
    - `ai` $\to$ 霓虹青 (Cyan-400 / Cyan Glow)
    - `finance` $\to$ 靛青与金 (Indigo-400 / Amber-400)
    - `geopolitics` $\to$ 警戒紫红与深橙 (Purple-400 / Rose-400)
    - `climate` $\to$ 翡翠绿与薄荷 (Emerald-400 / Teal-400)
  - [x] **影响等级与 Bento 布局契约**：
    - 当且仅当 `impactLevel === 'critical'` 时，自动升格为双列宽幅 Hero 大卡，带有动态边框脉冲；
    - 确保在缺少 critical 数据时，Bento 栅格自适应排列，绝不留白破损。
  - [x] **情绪极性心电图契约 (Sentiment Pulse)**：
    - `sentimentScore` (-1.0 ~ +1.0) 精确映射至 -100 ~ +100；
    - 动态根据极性分驱动心电图背景灯、百分比数值色彩（`>+30` 显著积极绿、`0~+30` 谨慎乐观青、`-30~0` 中性灰、`<-30` 避险红）。
  - [x] **排版截断防御契约**：
    - 标题强制 `line-clamp-2 break-words`，第 2 行末尾必须精确截断展示 `...`；
    - 卡片摘要限制 3 行，侧滑抽屉展示完整长文本与 Markdown 链接。
  - [x] **三大边界状态契约**：
    - 初次加载骨架屏（Skeleton Shimmer 动效，避免布局跳跃）；
    - 接口错误捕获（红调告警卡片 + 重试交互）；
    - 空数据状态（空态插画 + 重置过滤引导）。

#### 2.C 前端调试套件与开发者控制面板 (DevTools Panel)
- [x] **2.6 前端内置调试面板 (DevTools Suite)**
  - [x] **数据源运行模式指示器**：
    - 实时显示当前数据来自 `MONGODB_ATLAS (云数据库)` 还是 `LOCAL_FALLBACK (本地文件)`；
    - 显示 API 请求耗时与连接健康度；
  - [x] **状态机一键切换器**：
    - 一键将界面置为：`COMPLETED` (已完成正常展示)、`RUNNING` (雷达计算扫描态)、`ERROR` (接口 500 异常态)、`EMPTY` (空批次态)；
  - [x] **30 秒轮询监控仪表**：
    - 实时显示下次静默拉取倒计时秒数（`Next Sync in 28s`）；
    - 提供【立即静默同步】按钮，实时观察 `AbortController` 拦截动效；
  - [x] **极端数据注入器 (Mock Injector)**：
    - 一键注入一条 100 字超长标题新闻，实时肉眼检验两行省略契约；
    - 一键注入一条 `critical` 重大突发新闻，实时检验 Bento 重排动效；
  - [x] **网络延迟模拟器 (Network Throttler)**：
    - 支持在调试面板勾选“模拟 2 秒网络慢速”，方便肉眼调试骨架屏。

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

# 📋 Gemini Spark 智库看板 · 阶段交接与进度备忘录 (Session Handover)

> **项目名称**：Gemini Spark 24H 智能体新闻智库看板 (Gemini Spark Intelligence Terminal)  
> **更新时间**：2026-09-24 18:30  
> **当前阶段**：MVP 1 全部验收交付完成；MVP 2（Mongoose 建模与双模架构、前端效果契约与调试套件）准备就绪，待启动。  
> **Git 状态**：`master` 分支，`working tree clean`  

---

## 一、当前系统运行现状与核心成果

### 1. 服务运行端口与地址
- **前端看板**：`http://localhost:5173`（Vite 6 + React 18 + Tailwind CSS，暗黑黑曜石玻璃拟态主题）
- **后端 API 服务**：`http://localhost:3001`（Express 原生轻量服务，支持动态文件摄入与批次管理）
- **本地构建状态**：执行 `npm run build`（`tsc -b && vite build`）通过，耗时仅 3.95s，**0 警告、0 错误**。

### 2. 已落地交付的核心功能（MVP 1 全部完成）
- **新奇多维大屏交互**：
  - **Bento 智库看板**（重大突发 Hero 大卡 + 全球宏观热力雷达）；
  - **四象限垂直流**（AI算力、宏观金融、地缘经贸、气候能源 4 泳道并列对比）；
  - **24H 时空轨迹轴**（00:00~24:00 时间滑块，支持按亚太/欧洲/美洲交易时段回放）；
  - **Gemini NLP 认知档案抽屉**（模型血缘 `Gemini 1.5 Pro`、置信度 `98.2%`、命名实体 NER 词云、情绪连续极性量尺）。
- **工业级前端防御契约**：
  - **30 秒后台静默轮询机制**（呼吸指示灯，静默拉取不打扰当前交互）；
  - **AbortController 异步竞态消除**（切换分类或日期时立刻中断未决旧请求，防串台与内存泄漏）；
  - **长标题截断防御**（`line-clamp-2 break-words` 保证超长标题严格在第 2 行末尾截断显示 `...`）；
  - **三大边界状态健全处理**（骨架屏 Shimmer、接口 500 告警卡片带点击重试、空批次友好重置引导）。
- **数据热接入与大屏快捷录入**：
  - 本地动态简报扫描引擎（`data/briefings/*.json`）；
  - 大屏右上角 **【📥 导入简报】** 交互弹窗，支持一键粘贴 Gemini 输出（自动清洗 ````json```` 代码块并秒级上屏）。

### 3. 最新业务规则对齐（已全链路生效）
- **条数配额优化**：单日生成 **8-12 条** 新闻；其中 `climate`（气候能源）严格限制 **1-2 条**，剩余 **7-10 条** 重点分配给 `ai`、`finance`、`geopolitics`。
- **调度时间对齐**：全面改为 **每日 08:30 AM (每日晨报模式)**，隔夜欧美市场动态一览无余，调度 Cron 已设置为 `30 8 * * *`。

---

## 二、最新 Gemini Spark 提示词模板 (Prompt)

您在 Gemini 网页端定时任务（Schedules）中配置的最新 Prompt 如下（可随时直接取用）：

```text
你是一个全球宏观与前沿科技战略智库首席分析师。请针对过去 24 小时全球发生的重大事件，全网检索权威信源（Reuters, Bloomberg, FT, Nature, WSJ 等），严格按以下 JSON 格式输出一份结构化的每日深度新闻简报。

【输出要求】
1. 只输出合法、纯净的 JSON 数据，代码块使用 ```json ... ``` 包裹，不要输出任何开场白或前言。
2. 覆盖四大领域：ai（前沿算力）、finance（宏观金融）、geopolitics（地缘经贸）、climate（气候能源）。
3. 严格生成 8-12 条高质量全球要闻：
   - 【配额限制】climate（气候能源）类严格控制在 1-2 条；
   - 【重点倾斜】剩余全部条目（约 7-10 条）分配给 ai、finance、geopolitics 三大领域；
   - 挑选 1 条影响最深远的全球突发事件设为 "impactLevel": "critical"（用于 Hero 大卡展示），其余为 "high" 或 "medium"。
4. 情感极性评分 sentimentScore 介于 -1.0 到 +1.0 之间。
5. 命名实体 nlpKeyEntities 提取 3-5 个核心词。

【JSON 输出格式】
{
  "batchStatus": {
    "status": "COMPLETED",
    "statusText": "已完成归档",
    "generatedTime": "今天日期 08:30:00",
    "nextScheduleTime": "明日 08:30:00 (每日晨报)",
    "progress": 100,
    "currentStage": "Gemini 1.5 智能体多源交叉校验完成"
  },
  "items": [
    {
      "id": "gemini-今天日期-001",
      "title": "中文核心标题（30-50字，UI 自动适配两行截断）",
      "englishTitle": "Foreign Media English Headline",
      "source": "Reuters",
      "sourceCountry": "US",
      "category": "ai",
      "region": "North America",
      "impactLevel": "critical",
      "summary": "150-200 字深度研报摘要，包含核心事实、因果推演与宏观影响。",
      "tags": ["AI算力", "大模型"],
      "sentiment": "positive",
      "sentimentScore": 0.85,
      "nlpKeyEntities": ["OpenAI", "Anthropic", "NVIDIA"],
      "coverUrl": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60",
      "publishTime": "今天日期T08:00:00Z"
    }
  ]
}
```

---

## 三、下次继续推进的计划与 To-Do 事项

在用户回来后，我们将直接按照 [docs/fullstack_mvp_roadmap.md](file:///e:/antigravity项目/资讯前端/docs/fullstack_mvp_roadmap.md) 开始推进 **MVP 2**：

### ⏳ MVP 2 即刻待办清单（无需提前部署 MongoDB，双模解耦）
1. **任务 2.1：依赖与环境规范**
   - 安装 `mongoose` 与 `dotenv`；
   - 建立 `.env.example`，在 `.gitignore` 中确保真实 `.env` 不泄露。
2. **任务 2.2：Mongoose Schema 建模**
   - 编写 `server/models/NewsItem.mjs` 与 `server/models/BatchStatus.mjs`（严格约束枚举、数值区间、复合索引）。
3. **任务 2.3：双模数据访问仓储层设计 (`server/repository.mjs`)**
   - 封装 `getNewsList()`, `saveBriefing()`, `getBatchStatus()` 统一接口；
   - 实现**自动探测机制**：有 `MONGO_URI` 时走云数据库；无配置时**平滑降级走本地 `data/briefings/` 静态文件**，保证系统永远不崩。
4. **任务 2.4：历史数据种子工具 (`scripts/seed-mongo.mjs`)**
   - 准备一键导入脚本，方便未来 Atlas 集群创建后一键把多日历史数据灌入云数据库。
5. **任务 2.5 & 2.6：前端视觉契约加固与内置 DevTools 调试面板**
   - 大屏右上角内置开发者浮层：一键切换数据源模式、一键模拟计算中雷达/500异常、30s 倒计时器、极端长标题与突发 Hero 注入器。

---

## 四、核心工程目录结构速查

```text
e:\antigravity项目\资讯前端\
├── data/
│   └── briefings/                       # 本地简报存放目录（断网备份与开发调试）
│       ├── README.md                    # 格式与配额规范（8-12条，气候1-2条）
│       ├── sample-format.json           # 示例 schema
│       └── 2026-09-25.json              # 动态测试简报样本
├── docs/
│   └── fullstack_mvp_roadmap.md         # 5大 MVP 阶段分解与详细 To-Do List
├── server/
│   └── mock-server.mjs                  # Express API 引擎（3001端口，含动态加载与保存端点）
├── src/
│   ├── components/
│   │   ├── views/
│   │   │   ├── BentoView.tsx            # Bento 看板（Hero 大卡与全球热力雷达）
│   │   │   ├── MatrixStreamView.tsx     # 四象限多领域泳道
│   │   │   └── TimelineScrubber.tsx     # 24H 时空轨迹时间滑块
│   │   ├── GlobalCategoryBar.tsx        # 4大领域筛选、视图切换、历史归档日期选择
│   │   ├── GlobalNewsCard.tsx           # 黑曜石玻璃拟态卡片（两行省略截断防御）
│   │   ├── ImportBriefingModal.tsx      # 一键导入简报弹窗（带 Prompt 复制）
│   │   ├── IntelligenceDrawer.tsx       # Gemini 认知抽屉（NLP量化与 NER 档案）
│   │   ├── IntelligenceHeader.tsx       # 顶部全局监控头、情绪心电图与 08:30 状态
│   │   ├── Pagination.tsx               # 暗调分页
│   │   ├── RunningStateView.tsx         # 任务生成中雷达动画与前日降级
│   │   └── SparkNewsDashboard.tsx       # 主容器（30s轮询/AbortController/三大边界）
│   ├── services/
│   │   └── api.ts                       # 前端 API 封装层（含 AbortSignal 与 saveBriefing）
│   ├── types/
│   │   └── news.ts                      # 全球化 4 大领域与多维量化 TypeScript 类型定义
│   ├── App.tsx                          # 根组件
│   ├── main.tsx                         # 应用入口
│   └── index.css                        # Tailwind 基础与玻璃拟态微发光样式
├── index.html                           # 页面入口
├── package.json                         # 项目脚本与依赖
├── tailwind.config.js                   # 暗黑黑曜石调色板
├── tsconfig.json                        # TypeScript 配置
├── vite.config.ts                       # Vite 配置
├── .gitignore                           # Git 忽略配置
├── completed_checklist.md               # 已完成交付核对表
└── HANDOVER.md                          # 本交接备忘录文件
```

---

## 五、恢复开发时的操作指南

当您回来后，在对话中只需发送：
> **“继续”** 或 **“开始 MVP 2”**

我们将立刻无缝衔接，启动 **MVP 2（任务 2.1：依赖安装与 Mongoose 建模）** 的推进！祝您休息愉快！

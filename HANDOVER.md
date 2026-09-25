# Gemini Spark News 智库前端系统 · 完整项目研发交接档案 (Comprehensive Handover Document)

- **交接归档时间**: 2026-09-25 17:26 (UTC+8)
- **当前 Git 分支**: `master` (工作区干净，无未提交更改，最近提交 `3873a68`)
- **系统运行状态**: 
  - 前端开发服务: `http://localhost:5173` (Vite HMR 实时热重载正常)
  - 后端 API / Mock: `http://localhost:3001` (已连通 MongoDB Atlas 云数据库，双模自适应正常)
- **生产构建验证**: `npm run build` 成功通过 (0 errors / 0 warnings，耗时约 5s)

---

## 一、项目核心定位与背景认知 (Critical Context)

### 1. 概念校准：什么是 Gemini Spark？
- **绝非 Apache Spark**：本项目中的“Spark”绝非传统的 Apache Spark 大数据处理集群或分布式 JVM 计算框架，亦非传统爬虫中间件；
- **真实定位**：**Google Gemini 定时自主智能体（Gemini Spark Autonomous Agent）**；
- **业务流程**：用户在 Google Gemini 中配置的每日定时任务，自主全网检索全球权威外媒（Reuters, Bloomberg, FT, Nature, WSJ 等），完成跨语种深度长文本提炼、宏观情绪极性量化打分（-1.0 ~ +1.0）与命名实体识别（NER），输出结构化每日全球简报（JSON 格式）。前端看板负责将海量研报转化为高可读性、宏观决策级的交互式大屏。

### 2. 2026 年 9 月官方模型体系与选型规范
- **默认主力模型**: **`gemini-3.8-flash`**（Google 2026 年 9 月最新主力模型，专为 Agent 自动化工作流与低延迟检索提炼优化，1M Token 上下文）；
- **高阶推理模型**: **`gemini-3.1-pro`**（当前 Google 官方真实可用的旗舰深度推理模型，用于高难度多步复杂推理与地缘博弈推演；注意：**官方目前并无 3.8 Pro，严禁杜撰**）；
- **轻量通量模型**: **`gemini-3.5-flash-lite`**（超高通量、低成本补充选项）；
- **模型热切换机制**: 支持在后台/DevTools 动态切换激活模型，默认预置 3.8 Flash 与 3.1 Pro。

---

## 二、当前已交付的核心成果与架构 (Delivered Architecture)

### 1. 全站新野兽派与波普双主题视觉体系 (Teenage Engineering Neo-Brutalism & Pop Art)
已彻底打破传统浅色界面的苍白无力，全面建立三大主题系统：
1. **暗夜黑曜石主题 (`dark` / 默认)**：
   - 保持极客深邃黑曜石（`#030712`）、半透明毛玻璃质感、冷青微发光边框（`border-cyan-500/20`）与星云粒子底纹；
   - **绝对隔离**：所有野兽派与波普规则均限定在 `[data-theme="..."]` 作用域下，暗夜模式 100% 保持原有质感，零污染。
2. **P2 经典档案羊皮纸淡色主题 (`light`)**：
   - **底色**：纯正深沉的暖黄羊皮纸色（`#f4ebd9`），搭配 24px 工程微网格底纹；
   - **线条与投影**：全站统一 `2px/2.5px solid #000000` 黑色几何外框，搭配零羽化实体硬阴影 `4px 4px 0 #000000`（0px blur）；
   - **机械按键触感**：悬停向上浮起 `translate(-3px, -3px)` 且阴影扩大至 `7px 7px 0 #000`；点击下凹 `translate(2px, 2px)` 且阴影缩减至 `2px 2px 0 #000`；
   - **印章贴纸徽章**：AI天蓝（`#38bdf8`）、金融草绿（`#4ade80`）、地缘琥珀黄（`#fbbf24`）、能源电紫（`#818cf8`）、预警绯红（`#fee2e2` / `#991b1b`）；
   - **等宽打字机检索**：`category-search-input` 采用等宽字体族，获焦触发 `3.5px 3.5px 0 #000` 实体粉影；
   - **物理调查卷宗弹窗**：`3px solid #000` 粗框 + `10px 10px 0 #000` 实体大投影，条形码、机密序列号与黄色便利贴核心摘要衬底（`#fefce8`）。
3. **高能波普多巴胺主题 (`dopamine`)**：
   - 蜜桃粉底色（`#fff0f5`）、`2.5px solid #000` 刚性边框、电光热粉实体硬阴影 `4px 4px 0 #ff007f`；
   - 悬停带有 `-0.5deg` 俏皮微倾斜；电光热粉（`#ff007f`）、荧光柠檬黄（`#ffee00`）、电青（`#00f0ff`）三色波普撞色。

### 2. 界面视图与交互全量覆盖
- **Bento 智库看板 (`BentoView.tsx`)**：Hero 极重大头条大卡 + 热力雷达 Widget 实体框适配；
- **四象限矩阵流 (`MatrixStreamView.tsx`)**：4 大领域泳道标题栏白底黑框、高饱和计数圆标与多列卡片排列；
- **24H 时空轨迹 (`TimelineScrubber.tsx`)**：实体机械时间滑尺控制卡、工程虚线时间轴中轴、亮黄色实体圆点锚点；
- **分页控制器 (`Pagination.tsx`)**：实体按键、页码下沉与激活色；
- **全站主题切换胶囊 (`ThemeSwitcher.tsx`)**：三大模式分段切换，持久化存储于 `localStorage('gemini_spark_theme')`。

### 3. 底层渲染与防漏边保障 (GPU Layer Seam Fix)
- 卡片媒体区采用 `isolation: isolate; contain: paint; transform: translateZ(0); -webkit-mask-image: -webkit-radial-gradient(white, black)`；
- 渐变蒙层向下微延伸 2px（`-bottom-1`），卡片主体采用独立 `z-10` 层级配合 `-mt-px` 紧密咬合，彻底杜绝 Windows 125%/150% 等高缩放比下图片缩放时底色漏白。

### 4. 自动化回归测试资产
- 位于 `scripts/verify-themes.mjs`，通过 Chromium 2x Retina 高清无头截图验证，资产存放于 `screenshots/`：
  - `dark-obsidian-bento.png`
  - `light-parchment-bento.png`
  - `light-parchment-drawer.png`
  - `light-parchment-matrix.png`
  - `light-parchment-timeline.png`
  - `dopamine-pop-bento.png`
  - `dopamine-pop-drawer.png`
  - `dopamine-pop-matrix.png`
  - `dopamine-pop-timeline.png`

---

## 三、目标拆解：上线正常、安全稳定运行的三大 MVP 路线图

以**“全站公网安全稳定上线正常运行”**为终极目标，已拆解为三大递进式 MVP：

```mermaid
flowchart LR
    MVP1["MVP 1: 真实 Gemini Spark 生产闭环\n(智能体引擎 + 08:30定时 + SSE实时推流)"] --> MVP2["MVP 2: 生产安全与稳定性加固\n(密钥隔离 + 限流防刷 + 守护自愈)"] --> MVP3["MVP 3: 云端公网部署与正式交付\n(托管发布 + 域名HTTPS + 线上验收)"]
```

### 📦 MVP 1：真实 Gemini Spark 智能体生产闭环（接下来第一优先级）
1. **任务 1.1: 智能体调用与模型切换引擎 (`server/services/geminiSparkAgent.mjs`)**：
   - 接入 Google GenAI 官方接口（启用 Google Search Grounding）；
   - 默认采用 `gemini-3.8-flash`，候选支持 `gemini-3.1-pro`；
   - 强制 Prompt 契约：8~12 篇配额（气候严格 1~2 篇，其余分配 AI/金融/地缘），输出 JSON 校验，挑选 1 条置顶 Hero；
   - 双模自适应保底：无 Key 或网络受限时无缝切换至高保真本地语料生成，100% 保障接口不崩溃；
   - 提供 `GET /api/spark/models` 与 `POST /api/spark/models/select` 后台模型热切接口。
2. **任务 1.2: 自动化定时调度器与一键即时触发 (`server/services/scheduler.mjs`)**：
   - 每日固定 `08:30:00` 自动触发批次生成；
   - 暴露 `POST /api/spark/trigger-generate`，支持在 DevTools/Header 一键即时生成；
   - 引入并发互斥锁（Generation Mutex），生成中拦截重复触发，带超时强制解锁防死锁。
3. **任务 1.3: 原生 SSE 实时流推流管道 (`/api/spark/stream`)**：
   - 广播生成阶段（15% 智能体唤醒 -> 40% 联网检索 -> 70% 深度提炼 -> 90% 极性打分 -> 100% 入库）；
   - 前端接收 `COMPLETED` 事件后自动静默拉取最新批次，实现无感知动态推流。
4. **任务 1.4: 智能双写落盘与 MongoDB Atlas 持久化**：
   - 生成数据同时写入 MongoDB Atlas 云集群与本地 `data/briefings/YYYY-MM-DD.json` 备份。

---

### 🛡️ MVP 2：生产级安全防护与稳定性加固（上线前必须完成）
1. **任务 2.1: 密钥与敏感配置物理隔离**：
   - 规范 `.env.production`，确保 `GEMINI_API_KEY` 与 `MONGO_URI` 仅留存服务端，绝不打包进前端客户端 JS；
   - 为管理接口（批次触发、数据导入）增加基于 Header 的 `x-admin-key` 鉴权保护。
2. **任务 2.2: 生产环境 API 防护与限流防刷**：
   - 引入 `helmet` 保护 HTTP 响应头安全；
   - 引入 `express-rate-limit` 防止恶意高频攻击后端接口；
   - 严格限定生产环境 CORS 跨域域名白名单。
3. **任务 2.3: 进程守护与容灾自愈**：
   - 编写生产环境守护配置（PM2 `ecosystem.config.cjs` 或轻量 `Dockerfile`），保证异常秒级拉起；
   - 强化 MongoDB Atlas 偶发网络断线平滑重连与自动回退。
4. **任务 2.4: 前端生产构建优化与缓存控制**：
   - 验证生产环境打包体积，确保 Gzip / Brotli 压缩就绪，静态文件缓存配置合理。

---

### 🌐 MVP 3：云端公网部署与正式上线交付
1. **任务 3.1: 基础设施与部署选型**：
   - 前端：采用 Vercel / Cloudflare Pages 静态边缘托管（或 Nginx 反向代理）；
   - 后端 API：部署于云服务器或 Railway / Render 平台 Node.js 容器环境。
2. **任务 3.2: 生产环境网络连通与 MongoDB Atlas 白名单**：
   - 将云服务器/部署节点的公网 IP 纳入 MongoDB Atlas Network Access 白名单。
3. **任务 3.3: 自定义域名绑定与全站 HTTPS/SSL 自动化证书**。
4. **任务 3.4: 全流程线上实测与交付验收**：
   - 验证三套主题在移动端/桌面端线上访问；
   - 验证线上首次自动化触发生成与无感推流。

---

## 四、本地开发与环境配置指南

### 1. 常用命令速查
```bash
# 启动本地开发服务 (同时启动后端 API 3001 与前端 Vite 5173)
npm run dev

# 执行全量生产构建测试 (TypeScript 类型检查 + Vite 打包)
npm run build

# 运行自动化主题截图回归测试
node scripts/verify-themes.mjs

# 向 MongoDB Atlas 注入测试种子数据
npm run db:seed
```

### 2. 环境变量配置 (`.env`)
```bash
# 服务端口
PORT=3001

# MongoDB Atlas 云数据库连接串
MONGO_URI=mongodb+srv://aloisiamassanelli_db_user:SRXK7EC1lMW16rQI@cluster0.ryzx3s0.mongodb.net/gemini_news?retryWrites=true&w=majority

# Gemini 智能体 API 密钥与模型配置 (MVP 1 将引入)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.8-flash
SCHEDULE_TIME=08:30
```

---

## 五、关键文件与模块索引目录

```
e:/antigravity项目/资讯前端/
├── data/
│   └── briefings/                       # Gemini Spark 每日生成的结构化研报 JSON 目录
│       ├── README.md                    # 数据契约与配额规范（8~12篇，气候限1~2篇）
│       └── 2026-09-25.json              # 当前 12 篇全字段测试研报
├── docs/
│   └── superpowers/
│       ├── specs/                       # 视觉与系统设计规范
│       │   └── 2026-09-25-neo-brutalist-themes-design.md
│       └── plans/                       # 实施计划与执行清单
│           └── 2026-09-25-neo-brutalist-themes.md
├── screenshots/                         # 全套 9 张 Retina 高清主题回归测试截图
├── scripts/
│   └── verify-themes.mjs                # Puppeteer E2E 截图自动化回归测试套件
├── server/
│   ├── mock-server.mjs                  # Express API 核心服务入口 (3001)
│   ├── repository.mjs                   # 数据仓库层 (支持 Atlas 云端与本地双模 Fallback)
│   ├── corpus.mjs                       # 本地智能降级语料生成引擎
│   └── models/
│       ├── BatchStatus.mjs              # Mongoose 批次状态模型
│       └── NewsItem.mjs                 # Mongoose 新闻研报模型
└── src/
    ├── context/
    │   └── ThemeContext.tsx             # 全站主题 Context (dark / light / dopamine)
    ├── components/
    │   ├── ThemeSwitcher.tsx            # 顶部导航栏主题切换胶囊 (新野兽派/波普微交互)
    │   ├── IntelligenceHeader.tsx       # 顶部导视栏与 5 维微型机械仪表盘
    │   ├── GlobalCategoryBar.tsx        # 领域分类贴纸 Tab、打字机检索框与视图切换
    │   ├── GlobalNewsCard.tsx           # 实体情报卡片 (防漏光、印章贴纸、机械虚线)
    │   ├── IntelligenceDrawer.tsx       # 全球智库机密调查卷宗弹窗 (双栏黄色便签纸排版)
    │   ├── DevToolsPanel.tsx            # 全栈开发者调试控制台
    │   └── views/
    │       ├── BentoView.tsx            # Bento 智库看板
    │       ├── MatrixStreamView.tsx     # 四象限矩阵流
    │       └── TimelineScrubber.tsx     # 24H 时空轨迹时间轴
    └── index.css                        # 全站新野兽派与波普双主题核心样式库 (严格隔离)
```

---

**交接总结**:
本交接文件已将项目截至当前（2026-09-25 17:26）的所有技术演进、已完成的里程碑、设计决策、模型调查事实以及通往“公网安全上线稳定运行”的清晰 3 个 MVP 阶段完整归档。接手人员或后续对话可直接依据本文件从 **MVP 1（真实数据生产闭环）** 顺畅无缝推进！

# MVP 5: 跨时空智库连接与架构加固设计规范 (Cross-Temporal Intelligence & Hardening Spec)

> **设计规范编号**：SPEC-2026-10-15-MVP5  
> **制定日期**：2026-10-15  
> **负责人**：Gemini Spark News 首席全栈架构师  
> **状态**：APPROVED (评审通过)  

---

## 1. 目标与愿景 (Goals & Vision)

在 MVP 4 成功交付“终极智库结果页”、穿透保底引擎、年月微胶囊与三大主题（Cyber HUD / Pop Dopamine / iOS Glass）后，本版本重点解决**跨时空智库关联**与**底层盒模型性能抖动治理**，将碎片化的单日研报批次串联为具有连续因果关系的“宏观战略情报知识网”。

---

## 2. 模块技术规格 (Technical Specifications)

### 模块一：三主题零抖动盒模型与轻量级归档索引
- **边框与阴影标准**：
  - 统一全系统所有主题基础容器的物理 `border-width` 为 `1px`（或盒模型外扩统一）；
  - 方案 B（Pop Dopamine）采用实体硬阴影与扩散阴影叠加模拟粗野主义描边：`box-shadow: 0 0 0 2px #0f172a, 6px 6px 0px 0px #111827`；
  - 保证在 `theme` 热切换过程中，卡片宽高、内边距与文本排版偏移量为 **0px**。
- **Archive Manifest 索引缓存**：
  - 维护内存级索引单例 `cachedArchiveManifest`，包含 `availableDates`, `latestDate`, `years`, `monthMapByYear`, `totalCountByYear`, `lastUpdated`；
  - 设立 60 秒 TTL 并提供 `invalidateArchiveManifestCache()`，支持数据摄入时主动失效，保证首屏响应时间 $< 5$ms。

### 模块二：零死角探索二级穿透 —— 跨期历史全文检索
- **端点契约**：`GET /api/news/search?q={keyword}&limit=20`
- **输入校验**：去除首尾空白字符，若为空直接返回 `{ query: '', total: 0, items: [] }`。
- **检索权重与覆盖**：同时匹配中文标题、英文标题、摘要、标签列表 `tags` 与实体列表 `nlpKeyEntities`。
- **输出结构**：返回的每一项均携带所属归档批次字段 `briefingDate: "YYYY-MM-DD"`。
- **前端交互**：在零死角推荐横幅增加二级穿透按钮 `[🔍 跨越全部 N 期历史智库深度检索 "{searchQuery}"]`，点击后直接在下方展现跨期命中结果卡片。

### 模块三：深度研报抽屉 —— “历史演化脉络”时间轴
- **端点契约**：`GET /api/news/:id/timeline`
- **重合度演化算法**：
  - 实体完全匹配（Entity Match）：每匹配一个相同实体 $+5$ 分；
  - 标签完全匹配（Tag Match）：每匹配一个相同标签 $+3$ 分；
  - 领域相同（Category Match）：$+1$ 分；
  - 排除自身（$id \neq targetId$），仅保留得分为 $\ge 3$ 的历史关联研报，按得分倒序与日期倒序排列，输出 Top 4。
- **前端呈现**：在深度抽屉正文下方嵌入垂直时间轴，卡片包含 `[YYYY-MM-DD]` 批次徽标、研报标题、核心实体胶囊及情绪徽标；支持点击时间轴节点直接平滑切换抽屉阅读内容。

### 模块四：宏观情绪与板块热度“跨期心电图”
- **端点契约**：`GET /api/stats/pulse?days=7`
- **算法模型**：
  - 提取最近 7~14 期已归档批次；
  - 综合情绪指数 $SentimentIndex = \text{round}(50 + \bar{S} \times 50)$，将 $[-1.0, 1.0]$ 的情绪分数归一化为 $[0, 100]$ 的直观景气度指数；
  - 计算各领域条目计数分布，以及最新一期相对于前一期的波动点数（$\Delta$）。
- **前端呈现**：纯原生 SVG 矢量绘制 `<MacroPulseSparkline />`，包含平滑贝塞尔折线、渐变填充与悬停指标 Tooltip，零重型第三方图表库依赖。

### 模块五：每日 3 分钟“智库早茶”播客模式
- **文稿合成算法 (`audioBriefingService.mjs`)**：
  - 自动提取当日 Top 3 `critical / high` 研报标题与核心洞察；
  - 结合当日诺贝尔文学奖名言；
  - 结构化合成为包含 `intro`, `sections`, `outro`, `fullScript` 的完整早茶播报脚本，持久化至批次状态中。
- **前端悬浮播放器 (`AudioBriefingModal.tsx`)**：
  - 借助浏览器原生 Web Speech API `window.speechSynthesis` 进行高品质朗读；
  - 具有播放/暂停、倍速切换（1.0x / 1.25x / 1.5x）、提词器实时随声滚动与纯 CSS 动态音频律动波形。

---

## 3. 验收标准 (Acceptance Criteria)
1. 现有 50 项单元测试与新增测试 100% 绿灯（预期达 60+ 项）；
2. 生产构建 `npm run build` 0 Error, 0 Warning；
3. 全功能端到端通过 `scripts/verify-mvp5-features.mjs` 验证；
4. 三套主题热切换布局抖动消除为 0px。

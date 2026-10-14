# 历史简报日期分布下拉增强设计规范：年/月分类筛选与微型分页步进器

> **文档标识**：`SPEC-DATE-DROPDOWN-PAGINATION-2026-10-14`  
> **创建日期**：2026-10-14  
> **目标组件**：[`src/components/DateStepperCapsule.tsx`](file:///e:/antigravity项目/资讯前端/src/components/DateStepperCapsule.tsx)  
> **设计模式**：方案 1（年/月双层微胶囊过滤 + 分页步进器）  
> **关联铁律**：[`GEMINI.md`](file:///e:/antigravity项目/资讯前端/GEMINI.md) 全版面视觉平衡与 WCAG AAA 对比度审查

---

## 1. 需求背景与痛点分析 (Problem Definition)

在 Gemini Spark 智能体日常 24H 简报归档体系中，归档日期随着时间持续累加（目前已达 24 批次，年化将达数百批次）。

原版下拉弹窗设计存在如下痛点：
1. **纯单列长列表滚动**：未区分年份与月份，当日期批次达到 30+、100+ 时，用户必须在极长列表内上下拖拽滑动查找，定位效率低；
2. **缺乏时间维度聚合**：用户无法直观了解某特定月份（如“2026年9月”）归档了多少期简报；
3. **视窗高度不可控**：随着滚动条加长，单页高度难以保持 Neo-Brutalist 的精致紧凑度。

通过引入 **【年/月分类微胶囊过滤 + 纯客户端微型分页步进器】**，实现精准聚合、快速过滤，并将弹窗最大高度严密锁定在约 `320px`。

---

## 2. 架构设计与状态计算 (Architecture & State Model)

无需对后端数据库或 API 做任何修改。[`DateStepperCapsule.tsx`](file:///e:/antigravity项目/资讯前端/src/components/DateStepperCapsule.tsx) 依靠纯客户端派发逻辑，对传入的 `availableDates: string[]` 完成解析与多维切片。

### 2.1 派发与聚合函数

```typescript
interface MonthBucket {
  month: string;       // 两位月份，如 "10"
  label: string;       // 显示文本，如 "10月"
  count: number;       // 该月归档期数
}

interface YearBucket {
  year: string;        // 四位年份，如 "2026"
  months: MonthBucket[];
  total: number;
}
```

1. **年份聚合 (`availableYears`)**：
   遍历 `availableDates`，提取唯一 `YYYY` 年份并降序排列（如 `['2026', '2025']`）。
2. **月份聚合 (`availableMonths`)**：
   根据选中的 `selectedYear`，聚合并仅展示该年**实际拥有简报批次**的月份数组；自动排除无数据的月份，避免空点击。
3. **状态定义**：
   - `selectedYear: string`（默认取当前 `currentDate` 的年份，若不在列表中则取最新年份）；
   - `selectedMonth: string`（默认 `'all'` 全月展示；可点击切换为 `'10'`、`'09'` 等）；
   - `page: number`（当前页码，默认 1；**切换年份或月份时强制重置为 1**）；
   - `pageSize: number = 6`（固定每页呈现 6 条日期批次）。

### 2.2 响应式过滤与切片流水线

```text
availableDates (例如 24 期)
   │
   ▼
[ 年份筛选 (selectedYear) ] ──> 符合年份的批次
   │
   ▼
[ 月份筛选 (selectedMonth) ] ──> filteredDates (满足当月的批次)
   │
   ▼
[ 分页切片 (page, pageSize = 6) ] ──> pagedDates (渲染当前页 6 条)
```

- `totalPages`: `Math.ceil(filteredDates.length / pageSize) || 1`
- `pagedDates`: `filteredDates.slice((page - 1) * pageSize, page * pageSize)`
- `canPrevPage`: `page > 1`
- `canNextPage`: `page < totalPages`

---

## 3. UI 布局与 Neo-Brutalist 视觉规范

### 3.1 弹窗尺寸与定位
- **定位**：`absolute top-full left-0 mt-2 z-50`（位于分类筛选栏最左端，脱离滚动截断限制）；
- **宽度**：`w-72`（约 288px）；
- **高度**：固定约 `320px`，规整不抖动。

### 3.2 布局分层模型

```
┌──────────────────────────────────────────────┐
│  📅 历史简报归档库              24 批次 [2026]▼ │  <-- Row 1: 标题 + 批次总量 + 年份下拉/切片
├──────────────────────────────────────────────┤
│  [全部 24]  [10月 14]  [09月 10]              │  <-- Row 2: 月份水平滑动微胶囊栏
├──────────────────────────────────────────────┤
│  📅 2026-10-14                      LATEST ✓ │
│  📅 2026-10-13                               │
│  📅 2026-10-12                               │  <-- Row 3: 归档列表区 (固定 6 条)
│  📅 2026-10-11                               │
│  📅 2026-10-10                               │
│  📅 2026-10-09                               │
├──────────────────────────────────────────────┤
│  [ < ]         第 1 / 4 页           [ > ]   │  <-- Row 4: 微型分页控制器 (单页时隐去)
└──────────────────────────────────────────────┘
```

### 3.3 三大主题全量对比度审查 (WCAG AAA)

1. **波普多巴胺 (Pop Dopamine)**：
   - 弹窗外壳：纯白底 `bg-white`，`border-2 border-slate-900`，`shadow-[4px_4px_0px_#000]`；
   - 月份胶囊：选中态 `bg-pink-500 text-white border-slate-900 shadow-[1px_1px_0px_#000]`，未选中态 `bg-slate-100 text-slate-800`；
   - 翻页按钮：实体微黑框，字体 `Fredoka`。
2. **黑曜石暗色 (Cyber HUD)**：
   - 弹窗外壳：`bg-slate-900 border border-cyan-500/50 shadow-[0_0_15px_rgba(0,240,255,0.3)]`；
   - 月份胶囊：选中态 `bg-cyan-500 text-slate-950 font-bold`，未选中态 `bg-cyan-950/40 text-cyan-400 border border-cyan-500/30`；
   - 等宽字体与赛博角标。
3. **复古羊皮纸 / iOS Glass (Light Mode)**：
   - 弹窗外壳：`bg-white/95 border border-slate-200 shadow-xl text-slate-900`；
   - 月份胶囊：选中态 `bg-blue-600 text-white shadow-sm`，未选中态 `bg-slate-100 text-slate-700 hover:bg-slate-200`；
   - 文字颜色严禁受深色样式污染，纯黑文本对比度达到 21:1。

---

## 4. 边界处理与交互容错

1. **跨年自动切换**：若当前日期从 2026 步进至 2025，`selectedYear` 自动联动更新；
2. **空月份过滤**：若某年某月没有任何简报，不渲染该月份胶囊，杜绝空数据状态；
3. **分页智能隐去**：若当前筛选范围总条数 ≤ 6 条（`totalPages === 1`），底部微型分页器自动隐藏，释放垂直空间；
4. **外部点击与按键关闭**：保留 Esc 按键监听与 `useRef` 点击外部收起机制；
5. **日期选择即关闭**：点击具体日期项时，立即触发 `onDateChange(date)` 并收起下拉弹窗。

---

## 5. 验收标准与测试规范

1. **构建检查**：`npm run build` 100% 编译通过；
2. **交互测试**：
   - 切换月份胶囊（全部 -> 10月 -> 09月），日期列表即刻更新；
   - 分页器步进（第 1 页 -> 第 2 页），列表平滑切片；
   - 点击具体日期能够正常派发日期变更事件，并触发页面更新；
3. **多视口视觉证据**：
   - 桌面端 (1440px)、笔记本端 (1146px)、移动端 (390px) 下生成下拉菜单展开截图，确认无溢出截断、无错位。

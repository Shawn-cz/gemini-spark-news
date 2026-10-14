# 历史简报日期分布下拉增强实现计划 (年/月筛选与微型分页)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为历史简报日期分布下拉弹窗引入纯客户端的“年/月双层微胶囊过滤”与“每页 6 条微型分页步进器”，彻底解决大量历史批次下的无限滚动痛点，锁定固定弹窗高度，全面兼容三大主题规范。

**Architecture:** 
1. 将日期聚合、年月切片与分页计算逻辑抽取为可独立单元测试的纯函数模块 `src/utils/dateGrouping.ts`；
2. 重构 `src/components/DateStepperCapsule.tsx` 的下拉弹窗，接入年月微胶囊栏、6 条列表主体、微型分页控制器及 Esc/外击关闭逻辑；
3. 扩展自动化真机脚本 `scripts/verify-date-dropdown-advanced.mjs`，在 1440px / 1146px / 390px 关键断点及三大主题下生成真实截图凭证。

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Lucide React, Node.js Test Runner, Puppeteer Core

---

### Task 1: 编写日期聚合与分页过滤纯函数引擎与单元测试

**Files:**
- Create: `src/utils/dateGrouping.ts`
- Create: `tests/dateGrouping.test.mjs`

- [ ] **Step 1: 编写失败的单元测试套件 (`tests/dateGrouping.test.mjs`)**

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { 
  groupDatesByYearAndMonth, 
  filterAndPaginateDates 
} from '../src/utils/dateGrouping.js';

const mockDates = [
  '2026-10-14',
  '2026-10-13',
  '2026-10-12',
  '2026-10-11',
  '2026-10-10',
  '2026-10-09',
  '2026-10-08',
  '2026-09-27',
  '2026-09-26',
  '2026-09-25',
  '2025-12-31',
  '2025-12-30'
];

test('Date Grouping - 正确提取年份与对应实际有效月份', () => {
  const groups = groupDatesByYearAndMonth(mockDates);
  assert.equal(groups.years.length, 2);
  assert.deepEqual(groups.years, ['2026', '2025']);

  // 2026 年包含 10月 (7期) 与 09月 (3期)
  const months2026 = groups.monthMapByYear['2026'];
  assert.equal(months2026.length, 2);
  assert.equal(months2026[0].month, '10');
  assert.equal(months2026[0].count, 7);
  assert.equal(months2026[1].month, '09');
  assert.equal(months2026[1].count, 3);

  // 2025 年包含 12月 (2期)
  const months2025 = groups.monthMapByYear['2025'];
  assert.equal(months2025.length, 1);
  assert.equal(months2025[0].month, '12');
  assert.equal(months2025[0].count, 2);
});

test('Date Grouping - 年份和月份过滤及固定每页 6 条分页切片', () => {
  // 1. 2026 年全月（共 10 条）：第 1 页应展示 6 条，总页数为 2
  const page1 = filterAndPaginateDates(mockDates, {
    year: '2026',
    month: 'all',
    page: 1,
    pageSize: 6
  });
  assert.equal(page1.totalCount, 10);
  assert.equal(page1.totalPages, 2);
  assert.equal(page1.pagedDates.length, 6);
  assert.equal(page1.pagedDates[0], '2026-10-14');
  assert.equal(page1.pagedDates[5], '2026-10-09');

  // 第 2 页展示剩余 4 条
  const page2 = filterAndPaginateDates(mockDates, {
    year: '2026',
    month: 'all',
    page: 2,
    pageSize: 6
  });
  assert.equal(page2.pagedDates.length, 4);
  assert.equal(page2.pagedDates[0], '2026-10-08');

  // 2. 指定月份：2026-09（共 3 条），单页即可展示完全，总页数为 1
  const sepRes = filterAndPaginateDates(mockDates, {
    year: '2026',
    month: '09',
    page: 1,
    pageSize: 6
  });
  assert.equal(sepRes.totalCount, 3);
  assert.equal(sepRes.totalPages, 1);
  assert.equal(sepRes.pagedDates.length, 3);
  assert.equal(sepRes.pagedDates[0], '2026-09-27');
});

test('Date Grouping - 边界保护与防非法输入容错', () => {
  const emptyRes = filterAndPaginateDates([], { year: '2026', month: 'all', page: 1 });
  assert.equal(emptyRes.totalCount, 0);
  assert.equal(emptyRes.totalPages, 1);
  assert.deepEqual(emptyRes.pagedDates, []);

  // 页码超出范围自动规整
  const clampRes = filterAndPaginateDates(mockDates, { year: '2026', month: 'all', page: 99, pageSize: 6 });
  assert.equal(clampRes.currentPage, 2);
});
```

- [ ] **Step 2: 运行测试验证失败**

运行：`node tests/dateGrouping.test.mjs`  
预期：FAIL (Cannot find module `../src/utils/dateGrouping.js`)

- [ ] **Step 3: 编写核心实现 (`src/utils/dateGrouping.ts`)**

```typescript
export interface MonthBucket {
  month: string;  // 两位月份，如 "10"
  label: string;  // 如 "10月"
  count: number;  // 批次期数
}

export interface DateGroupingResult {
  years: string[];
  monthMapByYear: Record<string, MonthBucket[]>;
  totalCountByYear: Record<string, number>;
}

export interface FilterDatesOptions {
  year?: string;
  month?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedDatesResult {
  filteredDates: string[];
  pagedDates: string[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

/**
 * 将平铺日期数组聚合为年份与月份桶
 */
export function groupDatesByYearAndMonth(dates: string[] = []): DateGroupingResult {
  const yearSet = new Set<string>();
  const yearMonthCounts: Record<string, Record<string, number>> = {};
  const yearTotals: Record<string, number> = {};

  for (const date of dates) {
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    const [year, month] = date.split('-');

    yearSet.add(year);
    yearTotals[year] = (yearTotals[year] || 0) + 1;

    if (!yearMonthCounts[year]) {
      yearMonthCounts[year] = {};
    }
    yearMonthCounts[year][month] = (yearMonthCounts[year][month] || 0) + 1;
  }

  // 年份严格降序
  const years = Array.from(yearSet).sort((a, b) => b.localeCompare(a));
  const monthMapByYear: Record<string, MonthBucket[]> = {};

  for (const y of years) {
    const monthObj = yearMonthCounts[y] || {};
    // 月份严格降序 (从12月到01月)
    const sortedMonths = Object.keys(monthObj).sort((a, b) => b.localeCompare(a));
    monthMapByYear[y] = sortedMonths.map(m => ({
      month: m,
      label: `${parseInt(m, 10)}月`,
      count: monthObj[m]
    }));
  }

  return {
    years,
    monthMapByYear,
    totalCountByYear: yearTotals
  };
}

/**
 * 根据年份、月份与页码执行内存切片过滤
 */
export function filterAndPaginateDates(
  dates: string[] = [],
  options: FilterDatesOptions = {}
): PaginatedDatesResult {
  if (!Array.isArray(dates) || dates.length === 0) {
    return {
      filteredDates: [],
      pagedDates: [],
      totalCount: 0,
      totalPages: 1,
      currentPage: 1,
      pageSize: options.pageSize || 6
    };
  }

  const {
    year,
    month = 'all',
    page = 1,
    pageSize = 6
  } = options;

  let filtered = dates;

  if (year) {
    filtered = filtered.filter(d => d.startsWith(`${year}-`));
  }

  if (month && month !== 'all') {
    const prefix = year ? `${year}-${month}-` : `-${month}-`;
    filtered = filtered.filter(d => d.includes(prefix));
  }

  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const startIndex = (currentPage - 1) * pageSize;
  const pagedDates = filtered.slice(startIndex, startIndex + pageSize);

  return {
    filteredDates: filtered,
    pagedDates,
    totalCount,
    totalPages,
    currentPage,
    pageSize
  };
}
```

- [x] **Step 4: 运行测试验证通过**

运行：`node tests/dateGrouping.test.mjs`  
预期：PASS（3 项子测试全部通过）

- [x] **Step 5: 提交代码**

```bash
git add src/utils/dateGrouping.ts tests/dateGrouping.test.mjs
git commit -m "feat(date): implement date grouping, year-month filtering, and pagination engine"
```

---

### Task 2: 重构 DateStepperCapsule.tsx 接入年月微胶囊与翻页步进器

**Files:**
- Modify: `src/components/DateStepperCapsule.tsx`

- [x] **Step 1: 引入 `dateGrouping` 并在组件内部绑定状态**

在 `src/components/DateStepperCapsule.tsx` 中：
1. 导入 `groupDatesByYearAndMonth, filterAndPaginateDates`；
2. 内部增加状态：
   ```typescript
   // 聚合年份与月份数据
   const dateGroups = useMemo(() => groupDatesByYearAndMonth(availableDates), [availableDates]);
   const currentYear = currentDate.slice(0, 4);

   // 年份与月份过滤状态
   const [filterYear, setFilterYear] = useState<string>(() => {
     return dateGroups.years.includes(currentYear) ? currentYear : (dateGroups.years[0] || currentYear);
   });
   const [filterMonth, setFilterMonth] = useState<string>('all');
   const [page, setPage] = useState<number>(1);
   const pageSize = 6;
   ```
3. 联动响应：当外部 `availableDates` 或 `currentDate` 变更，且当前 `filterYear` 不在可用年份中时，自动校正 `filterYear`。
4. 切换年/月时自动将 `page` 重置为 `1`。

- [x] **Step 2: 重构下拉弹窗渲染结构**

替换原来的简单的平铺列表，构建包含三大层级的结构：
1. **顶栏 Header**：
   - 标题 `历史简报归档库`；
   - 年份切换微胶囊（单一年份时显示 `[2026年]`，多于 1 个年份时支持微下拉或切换）；
   - 当前年份归档总期数（如 `24 批次`）；
2. **第二栏 月份微胶囊水平滚动栏**：
   - `[全部 (24)]` 胶囊；
   - 当前年份有效月份胶囊列表，如 `[10月 (14)]`、`[09月 (10)]`；
   - 点击时切换 `filterMonth` 并重置 `setPage(1)`；
3. **第三栏 归档日期列表（固定 6 条）**：
   - 遍历 `paginatedResult.pagedDates`；
   - 渲染日历图标、日期文本、`LATEST` 最新徽章、选定态 `Check` 图标；
   - 点击具体日期时立即执行 `onDateChange(date)` 并关闭弹窗；
4. **第四栏 微型分页控制器**：
   - 当 `paginatedResult.totalPages > 1` 时展示；
   - 左侧 `<` 上一页（`page === 1` 时禁用）；
   - 中间 `第 ${page} / ${totalPages} 页`；
   - 右侧 `>` 下一页（`page === totalPages` 时禁用）。

- [x] **Step 3: 针对三大主题（波普、暗黑 HUD、羊皮纸）核验实体黑框与对比度**

- [x] **Step 4: 编译检查**

运行：`npm run build`  
预期：Vite 编译通过，0 错误 0 警告。

- [x] **Step 5: 提交代码**

```bash
git add src/components/DateStepperCapsule.tsx
git commit -m "feat(capsule): enrich date dropdown with year-month capsule filter and pagination"
```

---

### Task 3: 自动化端到端测试与全量多视口真机截图验证

**Files:**
- Create: `scripts/verify-date-dropdown-advanced.mjs`

- [x] **Step 1: 编写无头浏览器自动化验证脚本**

覆盖以下核心交互用例：
1. 打开页面，点击展开日期步进器下拉浮层；
2. 验证弹窗成功呈现年份与月份微胶囊栏；
3. 点击月份微胶囊 `[09月]`，验证日期列表切换为 9 月份批次；
4. 点击 `[全部]` 切换回全量模式，点击底部分页器 `>` 步进到第 2 页，验证列表呈现第 7~12 条数据；
5. 在三大主题（波普、HUD 暗黑、iOS Glass）及多视口（1440px / 1146px / 390px）下抓取真实截图并保存至 artifact 目录。

- [x] **Step 2: 执行全量自动化验证脚本**

运行：`node scripts/verify-date-dropdown-advanced.mjs`  
预期：所有断点截图成功生成，无截断无溢出，控制台输出 `🎉 日期下拉高级筛选与分页验证全部通过`。

- [x] **Step 3: 执行生产构建与全量单元测试回归**

运行：
`node --test tests/*.test.mjs`  
`npm run build`  
预期：全部绿灯通过。

- [x] **Step 4: 提交并交付最终代码**

```bash
git add scripts/verify-date-dropdown-advanced.mjs
git commit -m "test(e2e): add comprehensive headless verification for date dropdown pagination and filtering"
```

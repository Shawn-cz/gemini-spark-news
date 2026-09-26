# 历史简报日期步进选择器与多日回溯实施计划 (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建生产级历史简报日期步进选择器（`DateStepperCapsule`），实现可用归档日期的动态聚合、前后单日步进翻阅、下拉快速直选与后台新批次无感协同。

**Architecture:** 服务端在 `repository.mjs` 中聚合 MongoDB Atlas 与本地 `data/briefings/*.json`（含双模降级语料）生成去重降序的日期列表，通过 `GET /api/spark/available-dates` 暴露；前端新增 `DateStepperCapsule.tsx` 实体机械按键胶囊并挂载在 `IntelligenceHeader.tsx`；`SparkNewsDashboard.tsx` 动态加载最新批次（如 `2026-09-26`），回溯历史日期并以非侵入式微光轻提示同步今日新简报。

**Tech Stack:** Node.js 20 ESM, Express 4, React 18, TypeScript 5, Tailwind CSS, Lucide React, `node:test`.

---

## 文件变更清单与职责规划

| 序号 | 变更文件 | 类型 | 核心职责 |
| :--- | :--- | :--- | :--- |
| 1 | `server/repository.mjs` | 修改 | 新增 `getAvailableBriefingDates()` 聚合去重与降序排序方法 |
| 2 | `server/mock-server.mjs` | 修改 | 挂载 `GET /api/spark/available-dates` 端点并接入限流中间件 |
| 3 | `tests/availableDates.test.mjs` | 新建 | 验证可用日期聚合逻辑、降序排序与 API 端点 HTTP 200 返回 |
| 4 | `src/types/news.ts` | 修改 | 新增 `AvailableDatesData` 接口类型定义 |
| 5 | `src/services/api.ts` | 修改 | 新增 `fetchAvailableDates()` 客户端请求方法 |
| 6 | `src/components/DateStepperCapsule.tsx` | 新建 | 实体胶囊步进器组件（`◀` / 日期徽章与下拉 / `▶`，满足 WCAG AAA） |
| 7 | `src/components/IntelligenceHeader.tsx` | 修改 | 在顶部右侧工具栏嵌入 `DateStepperCapsule` |
| 8 | `src/components/SparkNewsDashboard.tsx` | 修改 | 顶层日期状态自适应初始化、历史回溯数据流与 SSE 新批次提示 |
| 9 | `scripts/verify-spark-pipeline.mjs` | 修改 | E2E 验证脚本增加可用日期端点校验与断言 |

---

## 实施任务列表

### Task 1: 服务端仓库层可用日期聚合与单元测试 (repository.mjs)

**Files:**
- Modify: `server/repository.mjs`
- Create: `tests/availableDates.test.mjs`

- [ ] **Step 1: 编写可用日期聚合单元测试**

创建 `tests/availableDates.test.mjs`：
```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getAvailableBriefingDates } from '../server/repository.mjs';

describe('Available Dates Repository Layer', () => {
  it('应当正确聚合可用日期并按时间严格降序排序', async () => {
    const result = await getAvailableBriefingDates();
    assert.ok(result, '返回结果应存在');
    assert.ok(Array.isArray(result.dates), 'dates 应当为数组');
    assert.ok(result.dates.length > 0, 'dates 数组应当非空');
    assert.strictEqual(typeof result.latestDate, 'string', 'latestDate 应当为字符串');
    assert.strictEqual(result.latestDate, result.dates[0], 'latestDate 必须是数组首个元素');

    // 验证严格降序且无重复
    const seen = new Set();
    for (let i = 0; i < result.dates.length; i++) {
      const d = result.dates[i];
      assert.match(d, /^\d{4}-\d{2}-\d{2}$/, `日期格式必须为 YYYY-MM-DD: ${d}`);
      assert.strictEqual(seen.has(d), false, `日期数组中不应出现重复日期: ${d}`);
      seen.add(d);

      if (i > 0) {
        assert.ok(result.dates[i - 1] > d, `日期应当降序排列: ${result.dates[i - 1]} 应大于 ${d}`);
      }
    }
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

运行：
```bash
node tests/availableDates.test.mjs
```
预期结果: FAIL (TypeError: `getAvailableBriefingDates is not a function` 或未导出)

- [ ] **Step 3: 在 `server/repository.mjs` 中实现 `getAvailableBriefingDates`**

在 `server/repository.mjs` 底部（或导出区域）实现并导出 `getAvailableBriefingDates`：
```javascript
/**
 * 聚合可用简报日期列表（支持 MongoDB Atlas 与 本地文件/内存双模降级）
 * 返回严格降序排列且无重复的日期数组
 */
export async function getAvailableBriefingDates() {
  const dateSet = new Set();

  // 1. 如果已连通 MongoDB，尝试从数据库聚合
  if (isMongoConnected) {
    try {
      const dbDates = await NewsItemModel.distinct('batchDate');
      if (Array.isArray(dbDates)) {
        dbDates.forEach(d => {
          if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
            dateSet.add(d);
          }
        });
      }
    } catch (err) {
      console.warn('[Repository] 从 MongoDB 获取 batchDate 失败，继续读取本地文件:', err.message);
    }
  }

  // 2. 读取本地物理磁盘 data/briefings 目录中的 YYYY-MM-DD.json
  try {
    if (fs.existsSync(BRIEFINGS_DIR)) {
      const files = fs.readdirSync(BRIEFINGS_DIR);
      files.forEach(file => {
        const match = file.match(/^(\d{4}-\d{2}-\d{2})\.json$/);
        if (match) {
          dateSet.add(match[1]);
        }
      });
    }
  } catch (err) {
    console.warn('[Repository] 读取 BRIEFINGS_DIR 异常:', err.message);
  }

  // 3. 读取内存降级存储中的日期
  Object.keys(memoryNewsStore).forEach(d => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      dateSet.add(d);
    }
  });

  // 4. 排序：严格时间降序 (从最新到最早)
  const sortedDates = Array.from(dateSet).sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));

  // 兜底保护：若全空则提供今天
  if (sortedDates.length === 0) {
    const today = new Date().toISOString().slice(0, 10);
    sortedDates.push(today);
  }

  return {
    dates: sortedDates,
    latestDate: sortedDates[0],
    totalDates: sortedDates.length
  };
}
```

- [ ] **Step 4: 运行测试验证通过**

运行：
```bash
node tests/availableDates.test.mjs
```
预期结果: PASS (1/1 passed)

- [ ] **Step 5: 提交代码**

```bash
git add server/repository.mjs tests/availableDates.test.mjs
git commit -m "feat(server): implement getAvailableBriefingDates in repository"
```

---

### Task 2: 服务端 API 路由网关端点挂载 (mock-server.mjs)

**Files:**
- Modify: `server/mock-server.mjs`
- Modify: `tests/availableDates.test.mjs`

- [ ] **Step 1: 在测试中补充 API 端点 HTTP 集成用例**

在 `tests/availableDates.test.mjs` 中追加集成测试：
```javascript
import http from 'http';
import { app } from '../server/mock-server.mjs';

describe('Available Dates API Endpoint', () => {
  it('GET /api/spark/available-dates 应当返回 HTTP 200 与结构化数据', async () => {
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    try {
      const res = await fetch(`http://localhost:${port}/api/spark/available-dates`);
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.code, 200);
      assert.strictEqual(json.message, 'success');
      assert.ok(json.data);
      assert.ok(Array.isArray(json.data.dates));
      assert.ok(json.data.dates.length > 0);
      assert.strictEqual(json.data.latestDate, json.data.dates[0]);
    } finally {
      server.close();
    }
  });
});
```

- [ ] **Step 2: 运行测试验证端点未挂载时失败**

运行：
```bash
node tests/availableDates.test.mjs
```
预期结果: 第二个测试 FAIL (HTTP 404)

- [ ] **Step 3: 在 `server/mock-server.mjs` 中挂载端点**

在 `server/mock-server.mjs` 中：
1. 导入 `getAvailableBriefingDates`：
   ```javascript
   import {
     initDatabase,
     getDataSourceInfo,
     getBatchStatus,
     getNewsList,
     saveBriefing,
     toggleBatchStatus,
     getAvailableBriefingDates
   } from './repository.mjs';
   ```
2. 挂载路由：
   ```javascript
   // 接口 1.5: 获取系统内所有可用简报日期列表
   app.get('/api/spark/available-dates', async (req, res) => {
     try {
       const data = await getAvailableBriefingDates();
       res.json({
         code: 200,
         message: 'success',
         data
       });
     } catch (err) {
       console.error('[API] /api/spark/available-dates error:', err);
       res.status(500).json({ code: 500, message: err.message });
     }
   });
   ```

- [ ] **Step 4: 运行测试验证通过**

运行：
```bash
node tests/availableDates.test.mjs
```
预期结果: PASS (2/2 suites passed)

- [ ] **Step 5: 提交代码**

```bash
git add server/mock-server.mjs tests/availableDates.test.mjs
git commit -m "feat(api): expose GET /api/spark/available-dates endpoint"
```

---

### Task 3: 前端 API 客户端与类型定义扩展 (news.ts & api.ts)

**Files:**
- Modify: `src/types/news.ts`
- Modify: `src/services/api.ts`

- [ ] **Step 1: 在 `src/types/news.ts` 中定义 `AvailableDatesData` 类型**

在 `src/types/news.ts` 中追加：
```typescript
export interface AvailableDatesData {
  dates: string[];
  latestDate: string;
  totalDates: number;
}
```

- [ ] **Step 2: 在 `src/services/api.ts` 中实现 `fetchAvailableDates`**

在 `src/services/api.ts` 中添加并导出方法：
```typescript
import {
  GlobalNewsItem,
  CategoryType,
  SentimentType,
  SparkBatchStatusInfo,
  GlobalNewsStats,
  AvailableDatesData
} from '../types/news';

/**
 * 获取系统所有已归档可用的简报日期列表
 */
export async function fetchAvailableDates(signal?: AbortSignal): Promise<AvailableDatesData> {
  const res = await fetch(`${API_BASE}/api/spark/available-dates`, { signal });
  if (!res.ok) {
    throw new Error(`获取可用日期失败: HTTP ${res.status}`);
  }
  const json = await res.json();
  return json.data;
}
```

- [ ] **Step 3: 运行全站 TypeScript 编译与打包验证**

运行：
```bash
npm run build
```
预期结果: PASS (0 errors, 0 warnings)

- [ ] **Step 4: 提交代码**

```bash
git add src/types/news.ts src/services/api.ts
git commit -m "feat(api): add fetchAvailableDates client method and types"
```

---

### Task 4: 新建 DateStepperCapsule 实体按键胶囊组件 (DateStepperCapsule.tsx)

**Files:**
- Create: `src/components/DateStepperCapsule.tsx`

- [ ] **Step 1: 实现 `src/components/DateStepperCapsule.tsx`**

组件具备机械触感按键、下拉日期选择、外部点击关闭、键盘 Esc 关闭、最新批次微光提示与 WCAG AAA 21:1 高对比度：
```tsx
import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Sparkles, Check } from 'lucide-react';

export interface DateStepperCapsuleProps {
  currentDate: string;
  availableDates: string[];
  onDateChange: (date: string) => void;
  isLoading?: boolean;
  hasNewerBatchAvailable?: boolean;
  onJumpToLatest?: () => void;
}

export const DateStepperCapsule: React.FC<DateStepperCapsuleProps> = ({
  currentDate,
  availableDates,
  onDateChange,
  isLoading = false,
  hasNewerBatchAvailable = false,
  onJumpToLatest
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 计算当前日期索引 (availableDates 严格降序：索引 0 为最新)
  const currentIndex = availableDates.indexOf(currentDate);
  const isLatest = currentIndex === 0 || (availableDates.length > 0 && currentDate >= availableDates[0]);
  const isEarliest = currentIndex !== -1 && currentIndex === availableDates.length - 1;

  // 步进按钮禁用状态
  const canGoPrevious = !isLoading && !isEarliest && availableDates.length > 1; // 往更早的一天
  const canGoNext = !isLoading && !isLatest && availableDates.length > 1;         // 往更新的一天

  const handlePrevious = () => {
    if (!canGoPrevious) return;
    const nextIdx = currentIndex === -1 ? 1 : currentIndex + 1;
    if (nextIdx < availableDates.length) {
      onDateChange(availableDates[nextIdx]);
    }
  };

  const handleNext = () => {
    if (!canGoNext) return;
    const nextIdx = currentIndex === -1 ? 0 : currentIndex - 1;
    if (nextIdx >= 0) {
      onDateChange(availableDates[nextIdx]);
    }
  };

  // 点击外部收起下拉菜单
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // 按 Esc 键收起下拉菜单
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative inline-flex items-center select-none font-mono">
      {/* 实体胶囊主外壳 */}
      <div className="flex items-center bg-black/90 dark:bg-black/90 text-white rounded-lg p-0.5 border-2 border-black dark:border-cyan-500/40 shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_rgba(6,182,212,0.3)]">
        {/* 左箭头：前一日 (更早) */}
        <button
          type="button"
          onClick={handlePrevious}
          disabled={!canGoPrevious}
          title={canGoPrevious ? "查看前一日历史简报" : "已是系统内最早归档简报"}
          className={`p-1.5 rounded transition-all duration-150 flex items-center justify-center ${
            canGoPrevious
              ? 'hover:bg-white/20 active:translate-y-0.5 cursor-pointer text-white'
              : 'opacity-30 cursor-not-allowed text-white/50'
          }`}
          aria-label="前一日"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* 中间日期徽章按钮：展开日期下拉列表 */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          className="px-2.5 py-1 text-xs font-bold tracking-wider flex items-center gap-1.5 hover:bg-white/10 rounded transition-colors cursor-pointer text-white"
          title="点击展开选择历史简报日期"
        >
          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
          <span>{currentDate}</span>
          {isLatest ? (
            <span className="text-[10px] bg-emerald-500 text-black font-black px-1.5 py-0.2 rounded uppercase tracking-tighter">
              最新
            </span>
          ) : (
            <span className="text-[10px] bg-slate-700 text-white font-medium px-1.5 py-0.2 rounded uppercase tracking-tighter">
              归档
            </span>
          )}
        </button>

        {/* 右箭头：后一日 (更新) */}
        <button
          type="button"
          onClick={handleNext}
          disabled={!canGoNext}
          title={canGoNext ? "查看后一日简报" : "已是最新批次简报"}
          className={`p-1.5 rounded transition-all duration-150 flex items-center justify-center ${
            canGoNext
              ? 'hover:bg-white/20 active:translate-y-0.5 cursor-pointer text-white'
              : 'opacity-30 cursor-not-allowed text-white/50'
          }`}
          aria-label="后一日"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 下拉历史日期选择列表浮层 */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-56 max-h-64 overflow-y-auto bg-slate-900 dark:bg-slate-900 light:bg-[#f4ebd9] text-white border-2 border-black dark:border-cyan-500/50 rounded-lg shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_rgba(6,182,212,0.4)] z-50 p-1.5 flex flex-col gap-1">
          <div className="px-2 py-1 text-[11px] font-bold text-slate-400 dark:text-cyan-400/80 border-b border-white/10 flex items-center justify-between">
            <span>历史简报归档库</span>
            <span className="text-[10px] opacity-75">{availableDates.length} 批次</span>
          </div>

          {availableDates.map((date, idx) => {
            const isSelected = date === currentDate;
            const isDateLatest = idx === 0;

            return (
              <button
                key={date}
                type="button"
                onClick={() => {
                  onDateChange(date);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded text-xs flex items-center justify-between transition-colors font-mono cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                    : 'hover:bg-white/10 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 opacity-60" />
                  <span>{date}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {isDateLatest && (
                    <span className="text-[9px] bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 px-1 rounded">
                      LATEST
                    </span>
                  )}
                  {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* 实时新批次漂浮轻提示 (当用户回溯历史，且后台生成完毕最新批次时呈现) */}
      {hasNewerBatchAvailable && onJumpToLatest && (
        <div className="absolute top-full right-0 mt-2 z-40 whitespace-nowrap">
          <button
            type="button"
            onClick={onJumpToLatest}
            className="flex items-center gap-1.5 bg-amber-400 text-black font-mono font-bold text-xs px-2.5 py-1 rounded-md border-2 border-black shadow-[3px_3px_0px_#000] hover:bg-amber-300 active:translate-y-0.5 transition-all animate-bounce cursor-pointer"
            title="点击切换到刚刚生成的今日最新批次"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>今日最新研报已就绪 · 点击查看</span>
          </button>
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 2: 运行测试构建检查组件语法与类型**

运行：
```bash
npm run build
```
预期结果: PASS (0 errors, 0 warnings)

- [ ] **Step 3: 提交代码**

```bash
git add src/components/DateStepperCapsule.tsx
git commit -m "feat(ui): create DateStepperCapsule component with Neo-Brutalism styling"
```

---

### Task 5: 顶层看板调度与 Header 工具栏集成 (IntelligenceHeader & SparkNewsDashboard)

**Files:**
- Modify: `src/components/IntelligenceHeader.tsx`
- Modify: `src/components/SparkNewsDashboard.tsx`

- [ ] **Step 1: 修改 `src/components/IntelligenceHeader.tsx`**

在 `IntelligenceHeader.tsx` 中：
1. 导入 `DateStepperCapsule`；
2. 扩充 `IntelligenceHeaderProps`：
   ```typescript
   export interface IntelligenceHeaderProps {
     statusInfo: SparkBatchStatusInfo | null;
     onManualSync: () => void;
     isSyncing: boolean;
     onOpenImportModal: () => void;
     onOpenDevTools: () => void;
     // 新增日期步进胶囊属性
     currentDate: string;
     availableDates: string[];
     onDateChange: (date: string) => void;
     hasNewerBatchAvailable?: boolean;
     onJumpToLatest?: () => void;
   }
   ```
3. 在右侧操作按钮区（`header-btn-sync` 前）渲染 `DateStepperCapsule`：
   ```tsx
   <DateStepperCapsule
     currentDate={currentDate}
     availableDates={availableDates}
     onDateChange={onDateChange}
     isLoading={isSyncing}
     hasNewerBatchAvailable={hasNewerBatchAvailable}
     onJumpToLatest={onJumpToLatest}
   />
   ```

- [ ] **Step 2: 修改 `src/components/SparkNewsDashboard.tsx`**

在 `SparkNewsDashboard.tsx` 中：
1. 导入 `fetchAvailableDates`：
   ```typescript
   import {
     fetchNewsList,
     fetchSparkBatchStatus,
     toggleSparkStatus,
     fetchAvailableDates
   } from '../services/api';
   ```
2. 增加状态：
   ```typescript
   const [availableDates, setAvailableDates] = useState<string[]>([]);
   const [hasNewerBatchAvailable, setHasNewerBatchAvailable] = useState<boolean>(false);
   ```
3. 动态初始化可用日期并默认定位到 `latestDate`：
   ```typescript
   // 初始化拉取系统可用日期
   useEffect(() => {
     let isMounted = true;
     fetchAvailableDates()
       .then(res => {
         if (isMounted && res.dates.length > 0) {
           setAvailableDates(res.dates);
           // 若当前日期为初始值，切换为最新日期
           if (res.latestDate && res.latestDate !== selectedDate) {
             setSelectedDate(res.latestDate);
           }
         }
       })
       .catch(err => {
         console.warn('[SparkNewsDashboard] 获取可用日期异常:', err);
       });
     return () => {
       isMounted = false;
     };
   }, []);
   ```
4. 切换日期处理函数：
   ```typescript
   const handleDateChange = (newDate: string) => {
     if (newDate === selectedDate) return;
     setSelectedDate(newDate);
     setPage(1); // 复位页码
     // 如果用户切换到了最新批次，消除新批次提示
     if (availableDates.length > 0 && newDate >= availableDates[0]) {
       setHasNewerBatchAvailable(false);
     }
   };

   const handleJumpToLatest = () => {
     if (availableDates.length > 0) {
       handleDateChange(availableDates[0]);
     }
   };
   ```
5. SSE `COMPLETED` 协同处理：
   ```typescript
   // 重新拉取可用日期
   fetchAvailableDates().then(res => {
     setAvailableDates(res.dates);
     if (res.latestDate && res.latestDate !== selectedDate) {
       // 用户正在回溯历史日期，提示有新批次
       setHasNewerBatchAvailable(true);
     }
   });
   ```
6. 传给 `IntelligenceHeader`：
   ```tsx
   <IntelligenceHeader
     statusInfo={statusInfo}
     onManualSync={() => loadDashboardData(false)}
     isSyncing={isSilentRefreshing || isInitialLoading}
     onOpenImportModal={() => setIsImportModalOpen(true)}
     onOpenDevTools={() => setIsDevToolsOpen(true)}
     currentDate={selectedDate}
     availableDates={availableDates}
     onDateChange={handleDateChange}
     hasNewerBatchAvailable={hasNewerBatchAvailable}
     onJumpToLatest={handleJumpToLatest}
   />
   ```

- [ ] **Step 3: 运行 TypeScript 严格构建验证**

运行：
```bash
npm run build
```
预期结果: PASS (0 errors, 0 warnings)

- [ ] **Step 4: 提交代码**

```bash
git add src/components/IntelligenceHeader.tsx src/components/SparkNewsDashboard.tsx
git commit -m "feat(dashboard): integrate DateStepperCapsule in IntelligenceHeader and SparkNewsDashboard"
```

---

### Task 6: E2E 闭环脚本升级与全量回归测试 (verify-spark-pipeline.mjs)

**Files:**
- Modify: `scripts/verify-spark-pipeline.mjs`

- [ ] **Step 1: 在 `scripts/verify-spark-pipeline.mjs` 中增加可用日期端点校验**

在 `scripts/verify-spark-pipeline.mjs` 的适当步骤校验 `GET /api/spark/available-dates`：
```javascript
console.log('\n[Step 0.5] 校验可用简报日期聚合接口 (GET /api/spark/available-dates)...');
const datesRes = await fetch('http://localhost:3001/api/spark/available-dates');
assert.strictEqual(datesRes.status, 200);
const datesBody = await datesRes.json();
assert.strictEqual(datesBody.code, 200);
assert.ok(Array.isArray(datesBody.data.dates), 'dates 必须为数组');
assert.ok(datesBody.data.dates.length > 0, 'dates 必须包含至少 1 个可用日期');
assert.strictEqual(datesBody.data.latestDate, datesBody.data.dates[0], 'latestDate 必须是 dates[0]');
console.log(`   ✅ 可用日期接口校验通过: 共 ${datesBody.data.totalDates} 个批次, 最新批次为 [${datesBody.data.latestDate}]`);
```

- [ ] **Step 2: 运行 E2E 验证脚本**

运行：
```bash
node scripts/verify-spark-pipeline.mjs
```
预期结果: 全部步骤 PASS (Exit Code 0)

- [ ] **Step 3: 运行全量测试套件**

运行：
```bash
node --test tests/*.test.mjs
```
预期结果: 全部测试 100% 绿灯 (0 failures)

- [ ] **Step 4: 运行全站最终打包构建**

运行：
```bash
npm run build
```
预期结果: PASS (0 errors, 0 warnings)

- [ ] **Step 5: 提交代码**

```bash
git add scripts/verify-spark-pipeline.mjs
git commit -m "test(e2e): add available dates verification to spark pipeline script"
```

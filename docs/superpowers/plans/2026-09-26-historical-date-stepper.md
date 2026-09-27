# 鍘嗗彶绠€鎶ユ棩鏈熸杩涢€夋嫨鍣ㄤ笌澶氭棩鍥炴函瀹炴柦璁″垝 (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 鏋勫缓鐢熶骇绾у巻鍙茬畝鎶ユ棩鏈熸杩涢€夋嫨鍣紙`DateStepperCapsule`锛夛紝瀹炵幇鍙敤褰掓。鏃ユ湡鐨勫姩鎬佽仛鍚堛€佸墠鍚庡崟鏃ユ杩涚炕闃呫€佷笅鎷夊揩閫熺洿閫変笌鍚庡彴鏂版壒娆℃棤鎰熷崗鍚屻€?
**Architecture:** 鏈嶅姟绔湪 `repository.mjs` 涓仛鍚?MongoDB Atlas 涓庢湰鍦?`data/briefings/*.json`锛堝惈鍙屾ā闄嶇骇璇枡锛夌敓鎴愬幓閲嶉檷搴忕殑鏃ユ湡鍒楄〃锛岄€氳繃 `GET /api/spark/available-dates` 鏆撮湶锛涘墠绔柊澧?`DateStepperCapsule.tsx` 瀹炰綋鏈烘鎸夐敭鑳跺泭骞舵寕杞藉湪 `IntelligenceHeader.tsx`锛沗SparkNewsDashboard.tsx` 鍔ㄦ€佸姞杞芥渶鏂版壒娆★紙濡?`2026-09-26`锛夛紝鍥炴函鍘嗗彶鏃ユ湡骞朵互闈炰镜鍏ュ紡寰厜杞绘彁绀哄悓姝ヤ粖鏃ユ柊绠€鎶ャ€?
**Tech Stack:** Node.js 20 ESM, Express 4, React 18, TypeScript 5, Tailwind CSS, Lucide React, `node:test`.

---

## 鏂囦欢鍙樻洿娓呭崟涓庤亴璐ｈ鍒?
| 搴忓彿 | 鍙樻洿鏂囦欢 | 绫诲瀷 | 鏍稿績鑱岃矗 |
| :--- | :--- | :--- | :--- |
| 1 | `server/repository.mjs` | 淇敼 | 鏂板 `getAvailableBriefingDates()` 鑱氬悎鍘婚噸涓庨檷搴忔帓搴忔柟娉?|
| 2 | `server/mock-server.mjs` | 淇敼 | 鎸傝浇 `GET /api/spark/available-dates` 绔偣骞舵帴鍏ラ檺娴佷腑闂翠欢 |
| 3 | `tests/availableDates.test.mjs` | 鏂板缓 | 楠岃瘉鍙敤鏃ユ湡鑱氬悎閫昏緫銆侀檷搴忔帓搴忎笌 API 绔偣 HTTP 200 杩斿洖 |
| 4 | `src/types/news.ts` | 淇敼 | 鏂板 `AvailableDatesData` 鎺ュ彛绫诲瀷瀹氫箟 |
| 5 | `src/services/api.ts` | 淇敼 | 鏂板 `fetchAvailableDates()` 瀹㈡埛绔姹傛柟娉?|
| 6 | `src/components/DateStepperCapsule.tsx` | 鏂板缓 | 瀹炰綋鑳跺泭姝ヨ繘鍣ㄧ粍浠讹紙`鈼€` / 鏃ユ湡寰界珷涓庝笅鎷?/ `鈻禶锛屾弧瓒?WCAG AAA锛?|
| 7 | `src/components/IntelligenceHeader.tsx` | 淇敼 | 鍦ㄩ《閮ㄥ彸渚у伐鍏锋爮宓屽叆 `DateStepperCapsule` |
| 8 | `src/components/SparkNewsDashboard.tsx` | 淇敼 | 椤跺眰鏃ユ湡鐘舵€佽嚜閫傚簲鍒濆鍖栥€佸巻鍙插洖婧暟鎹祦涓?SSE 鏂版壒娆℃彁绀?|
| 9 | `scripts/verify-spark-pipeline.mjs` | 淇敼 | E2E 楠岃瘉鑴氭湰澧炲姞鍙敤鏃ユ湡绔偣鏍￠獙涓庢柇瑷€ |

---

## 瀹炴柦浠诲姟鍒楄〃

### Task 1: 鏈嶅姟绔粨搴撳眰鍙敤鏃ユ湡鑱氬悎涓庡崟鍏冩祴璇?(repository.mjs)

**Files:**
- Modify: `server/repository.mjs`
- Create: `tests/availableDates.test.mjs`

- [x] **Step 1: 缂栧啓鍙敤鏃ユ湡鑱氬悎鍗曞厓娴嬭瘯**

鍒涘缓 `tests/availableDates.test.mjs`锛?```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getAvailableBriefingDates } from '../server/repository.mjs';

describe('Available Dates Repository Layer', () => {
  it('搴斿綋姝ｇ‘鑱氬悎鍙敤鏃ユ湡骞舵寜鏃堕棿涓ユ牸闄嶅簭鎺掑簭', async () => {
    const result = await getAvailableBriefingDates();
    assert.ok(result, '杩斿洖缁撴灉搴斿瓨鍦?);
    assert.ok(Array.isArray(result.dates), 'dates 搴斿綋涓烘暟缁?);
    assert.ok(result.dates.length > 0, 'dates 鏁扮粍搴斿綋闈炵┖');
    assert.strictEqual(typeof result.latestDate, 'string', 'latestDate 搴斿綋涓哄瓧绗︿覆');
    assert.strictEqual(result.latestDate, result.dates[0], 'latestDate 蹇呴』鏄暟缁勯涓厓绱?);

    // 楠岃瘉涓ユ牸闄嶅簭涓旀棤閲嶅
    const seen = new Set();
    for (let i = 0; i < result.dates.length; i++) {
      const d = result.dates[i];
      assert.match(d, /^\d{4}-\d{2}-\d{2}$/, `鏃ユ湡鏍煎紡蹇呴』涓?YYYY-MM-DD: ${d}`);
      assert.strictEqual(seen.has(d), false, `鏃ユ湡鏁扮粍涓笉搴斿嚭鐜伴噸澶嶆棩鏈? ${d}`);
      seen.add(d);

      if (i > 0) {
        assert.ok(result.dates[i - 1] > d, `鏃ユ湡搴斿綋闄嶅簭鎺掑垪: ${result.dates[i - 1]} 搴斿ぇ浜?${d}`);
      }
    }
  });
});
```

- [x] **Step 2: 杩愯娴嬭瘯楠岃瘉澶辫触**

杩愯锛?```bash
node tests/availableDates.test.mjs
```
棰勬湡缁撴灉: FAIL (TypeError: `getAvailableBriefingDates is not a function` 鎴栨湭瀵煎嚭)

- [x] **Step 3: 鍦?`server/repository.mjs` 涓疄鐜?`getAvailableBriefingDates`**

鍦?`server/repository.mjs` 搴曢儴锛堟垨瀵煎嚭鍖哄煙锛夊疄鐜板苟瀵煎嚭 `getAvailableBriefingDates`锛?```javascript
/**
 * 鑱氬悎鍙敤绠€鎶ユ棩鏈熷垪琛紙鏀寔 MongoDB Atlas 涓?鏈湴鏂囦欢/鍐呭瓨鍙屾ā闄嶇骇锛? * 杩斿洖涓ユ牸闄嶅簭鎺掑垪涓旀棤閲嶅鐨勬棩鏈熸暟缁? */
export async function getAvailableBriefingDates() {
  const dateSet = new Set();

  // 1. 濡傛灉宸茶繛閫?MongoDB锛屽皾璇曚粠鏁版嵁搴撹仛鍚?  if (isMongoConnected) {
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
      console.warn('[Repository] 浠?MongoDB 鑾峰彇 batchDate 澶辫触锛岀户缁鍙栨湰鍦版枃浠?', err.message);
    }
  }

  // 2. 璇诲彇鏈湴鐗╃悊纾佺洏 data/briefings 鐩綍涓殑 YYYY-MM-DD.json
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
    console.warn('[Repository] 璇诲彇 BRIEFINGS_DIR 寮傚父:', err.message);
  }

  // 3. 璇诲彇鍐呭瓨闄嶇骇瀛樺偍涓殑鏃ユ湡
  Object.keys(memoryNewsStore).forEach(d => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      dateSet.add(d);
    }
  });

  // 4. 鎺掑簭锛氫弗鏍兼椂闂撮檷搴?(浠庢渶鏂板埌鏈€鏃?
  const sortedDates = Array.from(dateSet).sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));

  // 鍏滃簳淇濇姢锛氳嫢鍏ㄧ┖鍒欐彁渚涗粖澶?  if (sortedDates.length === 0) {
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

- [x] **Step 4: 杩愯娴嬭瘯楠岃瘉閫氳繃**

杩愯锛?```bash
node tests/availableDates.test.mjs
```
棰勬湡缁撴灉: PASS (1/1 passed)

- [x] **Step 5: 鎻愪氦浠ｇ爜**

```bash
git add server/repository.mjs tests/availableDates.test.mjs
git commit -m "feat(server): implement getAvailableBriefingDates in repository"
```

---

### Task 2: 鏈嶅姟绔?API 璺敱缃戝叧绔偣鎸傝浇 (mock-server.mjs)

**Files:**
- Modify: `server/mock-server.mjs`
- Modify: `tests/availableDates.test.mjs`

- [x] **Step 1: 鍦ㄦ祴璇曚腑琛ュ厖 API 绔偣 HTTP 闆嗘垚鐢ㄤ緥**

鍦?`tests/availableDates.test.mjs` 涓拷鍔犻泦鎴愭祴璇曪細
```javascript
import http from 'http';
import { app } from '../server/mock-server.mjs';

describe('Available Dates API Endpoint', () => {
  it('GET /api/spark/available-dates 搴斿綋杩斿洖 HTTP 200 涓庣粨鏋勫寲鏁版嵁', async () => {
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

- [x] **Step 2: 杩愯娴嬭瘯楠岃瘉绔偣鏈寕杞芥椂澶辫触**

杩愯锛?```bash
node tests/availableDates.test.mjs
```
棰勬湡缁撴灉: 绗簩涓祴璇?FAIL (HTTP 404)

- [x] **Step 3: 鍦?`server/mock-server.mjs` 涓寕杞界鐐?*

鍦?`server/mock-server.mjs` 涓細
1. 瀵煎叆 `getAvailableBriefingDates`锛?   ```javascript
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
2. 鎸傝浇璺敱锛?   ```javascript
   // 鎺ュ彛 1.5: 鑾峰彇绯荤粺鍐呮墍鏈夊彲鐢ㄧ畝鎶ユ棩鏈熷垪琛?   app.get('/api/spark/available-dates', async (req, res) => {
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

- [x] **Step 4: 杩愯娴嬭瘯楠岃瘉閫氳繃**

杩愯锛?```bash
node tests/availableDates.test.mjs
```
棰勬湡缁撴灉: PASS (2/2 suites passed)

- [x] **Step 5: 鎻愪氦浠ｇ爜**

```bash
git add server/mock-server.mjs tests/availableDates.test.mjs
git commit -m "feat(api): expose GET /api/spark/available-dates endpoint"
```

---

### Task 3: 鍓嶇 API 瀹㈡埛绔笌绫诲瀷瀹氫箟鎵╁睍 (news.ts & api.ts)

**Files:**
- Modify: `src/types/news.ts`
- Modify: `src/services/api.ts`

- [x] **Step 1: 鍦?`src/types/news.ts` 涓畾涔?`AvailableDatesData` 绫诲瀷**

鍦?`src/types/news.ts` 涓拷鍔狅細
```typescript
export interface AvailableDatesData {
  dates: string[];
  latestDate: string;
  totalDates: number;
}
```

- [x] **Step 2: 鍦?`src/services/api.ts` 涓疄鐜?`fetchAvailableDates`**

鍦?`src/services/api.ts` 涓坊鍔犲苟瀵煎嚭鏂规硶锛?```typescript
import {
  GlobalNewsItem,
  CategoryType,
  SentimentType,
  SparkBatchStatusInfo,
  GlobalNewsStats,
  AvailableDatesData
} from '../types/news';

/**
 * 鑾峰彇绯荤粺鎵€鏈夊凡褰掓。鍙敤鐨勭畝鎶ユ棩鏈熷垪琛? */
export async function fetchAvailableDates(signal?: AbortSignal): Promise<AvailableDatesData> {
  const res = await fetch(`${API_BASE}/api/spark/available-dates`, { signal });
  if (!res.ok) {
    throw new Error(`鑾峰彇鍙敤鏃ユ湡澶辫触: HTTP ${res.status}`);
  }
  const json = await res.json();
  return json.data;
}
```

- [x] **Step 3: 杩愯鍏ㄧ珯 TypeScript 缂栬瘧涓庢墦鍖呴獙璇?*

杩愯锛?```bash
npm run build
```
棰勬湡缁撴灉: PASS (0 errors, 0 warnings)

- [x] **Step 4: 鎻愪氦浠ｇ爜**

```bash
git add src/types/news.ts src/services/api.ts
git commit -m "feat(api): add fetchAvailableDates client method and types"
```

---

### Task 4: 鏂板缓 DateStepperCapsule 瀹炰綋鎸夐敭鑳跺泭缁勪欢 (DateStepperCapsule.tsx)

**Files:**
- Create: `src/components/DateStepperCapsule.tsx`

- [x] **Step 1: 瀹炵幇 `src/components/DateStepperCapsule.tsx`**

缁勪欢鍏峰鏈烘瑙︽劅鎸夐敭銆佷笅鎷夋棩鏈熼€夋嫨銆佸閮ㄧ偣鍑诲叧闂€侀敭鐩?Esc 鍏抽棴銆佹渶鏂版壒娆″井鍏夋彁绀轰笌 WCAG AAA 21:1 楂樺姣斿害锛?```tsx
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

  // 璁＄畻褰撳墠鏃ユ湡绱㈠紩 (availableDates 涓ユ牸闄嶅簭锛氱储寮?0 涓烘渶鏂?
  const currentIndex = availableDates.indexOf(currentDate);
  const isLatest = currentIndex === 0 || (availableDates.length > 0 && currentDate >= availableDates[0]);
  const isEarliest = currentIndex !== -1 && currentIndex === availableDates.length - 1;

  // 姝ヨ繘鎸夐挳绂佺敤鐘舵€?  const canGoPrevious = !isLoading && !isEarliest && availableDates.length > 1; // 寰€鏇存棭鐨勪竴澶?  const canGoNext = !isLoading && !isLatest && availableDates.length > 1;         // 寰€鏇存柊鐨勪竴澶?
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

  // 鐐瑰嚮澶栭儴鏀惰捣涓嬫媺鑿滃崟
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

  // 鎸?Esc 閿敹璧蜂笅鎷夎彍鍗?  useEffect(() => {
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
      {/* 瀹炰綋鑳跺泭涓诲澹?*/}
      <div className="flex items-center bg-black/90 dark:bg-black/90 text-white rounded-lg p-0.5 border-2 border-black dark:border-cyan-500/40 shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_rgba(6,182,212,0.3)]">
        {/* 宸︾澶达細鍓嶄竴鏃?(鏇存棭) */}
        <button
          type="button"
          onClick={handlePrevious}
          disabled={!canGoPrevious}
          title={canGoPrevious ? "鏌ョ湅鍓嶄竴鏃ュ巻鍙茬畝鎶? : "宸叉槸绯荤粺鍐呮渶鏃╁綊妗ｇ畝鎶?}
          className={`p-1.5 rounded transition-all duration-150 flex items-center justify-center ${
            canGoPrevious
              ? 'hover:bg-white/20 active:translate-y-0.5 cursor-pointer text-white'
              : 'opacity-30 cursor-not-allowed text-white/50'
          }`}
          aria-label="鍓嶄竴鏃?
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* 涓棿鏃ユ湡寰界珷鎸夐挳锛氬睍寮€鏃ユ湡涓嬫媺鍒楄〃 */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          className="px-2.5 py-1 text-xs font-bold tracking-wider flex items-center gap-1.5 hover:bg-white/10 rounded transition-colors cursor-pointer text-white"
          title="鐐瑰嚮灞曞紑閫夋嫨鍘嗗彶绠€鎶ユ棩鏈?
        >
          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
          <span>{currentDate}</span>
          {isLatest ? (
            <span className="text-[10px] bg-emerald-500 text-black font-black px-1.5 py-0.2 rounded uppercase tracking-tighter">
              鏈€鏂?            </span>
          ) : (
            <span className="text-[10px] bg-slate-700 text-white font-medium px-1.5 py-0.2 rounded uppercase tracking-tighter">
              褰掓。
            </span>
          )}
        </button>

        {/* 鍙崇澶达細鍚庝竴鏃?(鏇存柊) */}
        <button
          type="button"
          onClick={handleNext}
          disabled={!canGoNext}
          title={canGoNext ? "鏌ョ湅鍚庝竴鏃ョ畝鎶? : "宸叉槸鏈€鏂版壒娆＄畝鎶?}
          className={`p-1.5 rounded transition-all duration-150 flex items-center justify-center ${
            canGoNext
              ? 'hover:bg-white/20 active:translate-y-0.5 cursor-pointer text-white'
              : 'opacity-30 cursor-not-allowed text-white/50'
          }`}
          aria-label="鍚庝竴鏃?
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 涓嬫媺鍘嗗彶鏃ユ湡閫夋嫨鍒楄〃娴眰 */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-56 max-h-64 overflow-y-auto bg-slate-900 dark:bg-slate-900 light:bg-[#f4ebd9] text-white border-2 border-black dark:border-cyan-500/50 rounded-lg shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_rgba(6,182,212,0.4)] z-50 p-1.5 flex flex-col gap-1">
          <div className="px-2 py-1 text-[11px] font-bold text-slate-400 dark:text-cyan-400/80 border-b border-white/10 flex items-center justify-between">
            <span>鍘嗗彶绠€鎶ュ綊妗ｅ簱</span>
            <span className="text-[10px] opacity-75">{availableDates.length} 鎵规</span>
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

      {/* 瀹炴椂鏂版壒娆℃紓娴交鎻愮ず (褰撶敤鎴峰洖婧巻鍙诧紝涓斿悗鍙扮敓鎴愬畬姣曟渶鏂版壒娆℃椂鍛堢幇) */}
      {hasNewerBatchAvailable && onJumpToLatest && (
        <div className="absolute top-full right-0 mt-2 z-40 whitespace-nowrap">
          <button
            type="button"
            onClick={onJumpToLatest}
            className="flex items-center gap-1.5 bg-amber-400 text-black font-mono font-bold text-xs px-2.5 py-1 rounded-md border-2 border-black shadow-[3px_3px_0px_#000] hover:bg-amber-300 active:translate-y-0.5 transition-all animate-bounce cursor-pointer"
            title="鐐瑰嚮鍒囨崲鍒板垰鍒氱敓鎴愮殑浠婃棩鏈€鏂版壒娆?
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>浠婃棩鏈€鏂扮爺鎶ュ凡灏辩华 路 鐐瑰嚮鏌ョ湅</span>
          </button>
        </div>
      )}
    </div>
  );
};
```

- [x] **Step 2: 杩愯娴嬭瘯鏋勫缓妫€鏌ョ粍浠惰娉曚笌绫诲瀷**

杩愯锛?```bash
npm run build
```
棰勬湡缁撴灉: PASS (0 errors, 0 warnings)

- [x] **Step 3: 鎻愪氦浠ｇ爜**

```bash
git add src/components/DateStepperCapsule.tsx
git commit -m "feat(ui): create DateStepperCapsule component with Neo-Brutalism styling"
```

---

### Task 5: 椤跺眰鐪嬫澘璋冨害涓?Header 宸ュ叿鏍忛泦鎴?(IntelligenceHeader & SparkNewsDashboard)

**Files:**
- Modify: `src/components/IntelligenceHeader.tsx`
- Modify: `src/components/SparkNewsDashboard.tsx`

- [x] **Step 1: 淇敼 `src/components/IntelligenceHeader.tsx`**

鍦?`IntelligenceHeader.tsx` 涓細
1. 瀵煎叆 `DateStepperCapsule`锛?2. 鎵╁厖 `IntelligenceHeaderProps`锛?   ```typescript
   export interface IntelligenceHeaderProps {
     statusInfo: SparkBatchStatusInfo | null;
     onManualSync: () => void;
     isSyncing: boolean;
     onOpenImportModal: () => void;
     onOpenDevTools: () => void;
     // 鏂板鏃ユ湡姝ヨ繘鑳跺泭灞炴€?     currentDate: string;
     availableDates: string[];
     onDateChange: (date: string) => void;
     hasNewerBatchAvailable?: boolean;
     onJumpToLatest?: () => void;
   }
   ```
3. 鍦ㄥ彸渚ф搷浣滄寜閽尯锛坄header-btn-sync` 鍓嶏級娓叉煋 `DateStepperCapsule`锛?   ```tsx
   <DateStepperCapsule
     currentDate={currentDate}
     availableDates={availableDates}
     onDateChange={onDateChange}
     isLoading={isSyncing}
     hasNewerBatchAvailable={hasNewerBatchAvailable}
     onJumpToLatest={onJumpToLatest}
   />
   ```

- [x] **Step 2: 淇敼 `src/components/SparkNewsDashboard.tsx`**

鍦?`SparkNewsDashboard.tsx` 涓細
1. 瀵煎叆 `fetchAvailableDates`锛?   ```typescript
   import {
     fetchNewsList,
     fetchSparkBatchStatus,
     toggleSparkStatus,
     fetchAvailableDates
   } from '../services/api';
   ```
2. 澧炲姞鐘舵€侊細
   ```typescript
   const [availableDates, setAvailableDates] = useState<string[]>([]);
   const [hasNewerBatchAvailable, setHasNewerBatchAvailable] = useState<boolean>(false);
   ```
3. 鍔ㄦ€佸垵濮嬪寲鍙敤鏃ユ湡骞堕粯璁ゅ畾浣嶅埌 `latestDate`锛?   ```typescript
   // 鍒濆鍖栨媺鍙栫郴缁熷彲鐢ㄦ棩鏈?   useEffect(() => {
     let isMounted = true;
     fetchAvailableDates()
       .then(res => {
         if (isMounted && res.dates.length > 0) {
           setAvailableDates(res.dates);
           // 鑻ュ綋鍓嶆棩鏈熶负鍒濆鍊硷紝鍒囨崲涓烘渶鏂版棩鏈?           if (res.latestDate && res.latestDate !== selectedDate) {
             setSelectedDate(res.latestDate);
           }
         }
       })
       .catch(err => {
         console.warn('[SparkNewsDashboard] 鑾峰彇鍙敤鏃ユ湡寮傚父:', err);
       });
     return () => {
       isMounted = false;
     };
   }, []);
   ```
4. 鍒囨崲鏃ユ湡澶勭悊鍑芥暟锛?   ```typescript
   const handleDateChange = (newDate: string) => {
     if (newDate === selectedDate) return;
     setSelectedDate(newDate);
     setPage(1); // 澶嶄綅椤电爜
     // 濡傛灉鐢ㄦ埛鍒囨崲鍒颁簡鏈€鏂版壒娆★紝娑堥櫎鏂版壒娆℃彁绀?     if (availableDates.length > 0 && newDate >= availableDates[0]) {
       setHasNewerBatchAvailable(false);
     }
   };

   const handleJumpToLatest = () => {
     if (availableDates.length > 0) {
       handleDateChange(availableDates[0]);
     }
   };
   ```
5. SSE `COMPLETED` 鍗忓悓澶勭悊锛?   ```typescript
   // 閲嶆柊鎷夊彇鍙敤鏃ユ湡
   fetchAvailableDates().then(res => {
     setAvailableDates(res.dates);
     if (res.latestDate && res.latestDate !== selectedDate) {
       // 鐢ㄦ埛姝ｅ湪鍥炴函鍘嗗彶鏃ユ湡锛屾彁绀烘湁鏂版壒娆?       setHasNewerBatchAvailable(true);
     }
   });
   ```
6. 浼犵粰 `IntelligenceHeader`锛?   ```tsx
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

- [x] **Step 3: 杩愯 TypeScript 涓ユ牸鏋勫缓楠岃瘉**

杩愯锛?```bash
npm run build
```
棰勬湡缁撴灉: PASS (0 errors, 0 warnings)

- [x] **Step 4: 鎻愪氦浠ｇ爜**

```bash
git add src/components/IntelligenceHeader.tsx src/components/SparkNewsDashboard.tsx
git commit -m "feat(dashboard): integrate DateStepperCapsule in IntelligenceHeader and SparkNewsDashboard"
```

---

### Task 6: E2E 闂幆鑴氭湰鍗囩骇涓庡叏閲忓洖褰掓祴璇?(verify-spark-pipeline.mjs)

**Files:**
- Modify: `scripts/verify-spark-pipeline.mjs`

- [x] **Step 1: 鍦?`scripts/verify-spark-pipeline.mjs` 涓鍔犲彲鐢ㄦ棩鏈熺鐐规牎楠?*

鍦?`scripts/verify-spark-pipeline.mjs` 鐨勯€傚綋姝ラ鏍￠獙 `GET /api/spark/available-dates`锛?```javascript
console.log('\n[Step 0.5] 鏍￠獙鍙敤绠€鎶ユ棩鏈熻仛鍚堟帴鍙?(GET /api/spark/available-dates)...');
const datesRes = await fetch('http://localhost:3001/api/spark/available-dates');
assert.strictEqual(datesRes.status, 200);
const datesBody = await datesRes.json();
assert.strictEqual(datesBody.code, 200);
assert.ok(Array.isArray(datesBody.data.dates), 'dates 蹇呴』涓烘暟缁?);
assert.ok(datesBody.data.dates.length > 0, 'dates 蹇呴』鍖呭惈鑷冲皯 1 涓彲鐢ㄦ棩鏈?);
assert.strictEqual(datesBody.data.latestDate, datesBody.data.dates[0], 'latestDate 蹇呴』鏄?dates[0]');
console.log(`   鉁?鍙敤鏃ユ湡鎺ュ彛鏍￠獙閫氳繃: 鍏?${datesBody.data.totalDates} 涓壒娆? 鏈€鏂版壒娆′负 [${datesBody.data.latestDate}]`);
```

- [x] **Step 2: 杩愯 E2E 楠岃瘉鑴氭湰**

杩愯锛?```bash
node scripts/verify-spark-pipeline.mjs
```
棰勬湡缁撴灉: 鍏ㄩ儴姝ラ PASS (Exit Code 0)

- [x] **Step 3: 杩愯鍏ㄩ噺娴嬭瘯濂椾欢**

杩愯锛?```bash
node --test tests/*.test.mjs
```
棰勬湡缁撴灉: 鍏ㄩ儴娴嬭瘯 100% 缁跨伅 (0 failures)

- [x] **Step 4: 杩愯鍏ㄧ珯鏈€缁堟墦鍖呮瀯寤?*

杩愯锛?```bash
npm run build
```
棰勬湡缁撴灉: PASS (0 errors, 0 warnings)

- [x] **Step 5: 鎻愪氦浠ｇ爜**

```bash
git add scripts/verify-spark-pipeline.mjs
git commit -m "test(e2e): add available dates verification to spark pipeline script"
```


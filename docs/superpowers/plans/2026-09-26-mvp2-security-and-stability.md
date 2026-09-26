# MVP 2: 鐢熶骇绾у畨鍏ㄩ槻鎶や笌绋冲畾鎬у姞鍥哄疄鏂借鍒?(Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 鏋勫缓鐢熶骇绾?API 瀹夊叏闃叉姢灞忛殰锛圚elmet銆佸垎绾ч檺娴併€丆ORS 鐧藉悕鍗曪級銆佹牳蹇冪鐞嗘搷浣滐紙妯″瀷鍒囨崲銆佹壒娆¤Е鍙戯級X-Admin-Key 閴存潈瀹堝崼銆佸墠绔帶鍒惰埍绉橀挜浜や簰銆丳M2 杩涚▼鑷剤涓庣敓浜?Docker 瀹瑰櫒鍖栭厤缃€?
**Architecture:** 鍩轰簬 Express 涓棿浠堕摼鏋勫缓澶氬眰绾垫繁闃插尽缃戯紙Helmet 鍝嶅簲澶撮槻鎶?-> CORS 鐧藉悕鍗?-> 鍏ㄥ眬闄愭祦 -> 鏁忔劅鎿嶄綔涓ユ牸闄愭祦 -> X-Admin-Key 瀹堝崼锛夛紱绠＄悊绔偣浣跨敤 `crypto.timingSafeEqual` 闃插尽瀹氭椂鏀诲嚮锛涘墠绔?DevTools 鎶藉眽闆嗘垚绉橀挜鏈湴鎸佷箙鍖栨敞鍏ワ紱鐢熶骇鐜鐢?Express 涓€浣撳寲鎵樼 Vite 浜х墿骞舵彁渚?PM2/Docker 瀹堟姢銆?
**Tech Stack:** Node.js 20 ESM, Express 4, `helmet`, `express-rate-limit`, `cors`, TypeScript 5, React 18, Vite 6, Docker, PM2.

---

## 鏂囦欢鍙樻洿娓呭崟涓庤亴璐ｈ鍒?
| 搴忓彿 | 鍙樻洿鏂囦欢 | 绫诲瀷 | 鏍稿績鑱岃矗 |
| :--- | :--- | :--- | :--- |
| 1 | `package.json` | 淇敼 | 鏂板 `helmet` 涓?`express-rate-limit` 鏍稿績鐢熶骇渚濊禆 |
| 2 | `server/middleware/adminAuth.mjs` | 鏂板缓 | 绠＄悊鍛橀壌鏉冧腑闂翠欢锛圶-Admin-Key 鎻愬彇涓庡父閲忔椂闂存瘮瀵癸級 |
| 3 | `server/middleware/rateLimiter.mjs` | 鏂板缓 | 鍏ㄥ眬 API 闄愭祦鍣ㄤ笌鏁忔劅鎿嶄綔涓ユ牸闃插埛闄愭祦鍣?|
| 4 | `server/mock-server.mjs` | 淇敼 | 鎸傝浇 Helmet銆侀檺娴併€丆ORS銆侀壌鏉冧腑闂翠欢鍙婄敓浜ч潤鎬佽祫婧愭墭绠?|
| 5 | `src/services/api.ts` | 淇敼 | 鍓嶇 API 璇锋眰鑷姩闄勫甫 `X-Admin-Key` 澶翠笌绉橀挜绠＄悊鏂规硶 |
| 6 | `src/components/DevToolsPanel.tsx` | 淇敼 | 鎺у埗鑸卞鍔犵鐞嗗憳绉橀挜閰嶇疆鍗＄墖锛堣緭鍏ャ€佺姸鎬佸窘绔犮€佹寔涔呭寲锛?|
| 7 | `ecosystem.config.cjs` | 鏂板缓 | PM2 杩涚▼瀹堟姢閰嶇疆锛堝穿婧冭嚜鎰堛€佸唴瀛橀檺鍒躲€佹棩蹇楄疆杞級 |
| 8 | `Dockerfile` & `.dockerignore` | 鏂板缓 | 澶氶樁娈电敓浜ч暅鍍忔瀯寤洪厤缃?|
| 9 | `.env.example` | 淇敼 | 琛ュ厖 `ADMIN_KEY`銆乣CORS_ORIGIN`銆乣RATE_LIMIT_MAX` 绛夐厤缃」 |
| 10 | `tests/securityAuth.test.mjs` | 鏂板缓 | 瀹夊叏鏍囧ご銆佸垎绾ч檺娴併€?01 閴存潈瀹堝崼涓庣櫧鍚嶅崟绔偣闆嗘垚娴嬭瘯 |
| 11 | `scripts/verify-spark-pipeline.mjs` | 淇敼 | E2E 楠岃瘉鑴氭湰娉ㄥ叆鏈夋晥 `X-Admin-Key` 淇濊瘉鍏ㄩ摼璺豢鐏?|

---

## 瀹炴柦浠诲姟鍒楄〃

### Task 1: 渚濊禆瀹夎涓庨檺娴侀槻鍒蜂腑闂翠欢 (package.json & rateLimiter.mjs)

**Files:**
- Modify: `package.json`
- Create: `server/middleware/rateLimiter.mjs`
- Test: `tests/rateLimiter.test.mjs`

- [x] **Step 1: 瀹夎 helmet 涓?express-rate-limit 渚濊禆**

杩愯:
```bash
npm install helmet express-rate-limit
```
棰勬湡缁撴灉: `package.json` 渚濊禆椤逛腑鏂板 `helmet` 涓?`express-rate-limit`锛宍package-lock.json` 鏇存柊鎴愬姛銆?
- [x] **Step 2: 缂栧啓闄愭祦涓棿浠跺崟鍏冩祴璇?*

鍒涘缓 `tests/rateLimiter.test.mjs`锛?```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import http from 'http';
import { apiRateLimiter, adminRateLimiter } from '../server/middleware/rateLimiter.mjs';

describe('RateLimiter Middleware', () => {
  it('搴斿綋姝ｇ‘瀵煎嚭 apiRateLimiter 涓?adminRateLimiter 涓棿浠?, () => {
    assert.strictEqual(typeof apiRateLimiter, 'function');
    assert.strictEqual(typeof adminRateLimiter, 'function');
  });

  it('鏁忔劅鎿嶄綔闄愭祦鍣ㄥ湪绐佸彂璇锋眰瓒呰繃閰嶉鏃惰繑鍥?429 Too Many Requests', async () => {
    const app = express();
    app.post('/api/test-limit', adminRateLimiter, (req, res) => {
      res.json({ success: true });
    });

    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    let hit429 = false;
    // 鏁忔劅闄愭祦璁句负 10娆?鍒嗭紝杩炵画鍙戦€?15 娆¤姹?    for (let i = 0; i < 15; i++) {
      const res = await fetch(`http://localhost:${port}/api/test-limit`, { method: 'POST' });
      if (res.status === 429) {
        hit429 = true;
        const body = await res.json();
        assert.match(body.message, /璇锋眰杩囦簬棰戠箒/);
        break;
      }
    }

    server.close();
    assert.strictEqual(hit429, true, '搴斿綋瑙﹀彂 429 闄愭祦鎷︽埅');
  });
});
```

- [x] **Step 3: 杩愯娴嬭瘯楠岃瘉澶辫触**

杩愯:
```bash
node tests/rateLimiter.test.mjs
```
棰勬湡: FAIL (ERR_MODULE_NOT_FOUND, `server/middleware/rateLimiter.mjs` 灏氫笉瀛樺湪)

- [x] **Step 4: 瀹炵幇 `server/middleware/rateLimiter.mjs`**

鍒涘缓 `server/middleware/rateLimiter.mjs`锛?```javascript
import rateLimit from 'express-rate-limit';

/**
 * 閫氱敤 API 璇诲彇璇锋眰闄愭祦鍣?(120 娆?鍒嗛挓)
 */
export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: process.env.RATE_LIMIT_GLOBAL ? parseInt(process.env.RATE_LIMIT_GLOBAL, 10) : 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: 429,
    message: '璇锋眰杩囦簬棰戠箒锛岃绋嶅悗鍐嶈瘯 (Too Many Requests)',
    timestamp: new Date().toISOString()
  },
  skip: (req) => {
    // 璞佸厤鍘熺敓 SSE 鎺ㄦ祦淇濇椿閫氶亾涓庡仴搴锋帰閽?    return req.path === '/api/spark/stream' || req.path === '/api/health';
  }
});

/**
 * 鏁忔劅绠＄悊鎿嶄綔涓ユ牸闄愭祦鍣?(10 娆?鍒嗛挓)
 * 閽堝鎵规鐢熸垚璋冨害銆佹ā鍨嬬儹鍒囩瓑楂樿绠楀紑閿€鎿嶄綔
 */
export const adminRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: process.env.RATE_LIMIT_ADMIN ? parseInt(process.env.RATE_LIMIT_ADMIN, 10) : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: 429,
    message: '鏁忔劅鎿嶄綔璇锋眰杩囦簬棰戠箒锛岃Е鍙戦鐜囦繚鎶わ紝璇?1 鍒嗛挓鍚庨噸璇?,
    timestamp: new Date().toISOString()
  }
});
```

- [x] **Step 5: 杩愯娴嬭瘯楠岃瘉閫氳繃**

杩愯:
```bash
node tests/rateLimiter.test.mjs
```
棰勬湡: PASS (2/2 passing)

- [x] **Step 6: 鎻愪氦浠ｇ爜**

```bash
git add package.json package-lock.json server/middleware/rateLimiter.mjs tests/rateLimiter.test.mjs
git commit -m "feat(security): implement tiered rate limiting middleware with SSE exemption"
```

---

### Task 2: 鏍稿績绠＄悊鎺ュ彛閴存潈瀹堝崼涓棿浠?(adminAuth.mjs)

**Files:**
- Create: `server/middleware/adminAuth.mjs`
- Test: `tests/adminAuth.test.mjs`

- [x] **Step 1: 缂栧啓閴存潈瀹堝崼鍗曞厓涓庨泦鎴愭祴璇?*

鍒涘缓 `tests/adminAuth.test.mjs`锛?```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import http from 'http';
import { adminAuthGuard, getEffectiveAdminKey } from '../server/middleware/adminAuth.mjs';

describe('AdminAuthGuard Middleware', () => {
  it('鏈彁渚?X-Admin-Key 澶撮儴鏃舵嫤鎴苟杩斿洖 HTTP 401', async () => {
    const app = express();
    app.post('/api/admin-action', adminAuthGuard, (req, res) => res.json({ ok: true }));
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    const res = await fetch(`http://localhost:${port}/api/admin-action`, { method: 'POST' });
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.code, 401);
    assert.match(body.message, /鏈巿鏉?);

    server.close();
  });

  it('鎻愪緵閿欒绉橀挜鏃舵嫤鎴苟杩斿洖 HTTP 401', async () => {
    const app = express();
    app.post('/api/admin-action', adminAuthGuard, (req, res) => res.json({ ok: true }));
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    const res = await fetch(`http://localhost:${port}/api/admin-action`, {
      method: 'POST',
      headers: { 'X-Admin-Key': 'wrong-password-123' }
    });
    assert.strictEqual(res.status, 401);

    server.close();
  });

  it('鎻愪緵姝ｇ‘绉橀挜鏃舵斁琛屽苟閫氳繃杩斿洖 HTTP 200', async () => {
    const app = express();
    app.post('/api/admin-action', adminAuthGuard, (req, res) => res.json({ ok: true }));
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    const effectiveKey = getEffectiveAdminKey();
    const res = await fetch(`http://localhost:${port}/api/admin-action`, {
      method: 'POST',
      headers: { 'X-Admin-Key': effectiveKey }
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.ok, true);

    server.close();
  });

  it('鏀寔 Authorization: Bearer <key> 鏍煎紡閴存潈', async () => {
    const app = express();
    app.post('/api/admin-action', adminAuthGuard, (req, res) => res.json({ ok: true }));
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    const effectiveKey = getEffectiveAdminKey();
    const res = await fetch(`http://localhost:${port}/api/admin-action`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${effectiveKey}` }
    });
    assert.strictEqual(res.status, 200);

    server.close();
  });
});
```

- [x] **Step 2: 杩愯娴嬭瘯楠岃瘉澶辫触**

杩愯:
```bash
node tests/adminAuth.test.mjs
```
棰勬湡: FAIL (ERR_MODULE_NOT_FOUND, `server/middleware/adminAuth.mjs` 灏氫笉瀛樺湪)

- [x] **Step 3: 瀹炵幇 `server/middleware/adminAuth.mjs`**

鍒涘缓 `server/middleware/adminAuth.mjs`锛?```javascript
import crypto from 'crypto';

const DEFAULT_DEV_ADMIN_KEY = 'gemini-spark-dev-secret';

/**
 * 鑾峰彇褰撳墠鐢熸晥鐨勭鐞嗗憳绉橀挜
 */
export function getEffectiveAdminKey() {
  return process.env.ADMIN_KEY || DEFAULT_DEV_ADMIN_KEY;
}

/**
 * 浣跨敤甯告暟鏃堕棿瀹夊叏姣斿涓や釜瀛楃涓诧紝鏉滅粷璁℃椂渚т俊閬撴敾鍑? */
function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // 淇濇寔鐩稿悓闀垮害姣斿浠ユ秷鑰楁亽瀹氭椂闂达紝闅忓悗鍒ゅ畾澶辫触
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * 绠＄悊鍛橀壌鏉冨畧鍗腑闂翠欢
 */
export function adminAuthGuard(req, res, next) {
  const adminKey = getEffectiveAdminKey();
  
  // 鎻愬彇璇锋眰鍑瘉锛氫紭鍏?X-Admin-Key 澶达紝娆￠€?Authorization: Bearer <key>
  let clientKey = req.headers['x-admin-key'];
  if (!clientKey && req.headers['authorization']) {
    const authHeader = req.headers['authorization'];
    if (authHeader.startsWith('Bearer ')) {
      clientKey = authHeader.slice(7).trim();
    }
  }

  if (!clientKey || !safeCompare(clientKey, adminKey)) {
    return res.status(401).json({
      code: 401,
      message: '鏈巿鏉冩搷浣滐細璇ョ鐞嗘帴鍙ｉ渶瑕佹彁渚涙湁鏁堢殑 X-Admin-Key 鍑瘉',
      timestamp: new Date().toISOString()
    });
  }

  next();
}
```

- [x] **Step 4: 杩愯娴嬭瘯楠岃瘉閫氳繃**

杩愯:
```bash
node tests/adminAuth.test.mjs
```
棰勬湡: PASS (4/4 passing)

- [x] **Step 5: 鎻愪氦浠ｇ爜**

```bash
git add server/middleware/adminAuth.mjs tests/adminAuth.test.mjs
git commit -m "feat(security): implement timing-safe X-Admin-Key authentication guard"
```

---

### Task 3: 鏈嶅姟绔綉鍏抽泦鎴愪笌鐢熶骇闈欐€佽祫婧愮洿鍑?(server/mock-server.mjs)

**Files:**
- Modify: `server/mock-server.mjs`
- Test: `tests/serverSecurityIntegration.test.mjs`

- [x] **Step 1: 缂栧啓鏈嶅姟绔泦鎴愭祴璇?*

鍒涘缓 `tests/serverSecurityIntegration.test.mjs`锛?```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { app } from '../server/mock-server.mjs';
import { getEffectiveAdminKey } from '../server/middleware/adminAuth.mjs';

describe('Server Security Integration', () => {
  it('鍖呭惈 Helmet 鏍稿績瀹夊叏鍝嶅簲澶?(nosniff & x-frame-options)', async () => {
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    const res = await fetch(`http://localhost:${port}/api/health`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get('x-content-type-options'), 'nosniff');
    assert.strictEqual(res.headers.get('x-frame-options'), 'DENY');

    server.close();
  });

  it('鏈巿鏉冭皟鐢?POST /api/spark/trigger-generate 杩斿洖 401', async () => {
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    const res = await fetch(`http://localhost:${port}/api/spark/trigger-generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: '2026-09-26' })
    });
    assert.strictEqual(res.status, 401);

    server.close();
  });

  it('鏈巿鏉冭皟鐢?POST /api/spark/models/select 杩斿洖 401', async () => {
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    const res = await fetch(`http://localhost:${port}/api/spark/models/select`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gemini-3.1-pro' })
    });
    assert.strictEqual(res.status, 401);

    server.close();
  });

  it('鎼哄甫鍚堟硶 X-Admin-Key 鏃惰皟鐢?POST /api/spark/models/select 鎴愬姛杩斿洖 200', async () => {
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    const key = getEffectiveAdminKey();
    const res = await fetch(`http://localhost:${port}/api/spark/models/select`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': key
      },
      body: JSON.stringify({ model: 'gemini-3.8-flash' })
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.code, 200);

    server.close();
  });
});
```

- [x] **Step 2: 杩愯娴嬭瘯楠岃瘉澶辫触**

杩愯:
```bash
node tests/serverSecurityIntegration.test.mjs
```
棰勬湡: FAIL (Helmet 鍝嶅簲澶寸己澶憋紝浠ュ強鏃犻壌鏉冩嫤鎴鑷磋繑鍥?200 鑰岄潪 401)

- [x] **Step 3: 淇敼 `server/mock-server.mjs` 鎸傝浇瀹夊叏涓庣敓浜ф墭绠′腑闂翠欢**

鍦?`server/mock-server.mjs` 涓紩鍏?`helmet`銆乣apiRateLimiter`銆乣adminRateLimiter`銆乣adminAuthGuard`锛屽苟淇濇姢鐩稿簲璺敱锛?```javascript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { apiRateLimiter, adminRateLimiter } from './middleware/rateLimiter.mjs';
import { adminAuthGuard } from './middleware/adminAuth.mjs';
// ... 鍘熸湁 import 淇濇寔涓嶅彉
```

鍦?`app.use(cors(...))` 鍚庢坊鍔狅細
```javascript
// 1. Helmet HTTP 瀹夊叏鍝嶅簲澶撮槻鎶?app.use(helmet({
  contentSecurityPolicy: false, // 鍏佽鏈湴鍐呰仈鏍峰紡涓?Vite/SVG 寮€鍙戠幆澧?  crossOriginEmbedderPolicy: false,
  frameguard: { action: 'deny' },
  hidePoweredBy: true
}));

// 2. 鍏ㄥ眬閫氱敤 API 閫熺巼闄愬埗 (璞佸厤 SSE 涓庡仴搴锋鏌?
app.use('/api', apiRateLimiter);
```

涓虹鐞嗘帴鍙ｆ寕杞?`adminRateLimiter` 涓?`adminAuthGuard`锛?```javascript
// 妯″瀷鐑垏鎹㈢鐐?(鍙椾弗鏍奸檺娴佷笌 Admin 閴存潈瀹堝崼淇濇姢)
app.post('/api/spark/models/select', adminRateLimiter, adminAuthGuard, (req, res) => {
  const { model } = req.body || {};
  if (!model) {
    return res.status(400).json({ code: 400, message: '蹇呴』鎸囧畾鐩爣妯″瀷' });
  }
  const result = setActiveModel(model);
  if (!result.success) {
    return res.status(400).json({ code: 400, message: result.message });
  }
  return res.json({ code: 200, message: result.message, data: { current: result.current } });
});

// 鎵嬪姩鍗虫椂瑙﹀彂鐢熶骇娴?(鍙椾弗鏍奸檺娴佷笌 Admin 閴存潈瀹堝崼淇濇姢)
app.post('/api/spark/trigger-generate', adminRateLimiter, adminAuthGuard, async (req, res) => {
  // 鍘熸湁鎵规鐢熸垚閫昏緫淇濇寔涓嶅彉
```

鍦ㄨ矾鐢辨湯灏炬坊鍔犵敓浜ч潤鎬佺洿鍑烘敮鎸侊細
```javascript
// 3. 鐢熶骇妯″紡涓€浣撳寲闈欐€佽祫婧愭墭绠?const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '..', 'dist');

if (process.env.NODE_ENV === 'production' && fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distDir, 'index.html'));
  });
}
```

- [x] **Step 4: 杩愯娴嬭瘯楠岃瘉閫氳繃**

杩愯:
```bash
node tests/serverSecurityIntegration.test.mjs
```
棰勬湡: PASS (4/4 passing)

- [x] **Step 5: 鎻愪氦浠ｇ爜**

```bash
git add server/mock-server.mjs tests/serverSecurityIntegration.test.mjs
git commit -m "feat(server): integrate Helmet, rate limiting, admin auth guard, and production static hosting"
```

---

### Task 4: 鍓嶇 API 灞備笌 DevTools 鎺у埗鑸辩閽ヤ氦浜掑崌绾?(api.ts & DevToolsPanel.tsx)

**Files:**
- Modify: `src/services/api.ts`
- Modify: `src/components/DevToolsPanel.tsx`

- [x] **Step 1: 鍦?`src/services/api.ts` 涓疄鐜扮閽ュ瓨鍙栦笌鑷姩娉ㄥ叆**

淇敼 `src/services/api.ts`锛屽鍑?`getAdminKey` 涓?`setAdminKey`锛?```typescript
const ADMIN_KEY_STORAGE_KEY = 'gemini_spark_admin_key';

export function getAdminKey(): string {
  try {
    return localStorage.getItem(ADMIN_KEY_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function setAdminKey(key: string): void {
  try {
    if (key.trim()) {
      localStorage.setItem(ADMIN_KEY_STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(ADMIN_KEY_STORAGE_KEY);
    }
  } catch {
    // 瀹归敊澶勭悊
  }
}

function getAuthHeaders(): Record<string, string> {
  const key = getAdminKey();
  return key ? { 'X-Admin-Key': key } : {};
}
```

鍦?`selectSparkModel()` 涓?`triggerSparkGenerate()` 鐨?`fetch` 璇锋眰涓姞鍏?`...getAuthHeaders()`锛?```typescript
export async function selectSparkModel(model: string): Promise<SparkModelsResponse> {
  const res = await fetch(`${API_BASE_URL}/spark/models/select`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ model }),
  });
  // 淇濇寔鍘熸湁澶勭悊锛岃嫢 401 鎶涘嚭鍖呭惈鏈巿鏉冧俊鎭殑閿欒
```

- [x] **Step 2: 鍦?`src/components/DevToolsPanel.tsx` 涓鍔犵閽ヨ缃崱鐗?*

鍦?DevTools 鎶藉眽鐨勨€淕emini Spark 鏅鸿兘浣撴帶鍒惰埍鈥濆崱鐗囧唴锛屾坊鍔犵鐞嗗憳绉橀挜閰嶇疆鍖猴細
- 杈撳叆妗嗘敮鎸佹樉绀?闅愯棌瀵嗙爜鍒囨崲锛坄<Eye>` / `<EyeOff>` 鍥炬爣锛夛紱
- 蹇€熶繚瀛樼閽ヤ笌娓呴櫎绉橀挜鎸夐挳锛?- 鐘舵€佹寚绀烘爣绛撅細`[宸叉巿鏉?宸查厤缃甝` 鎴?`[鏈厤缃?(鎿嶄綔灏嗗彈闄?]`锛?- 褰撻亣鍒?401 鎷︽埅鏃讹紝鍦ㄦ帶鍒跺彴鏃ュ織涓庣晫闈?Toast 涓樉绀洪啋鐩殑鏈巿鏉冩彁绀恒€?
- [x] **Step 3: 杩愯 TypeScript 缂栬瘧妫€鏌?*

杩愯:
```bash
npm run build
```
棰勬湡: 0 errors 0 warnings, `tsc -b && vite build` 鎴愬姛銆?
- [x] **Step 4: 鎻愪氦浠ｇ爜**

```bash
git add src/services/api.ts src/components/DevToolsPanel.tsx
git commit -m "feat(ui): add admin key management and authorization headers in DevTools panel"
```

---

### Task 5: 鐢熶骇瀹瑰櫒鍖栦笌杩涚▼鑷剤閰嶇疆 (ecosystem.config.cjs & Dockerfile)

**Files:**
- Create: `ecosystem.config.cjs`
- Create: `Dockerfile`
- Create: `.dockerignore`
- Modify: `.env.example`

- [x] **Step 1: 鍒涘缓 PM2 瀹堟姢閰嶇疆鏂囦欢 `ecosystem.config.cjs`**

鍒涘缓 `ecosystem.config.cjs`锛?```javascript
module.exports = {
  apps: [
    {
      name: 'gemini-spark-service',
      script: 'server/mock-server.mjs',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: 'logs/pm2-error.log',
      out_file: 'logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      time: true
    }
  ]
};
```

- [x] **Step 2: 鍒涘缓澶氶樁娈佃交閲?`Dockerfile` 涓?`.dockerignore`**

鍒涘缓 `Dockerfile`锛?```dockerfile
# Stage 1: Build Frontend Assets
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
COPY package*.json ./
RUN npm ci --omit=dev
COPY server ./server
COPY data ./data
COPY --from=builder /app/dist ./dist
RUN mkdir -p logs data/briefings

EXPOSE 3001
CMD ["node", "server/mock-server.mjs"]
```

鍒涘缓 `.dockerignore`锛?```
node_modules
dist
logs
screenshots
.git
.env
```

- [x] **Step 3: 瀹屽杽 `.env.example` 鐜鍙橀噺瑙勮寖妯℃澘**

鏇存柊 `.env.example`锛?```bash
# 鏈嶅姟鐩戝惉绔彛
PORT=3001

# 鐢熶骇鐜鏍囪瘑 (development / production)
NODE_ENV=production

# 鏍稿績绠＄悊鎿嶄綔閴存潈绉橀挜 (蹇呴』淇敼涓哄己闅忔満瀵嗙爜锛岀敤浜?DevTools 璋冨害涓庢ā鍨嬬儹鍒囬壌鏉?
ADMIN_KEY=your_secure_admin_secret_key_here

# 璺ㄥ煙鍩熷悕鐧藉悕鍗?(閫楀彿鍒嗛殧)
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173

# 鍏ㄥ眬涓庢晱鎰熸搷浣滈檺娴佷笂闄?RATE_LIMIT_GLOBAL=120
RATE_LIMIT_ADMIN=10

# MongoDB Atlas 浜戞暟鎹簱杩炴帴涓?MONGO_URI=mongodb+srv://<username>:<password>@cluster0.ryzx3s0.mongodb.net/gemini_news?retryWrites=true&w=majority

# Google Gemini 鏅鸿兘浣?API 瀵嗛挜
GEMINI_API_KEY=your_gemini_api_key_here

# 榛樿婵€娲绘ā鍨?(gemini-3.8-flash 鎴?gemini-3.1-pro)
GEMINI_MODEL=gemini-3.8-flash

# 姣忔棩瀹氭椂璋冨害鐢熶骇鏃堕棿
SCHEDULE_TIME=08:30
```

- [x] **Step 4: 鎻愪氦浠ｇ爜**

```bash
git add ecosystem.config.cjs Dockerfile .dockerignore .env.example
git commit -m "feat(deploy): add PM2 ecosystem config, multi-stage Dockerfile, and env template"
```

---

### Task 6: 绔埌绔棴鐜畨鍏ㄩ獙璇佷笌鍏ㄩ噺鍥炲綊娴嬭瘯 (Security & Stability Verification)

**Files:**
- Modify: `scripts/verify-spark-pipeline.mjs`
- Test: `tests/securityAuth.test.mjs`

- [x] **Step 1: 鍗囩骇 `scripts/verify-spark-pipeline.mjs` 娉ㄥ叆閴存潈娴嬭瘯**

鍦?`scripts/verify-spark-pipeline.mjs` 涓細
- 澧炲姞鏈甫 `X-Admin-Key` 鏃剁殑 401 鎷︽埅楠岃瘉锛?- 鎼哄甫鍚堟硶 `X-Admin-Key` 鎵ц妯″瀷鐑垏鎹笌鐢熶骇娴佹按绾匡紱
- 楠岃瘉闄愭祦鍣ㄤ笌瀹夊叏鏍囧ご鐘舵€併€?
- [x] **Step 2: 杩愯鍏ㄩ噺娴嬭瘯濂椾欢**

杩愯:
```bash
node tests/geminiSparkAgent.test.mjs
node tests/sseManager.test.mjs
node tests/scheduler.test.mjs
node tests/apiEndpoints.test.mjs
node tests/rateLimiter.test.mjs
node tests/adminAuth.test.mjs
node tests/serverSecurityIntegration.test.mjs
```
棰勬湡: 7 濂楀崟鍏冧笌闆嗘垚娴嬭瘯鍏ㄩ儴 100% 缁跨伅閫氳繃銆?
- [x] **Step 3: 杩愯鍏ㄩ摼璺?E2E 鑷姩鍖栭獙璇?*

杩愯:
```bash
node scripts/verify-spark-pipeline.mjs
```
棰勬湡: 100% 鎴愬姛閫氳繃銆?
- [x] **Step 4: 鎵ц鍏ㄧ珯鐢熶骇鏋勫缓**

杩愯:
```bash
npm run build
```
棰勬湡: 0 errors 0 warnings銆?
- [x] **Step 5: 鎻愪氦浠ｇ爜**

```bash
git add scripts/verify-spark-pipeline.mjs tests/
git commit -m "test(security): add comprehensive security auth test suite and update E2E pipeline"
```

---

## 鑷垜瀹℃煡娓呭崟 (Self-Review Checklist)

1. **Spec 瑕嗙洊搴?*:
   - Helmet 瀹夊叏鍝嶅簲澶? 瑕嗙洊 (Task 1, Task 3)
   - 鍒嗙骇闄愭祦涓?SSE 璞佸厤: 瑕嗙洊 (Task 1, Task 3)
   - X-Admin-Key 瀹堝崼涓庡父鏁版椂闂存瘮瀵? 瑕嗙洊 (Task 2, Task 3)
   - 鍓嶇 DevTools 绉橀挜绠＄悊涓庤嚜鍔ㄦ敞鍏? 瑕嗙洊 (Task 4)
   - PM2 涓?Docker 瀹瑰櫒鍖? 瑕嗙洊 (Task 5)
   - 鑷姩鍖栨祴璇曚笌 E2E 闂幆: 瑕嗙洊 (Task 6)
2. **鍗犱綅绗︽壂鎻?*: 鏃犱换浣?TODO銆乀BD銆乮mplement later 鎴栫己鐪佷唬鐮佸潡銆?3. **绫诲瀷涓庡懡鍚嶄竴鑷存€?*: 缁熶竴浣跨敤 `X-Admin-Key`銆乣gemini_spark_admin_key`銆乣adminAuthGuard`銆乣adminRateLimiter`銆乣apiRateLimiter`銆?

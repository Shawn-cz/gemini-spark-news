import assert from 'node:assert/strict';
import http from 'node:http';
import { getEffectiveAdminKey } from '../server/middleware/adminAuth.mjs';

const BASE_URL = 'http://localhost:3001';

async function main() {
  console.log('===========================================================');
  console.log('🧪 开始执行 Gemini Spark 生产流全链路 E2E 闭环验证 (含安全加固)...');
  console.log('===========================================================');

  const adminKey = getEffectiveAdminKey();
  const authHeaders = {
    'Content-Type': 'application/json',
    'X-Admin-Key': adminKey
  };

  // 检测 3001 端口服务，若未启动则动态挂载内置网关实例
  let localServer = null;
  try {
    const probe = await fetch(`${BASE_URL}/api/health`);
    if (!probe.ok) throw new Error('probe failed');
  } catch {
    console.log('\n[Init] 未检测到独立运行的 3001 端口服务，正在自动挂载网关实例...');
    const { app } = await import('../server/mock-server.mjs');
    const { initDatabase } = await import('../server/repository.mjs');
    await initDatabase();
    localServer = http.createServer(app);
    await new Promise(r => localServer.listen(3001, r));
    console.log('   ✅ 内置网关服务已挂载在 http://localhost:3001');
  }

  // 0. 安全防护与鉴权拦截验证 (Security & Auth Verification)
  console.log('\n[Step 0] 校验 Helmet 安全标头与核心接口 X-Admin-Key 鉴权守卫...');
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  assert.equal(healthRes.status, 200);
  assert.equal(healthRes.headers.get('x-content-type-options'), 'nosniff', '必须包含 nosniff 标头');
  assert.equal(healthRes.headers.get('x-frame-options'), 'DENY', '必须包含 x-frame-options: DENY 标头');
  console.log('   ✅ Helmet 安全标头验证通过 (nosniff & x-frame-options: DENY)');

  // 0.1 校验无凭证拦截
  const unauthSelect = await fetch(`${BASE_URL}/api/spark/models/select`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gemini-3.1-pro' })
  });
  assert.equal(unauthSelect.status, 401, '未授权调用模型切换必须返回 401');

  const unauthTrigger = await fetch(`${BASE_URL}/api/spark/trigger-generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date: '2026-09-25' })
  });
  assert.equal(unauthTrigger.status, 401, '未授权调用流水线生成必须返回 401');

  // 0.2 校验错误秘钥拦截
  const wrongKeyRes = await fetch(`${BASE_URL}/api/spark/models/select`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Key': 'invalid-secret-key' },
    body: JSON.stringify({ model: 'gemini-3.1-pro' })
  });
  assert.equal(wrongKeyRes.status, 401, '错误秘钥调用模型切换必须返回 401');
  console.log('   ✅ 管理接口鉴权守卫生效：无凭证及非法凭证均被拦截并返回 HTTP 401');

  // 0.3 状态初始化：携带合法秘钥确保从默认模型 gemini-3.8-flash 开始
  const initSelectRes = await fetch(`${BASE_URL}/api/spark/models/select`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ model: 'gemini-3.8-flash' })
  });
  assert.equal(initSelectRes.status, 200, '携带有效秘钥初始化模型应返回 200');

  // 1. 建立 SSE 实时监听通道
  console.log('\n[Step 1] 挂载原生 SSE 实时推流通道 (GET /api/spark/stream)...');
  const sseEvents = [];
  let sseReq = null;
  let resolveConnected = null;
  const connectedPromise = new Promise((resolve) => {
    resolveConnected = resolve;
  });

  sseReq = http.get(`${BASE_URL}/api/spark/stream`, (res) => {
    assert.equal(res.statusCode, 200, 'SSE 端点应返回 200');
    assert.ok(res.headers['content-type']?.includes('text/event-stream'), 'Content-Type 必须为 text/event-stream');

    res.on('data', (chunk) => {
      const text = chunk.toString();
      const lines = text.split('\n\n');
      for (const line of lines) {
        if (!line.trim() || line.startsWith(':')) continue; // 忽略保活心跳
        if (line.startsWith('data: ')) {
          try {
            const payload = JSON.parse(line.slice(6));
            sseEvents.push(payload);
            if (payload.type === 'CONNECTED') {
              resolveConnected?.(true);
            }
          } catch {
            // 忽略非 JSON 数据
          }
        }
      }
    });
  });

  // 防御性监听 error 事件，防止 destroy 抛出未捕获异常
  sseReq.on('error', () => {});

  try {
    // 事件驱动等待 SSE 握手就绪 (最多等待 3000ms)
    const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(false), 3000));
    const isHandshakeReady = await Promise.race([connectedPromise, timeoutPromise]);
    assert.ok(isHandshakeReady, 'SSE 握手应成功并收到 CONNECTED 事件');
    console.log('   ✅ SSE 通道握手成功，推流事件监听已就绪！');

    // 2. 验证模型查询接口
    console.log('\n[Step 2] 校验模型列表接口 (GET /api/spark/models)...');
    const modelsRes = await fetch(`${BASE_URL}/api/spark/models`);
    assert.equal(modelsRes.status, 200);
    const modelsData = await modelsRes.json();
    assert.equal(modelsData.code, 200);
    console.log(`   当前激活模型: [${modelsData.data.current}]`);
    console.log(`   可用认证模型: ${modelsData.data.available.map(m => m.name).join(', ')}`);
    assert.equal(modelsData.data.current, 'gemini-3.8-flash', '默认工作马必须为 gemini-3.8-flash');
    assert.ok(modelsData.data.available.some(m => m.id === 'gemini-3.8-flash'), '模型池必须包含 gemini-3.8-flash');
    assert.ok(modelsData.data.available.some(m => m.id === 'gemini-3.1-pro'), '模型池必须包含 gemini-3.1-pro');
    console.log('   ✅ 模型池与默认工作马校验通过！');

    // 3. 验证模型热切换与非法模型防御
    console.log('\n[Step 3] 校验模型热切换与非法模型防御 (POST /api/spark/models/select)...');
    
    // 3.1 尝试设置捏造的不存在模型 (如 gemini-3.8-pro) - 携带秘钥通过鉴权后由模型校验拦截
    const rejectRes = await fetch(`${BASE_URL}/api/spark/models/select`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ model: 'gemini-3.8-pro' })
    });
    assert.equal(rejectRes.status, 400, '设置不存在的模型必须返回 400');
    console.log('   ✅ 非法/捏造模型防御生效：拒绝 gemini-3.8-pro 并返回 400');

    // 3.2 热切换至候选模型 gemini-3.1-pro
    const switchProRes = await fetch(`${BASE_URL}/api/spark/models/select`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ model: 'gemini-3.1-pro' })
    });
    assert.equal(switchProRes.status, 200);
    const switchProData = await switchProRes.json();
    assert.equal(switchProData.data.model.id, 'gemini-3.1-pro');
    console.log('   ✅ 模型热切换成功：已即时激活 [Gemini 3.1 Pro]');

    // 4. 触发生产流并验证并发互斥保护
    console.log('\n[Step 4] 触发 Gemini Spark 生产流并校验并发互斥锁...');
    const testDate = '2026-09-25';

    // 4.1 发起生成请求
    const triggerPromise = fetch(`${BASE_URL}/api/spark/trigger-generate`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ date: testDate })
    });

    // 短暂等待生成互斥锁生效 (60ms)
    await new Promise(r => setTimeout(r, 60));

    // 4.2 并发重入测试：在生成期间立即再次触发，应当被互斥锁拦截并返回 409
    console.log('   测试并发防重互斥锁：触发并发请求...');
    const conflictRes = await fetch(`${BASE_URL}/api/spark/trigger-generate`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ date: testDate })
    });
    assert.equal(conflictRes.status, 409, '并发触发必须被互斥锁拦截并返回 409 Conflict');
    const conflictData = await conflictRes.json();
    console.log(`   ✅ 并发互斥拦截生效：HTTP 409 - ${conflictData.message}`);

    // 等待首个生成任务执行完成
    const triggerRes = await triggerPromise;
    assert.equal(triggerRes.status, 200, '生产流应正常返回 200');
    const triggerData = await triggerRes.json();
    assert.equal(triggerData.code, 200);
    console.log(`   ✅ [${testDate}] 简报生产闭环达成: 新闻总数=${triggerData.data.itemCount}, 使用模型=${triggerData.data.model}`);

    // 5. 校验 SSE 实时推流完整生命周期
    console.log('\n[Step 5] 检验 SSE 推流事件完整性...');
    // 等待可能延迟的 SSE 数据缓冲
    await new Promise(r => setTimeout(r, 200));

    const progressEvents = sseEvents.filter(e => e.type === 'PROGRESS');
    const completedEvents = sseEvents.filter(e => e.type === 'COMPLETED' || e.stage === 'COMPLETED');

    console.log(`   捕获 SSE 事件总数: ${sseEvents.length}`);
    console.log(`   进度事件序列: ${progressEvents.map(e => `${e.stage}(${e.progress}%)`).join(' -> ')}`);
    assert.ok(progressEvents.length >= 3, '应当捕获多阶段进度推流');
    assert.ok(completedEvents.length >= 1, '必须接收到 COMPLETED 完成事件');
    console.log('   ✅ SSE 5 阶段推流链路完整性验证通过！');

    // 6. 验证持久化与智库契约
    console.log('\n[Step 6] 检验落盘数据与智库合同契约 (Contract Audit)...');
    const newsRes = await fetch(`${BASE_URL}/api/news?date=${testDate}&pageSize=50`);
    assert.equal(newsRes.status, 200);
    const newsJson = await newsRes.json();
    const items = newsJson.data.items;

    console.log(`   获取归档资讯篇数: ${items.length} 篇`);
    assert.ok(items.length >= 8 && items.length <= 12, `资讯总量必须在 8 至 12 篇之间，实际为 ${items.length}`);

    const criticalItems = items.filter(i => i.impactLevel === 'critical');
    console.log(`   Critical Hero 头条篇数: ${criticalItems.length} 篇`);
    assert.equal(criticalItems.length, 1, '必须且仅有 1 篇 critical 头条');

    const climateItems = items.filter(i => i.category === 'climate');
    console.log(`   气候与能源情报篇数: ${climateItems.length} 篇`);
    assert.ok(climateItems.length >= 1 && climateItems.length <= 2, `气候情报篇数必须为 1 至 2 篇，实际为 ${climateItems.length}`);

    // 校验 NLP 情感极性与实体属性
    for (const item of items) {
      assert.ok(['positive', 'neutral', 'negative'].includes(item.sentiment), '情感极性必须为 positive/neutral/negative');
      assert.equal(typeof item.sentimentScore, 'number', '情感得分必须为数字');
      assert.ok(Array.isArray(item.nlpKeyEntities) && item.nlpKeyEntities.length > 0, 'NLP 实体必须为非空数组');
    }
    console.log('   ✅ 智库严谨契约检验 100% 达标！');

    console.log('\n===========================================================');
    console.log('🎉🎉🎉 Gemini Spark 智能体数据闭环与实时推流 E2E 验证全量通过！');
    console.log('===========================================================');
  } finally {
    // 始终切回默认 gemini-3.8-flash 并安全关闭 SSE 通道
    try {
      await fetch(`${BASE_URL}/api/spark/models/select`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ model: 'gemini-3.8-flash' })
      });
      console.log('   [Cleanup] 默认模型已复位为 gemini-3.8-flash');
    } catch {}
    sseReq?.destroy();
    if (localServer) {
      localServer.close();
      console.log('   [Cleanup] 内置网关服务已安全关闭');
    }
  }
}

main().catch((err) => {
  console.error('\n❌ E2E 验证遇到错误:', err);
  process.exit(1);
});

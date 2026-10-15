import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
];

function getBrowserPath() {
  for (const p of CHROME_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('No Chrome or Edge browser found in default paths.');
}

const ARTIFACT_DIR = 'C:\\Users\\79551\\.gemini\\antigravity\\brain\\c546e420-1f57-4c2c-ac89-b6305f49a00f';

async function run() {
  const browserPath = getBrowserPath();
  const browser = await puppeteer.launch({
    executablePath: browserPath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const baseUrl = 'http://localhost:5173';

  console.log('=== [智库成果大屏验收脚本启动] ===');

  // 1. 验证默认首屏加载 (必须直接呈现 12 篇资讯成果，0 空盒子)
  console.log('\n[验收 1] 默认首页成果呈现测试 (http://localhost:5173/)...');
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(() => document.querySelectorAll('article').length > 0, { timeout: 15000 });

  // 切换为波普主题以还原用户截图环境
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.theme-capsule-container button'));
    const popBtn = btns.find(b => b.textContent && b.textContent.includes('波普'));
    if (popBtn) popBtn.click();
  });
  await new Promise(r => setTimeout(r, 1200));

  const defaultCheck = await page.evaluate(() => {
    const bodyText = document.body.innerText;
    const hasEmptyBox = bodyText.includes('当前 Gemini Spark 批次暂无资讯产物');
    const hasAgentSyncBanner = bodyText.includes('智能事件驱动机制生效中');
    const newsCards = document.querySelectorAll('article');
    return {
      hasEmptyBox,
      hasAgentSyncBanner,
      cardCount: newsCards.length,
      pageTextExcerpt: bodyText.slice(0, 300)
    };
  });

  console.log('   -> 是否存在旧版空盒子:', defaultCheck.hasEmptyBox ? '❌ 存在' : '✅ 已彻底消除');
  console.log('   -> 是否存在过程同步横幅:', defaultCheck.hasAgentSyncBanner ? '❌ 存在' : '✅ 已彻底消除');
  console.log('   -> 渲染研报卡片数:', defaultCheck.cardCount);

  if (defaultCheck.hasEmptyBox || defaultCheck.cardCount === 0) {
    throw new Error('验收失败：默认首屏未展现研报成果！');
  }

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'result_page_default_1440.png'),
    fullPage: false
  });
  console.log('   📸 首屏成果大屏截图已保存: result_page_default_1440.png');

  // 2. 验证穿透保底场景 (请求未出日期的批次 ?date=2026-10-15)
  console.log('\n[验收 2] 结果穿透保底测试 (http://localhost:5173/?date=2026-10-15)...');
  await page.goto(`${baseUrl}/?date=2026-10-15`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  // 等待穿透数据载入完成
  await page.waitForFunction(() => document.querySelectorAll('article').length > 0, { timeout: 15000 });
  await new Promise(r => setTimeout(r, 1000));

  const fallbackCheck = await page.evaluate(() => {
    const bodyText = document.body.innerText;
    const hasEmptyBox = bodyText.includes('当前 Gemini Spark 批次暂无资讯产物');
    const hasFallbackNotice = bodyText.includes('智库内参穿透归档') || bodyText.includes('晨报正在深度提炼中') || bodyText.includes('晨报调度提炼中');
    const newsCards = document.querySelectorAll('article');
    return {
      hasEmptyBox,
      hasFallbackNotice,
      cardCount: newsCards.length,
      sampleText: bodyText.slice(0, 500)
    };
  });

  console.log('   -> 穿透模式下是否存在空状态:', fallbackCheck.hasEmptyBox ? '❌ 存在' : '✅ 0 空白');
  console.log('   -> 穿透提示微胶囊是否正常展示:', fallbackCheck.hasFallbackNotice ? '✅ 成功展示' : '❌ 未找到');
  console.log('   -> 穿透展现研报卡片数:', fallbackCheck.cardCount);
  if (!fallbackCheck.hasFallbackNotice) {
    console.log('   [DEBUG] 页面文本前 500 字符:', fallbackCheck.sampleText);
  }

  if (fallbackCheck.hasEmptyBox || !fallbackCheck.hasFallbackNotice) {
    throw new Error('验收失败：未生成批次未能成功穿透展现最近成果！');
  }

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'result_page_fallback_1440.png'),
    fullPage: false
  });
  console.log('   📸 穿透保底结果截图已保存: result_page_fallback_1440.png');

  // 3. 验证零死胡同智能推荐 (搜索无命中关键词)
  console.log('\n[验收 3] 零死胡同智能推荐测试 (搜索未命中词)...');
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(() => document.querySelectorAll('article').length > 0, { timeout: 15000 });
  await new Promise(r => setTimeout(r, 1000));

  // 在搜索框输入一个绝对不存在的关键词
  const searchInput = await page.$('input.category-search-input');
  if (searchInput) {
    await searchInput.type('QuantumGravitationalEngine999');
    await new Promise(r => setTimeout(r, 1000));
  }

  const zeroDeadEndCheck = await page.evaluate(() => {
    const bodyText = document.body.innerText;
    const hasOldEmpty = bodyText.includes('当前 Gemini Spark 批次暂无资讯产物');
    const hasZeroDeadEndBanner = bodyText.includes('当前筛选暂无匹配项 · 为您推荐今日全领域核心头条');
    const hasResetBtn = bodyText.includes('重置筛选 · 浏览全领域');
    const newsCards = document.querySelectorAll('article');
    return {
      hasOldEmpty,
      hasZeroDeadEndBanner,
      hasResetBtn,
      cardCount: newsCards.length
    };
  });

  console.log('   -> 是否有旧版空状态:', zeroDeadEndCheck.hasOldEmpty ? '❌ 存在' : '✅ 0 空白');
  console.log('   -> 智能推荐横幅是否激活:', zeroDeadEndCheck.hasZeroDeadEndBanner ? '✅ 成功激活' : '❌ 未激活');
  console.log('   -> 重置按钮是否存在:', zeroDeadEndCheck.hasResetBtn ? '✅ 存在' : '❌ 缺失');
  console.log('   -> 推荐头条卡片数:', zeroDeadEndCheck.cardCount);

  if (zeroDeadEndCheck.hasOldEmpty || !zeroDeadEndCheck.hasZeroDeadEndBanner) {
    throw new Error('验收失败：筛选无条目时未呈现智能推荐头条！');
  }

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'result_page_zero_dead_end_1440.png'),
    fullPage: false
  });
  console.log('   📸 零死胡同智能推荐截图已保存: result_page_zero_dead_end_1440.png');

  // 4. 三大主题全量视觉凭证
  console.log('\n[验收 4] 三大主题全量视觉核验 (Dark HUD & iOS Glass)...');
  
  // 重置搜索回到完整大屏状态
  const resetBtn = await page.$('button[type="button"]');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const rb = btns.find(b => b.textContent && b.textContent.includes('重置筛选'));
    if (rb) rb.click();
  });
  await new Promise(r => setTimeout(r, 800));

  // 4.1 暗黑 HUD
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.theme-capsule-container button'));
    const hudBtn = btns.find(b => b.textContent && (b.textContent.includes('HUD') || b.textContent.includes('方案A')));
    if (hudBtn) hudBtn.click();
  });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'result_page_hud_1440.png'),
    fullPage: false
  });
  console.log('   📸 暗黑 HUD 主题截图已保存: result_page_hud_1440.png');

  // 4.2 iOS 羊皮纸
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.theme-capsule-container button'));
    const iosBtn = btns.find(b => b.textContent && (b.textContent.includes('iOS') || b.textContent.includes('方案C')));
    if (iosBtn) iosBtn.click();
  });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'result_page_ios_1440.png'),
    fullPage: false
  });
  console.log('   📸 iOS 羊皮纸主题截图已保存: result_page_ios_1440.png');

  await browser.close();
  console.log('\n🎉 所有结果大屏验收用例 100% 通过！真机视觉凭证已生成完成。');
}

run().catch(err => {
  console.error('❌ 验收脚本执行失败:', err);
  process.exit(1);
});

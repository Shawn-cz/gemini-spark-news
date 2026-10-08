import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function run() {
  const browserPath = getBrowserPath();
  const browser = await puppeteer.launch({
    executablePath: browserPath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });

  console.log('[1/4] 测试已有缓存批次：访问 http://localhost:5173/ ...');
  // 确保初始状态为 COMPLETED
  await fetch('http://localhost:3001/api/spark/toggle-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date: '2026-09-24', status: 'COMPLETED' })
  });

  await page.goto('http://localhost:5173/?date=2026-09-24', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1200));

  // 验证已有缓存下直接呈现资讯大屏
  const hasRunningViewInitial = await page.evaluate(() => {
    return document.body.innerText.includes('简报正在自主生成中') || document.body.innerText.includes('GEMINI SPARK AGENT GENERATING');
  });
  const newsCardsCountInitial = await page.evaluate(() => {
    return document.querySelectorAll('article, .glass-card, [data-news-id]').length;
  });
  console.log(`   已有缓存直出结果: runningView存在=${hasRunningViewInitial}, 新闻卡片数量=${newsCardsCountInitial}`);
  
  const artifactDir = 'C:\\Users\\79551\\.gemini\\antigravity\\brain\\c546e420-1f57-4c2c-ac89-b6305f49a00f';
  await page.screenshot({ path: path.join(artifactDir, 'cached_direct_render.png') });
  console.log('   📸 已截图保存: cached_direct_render.png');

  // [2/4] 模拟未完成数据同步 (RUNNING 态)
  console.log('\n[2/4] 模拟数据同步未完成状态 (POST /api/spark/status/toggle -> RUNNING)...');
  await fetch('http://localhost:3001/api/spark/toggle-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date: '2026-09-24', status: 'RUNNING' })
  });

  await page.goto('http://localhost:5173/?date=2026-09-24', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));

  const runningText = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasRunning: text.includes('简报正在自主生成中') || text.includes('GEMINI SPARK AGENT GENERATING'),
      hasProgress: text.includes('全局流水线计算进度')
    };
  });
  console.log(`   运行中视图感知: hasRunning=${runningText.hasRunning}, hasProgress=${runningText.hasProgress}`);
  await page.screenshot({ path: path.join(artifactDir, 'running_progress_state.png') });
  console.log('   📸 已截图保存: running_progress_state.png');

  // [3/4] 模拟后端生成完成广播 (COMPLETED 态)，观察前端平滑冲刺至 100%
  console.log('\n[3/4] 触发后端生成完毕 (POST /api/spark/status/toggle -> COMPLETED)...');
  await fetch('http://localhost:3001/api/spark/toggle-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date: '2026-09-24', status: 'COMPLETED' })
  });

  // 抓取冲刺 100% 阶段 (在 850ms 过渡窗口内)
  await new Promise(r => setTimeout(r, 450));
  const sprintInfo = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      textContains100: text.includes('100%'),
      textContainsReady: text.includes('GEMINI SPARK BATCH READY') || text.includes('简报生成与归档完成'),
      doneBadges: Array.from(document.querySelectorAll('span')).filter(s => s.textContent?.includes('DONE')).length
    };
  });
  console.log('   冲刺阶段感知:', sprintInfo);
  await page.screenshot({ path: path.join(artifactDir, 'running_sprint_100_state.png') });
  console.log('   📸 已截图保存: running_sprint_100_state.png (100% 冲刺完成态)');

  // [4/4] 等待 850ms 缓冲期结束，验证平滑转入资讯卡片流
  console.log('\n[4/4] 等待过渡完成，验证平滑转入资讯卡片流...');
  await new Promise(r => setTimeout(r, 800));

  const afterTransition = await page.evaluate(() => {
    const text = document.body.innerText;
    const cards = document.querySelectorAll('article, .glass-card, [data-news-id], .bento-radar-widget').length;
    return {
      hasRunningNow: text.includes('简报正在自主生成中') || text.includes('GEMINI SPARK AGENT GENERATING'),
      cardsCount: cards
    };
  });
  console.log(`   最终过渡结果: hasRunningNow=${afterTransition.hasRunningNow}, cardsCount=${afterTransition.cardsCount}`);
  await page.screenshot({ path: path.join(artifactDir, 'transitioned_to_cards.png') });
  console.log('   📸 已截图保存: transitioned_to_cards.png');

  await browser.close();
  console.log('\n🎉 全流程闭环测试完成！');
}

run().catch((err) => {
  console.error('测试异常:', err);
  process.exit(1);
});

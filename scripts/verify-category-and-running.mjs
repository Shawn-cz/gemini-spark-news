import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';

const ARTIFACT_DIR = 'C:\\Users\\79551\\.gemini\\antigravity\\brain\\c546e420-1f57-4c2c-ac89-b6305f49a00f';

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
  throw new Error('No Chrome or Edge browser found.');
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: getBrowserPath(),
    headless: true,
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. 验证 Theme A 下 Category Bar (解决 Bento 重叠)
  console.log('[Verification] 校验 Theme A 下 Category Bar 与 Bento 按钮隔离...');
  await page.goto('http://localhost:5173/?date=2026-09-27', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.theme-capsule-container', { timeout: 10000 });
  await page.evaluate(() => {
    const btn = document.querySelector('.theme-capsule-container button[title*="方案A"]');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  const catBarBox = await page.evaluate(() => {
    const bar = document.querySelector('.category-scroll-container');
    const viewmode = document.querySelector('.viewmode-container');
    const lastBtn = document.querySelectorAll('.category-pill-btn')[5];
    return {
      bar: bar ? bar.getBoundingClientRect() : null,
      viewmode: viewmode ? viewmode.getBoundingClientRect() : null,
      lastBtn: lastBtn ? {
        text: lastBtn.innerText.replace(/\s+/g, ' ').trim(),
        rect: lastBtn.getBoundingClientRect()
      } : null
    };
  });
  console.log('Category Bar & ViewMode metrics:', JSON.stringify(catBarBox, null, 2));

  const pathA = path.join(ARTIFACT_DIR, 'category_bar_no_overlap_theme_a.png');
  await page.screenshot({ path: pathA });
  console.log('📸 已保存 Theme A 导航栏截图:', pathA);

  // 2. 验证 RunningStateView 进度条动态推进效果
  console.log('[Verification] 校验 RunningStateView 动态推进引擎...');
  // 切换 2026-09-27 状态为 RUNNING 以渲染真实 RunningStateView
  await fetch('http://localhost:3001/api/spark/toggle-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date: '2026-09-27', status: 'RUNNING' })
  });

  await page.goto('http://localhost:5173/?date=2026-09-27', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1500));

  // 截取初始进度
  const pathRun1 = path.join(ARTIFACT_DIR, 'running_progress_step1.png');
  await page.screenshot({ path: pathRun1 });
  console.log('📸 已保存 RunningStateView 阶段 1 截图:', pathRun1);

  // 等待 4 秒让动态进度引擎推进
  await new Promise(r => setTimeout(r, 4000));
  const pathRun2 = path.join(ARTIFACT_DIR, 'running_progress_step2.png');
  await page.screenshot({ path: pathRun2 });
  console.log('📸 已保存 RunningStateView 阶段 2 (已推进) 截图:', pathRun2);

  const progressData = await page.evaluate(() => {
    const textEl = document.querySelector('.running-progress-text');
    return textEl ? textEl.innerText.trim() : null;
  });
  console.log('Current Running Progress:', progressData);

  // 恢复状态为 COMPLETED
  await fetch('http://localhost:3001/api/spark/toggle-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date: '2026-09-27', status: 'COMPLETED' })
  });

  await browser.close();
})();

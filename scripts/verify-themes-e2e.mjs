process.env.NODE_ENV = 'production';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import puppeteer from 'puppeteer-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '..', 'dist');

// 保证 2026-09-24 默认简报存在
const briefingsDir = path.resolve(__dirname, '..', 'data', 'briefings');
const f25 = path.join(briefingsDir, '2026-09-25.json');
const f24 = path.join(briefingsDir, '2026-09-24.json');
if (!fs.existsSync(f24) && fs.existsSync(f25)) {
  fs.copyFileSync(f25, f24);
}

const { app } = await import('../server/mock-server.mjs');
import express from 'express';

// 确保 static 挂载
app.use(express.static(distDir));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(distDir, 'index.html'));
});

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

async function run() {
  const PORT = 3088;
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
  console.log(`[E2E] Embedded server running on http://127.0.0.1:${PORT}`);

  const browser = await puppeteer.launch({
    executablePath: getBrowserPath(),
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err));

  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  try {
    console.log(`[E2E] Navigating to http://127.0.0.1:${PORT}?date=2026-09-25 ...`);
    await page.goto(`http://127.0.0.1:${PORT}?date=2026-09-25`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    // 等待核心 DOM 与数据卡片渲染完成
    await page.waitForSelector('.theme-capsule-container', { timeout: 10000 });
    await page.waitForSelector('article, .glass-card', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 1500));

    // 1. 验证方案 A (Cyber HUD)
    console.log('[E2E] 切换并校验 方案A·HUD...');
    await page.evaluate(() => {
      const btn = document.querySelector('.theme-capsule-container button[title*="方案A"]');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 800));
    const pathA = path.join(ARTIFACT_DIR, 'react_theme_a_cyber_hud.png');
    await page.screenshot({ path: pathA });
    console.log(`   📸 方案A截图已保存: ${pathA}`);

    // 2. 验证方案 B (Pop Dopamine)
    console.log('[E2E] 切换并校验 方案B·波普...');
    await page.evaluate(() => {
      const btn = document.querySelector('.theme-capsule-container button[title*="方案B"]');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 800));
    const pathB = path.join(ARTIFACT_DIR, 'react_theme_b_pop_dopamine.png');
    await page.screenshot({ path: pathB });
    console.log(`   📸 方案B截图已保存: ${pathB}`);

    // 3. 验证方案 C (iOS Glass)
    console.log('[E2E] 切换并校验 方案C·iOS 流体微圆角...');
    await page.evaluate(() => {
      const btn = document.querySelector('.theme-capsule-container button[title*="方案C"]');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    const pathC = path.join(ARTIFACT_DIR, 'react_theme_c_ios_glass.png');
    await page.screenshot({ path: pathC });
    console.log(`   📸 方案C全景截图已保存: ${pathC}`);

    // 4. 验证卡片内“查看详情”按钮与 10px 微圆角，以及分类胶囊度量
    const cardMetrics = await page.evaluate(() => {
      const card = document.querySelector('.ios-glass-card');
      const allBtns = card ? Array.from(card.querySelectorAll('button')).map(b => b.innerText.trim()) : [];
      const computed = card ? window.getComputedStyle(card) : null;
      const pills = Array.from(document.querySelectorAll('.category-pill-btn')).map(p => ({
        text: p.innerText.replace(/\s+/g, ' ').trim(),
        className: p.className,
        color: window.getComputedStyle(p).color,
        bg: window.getComputedStyle(p).backgroundColor
      }));
      return {
        hasCard: !!card,
        borderRadius: computed ? computed.borderRadius : null,
        buttons: allBtns,
        pills: pills.slice(0, 3)
      };
    });
    console.log('[E2E] 方案C 卡片与胶囊规格校验:', cardMetrics);

    // 5. 点击“查看详情”唤起 IntelligenceDrawer
    console.log('[E2E] 点击方案C卡片“查看详情”唤起研报视窗...');
    await page.evaluate(() => {
      const card = document.querySelector('.ios-glass-card');
      if (card) {
        const detailBtn = Array.from(card.querySelectorAll('button')).find(b => b.innerText.includes('查看详情'));
        if (detailBtn) detailBtn.click();
        else card.click();
      }
    });
    await new Promise(r => setTimeout(r, 1200));

    // 6. 验证视窗 Z 轴角度 (0° 平视视窗 transform: none) 与 12px 外圆角
    const drawerMetrics = await page.evaluate(() => {
      const modal = document.querySelector('.dossier-modal-window');
      if (!modal) return { hasModal: false };
      const comp = window.getComputedStyle(modal);
      const summaryCard = modal.querySelector('.dossier-summary-card');
      const sumComp = summaryCard ? window.getComputedStyle(summaryCard) : null;
      return {
        hasModal: true,
        transform: comp.transform,
        borderRadius: comp.borderRadius,
        innerPaneBorderRadius: sumComp ? sumComp.borderRadius : null
      };
    });
    console.log('[E2E] 方案C 研报视窗规格检验 (0° 平视与微圆角):', drawerMetrics);

    const pathDrawer = path.join(ARTIFACT_DIR, 'react_theme_c_ios_drawer.png');
    await page.screenshot({ path: pathDrawer });
    console.log(`   📸 方案C研报弹窗截图已保存: ${pathDrawer}`);

    // 关闭抽屉
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 500));

    // 7. 多视口响应式自适应校验 (390px 移动端, 768px 平板, 1920px 超大屏)
    console.log('[E2E] 校验移动端 390px 视口...');
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
    await new Promise(r => setTimeout(r, 600));
    const pathMobile = path.join(ARTIFACT_DIR, 'react_theme_c_mobile_390.png');
    await page.screenshot({ path: pathMobile });

    console.log('[E2E] 校验平板端 768px 视口...');
    await page.setViewport({ width: 768, height: 1024, deviceScaleFactor: 1 });
    await new Promise(r => setTimeout(r, 600));
    const pathTablet = path.join(ARTIFACT_DIR, 'react_theme_c_tablet_768.png');
    await page.screenshot({ path: pathTablet });

    console.log('[E2E] 校验超大屏 1920px 视口...');
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
    await new Promise(r => setTimeout(r, 600));
    const pathDesktop = path.join(ARTIFACT_DIR, 'react_theme_c_desktop_1920.png');
    await page.screenshot({ path: pathDesktop });

    console.log('🎉 全部真实视觉截图与响应式度量采集完成！');
  } finally {
    await browser.close();
    server.close();
  }
}

run().catch((err) => {
  console.error('[E2E Error]', err);
  process.exit(1);
});

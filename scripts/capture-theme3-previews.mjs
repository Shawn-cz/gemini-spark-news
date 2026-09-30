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
  throw new Error('No Chrome or Edge browser found.');
}

async function capture() {
  const browserPath = getBrowserPath();
  const browser = await puppeteer.launch({
    executablePath: browserPath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1080, deviceScaleFactor: 1 });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  const htmlPath = 'C:/Users/79551/.gemini/antigravity/brain/c546e420-1f57-4c2c-ac89-b6305f49a00f/THEME_3_CANDIDATES_SHOWCASE.html';
  const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');

  console.log('正在加载原型文件:', fileUrl);
  await page.goto(fileUrl, { waitUntil: 'load', timeout: 30000 });
  await page.waitForFunction(() => typeof window.setTheme === 'function', { timeout: 15000 });
  await new Promise(r => setTimeout(r, 1500));

  const outDir = 'C:/Users/79551/.gemini/antigravity/brain/c546e420-1f57-4c2c-ac89-b6305f49a00f';

  // 1. 截取方案 A: 赛博战术 HUD · 裸眼 3D 原生全息投影沙盘 (全景 3D 卡盘流)
  console.log('截取方案 A: 赛博战术 HUD (全景原生 3D 全息投影沙盘)...');
  await page.evaluate(() => {
    window.setTheme('cyber-hud');
    window.toggleRadarPulse();
  });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outDir, 'theme3_cyber_hud_preview.png'), fullPage: false });

  // 2. 截取方案 A: 原生 3D 全息沙盘第一张卡片 Hover 视差与光束扫描聚焦特写
  console.log('截取方案 A: 原生 3D 全息卡盘特写 (底座平躺 + 光束贯穿 + 文字立姿浮空)...');
  await page.hover('#holo-card-1 .crosshair-container');
  await page.evaluate(() => {
    window.triggerHoloScan(1);
  });
  await new Promise(r => setTimeout(r, 800));
  const card1 = await page.$('#holo-card-1');
  if (card1) {
    await card1.screenshot({ path: path.join(outDir, 'theme3_cyber_dossier_preview.png') });
  } else {
    await page.screenshot({ path: path.join(outDir, 'theme3_cyber_dossier_preview.png'), fullPage: false });
  }

  // 3. 截取方案 C: 街机关卡通报 (展现投币 +1 CREDIT、STAGE CLEAR 通关印章、BULL VS BEAR 对决槽)
  console.log('截取方案 C: 街机关卡通报 (含投币与 STAGE CLEAR 印章)...');
  await page.evaluate(() => {
    window.setTheme('arcade-quest');
    window.insertCoin();
    window.clearMission(1);
  });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outDir, 'theme3_arcade_quest_preview.png'), fullPage: false });

  // 4. 截取方案 B: 波普潮玩多巴胺
  console.log('截取方案 B: 波普潮玩多巴胺...');
  await page.evaluate(() => window.setTheme('pop-dopamine'));
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, 'theme3_pop_dopamine_preview.png'), fullPage: false });

  await browser.close();
  console.log('✅ 全部深度互动真机高清截图捕获完成！');
}

capture().catch(err => {
  console.error('截图捕获失败:', err);
  process.exit(1);
});

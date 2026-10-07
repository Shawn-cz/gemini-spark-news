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
  await page.goto(fileUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const localTailwindPath = path.join(__dirname, 'tailwindcss.cdn.js');
  if (fs.existsSync(localTailwindPath)) {
    await page.addScriptTag({ path: localTailwindPath });
  }
  await page.waitForFunction(() => typeof window.setTheme === 'function', { timeout: 20000 });
  await new Promise(r => setTimeout(r, 1500));

  const outDir = 'C:/Users/79551/.gemini/antigravity/brain/c546e420-1f57-4c2c-ac89-b6305f49a00f';

  // 1. 截取方案 A: 赛博战术 HUD · 首页清爽情报信息流 (包含点击启动 3D 全息投影入口)
  console.log('截取方案 A: 赛博战术 HUD (首页情报流)...');
  await page.evaluate(() => {
    window.setTheme('cyber-hud');
    window.toggleRadarPulse();
  });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outDir, 'theme3_cyber_hud_preview.png'), fullPage: false });

  // 2. 截取方案 A: 点击资讯概要后展开的【裸眼 3D 原生全息投影资讯内容生成视窗】
  console.log('截取方案 A: 3D 全息研报视窗 - 动态生成中瞬间 (光束上冲、窗格级联实体化、激光扫射、文字流式解码)...');
  await page.evaluate(() => {
    window.openHoloDossier(1);
  });
  // 等待 260ms，捕获正在级联生成、激光扫描与文字流式解码的瞬间
  await new Promise(r => setTimeout(r, 260));
  await page.screenshot({ path: path.join(outDir, 'theme3_holo_generating_flow.png'), fullPage: false });

  // 等待动画全部完成并稳定进入交互态 (850ms 之后即已全部完成)
  await new Promise(r => setTimeout(r, 1100));
  await page.screenshot({ path: path.join(outDir, 'theme3_holo_dossier_modal_preview.png'), fullPage: false });

  // 关闭全息视窗返回主页
  await page.evaluate(() => {
    window.closeHoloDossier();
  });
  await new Promise(r => setTimeout(r, 500));

  // 3. 截取方案 B: 波普潮玩多巴胺
  console.log('截取方案 B: 波普潮玩多巴胺...');
  await page.evaluate(() => window.setTheme('pop-dopamine'));
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, 'theme3_pop_dopamine_preview.png'), fullPage: false });

  // 4. 截取方案 C: 白色 iOS 流体透明玻璃 (首页工作台)
  console.log('截取方案 C: 白色 iOS 流体透明玻璃 (首页工作台)...');
  await page.evaluate(() => {
    window.setTheme('ios-glass');
    window.setGlassAtmosphere('mist');
  });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outDir, 'theme3_ios_glass_preview.png'), fullPage: false });

  // 5. 截取方案 C: 白色 iOS 流体透明玻璃 (Apple VisionOS 深度研报弹窗)
  console.log('截取方案 C: 白色 iOS 流体透明玻璃 (Apple VisionOS 深度研报弹窗)...');
  await page.evaluate(() => {
    window.openGlassDossier(1);
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, 'theme3_ios_glass_modal_preview.png'), fullPage: false });
  await page.evaluate(() => window.closeGlassDossier());
  await new Promise(r => setTimeout(r, 400));

  await browser.close();
  console.log('✅ 全部深度互动真机高清截图捕获完成！');
}

capture().catch(err => {
  console.error('截图捕获失败:', err);
  process.exit(1);
});

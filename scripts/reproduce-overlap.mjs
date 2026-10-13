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

async function run() {
  const browser = await puppeteer.launch({
    executablePath: getBrowserPath(),
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const artifactDir = 'C:\\Users\\79551\\.gemini\\antigravity\\brain\\c546e420-1f57-4c2c-ac89-b6305f49a00f';

  // 1. 测试 1146px 中屏视口
  await page.setViewport({ width: 1146, height: 850, deviceScaleFactor: 1 });
  await page.goto('http://localhost:5173/?date=2026-09-24', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1200));

  // 1.1 方案 A (Cyber HUD) - 1146px
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.theme-capsule-container button'));
    if (btns[0]) btns[0].click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(artifactDir, 'header_overlap_theme_a_1146.png') });
  console.log('📸 截图完成: header_overlap_theme_a_1146.png');

  // 1.2 方案 B (波普潮玩) - 1146px
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.theme-capsule-container button'));
    if (btns[1]) btns[1].click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(artifactDir, 'header_overlap_theme_b_1146.png') });
  console.log('📸 截图完成: header_overlap_theme_b_1146.png');

  // 1.3 方案 C (iOS Glass) - 1146px
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.theme-capsule-container button'));
    if (btns[2]) btns[2].click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(artifactDir, 'header_overlap_theme_c_1146.png') });
  console.log('📸 截图完成: header_overlap_theme_c_1146.png');

  // 2. 测试 1440px 桌面大屏排布 (方案 B)
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.theme-capsule-container button'));
    if (btns[1]) btns[1].click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(artifactDir, 'header_desktop_theme_b_1440.png') });
  console.log('📸 截图完成: header_desktop_theme_b_1440.png');

  // 3. 测试 390px 移动端窄屏排布 (方案 B)
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.theme-capsule-container button'));
    if (btns[1]) btns[1].click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(artifactDir, 'header_mobile_theme_b_390.png') });
  console.log('📸 截图完成: header_mobile_theme_b_390.png');

  // 4. 测试 390px 移动端窄屏排布 (方案 A)
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.theme-capsule-container button'));
    if (btns[0]) btns[0].click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(artifactDir, 'header_mobile_theme_a_390.png') });
  console.log('📸 截图完成: header_mobile_theme_a_390.png');

  // 5. 测试 390px 移动端窄屏排布 (方案 C)
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.theme-capsule-container button'));
    if (btns[2]) btns[2].click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(artifactDir, 'header_mobile_theme_c_390.png') });
  console.log('📸 截图完成: header_mobile_theme_c_390.png');

  await browser.close();
}

run().catch(console.error);

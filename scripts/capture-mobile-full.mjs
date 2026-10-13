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

  // 手机端真实视口：390x844 (iPhone 14/15 逻辑分辨率，2x 视网膜清晰度)
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto('http://localhost:5173/?date=2026-09-24', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1200));

  // 1. 方案 B (高能波普) 手机端全景
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.theme-capsule-container button'));
    if (btns[1]) btns[1].click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(artifactDir, 'mobile_theme_b_full.png') });
  console.log('📸 截图完成: mobile_theme_b_full.png');

  // 2. 方案 A (赛博 HUD) 手机端全景
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.theme-capsule-container button'));
    if (btns[0]) btns[0].click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(artifactDir, 'mobile_theme_a_full.png') });
  console.log('📸 截图完成: mobile_theme_a_full.png');

  // 3. 方案 C (白色 iOS Glass) 手机端全景
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.theme-capsule-container button'));
    if (btns[2]) btns[2].click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(artifactDir, 'mobile_theme_c_full.png') });
  console.log('📸 截图完成: mobile_theme_c_full.png');

  // 4. 点击第一张卡片打开移动端详情抽屉
  const firstCard = await page.$('.bento-item-hero, .bento-item-subhero, .group.cursor-pointer');
  if (firstCard) {
    await firstCard.click();
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(artifactDir, 'mobile_drawer_opened.png') });
    console.log('📸 截图完成: mobile_drawer_opened.png');
  }

  await browser.close();
}

run().catch(console.error);

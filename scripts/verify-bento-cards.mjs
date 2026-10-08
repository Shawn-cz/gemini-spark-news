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

  await page.goto('http://localhost:5173/?date=2026-10-08', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.theme-capsule-container', { timeout: 10000 });
  await page.evaluate(() => {
    const btn = document.querySelector('.theme-capsule-container button[title*="方案A"]');
    if (btn) btn.click();
  });
  console.log('Waiting for data to load from MongoDB Atlas...');
  await page.waitForFunction(() => {
    const el = document.querySelector('.category-pill-btn');
    return el && el.innerText.includes('12');
  }, { timeout: 15000 }).catch(() => console.log('Timeout waiting for 12, taking screenshot anyway'));

  await new Promise(r => setTimeout(r, 1000));

  // 截取完整卡片视窗
  const pathA = path.join(ARTIFACT_DIR, 'bento_cards_full_theme_a.png');
  await page.screenshot({ path: pathA });
  console.log('📸 已保存 Theme A 完整卡片大屏截图:', pathA);

  await browser.close();
})();

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
  throw new Error('No Chrome or Edge browser found.');
}

async function run() {
  const browser = await puppeteer.launch({
    executablePath: getBrowserPath(),
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const artifactDir = 'C:\\Users\\79551\\.gemini\\antigravity\\brain\\c546e420-1f57-4c2c-ac89-b6305f49a00f';

  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto('http://localhost:5173/NOBEL_QUOTE_HEADER_SHOWCASE.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 800));

  // 1. 方案 A: 右侧控制区 (强烈推荐) - 日期胶囊移至右侧，与主题、DevTools紧挨，Row 1 左右无空白
  await page.evaluate(() => {
    window.setTheme('pop-dopamine');
    window.setLayoutMode('flow');
    window.setDatePosition('right-toolbar');
  });
  await new Promise(r => setTimeout(r, 400));
  const headerA = await page.$('#app-header');
  if (headerA) {
    await headerA.screenshot({ path: path.join(artifactDir, 'date_solution_a_right.png') });
    console.log('📸 截图完成: date_solution_a_right.png');
  }

  // 2. 方案 B: 紧随左侧品牌 (报刊出版物刊期模式)
  await page.evaluate(() => {
    window.setDatePosition('left-brand');
  });
  await new Promise(r => setTimeout(r, 400));
  const headerB = await page.$('#app-header');
  if (headerB) {
    await headerB.screenshot({ path: path.join(artifactDir, 'date_solution_b_left.png') });
    console.log('📸 截图完成: date_solution_b_left.png');
  }

  // 3. 方案 C: 下沉至分类筛选栏 (包含 Header + Main 分类条全景)
  await page.evaluate(() => {
    window.setDatePosition('filter-bar');
  });
  await new Promise(r => setTimeout(r, 400));
  const frameC = await page.$('#theme-frame');
  if (frameC) {
    await frameC.screenshot({ path: path.join(artifactDir, 'date_solution_c_filter.png') });
    console.log('📸 截图完成: date_solution_c_filter.png');
  }

  // 4. 原版现状对比: 居中浮空
  await page.evaluate(() => {
    window.setDatePosition('center');
  });
  await new Promise(r => setTimeout(r, 400));
  const headerOrig = await page.$('#app-header');
  if (headerOrig) {
    await headerOrig.screenshot({ path: path.join(artifactDir, 'date_solution_orig_center.png') });
    console.log('📸 截图完成: date_solution_orig_center.png');
  }

  // 恢复默认方案 A
  await page.evaluate(() => window.setDatePosition('right-toolbar'));

  await browser.close();
  console.log('🎉 所有日期方案对比截图生成完成！');
}

run().catch(console.error);

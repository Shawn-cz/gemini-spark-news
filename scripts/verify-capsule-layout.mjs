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
  // 按照用户截图的精确屏幕宽度 1146px 测试
  await page.setViewport({ width: 1146, height: 800, deviceScaleFactor: 1 });

  console.log('正在访问生产环境 https://www.shawn-news.top ...');
  await page.goto('https://www.shawn-news.top', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  // 切换到用户截图中的“淡色 (Light)”主题
  await page.evaluate(() => {
    const btn = document.querySelector('.theme-capsule-container button[title*="羊皮纸"]');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // 测量两组胶囊的绝对屏幕位置
  const metrics = await page.evaluate(() => {
    const categoryBtns = Array.from(document.querySelectorAll('.category-pill-btn'));
    const lastCategoryBtn = categoryBtns[categoryBtns.length - 1]; // "我的收藏"
    const viewmodeContainer = document.querySelector('.viewmode-container');

    if (!lastCategoryBtn || !viewmodeContainer) {
      return { error: '未找到元素' };
    }

    const r1 = lastCategoryBtn.getBoundingClientRect();
    const r2 = viewmodeContainer.getBoundingClientRect();

    return {
      lastCategoryText: lastCategoryBtn.innerText.trim(),
      lastCategoryRight: r1.right,
      viewmodeLeft: r2.left,
      clearance: r2.left - r1.right,
      isOverlapping: r1.right > r2.left
    };
  });

  console.log('布局测算结果:', metrics);

  const screenshotPath = path.resolve(__dirname, '../screenshots/capsule-fix-verification.png');
  await page.screenshot({ path: screenshotPath });
  console.log(`截图已保存至: ${screenshotPath}`);

  await browser.close();
  if (metrics.isOverlapping) {
    console.error('❌ 仍然存在重叠！');
    process.exit(1);
  } else {
    console.log(`✅ 胶囊完全分离！间距清晰剩余: ${metrics.clearance}px！`);
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

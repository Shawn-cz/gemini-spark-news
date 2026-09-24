import puppeteer from 'puppeteer-core';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1080 });

  // 1. 确保状态为 COMPLETED
  await fetch('http://localhost:3001/api/spark/toggle-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date: '2026-09-24', status: 'COMPLETED' })
  });

  console.log('Navigating to Bento view...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'screenshot_bento.png', fullPage: false });
  console.log('Saved screenshot_bento.png');

  // 2. 点击进入 Matrix 四象限视图
  console.log('Switching to Matrix view...');
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('四象限流')) {
      await btn.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'screenshot_matrix.png', fullPage: false });
  console.log('Saved screenshot_matrix.png');

  // 3. 点击进入 Timeline 24H 轨迹视图
  console.log('Switching to Timeline view...');
  const buttons2 = await page.$$('button');
  for (const btn of buttons2) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('24H 时空轨迹')) {
      await btn.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'screenshot_timeline.png', fullPage: false });
  console.log('Saved screenshot_timeline.png');

  // 4. 打开第一张卡片的 NLP 深度抽屉
  console.log('Opening Intelligence Drawer...');
  const firstCard = await page.$('article');
  if (firstCard) {
    await firstCard.click();
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: 'screenshot_drawer.png', fullPage: false });
    console.log('Saved screenshot_drawer.png');
  }

  await browser.close();
  console.log('All 4 global intelligence screenshots captured successfully!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

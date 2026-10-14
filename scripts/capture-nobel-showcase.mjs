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

  // 1. 桌面视口: 1440x900
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto('http://localhost:5173/NOBEL_QUOTE_HEADER_SHOWCASE.html', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1200));

  // 1.1 短句测试：鲍勃·迪伦 (15字) - 捕获特写并测量高度
  await page.evaluate(() => {
    window.setTheme('pop-dopamine');
    window.setQuoteIndex(4); // 鲍勃·迪伦
  });
  await new Promise(r => setTimeout(r, 500));
  
  const dylanMeasurements = await page.evaluate(() => {
    const qBox = document.getElementById('nobel-quote-capsule').getBoundingClientRect();
    const pBox = document.getElementById('sentiment-pulse-capsule').getBoundingClientRect();
    const dBox = document.getElementById('date-stepper-capsule').getBoundingClientRect();
    return { quoteHeight: qBox.height, pulseHeight: pBox.height, dateHeight: dBox.height };
  });
  console.log(`[Dylan 短句高度校验] 诺奖名言高度: ${dylanMeasurements.quoteHeight}px, 情绪脉搏高度: ${dylanMeasurements.pulseHeight}px, 日期胶囊高度: ${dylanMeasurements.dateHeight}px`);

  const headerOnlyDylan = await page.$('#app-header');
  if (headerOnlyDylan) {
    await headerOnlyDylan.screenshot({ path: path.join(artifactDir, 'nobel_quote_short_dylan.png') });
    console.log('📸 截图完成: nobel_quote_short_dylan.png');
  }

  // 1.2 长句测试：加西亚·马尔克斯 (46字超长句 - 用户的关键反馈用例) - 捕获特写并测量高度
  await page.evaluate(() => {
    window.setQuoteIndex(1); // 马尔克斯《百年孤独》
  });
  await new Promise(r => setTimeout(r, 500));

  const marquezMeasurements = await page.evaluate(() => {
    const qBox = document.getElementById('nobel-quote-capsule').getBoundingClientRect();
    const pBox = document.getElementById('sentiment-pulse-capsule').getBoundingClientRect();
    const dBox = document.getElementById('date-stepper-capsule').getBoundingClientRect();
    return { quoteHeight: qBox.height, pulseHeight: pBox.height, dateHeight: dBox.height };
  });
  console.log(`[Marquez 长句高度校验] 诺奖名言高度: ${marquezMeasurements.quoteHeight}px, 情绪脉搏高度: ${marquezMeasurements.pulseHeight}px, 日期胶囊高度: ${marquezMeasurements.dateHeight}px`);

  const headerOnlyMarquez = await page.$('#app-header');
  if (headerOnlyMarquez) {
    await headerOnlyMarquez.screenshot({ path: path.join(artifactDir, 'nobel_quote_long_marquez.png') });
    console.log('📸 截图完成: nobel_quote_long_marquez.png');
  }

  // 1.2.1 方案1特写: 作者紧随名言 (彻底消除红框空白)
  await page.evaluate(() => {
    window.setQuoteIndex(1); // 马尔克斯
    window.setLayoutMode('flow');
  });
  await new Promise(r => setTimeout(r, 400));
  const headerFlow = await page.$('#app-header');
  if (headerFlow) {
    await headerFlow.screenshot({ path: path.join(artifactDir, 'nobel_quote_solution1_flow.png') });
    console.log('📸 截图完成: nobel_quote_solution1_flow.png');
  }

  // 1.2.2 方案2特写: 宽屏双语对照 (英文原著填补空白)
  await page.evaluate(() => {
    window.setLayoutMode('bilingual');
  });
  await new Promise(r => setTimeout(r, 400));
  const headerBi = await page.$('#app-header');
  if (headerBi) {
    await headerBi.screenshot({ path: path.join(artifactDir, 'nobel_quote_solution2_bilingual.png') });
    console.log('📸 截图完成: nobel_quote_solution2_bilingual.png');
  }

  // 1.2.3 方案3特写: 原版两端对齐 (红框空白现状对比)
  await page.evaluate(() => {
    window.setLayoutMode('split');
  });
  await new Promise(r => setTimeout(r, 400));
  const headerSplit = await page.$('#app-header');
  if (headerSplit) {
    await headerSplit.screenshot({ path: path.join(artifactDir, 'nobel_quote_solution3_split.png') });
    console.log('📸 截图完成: nobel_quote_solution3_split.png');
  }

  // 恢复推荐的方案1
  await page.evaluate(() => window.setLayoutMode('flow'));

  // 1.3 方案 B: 高能波普 (默认加缪)
  await page.evaluate(() => {
    window.currentQuoteIndex = 0;
    window.updateQuoteUI();
  });
  await new Promise(r => setTimeout(r, 400));
  const headerElemB = await page.$('#theme-frame');
  if (headerElemB) {
    await headerElemB.screenshot({ path: path.join(artifactDir, 'nobel_quote_theme_b_1440.png') });
    console.log('📸 截图完成: nobel_quote_theme_b_1440.png');
  }

  // 1.4 方案 A: 赛博 HUD
  await page.evaluate(() => window.setTheme('cyber-hud'));
  await new Promise(r => setTimeout(r, 500));
  const headerElemA = await page.$('#theme-frame');
  if (headerElemA) {
    await headerElemA.screenshot({ path: path.join(artifactDir, 'nobel_quote_theme_a_1440.png') });
    console.log('📸 截图完成: nobel_quote_theme_a_1440.png');
  }

  // 1.5 方案 C: iOS 流体玻璃
  await page.evaluate(() => window.setTheme('ios-glass'));
  await new Promise(r => setTimeout(r, 500));
  const headerElemC = await page.$('#theme-frame');
  if (headerElemC) {
    await headerElemC.screenshot({ path: path.join(artifactDir, 'nobel_quote_theme_c_1440.png') });
    console.log('📸 截图完成: nobel_quote_theme_c_1440.png');
  }

  // 1.6 顶栏统一高度整体特写
  await page.evaluate(() => window.setTheme('pop-dopamine'));
  await new Promise(r => setTimeout(r, 400));
  const headerOnly = await page.$('#app-header');
  if (headerOnly) {
    await headerOnly.screenshot({ path: path.join(artifactDir, 'nobel_quote_header_closeup.png') });
    console.log('📸 截图完成: nobel_quote_header_closeup.png');
  }

  // 2. 笔记本视口: 1146px (挤压敏感区测试)
  await page.setViewport({ width: 1146, height: 800, deviceScaleFactor: 2 });
  await page.evaluate(() => {
    window.setTheme('pop-dopamine');
    // 在笔记本视口测试超长句马尔克斯
    window.currentQuoteIndex = 1;
    window.updateQuoteUI();
  });
  await new Promise(r => setTimeout(r, 500));
  const frame1146 = await page.$('#theme-frame');
  if (frame1146) {
    await frame1146.screenshot({ path: path.join(artifactDir, 'nobel_quote_theme_b_1146.png') });
    console.log('📸 截图完成: nobel_quote_theme_b_1146.png');
  }

  // 3. 移动端视口: 390px (iPhone 视口全真机模拟)
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.evaluate(() => {
    window.setTheme('pop-dopamine');
    const controlBar = document.querySelector('.bg-slate-950\\/90');
    if (controlBar) controlBar.style.display = 'none';
    const parent = document.getElementById('sandbox-viewport')?.parentElement;
    if (parent) {
      parent.style.padding = '0';
      parent.style.background = 'transparent';
    }
    const frame = document.getElementById('theme-frame');
    if (frame) {
      frame.style.borderRadius = '0';
      frame.style.borderWidth = '0 0 2px 0';
    }
  });
  await new Promise(r => setTimeout(r, 600));
  const frame390 = await page.$('#theme-frame');
  if (frame390) {
    await frame390.screenshot({ path: path.join(artifactDir, 'nobel_quote_mobile_390.png') });
    console.log('📸 截图完成: nobel_quote_mobile_390.png');
  }

  await browser.close();
  console.log('🎉 所有排版效果凭证截图全部生成成功！');
}

run().catch(console.error);

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

const ARTIFACT_DIR = 'C:\\Users\\79551\\.gemini\\antigravity\\brain\\c546e420-1f57-4c2c-ac89-b6305f49a00f';

async function run() {
  const browserPath = getBrowserPath();
  const browser = await puppeteer.launch({
    executablePath: browserPath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const baseUrl = 'http://localhost:5173';

  console.log('1. 正在访问本地开发服务器:', baseUrl);
  await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  // 1. 桌面端 1440px 验证 (方案 B 波普潮玩)
  console.log('2. 桌面端 1440px 验证 (方案 B 波普潮玩)...');
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  
  // 切换为波普主题
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.theme-capsule-container button'));
    const popBtn = btns.find(b => b.textContent && b.textContent.includes('波普'));
    if (popBtn) popBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'scheme_c_pop_1440.png'),
    fullPage: false
  });
  console.log('   📸 方案 C 波普桌面端截图保存成功: scheme_c_pop_1440.png');

  // 2. 测量顶栏高度一致性与排版规范
  const headerMetrics = await page.evaluate(() => {
    const quoteCapsule = document.querySelector('header .max-w-7xl > div > div:nth-child(2) > div:first-child');
    const pulseCapsule = document.querySelector('.header-sentiment-capsule');
    const devtoolsBtn = document.querySelector('.header-btn-devtools');
    const categoryDateStepper = document.querySelector('.date-stepper-capsule');

    return {
      quoteHeight: quoteCapsule ? quoteCapsule.getBoundingClientRect().height : null,
      pulseHeight: pulseCapsule ? pulseCapsule.getBoundingClientRect().height : null,
      devtoolsHeight: devtoolsBtn ? devtoolsBtn.getBoundingClientRect().height : null,
      hasDateStepper: !!categoryDateStepper,
      quoteText: quoteCapsule ? quoteCapsule.innerText.replace(/\s+/g, ' ') : null
    };
  });
  console.log('   📊 顶栏度量衡与高度测量:', headerMetrics);

  // 3. 测试点击“🎲 换一句名言”微交互
  console.log('3. 测试点击 🎲 换一句名言...');
  const beforeQuote = headerMetrics.quoteText;
  await page.evaluate(() => {
    const dice = document.querySelector('header button[aria-label="换一句诺贝尔文学奖名言"]');
    if (dice) dice.click();
  });
  await new Promise(r => setTimeout(r, 800));

  const afterQuote = await page.evaluate(() => {
    const quoteCapsule = document.querySelector('header .max-w-7xl > div > div:nth-child(2) > div:first-child');
    return quoteCapsule ? quoteCapsule.innerText.replace(/\s+/g, ' ') : null;
  });
  console.log(`   🎲 换句前: ${beforeQuote}`);
  console.log(`   🎲 换句后: ${afterQuote}`);

  // 4. 切换为暗色 HUD 主题 (赛博战术) 1146px 视口
  console.log('4. 笔记本 1146px 视口验证 (方案 A 赛博 HUD)...');
  await page.setViewport({ width: 1146, height: 800, deviceScaleFactor: 1 });
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.theme-capsule-container button'));
    const hudBtn = btns.find(b => b.textContent && b.textContent.includes('HUD'));
    if (hudBtn) hudBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'scheme_c_hud_1146.png'),
    fullPage: false
  });
  console.log('   📸 方案 C HUD 1146px 截图保存成功: scheme_c_hud_1146.png');

  // 5. 切换为 iOS Glass / Light 羊皮纸白底主题 1440px
  console.log('5. 桌面端 1440px 验证 (方案 C iOS 流体微圆角 / 羊皮纸白底)...');
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.theme-capsule-container button'));
    const iosBtn = btns.find(b => b.textContent && b.textContent.includes('iOS'));
    if (iosBtn) iosBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'scheme_c_ios_1440.png'),
    fullPage: false
  });
  console.log('   📸 方案 C iOS 1440px 截图保存成功: scheme_c_ios_1440.png');

  // 6. 验证分类栏日期步进器下拉浮层 (Scheme C 交互展开)
  console.log('6. 测试展开分类栏中的日期步进器历史下拉菜单...');
  const clicked = await page.evaluate(() => {
    const dateBtn = document.querySelector('.stepper-btn-date');
    if (dateBtn) {
      dateBtn.click();
      return true;
    }
    return false;
  });
  console.log('   🖱️ 点击日期按钮结果:', clicked);
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'scheme_c_date_dropdown.png'),
    clip: { x: 0, y: 70, width: 650, height: 400 }
  });
  console.log('   📸 方案 C 日期下拉菜单展开截图: scheme_c_date_dropdown.png');

  // 收起下拉菜单
  await page.evaluate(() => {
    const dateBtn = document.querySelector('.stepper-btn-date');
    if (dateBtn) dateBtn.click();
  });
  await new Promise(r => setTimeout(r, 300));

  // 7. 移动端 390px 极窄视口验证
  console.log('7. 移动端 390px 极窄视口验证...');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true });
  await new Promise(r => setTimeout(r, 1500));

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'scheme_c_mobile_390.png'),
    fullPage: false
  });
  console.log('   📸 方案 C 移动端 390px 截图保存成功: scheme_c_mobile_390.png');

  // 8. 特写截图：顶栏 Header 与 分类筛选栏联动特写 (1440px 波普)
  console.log('8. 捕获 Header 与 CategoryBar 核心特写...');
  await page.setViewport({ width: 1440, height: 500, deviceScaleFactor: 1 });
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.theme-capsule-container button'));
    const popBtn = btns.find(b => b.textContent && b.textContent.includes('波普'));
    if (popBtn) popBtn.click();
  });
  await new Promise(r => setTimeout(r, 1200));

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'scheme_c_header_closeup.png'),
    clip: { x: 0, y: 0, width: 1440, height: 260 }
  });
  console.log('   📸 方案 C 顶栏特写截图保存成功: scheme_c_header_closeup.png');

  await browser.close();
  console.log('\n🎉 所有多视口与多主题视觉凭证已全部采集完毕！');
}

run().catch(err => {
  console.error('❌ 执行验证异常:', err);
  process.exit(1);
});

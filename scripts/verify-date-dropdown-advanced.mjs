import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import assert from 'assert';

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

/**
 * 辅助函数：精准截取下拉浮层及周边呼吸区
 */
async function captureDropdown(page, filename) {
  const box = await page.evaluate(() => {
    const el = document.querySelector('.date-stepper-dropdown');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });

  if (!box) {
    throw new Error('未找到 .date-stepper-dropdown 元素');
  }

  const padding = 16;
  const clip = {
    x: Math.max(0, Math.floor(box.x - padding)),
    y: Math.max(0, Math.floor(box.y - padding)),
    width: Math.ceil(box.width + padding * 2),
    height: Math.ceil(box.height + padding * 2)
  };

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, filename),
    clip
  });
  console.log(`   📸 精准截图保存成功: ${filename} (尺寸: ${clip.width}x${clip.height})`);
}

async function ensureDropdownOpen(page) {
  const hasDropdown = await page.$('.date-stepper-dropdown');
  if (!hasDropdown) {
    await page.waitForFunction(() => {
      const btn = document.querySelector('.stepper-btn-date');
      return btn && !btn.disabled;
    }, { timeout: 10000 });
    await page.click('.stepper-btn-date');
    await page.waitForSelector('.date-stepper-dropdown', { timeout: 5000 });
    await new Promise(r => setTimeout(r, 400));
  }
}

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

  // ==========================================
  // 测试场景 1: 波普潮玩主题 1440px 下拉浮层默认展开 (全部批次第 1 页，6 条)
  // ==========================================
  console.log('\n2. 测试场景 1: 波普主题 1440px 视口 - 展开日期下拉浮层...');
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  // 切换为波普主题
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.theme-capsule-container button'));
    const popBtn = btns.find(b => b.textContent && b.textContent.includes('波普'));
    if (popBtn) popBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // 等待日期按钮准备好并展开
  await ensureDropdownOpen(page);

  // 校验下拉浮层结构与元素
  const page1State = await page.evaluate(() => {
    const dropdown = document.querySelector('.date-stepper-dropdown');
    if (!dropdown) return null;
    const header = dropdown.querySelector('.date-dropdown-header');
    const monthPills = Array.from(dropdown.querySelectorAll('.month-filter-pill')).map(p => p.textContent?.trim());
    const dateItems = Array.from(dropdown.querySelectorAll('.date-dropdown-item')).map(d => ({
      date: d.getAttribute('data-date'),
      text: d.textContent?.replace(/\s+/g, ' ').trim()
    }));
    const pagination = dropdown.querySelector('.date-dropdown-pagination');
    const pageText = pagination ? pagination.querySelector('span')?.textContent?.trim() : null;

    return {
      hasDropdown: true,
      headerText: header?.textContent?.replace(/\s+/g, ' ').trim(),
      monthPills,
      itemCount: dateItems.length,
      firstDate: dateItems[0]?.date,
      lastDate: dateItems[dateItems.length - 1]?.date,
      dateItems,
      pageText
    };
  });

  console.log('   📊 第 1 页状态检查:', page1State);
  assert(page1State && page1State.hasDropdown, '下拉菜单必须成功浮现');
  assert(page1State.itemCount === 6, `第 1 页应展示固定 6 条记录，实际为: ${page1State.itemCount}`);
  assert(page1State.monthPills.length >= 2, '必须展示至少全部与有效月份微胶囊');
  assert(page1State.pageText && page1State.pageText.includes('第 1 /'), '分页器应展示当前第 1 页');

  // 截图 1: 波普主题下拉默认展开 (全量第 1 页，含完整分页栏)
  await captureDropdown(page, 'date_dropdown_pop_all_page1.png');

  // ==========================================
  // 测试场景 2: 月份微胶囊过滤联动 (点击 09月)
  // ==========================================
  console.log('\n3. 测试场景 2: 月份微胶囊过滤联动 (点击 09月)...');
  const monthFilterResult = await page.evaluate(() => {
    const pills = Array.from(document.querySelectorAll('.date-stepper-dropdown .month-filter-pill'));
    const sepPill = pills.find(p => p.textContent && (p.textContent.includes('09月') || p.textContent.includes('9月')) || p.getAttribute('data-month') === '09');
    if (!sepPill) return { success: false, available: pills.map(p => p.textContent) };
    sepPill.click();
    return { success: true, pillText: sepPill.textContent?.trim() };
  });
  console.log('   🖱️ 月份胶囊点击结果:', monthFilterResult);
  assert(monthFilterResult.success, '必须找到并点击 09月 胶囊');
  await new Promise(r => setTimeout(r, 600));

  const sepState = await page.evaluate(() => {
    const dropdown = document.querySelector('.date-stepper-dropdown');
    if (!dropdown) return null;
    const dateItems = Array.from(dropdown.querySelectorAll('.date-dropdown-item')).map(d => d.getAttribute('data-date'));
    const pagination = dropdown.querySelector('.date-dropdown-pagination');
    return {
      dateItems,
      allSep: dateItems.every(d => d && d.startsWith('2026-09')),
      hasPagination: !!pagination
    };
  });
  console.log('   📊 09月筛选状态:', sepState);
  assert(sepState.allSep, '所有切片项必须严格属于 09 月');

  // 截图 2: 09月过滤态
  await captureDropdown(page, 'date_dropdown_pop_sep_filter.png');

  // ==========================================
  // 测试场景 3: 恢复全部并测试微型翻页步进器 (点击 > 翻到第 2 页)
  // ==========================================
  console.log('\n4. 测试场景 3: 点击 [全部] 并步进翻到第 2 页...');
  await page.evaluate(() => {
    const allPill = document.querySelector('.date-stepper-dropdown .month-pill-all');
    if (allPill) allPill.click();
  });
  await new Promise(r => setTimeout(r, 400));

  await page.waitForSelector('.date-stepper-dropdown .pagination-btn-next');
  await page.click('.date-stepper-dropdown .pagination-btn-next');
  await new Promise(r => setTimeout(r, 600));

  const page2State = await page.evaluate(() => {
    const dropdown = document.querySelector('.date-stepper-dropdown');
    const dateItems = Array.from(dropdown.querySelectorAll('.date-dropdown-item')).map(d => d.getAttribute('data-date'));
    const pageText = dropdown.querySelector('.date-dropdown-pagination span')?.textContent?.trim();
    return {
      dateItems,
      pageText
    };
  });
  console.log('   📊 第 2 页状态:', page2State);
  assert(page2State.pageText && page2State.pageText.includes('第 2 /'), '当前页码应成功步进为第 2 页');
  assert(page2State.dateItems[0] !== page1State.firstDate, '第 2 页第一项不应与第 1 页相同');

  // 截图 3: 全部批次第 2 页
  await captureDropdown(page, 'date_dropdown_pop_all_page2.png');

  // ==========================================
  // 测试场景 4: 切换到暗黑 HUD (Cyber HUD) 主题展开视图
  // ==========================================
  console.log('\n5. 测试场景 4: 暗黑 HUD 主题下拉浮层高对比度核验...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.theme-capsule-container button'));
    const hudBtn = btns.find(b => b.textContent && b.textContent.includes('HUD'));
    if (hudBtn) hudBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // 确保下拉处于展开态
  await ensureDropdownOpen(page);

  // 截图 4: Cyber HUD 暗色
  await captureDropdown(page, 'date_dropdown_hud_dark.png');

  // ==========================================
  // 测试场景 5: 切换到 iOS Glass / Light 羊皮纸白底主题展开视图
  // ==========================================
  console.log('\n6. 测试场景 5: iOS Glass / Light 主题下拉浮层纯净白底核验...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.theme-capsule-container button'));
    const iosBtn = btns.find(b => b.textContent && b.textContent.includes('iOS'));
    if (iosBtn) iosBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // 确保下拉处于展开态
  await ensureDropdownOpen(page);

  // 截图 5: iOS Glass 羊皮纸浅色
  await captureDropdown(page, 'date_dropdown_ios_glass.png');

  // ==========================================
  // 测试场景 6: 移动端 390px 视口展开无溢出核验
  // ==========================================
  console.log('\n7. 测试场景 6: 移动端 390px 极窄视口展开无截断核验...');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true });
  await new Promise(r => setTimeout(r, 1200));

  // 确保下拉展开
  await ensureDropdownOpen(page);

  // 检查移动端是否有横向溢出
  const overflowCheck = await page.evaluate(() => {
    const dropdown = document.querySelector('.date-stepper-dropdown');
    if (!dropdown) return { error: '未找到下拉' };
    const rect = dropdown.getBoundingClientRect();
    return {
      dropdownLeft: rect.left,
      dropdownRight: rect.right,
      dropdownWidth: rect.width,
      viewportWidth: window.innerWidth,
      isWithinViewport: rect.right <= window.innerWidth && rect.left >= 0
    };
  });
  console.log('   📱 移动端 390px 边界测量:', overflowCheck);

  // 截图 6: 移动端 390px 全景与下拉
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'date_dropdown_mobile_390.png'),
    clip: { x: 0, y: 0, width: 390, height: 600 }
  });
  console.log('   📸 截图保存成功: date_dropdown_mobile_390.png');

  // ==========================================
  // 测试场景 7: 点击具体日期切换简报批次与自动收起弹窗交互
  // ==========================================
  console.log('\n8. 测试场景 7: 点击具体日期切换批次与自动关闭弹窗...');
  const selectResult = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.date-stepper-dropdown .date-dropdown-item'));
    if (items.length < 2) return { success: false, reason: '批次条目不足' };
    const targetItem = items[1]; // 选择第 2 个
    const targetDate = targetItem.getAttribute('data-date');
    targetItem.click();
    return { success: true, targetDate };
  });
  console.log('   🖱️ 点击批次项:', selectResult);
  assert(selectResult.success, '应成功点击批次项');
  await new Promise(r => setTimeout(r, 800));

  // 检查弹窗是否关闭且当前日期胶囊已更新
  const afterSelection = await page.evaluate(() => {
    const dropdown = document.querySelector('.date-stepper-dropdown');
    const currentDateText = document.querySelector('.stepper-date-text')?.textContent?.trim();
    return {
      dropdownClosed: !dropdown,
      currentDateText
    };
  });
  console.log('   📊 点击后状态:', afterSelection);
  assert(afterSelection.dropdownClosed, '点击具体日期后下拉浮层应自动关闭收起');
  assert(afterSelection.currentDateText === selectResult.targetDate, `当前胶囊日期应更新为 ${selectResult.targetDate}`);

  await browser.close();
  console.log('\n🎉 日期下拉高级筛选与分页验证全部通过！');
}

run().catch(err => {
  console.error('❌ 执行验证异常:', err);
  process.exit(1);
});

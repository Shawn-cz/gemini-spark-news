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

async function verify() {
  const artifactDir = 'C:\\Users\\79551\\.gemini\\antigravity\\brain\\c546e420-1f57-4c2c-ac89-b6305f49a00f';
  const browser = await puppeteer.launch({
    executablePath: getBrowserPath(),
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    // 模拟 iPhone 14 / iPhone 12/13/15 标准移动视口 390x844
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

    console.log('📱 正在加载本地页面 http://localhost:5173 ...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1000));

    // 1. 切换到“复古羊皮纸 / iOS 白色”主题（用户手机截图所在的主题）
    console.log('🎨 切换为方案C·iOS 主题...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const lightBtn = btns.find(b => b.title && b.title.includes('方案C·iOS'));
      if (lightBtn) lightBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    // 2. 测量初始几何与检查溢出
    const initMetrics = await page.evaluate(() => {
      const banner = document.querySelector('header .h-\\[42px\\]');
      const container = document.querySelector('header .touch-pan-x');
      const pulse = document.querySelector('header [class*="Activity"]')?.closest('.h-\\[42px\\]') || 
                    document.querySelectorAll('header .h-\\[42px\\]')[1];

      return {
        bannerHeight: banner ? banner.getBoundingClientRect().height : null,
        pulseHeight: pulse ? pulse.getBoundingClientRect().height : null,
        scrollLeft: container ? container.scrollLeft : null,
        scrollWidth: container ? container.scrollWidth : null,
        clientWidth: container ? container.clientWidth : null,
        docScrollWidth: document.documentElement.scrollWidth,
        docClientWidth: document.documentElement.clientWidth
      };
    });

    console.log('📊 初始几何度量:', initMetrics);
    
    // 截取初始状态截图 (方案 C·iOS / 羊皮纸白底)
    await page.screenshot({ path: path.join(artifactDir, 'nobel_scroll_stage1_start_light.png'), clip: { x: 0, y: 0, width: 390, height: 260 } });
    console.log('📸 截图已生成: nobel_scroll_stage1_start_light.png');

    // 3. 此时平滑跑马灯前向推进 (等待至向右展示全句与作者)
    console.log('⏳ 等待平滑跑马灯向右推进至尾端 (3200ms)...');
    await new Promise(r => setTimeout(r, 3200));

    const endMetrics = await page.evaluate(() => {
      const container = document.querySelector('header .touch-pan-x');
      return {
        scrollLeft: container ? Math.round(container.scrollLeft) : null,
        scrollWidth: container ? container.scrollWidth : null,
        clientWidth: container ? container.clientWidth : null
      };
    });
    console.log('📊 尾端位置度量:', endMetrics);
    await page.screenshot({ path: path.join(artifactDir, 'nobel_scroll_stage2_end_light.png'), clip: { x: 0, y: 0, width: 390, height: 260 } });
    console.log('📸 截图已生成: nobel_scroll_stage2_end_light.png');

    // 4. 等待顺滑回弹至初始位并停驻
    console.log('⏳ 等待顺滑回弹至初始位并彻底停驻 (3000ms)...');
    await new Promise(r => setTimeout(r, 3000));
    const resetMetrics = await page.evaluate(() => {
      const container = document.querySelector('header .touch-pan-x');
      return {
        scrollLeft: container ? Math.round(container.scrollLeft) : null,
        scrollWidth: container ? container.scrollWidth : null,
        clientWidth: container ? container.clientWidth : null
      };
    });
    console.log('📊 回弹复位度量:', resetMetrics);
    await page.screenshot({ path: path.join(artifactDir, 'nobel_scroll_stage3_reset_light.png'), clip: { x: 0, y: 0, width: 390, height: 260 } });
    console.log('📸 截图已生成: nobel_scroll_stage3_reset_light.png');

    // 5. 验证“用户手指拖拽/自由滚动”
    console.log('👆 模拟移动端用户手指触控拖拽 (Touch Drag)...');
    await page.evaluate(() => {
      const container = document.querySelector('header .touch-pan-x');
      if (container) {
        container.scrollLeft = 65;
        container.dispatchEvent(new Event('touchstart', { bubbles: true }));
      }
    });
    await new Promise(r => setTimeout(r, 600));

    const dragMetrics = await page.evaluate(() => {
      const container = document.querySelector('header .touch-pan-x');
      return {
        scrollLeft: container ? Math.round(container.scrollLeft) : null
      };
    });
    console.log('📊 用户拖拽后驻留位置:', dragMetrics);
    await page.screenshot({ path: path.join(artifactDir, 'nobel_scroll_stage4_dragged_light.png'), clip: { x: 0, y: 0, width: 390, height: 260 } });
    console.log('📸 截图已生成: nobel_scroll_stage4_dragged_light.png');

    // 6. 切换暗色 Cyber HUD 主题验证
    console.log('🌌 验证 Cyber HUD 暗色主题...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const darkBtn = btns.find(b => b.title && b.title.includes('方案A·HUD'));
      if (darkBtn) darkBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(artifactDir, 'nobel_scroll_hud_theme.png'), clip: { x: 0, y: 0, width: 390, height: 260 } });
    console.log('📸 截图已生成: nobel_scroll_hud_theme.png');

    // 7. 切换波普多巴胺 Pop Dopamine 主题验证
    console.log('🍭 验证 Pop Dopamine 主题...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const popBtn = btns.find(b => b.title && b.title.includes('方案B·波普'));
      if (popBtn) popBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(artifactDir, 'nobel_scroll_pop_theme.png'), clip: { x: 0, y: 0, width: 390, height: 260 } });
    console.log('📸 截图已生成: nobel_scroll_pop_theme.png');

    console.log('✅ 所有自动化视觉凭证采集完成！');
  } catch (err) {
    console.error('❌ 验证过程出错:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

verify();

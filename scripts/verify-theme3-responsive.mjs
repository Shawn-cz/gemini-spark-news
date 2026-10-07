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
  throw new Error('No Chrome or Edge browser found.');
}

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844, isMobile: true, label: '📱 移动端 (iPhone 14)' },
  { name: 'tablet', width: 768, height: 1024, isMobile: false, label: '📟 平板端 (iPad 768px)' },
  { name: 'laptop', width: 1280, height: 800, isMobile: false, label: '💻 笔记本中屏 (1280px)' },
  { name: 'desktop', width: 1920, height: 1080, isMobile: false, label: '🖥️ 大屏桌面 (1920px)' }
];

async function verifyResponsive() {
  const browserPath = getBrowserPath();
  const browser = await puppeteer.launch({
    executablePath: browserPath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files']
  });

  const page = await browser.newPage();
  const outDir = 'C:/Users/79551/.gemini/antigravity/brain/c546e420-1f57-4c2c-ac89-b6305f49a00f';
  const htmlPath = path.resolve(__dirname, '../THEME_3_CANDIDATES_SHOWCASE.html');
  const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');

  console.log('🌐 正在加载全息原型文件:', fileUrl);
  await page.goto(fileUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => typeof window.setTheme === 'function', { timeout: 20000 });

  // 确保处于方案 A: 赛博战术 HUD
  await page.evaluate(() => {
    window.setTheme('cyber-hud');
  });

  const auditReport = [];

  for (const vp of VIEWPORTS) {
    console.log(`\n🔍 正在审阅视口: ${vp.label} (${vp.width}x${vp.height})...`);
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1, isMobile: vp.isMobile });
    await new Promise(r => setTimeout(r, 600));

    // 1. 检查首页 HUD 页面水平溢出
    const hudOverflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return {
        scrollWidth: doc.scrollWidth,
        clientWidth: doc.clientWidth,
        hasHorizontalOverflow: doc.scrollWidth > doc.clientWidth
      };
    });

    console.log(`   [HUD 首页] 宽度: ${hudOverflow.clientWidth}px, 滚动宽度: ${hudOverflow.scrollWidth}px, 溢出: ${hudOverflow.hasHorizontalOverflow ? '❌ 发生横向穿透' : '✅ 无溢出'}`);
    const hudImgPath = path.join(outDir, `theme3_responsive_${vp.name}_hud.png`);
    await page.screenshot({ path: hudImgPath, fullPage: false });

    // 2. 打开 3D 原生全息研报视窗
    await page.evaluate(() => {
      window.openHoloDossier(1);
    });
    await new Promise(r => setTimeout(r, 1200));

    // 检查全息弹窗视窗溢出与尺寸
    const modalAudit = await page.evaluate(() => {
      const modal = document.getElementById('holo-dossier-modal');
      const content = document.getElementById('holo-modal-floating-content');
      const cards = document.querySelectorAll('.holo-section-card-3d');
      const header = modal.querySelector('.relative.z-30');
      
      const modalRect = modal ? modal.getBoundingClientRect() : null;
      const contentRect = content ? content.getBoundingClientRect() : null;
      
      const cardRects = Array.from(cards).map(c => {
        const r = c.getBoundingClientRect();
        return { width: r.width, height: r.height, left: r.left, right: r.right };
      });

      return {
        modalScrollWidth: modal ? modal.scrollWidth : 0,
        modalClientWidth: modal ? modal.clientWidth : 0,
        hasModalHorizontalOverflow: modal ? modal.scrollWidth > modal.clientWidth : false,
        cardCount: cards.length,
        cardWidths: cardRects.map(c => Math.round(c.width)),
        cardHeights: cardRects.map(c => Math.round(c.height)),
        headerWidth: header ? Math.round(header.getBoundingClientRect().width) : 0
      };
    });

    console.log(`   [全息弹窗] 宽度: ${modalAudit.modalClientWidth}px, 滚动宽度: ${modalAudit.modalScrollWidth}px, 溢出: ${modalAudit.hasModalHorizontalOverflow ? '❌ 弹窗横向穿透' : '✅ 弹窗无横向穿透'}`);
    console.log(`   [3块窗格尺寸] 宽度列表: [${modalAudit.cardWidths.join(', ')}px], 高度自适应: [${modalAudit.cardHeights.join(', ')}px]`);

    const modalImgPath = path.join(outDir, `theme3_responsive_${vp.name}_modal.png`);
    await page.screenshot({ path: modalImgPath, fullPage: false });

    auditReport.push({
      viewport: vp.label,
      width: vp.width,
      hudOverflow: hudOverflow.hasHorizontalOverflow,
      modalOverflow: modalAudit.hasModalHorizontalOverflow,
      cardWidths: modalAudit.cardWidths,
      cardHeights: modalAudit.cardHeights
    });

    // 关闭弹窗
    await page.evaluate(() => {
      window.closeHoloDossier();
    });
    await new Promise(r => setTimeout(r, 400));
  }

  await browser.close();
  console.log('\n================ 响应式多端审阅总结 ================');
  console.table(auditReport);
  console.log('✅ 全部端点截图与几何计算已生成完毕！');
}

verifyResponsive().catch(err => {
  console.error('响应式审阅执行失败:', err);
  process.exit(1);
});

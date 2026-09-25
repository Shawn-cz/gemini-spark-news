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

async function waitForReady(page) {
  await page.waitForFunction(() => {
    return !document.body.innerText.includes('正在从 Gemini Spark 智能体管道初始化加载') &&
      document.querySelectorAll('article.glass-card').length > 0;
  }, { timeout: 15000 });
  await new Promise(r => setTimeout(r, 800));
}

async function switchTheme(page, themeName) {
  await page.evaluate((name) => {
    const btn = document.querySelector(`.theme-capsule-container button[title*="${name}"]`);
    if (btn) btn.click();
  }, themeName);
  await new Promise(r => setTimeout(r, 800));
}

async function switchViewMode(page, modeName) {
  await page.evaluate((name) => {
    const btns = Array.from(document.querySelectorAll('.viewmode-btn'));
    const target = btns.find(b => b.innerText.includes(name));
    if (target) target.click();
  }, modeName);
  await new Promise(r => setTimeout(r, 800));
}

async function closeModal(page) {
  const closeBtn = await page.$('.dossier-close-btn');
  if (closeBtn) {
    await closeBtn.click();
  } else {
    await page.keyboard.press('Escape');
  }
  await page.waitForFunction(() => !document.querySelector('.dossier-modal-window'), { timeout: 5000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 600));
}

async function run() {
  const browserPath = getBrowserPath();
  console.log('Using browser executable:', browserPath);

  const outputDir = path.resolve(__dirname, '..', 'screenshots');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: browserPath,
    headless: true,
    defaultViewport: {
      width: 1440,
      height: 960,
      deviceScaleFactor: 2
    },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  try {
    const page = await browser.newPage();

    console.log('Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });

    console.log('Waiting for articles to load...');
    await waitForReady(page);

    // ==========================================
    // 1. Dark Obsidian Theme (Bento View)
    // ==========================================
    console.log('\n--- 1. Capturing Dark Theme (Obsidian) ---');
    await switchTheme(page, '暗夜');
    await switchViewMode(page, 'Bento');
    await waitForReady(page);
    const darkPath = path.join(outputDir, 'dark-obsidian-bento.png');
    await page.screenshot({ path: darkPath, fullPage: false });
    console.log('Saved:', darkPath);

    // ==========================================
    // 2. Light Theme (Archival Parchment P2)
    // ==========================================
    console.log('\n--- 2. Capturing Light Theme Bento View ---');
    await switchTheme(page, '淡色');
    await switchViewMode(page, 'Bento');
    await waitForReady(page);
    const lightBentoPath = path.join(outputDir, 'light-parchment-bento.png');
    await page.screenshot({ path: lightBentoPath, fullPage: false });
    console.log('Saved:', lightBentoPath);

    // 2.1 Light Theme Dossier Drawer
    console.log('--- 3. Capturing Light Theme Dossier Drawer ---');
    const firstLightCard = await page.$('article.glass-card');
    if (firstLightCard) {
      await firstLightCard.click();
      await page.waitForSelector('.dossier-modal-window', { timeout: 6000 });
      await new Promise(r => setTimeout(r, 1200));
      const drawerPath = path.join(outputDir, 'light-parchment-drawer.png');
      await page.screenshot({ path: drawerPath, fullPage: false });
      console.log('Saved:', drawerPath);

      // Close modal
      await closeModal(page);
    }

    // 2.2 Light Theme Matrix View
    console.log('--- 4. Capturing Light Theme Matrix Stream View ---');
    await switchViewMode(page, '四象限流');
    await page.waitForSelector('.matrix-lane-header', { timeout: 8000 });
    await waitForReady(page);
    const lightMatrixPath = path.join(outputDir, 'light-parchment-matrix.png');
    await page.screenshot({ path: lightMatrixPath, fullPage: false });
    console.log('Saved:', lightMatrixPath);

    // 2.3 Light Theme Timeline View
    console.log('--- 5. Capturing Light Theme Timeline Scrubber View ---');
    await switchViewMode(page, '时空轨迹');
    await page.waitForSelector('.timeline-scrubber-card', { timeout: 8000 });
    await waitForReady(page);
    const lightTimelinePath = path.join(outputDir, 'light-parchment-timeline.png');
    await page.screenshot({ path: lightTimelinePath, fullPage: false });
    console.log('Saved:', lightTimelinePath);

    // ==========================================
    // 3. Dopamine Pop Theme
    // ==========================================
    console.log('\n--- 6. Capturing Dopamine Pop Theme Bento View ---');
    await switchTheme(page, '多巴胺');
    await switchViewMode(page, 'Bento');
    await waitForReady(page);
    const dopamineBentoPath = path.join(outputDir, 'dopamine-pop-bento.png');
    await page.screenshot({ path: dopamineBentoPath, fullPage: false });
    console.log('Saved:', dopamineBentoPath);

    // 3.1 Dopamine Dossier Drawer
    console.log('--- 7. Capturing Dopamine Pop Theme Dossier Drawer ---');
    const firstPopCard = await page.$('article.glass-card');
    if (firstPopCard) {
      await firstPopCard.click();
      await page.waitForSelector('.dossier-modal-window', { timeout: 6000 });
      await new Promise(r => setTimeout(r, 1200));
      const dopamineDrawerPath = path.join(outputDir, 'dopamine-pop-drawer.png');
      await page.screenshot({ path: dopamineDrawerPath, fullPage: false });
      console.log('Saved:', dopamineDrawerPath);

      // Close modal
      await closeModal(page);
    }

    // 3.2 Dopamine Matrix View
    console.log('--- 8. Capturing Dopamine Pop Theme Matrix View ---');
    await switchViewMode(page, '四象限流');
    await page.waitForSelector('.matrix-lane-header', { timeout: 8000 });
    await waitForReady(page);
    const dopamineMatrixPath = path.join(outputDir, 'dopamine-pop-matrix.png');
    await page.screenshot({ path: dopamineMatrixPath, fullPage: false });
    console.log('Saved:', dopamineMatrixPath);

    // 3.3 Dopamine Timeline View
    console.log('--- 9. Capturing Dopamine Pop Theme Timeline View ---');
    await switchViewMode(page, '时空轨迹');
    await page.waitForSelector('.timeline-scrubber-card', { timeout: 8000 });
    await waitForReady(page);
    const dopamineTimelinePath = path.join(outputDir, 'dopamine-pop-timeline.png');
    await page.screenshot({ path: dopamineTimelinePath, fullPage: false });
    console.log('Saved:', dopamineTimelinePath);

    console.log('\n=========================================');
    console.log('All visual regression screenshots successfully captured!');
    console.log('Saved to directory:', outputDir);
    console.log('=========================================\n');
  } catch (err) {
    console.error('Visual regression error:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

run();

import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

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

function createStaticServer(dir, port) {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };

  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      if (req.url.startsWith('/api')) {
        const proxyReq = http.request({
          host: 'localhost',
          port: 3001,
          path: req.url,
          method: req.method,
          headers: req.headers
        }, (proxyRes) => {
          res.writeHead(proxyRes.statusCode, proxyRes.headers);
          proxyRes.pipe(res);
        });
        req.pipe(proxyReq);
        return;
      }

      let reqPath = req.url.split('?')[0];
      if (reqPath === '/') reqPath = '/index.html';
      let filePath = path.join(dir, reqPath);

      if (!fs.existsSync(filePath)) {
        filePath = path.join(dir, 'index.html');
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = mimeTypes[ext] || 'application/octet-stream';

      fs.readFile(filePath, (err, content) => {
        if (err) {
          res.writeHead(500);
          res.end('Error loading file');
        } else {
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content);
        }
      });
    });

    server.listen(port, () => {
      resolve(server);
    });
  });
}

async function run() {
  let apiServer = null;
  try {
    const probe = await fetch('http://localhost:3001/api/health');
    if (!probe.ok) throw new Error('probe down');
  } catch {
    console.log('[Init] 启动本地 3001 API 网关...');
    const { app } = await import('../server/mock-server.mjs');
    const { initDatabase } = await import('../server/repository.mjs');
    await initDatabase();
    apiServer = http.createServer(app);
    await new Promise(r => apiServer.listen(3001, r));
    console.log('   ✅ 本地 API 服务已在 3001 启动');
  }

  const PORT = 4198;
  const staticServer = await createStaticServer(distDir, PORT);
  console.log(`本地验证静态服务器已启动: http://localhost:${PORT}`);

  const browserPath = getBrowserPath();
  const browser = await puppeteer.launch({
    executablePath: browserPath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const screenshotDir = path.resolve(__dirname, '../screenshots');
  if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

  try {
    const page = await browser.newPage();

    // ==========================================
    // 1. 移动端 (390px, iPhone 视口) 审查
    // ==========================================
    console.log('\n[1/3] 正在审查移动端 390px 吸顶与主体可见度...');
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('article', { timeout: 15000 });
    await new Promise(r => setTimeout(r, 1000));

    const mobileMetrics = await page.evaluate(() => {
      const header = document.querySelector('header');
      const sentimentCapsule = document.querySelector('.header-sentiment-capsule');
      const oldMetricCards = document.querySelectorAll('.header-metric-card');
      const firstArticle = document.querySelector('article');

      const headerRect = header ? header.getBoundingClientRect() : null;
      const articleRect = firstArticle ? firstArticle.getBoundingClientRect() : null;

      return {
        headerHeight: headerRect ? Math.round(headerRect.height) : 0,
        hasSentiment: !!sentimentCapsule,
        oldMetricCardsCount: oldMetricCards.length,
        articleTop: articleRect ? Math.round(articleRect.top) : 0
      };
    });

    console.log('移动端 390px 布局度量:', mobileMetrics);
    if (mobileMetrics.headerHeight > 130) {
      throw new Error(`移动端吸顶高度依然过高: ${mobileMetrics.headerHeight}px (预期 < 130px)`);
    }
    if (mobileMetrics.oldMetricCardsCount > 0) {
      throw new Error(`发现残余旧指标卡片数量: ${mobileMetrics.oldMetricCardsCount}`);
    }
    if (!mobileMetrics.hasSentiment) {
      throw new Error('未找到保留的情绪指标脉搏胶囊！');
    }

    const mobileShot = path.join(screenshotDir, 'mobile-compact-header-390px.png');
    await page.screenshot({ path: mobileShot, fullPage: false });
    console.log(`   ✅ 移动端 390px 紧凑布局真机快照已保存: ${mobileShot}`);

    // ==========================================
    // 2. 移动端羊皮纸淡色模式审查
    // ==========================================
    console.log('\n[2/3] 正在审查移动端 390px 羊皮纸淡色模式...');
    await page.evaluate(() => {
      const btn = document.querySelector('.theme-capsule-container button[title*="淡色"]');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    const mobileLightShot = path.join(screenshotDir, 'mobile-compact-header-light-390px.png');
    await page.screenshot({ path: mobileLightShot, fullPage: false });
    console.log(`   ✅ 移动端 390px 淡色羊皮纸真机快照已保存: ${mobileLightShot}`);

    // ==========================================
    // 3. 桌面端 (1146px 碰撞高发区) 审查
    // ==========================================
    console.log('\n[3/3] 正在审查桌面端 1146px 单行紧凑布局...');
    await page.setViewport({ width: 1146, height: 860, deviceScaleFactor: 1 });
    await new Promise(r => setTimeout(r, 800));

    const desktopMetrics = await page.evaluate(() => {
      const header = document.querySelector('header');
      const headerRect = header ? header.getBoundingClientRect() : null;
      const sentimentCapsule = document.querySelector('.header-sentiment-capsule');
      return {
        headerHeight: headerRect ? Math.round(headerRect.height) : 0,
        hasSentiment: !!sentimentCapsule
      };
    });

    console.log('桌面端 1146px 布局度量:', desktopMetrics);
    if (desktopMetrics.headerHeight > 90) {
      throw new Error(`桌面端 Header 高度异常: ${desktopMetrics.headerHeight}px (预期 < 90px 单行)`);
    }

    const desktopShot = path.join(screenshotDir, 'desktop-compact-header-1146px.png');
    await page.screenshot({ path: desktopShot, fullPage: false });
    console.log(`   ✅ 桌面端 1146px 单行紧凑布局快照已保存: ${desktopShot}`);

    console.log('\n🎉 全版面紧凑布局多断点真机审阅 100% 通过！吸顶高度大幅缩减，首屏主体信息清晰呈现！');
  } finally {
    await browser.close();
    staticServer.close();
    if (apiServer) apiServer.close();
  }
}

run().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('❌ 验证失败:', err);
  process.exit(1);
});

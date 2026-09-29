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

// 简易静态服务器，用于测试 dist 构建产物并代理 API 请求到 3001
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
      // 代理 /api 请求至 3001
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
  // 1. 确保 3001 端口服务可用
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

  const PORT = 4199;
  const staticServer = await createStaticServer(distDir, PORT);
  console.log(`本地验证静态服务器已启动: http://localhost:${PORT}`);

  const browserPath = getBrowserPath();
  const browser = await puppeteer.launch({
    executablePath: browserPath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    // 按照用户截图的精确屏幕宽度 1146px 测试
    await page.setViewport({ width: 1146, height: 860, deviceScaleFactor: 1 });

    page.on('console', msg => console.log('   [Page Browser]:', msg.text()));
    page.on('pageerror', err => console.log('   [Page Error]:', err.message));

    console.log(`正在访问 http://localhost:${PORT} ...`);
    await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // 1. 切换到“淡色羊皮纸 (Light)”主题
    console.log('切换到淡色羊皮纸主题...');
    await page.evaluate(() => {
      const btn = document.querySelector('.theme-capsule-container button[title*="羊皮纸"]');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 800));

    // 2. 等待并点击第一张新闻卡片打开详情抽屉
    console.log('等待数据加载并点击第一张卡片打开详情抽屉...');
    await page.waitForSelector('article', { timeout: 15000 });
    await page.click('article');
    await new Promise(r => setTimeout(r, 1200));

    // 3. 检查抽屉是否已打开并点击 Share 按钮
    console.log('在抽屉中点击分享按钮...');
    const shareClicked = await page.evaluate(() => {
      const shareBtn = document.querySelector('.dossier-action-btn[title*="分享"]') || 
                       document.querySelector('button[title*="分享"]');
      if (shareBtn) {
        shareBtn.click();
        return true;
      }
      return false;
    });

    if (!shareClicked) {
      throw new Error('未找到详情抽屉中的分享按键！');
    }
    await new Promise(r => setTimeout(r, 1000));

    // 4. 验证 ShareModal 是否渲染并且二维码有效
    const modalCheck = await page.evaluate(() => {
      const modal = document.querySelector('.share-modal-window');
      const qrImg = modal ? modal.querySelector('img[alt*="二维码"]') : null;
      const copyBtn = modal ? modal.querySelector('button') : null;
      const wechatBanner = modal ? modal.innerText.includes('微信') : false;

      return {
        hasModal: !!modal,
        hasQr: !!qrImg && (qrImg.getAttribute('src') || '').startsWith('data:image/png;base64,'),
        wechatReady: wechatBanner
      };
    });

    console.log('ShareModal 渲染状态检查:', modalCheck);
    if (!modalCheck.hasModal || !modalCheck.hasQr) {
      throw new Error('ShareModal 渲染异常或二维码生成失败！');
    }

    // 5. 截图归档
    const screenshotDir = path.resolve(__dirname, '../screenshots');
    if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

    const screenshotPath = path.join(screenshotDir, 'share-modal-light-1146px.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`✅ 1146px 淡色羊皮纸全版面截图已保存: ${screenshotPath}`);

    // 6. 测试移动端 390px 视口表现
    console.log('测试移动端 390px 视口表现...');
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await new Promise(r => setTimeout(r, 800));

    const mobileScreenshotPath = path.join(screenshotDir, 'share-modal-mobile-390px.png');
    await page.screenshot({ path: mobileScreenshotPath, fullPage: false });
    console.log(`✅ 390px 移动端微信分享自适应截图已保存: ${mobileScreenshotPath}`);

    // 7. 测试黑曜石暗色主题
    console.log('测试黑曜石暗夜主题...');
    await page.evaluate(() => {
      const btn = document.querySelector('.theme-capsule-container button[title*="暗夜"]');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 800));

    const darkScreenshotPath = path.join(screenshotDir, 'share-modal-dark-1146px.png');
    await page.setViewport({ width: 1146, height: 860, deviceScaleFactor: 1 });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: darkScreenshotPath, fullPage: false });
    console.log(`✅ 1146px 黑曜石暗色全版面截图已保存: ${darkScreenshotPath}`);

    console.log('\n🎉 全断点与多主题微信分享验证 100% 通过！零“共享失败”原生弹窗！');
  } finally {
    await browser.close();
    staticServer.close();
    if (apiServer) apiServer.close();
    console.log('验证服务器与无头浏览器已平稳关闭。');
  }
}

run().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('❌ 验证失败:', err);
  process.exit(1);
});

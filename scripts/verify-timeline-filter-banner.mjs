import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');
const screenshotsDir = path.resolve(__dirname, '../screenshots');

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

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
          host: '127.0.0.1',
          port: 3001,
          path: req.url,
          method: req.method,
          headers: req.headers
        }, (proxyRes) => {
          res.writeHead(proxyRes.statusCode, proxyRes.headers);
          proxyRes.pipe(res);
        });
        proxyReq.on('error', () => {
          if (!res.headersSent) {
            res.writeHead(502);
            res.end('Bad Gateway');
          }
        });
        req.on('error', () => {});
        req.pipe(proxyReq);
        return;
      }

      let filePath = path.join(dir, req.url.split('?')[0]);
      if (filePath.endsWith(path.sep) || !path.extname(filePath)) {
        filePath = path.join(dir, 'index.html');
      }

      const ext = path.extname(filePath);
      const contentType = mimeTypes[ext] || 'application/octet-stream';

      fs.readFile(filePath, (err, content) => {
        if (err) {
          if (err.code === 'ENOENT') {
            fs.readFile(path.join(dir, 'index.html'), (err2, fallback) => {
              if (err2) {
                res.writeHead(404);
                res.end('Not Found');
              } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(fallback);
              }
            });
          } else {
            res.writeHead(500);
            res.end(`Server Error: ${err.code}`);
          }
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

async function isBackendRunning() {
  try {
    const res = await fetch('http://127.0.0.1:3001/api/health');
    return res.ok;
  } catch {
    return false;
  }
}

async function run() {
  console.log('=== [E2E] 验证 24H 时空轴常驻全维感知条 (Filtered & Unfiltered) ===\n');

  let backendProc = null;
  const backendUp = await isBackendRunning();
  if (!backendUp) {
    console.log('[1/5] 后端 3001 端口未运行，自动启动 mock-server...');
    backendProc = spawn('node', ['server/mock-server.mjs'], {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit'
    });
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 500));
      if (await isBackendRunning()) break;
    }
  } else {
    console.log('[1/5] 后端 3001 已在运行，复用当前服务。');
  }

  const staticPort = 4174;
  console.log(`[2/5] 启动静态资源服务器 http://localhost:${staticPort} ...`);
  const staticServer = await createStaticServer(distDir, staticPort);

  const browserPath = getBrowserPath();
  const browser = await puppeteer.launch({
    executablePath: browserPath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });

    console.log('[3/5] 导航至测试页并等待初始数据就绪...');
    await page.goto(`http://localhost:${staticPort}`, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForFunction(() => document.querySelectorAll('article').length > 0, { timeout: 20000 });
    await new Promise(r => setTimeout(r, 800));

    // 1. 直接切换到「24H 时空轴」视图（无任何过滤，默认全领域全部情绪状态）
    console.log('   -> 切换到「24H 时空轴」视图（验证常驻未过滤就绪态）...');
    await page.evaluate(() => {
      const viewBtns = Array.from(document.querySelectorAll('.viewmode-container button'));
      const timelineBtn = viewBtns.find(b => b.innerText.includes('时空轴'));
      if (timelineBtn) timelineBtn.click();
    });
    await page.waitForFunction(() => document.querySelector('.timeline-filter-banner'), { timeout: 15000 });

    const idleBannerText = await page.$eval('.timeline-filter-banner', el => el.innerText);
    console.log('   ✅ 常驻就绪感知条已展现:', idleBannerText.replace(/\n/g, ' '));
    if (!idleBannerText.includes('全天全领域连续流就绪')) {
      throw new Error(`❌ 预期包含全天全领域连续流就绪，实际为: ${idleBannerText}`);
    }

    // 保存未过滤就绪态截图
    await page.screenshot({ path: path.join(screenshotsDir, 'timeline-filter-banner-idle.png') });
    console.log('   📸 已保存未过滤就绪态截图: screenshots/timeline-filter-banner-idle.png');

    // 2. 精准复刻用户场景：点击「正面发展 (8)」情绪过滤
    console.log('   -> 点击「正面发展」情绪过滤胶囊（精准复现用户截图状态）...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.filter-sentiment-btn'));
      const posBtn = btns.find(b => b.innerText.includes('正面发展'));
      if (posBtn) posBtn.click();
    });
    await page.waitForFunction(() => {
      const banner = document.querySelector('.timeline-filter-banner-active');
      return banner && banner.innerText.includes('正面发展');
    }, { timeout: 15000 });
    await new Promise(r => setTimeout(r, 600));

    // 3. 校验情绪过滤下的状态指示条
    console.log('[4/5] 校验情绪过滤（正面发展）下的 .timeline-filter-banner 呈现...');
    const bannerInfo = await page.evaluate(() => {
      const banner = document.querySelector('.timeline-filter-banner');
      if (!banner) return null;
      const target = banner.querySelector('.timeline-filter-target')?.innerText || '';
      const count = banner.querySelector('.timeline-filter-count')?.innerText || '';
      const resetBtn = banner.querySelector('.timeline-filter-reset-btn')?.innerText || '';
      return {
        text: banner.innerText,
        target,
        count,
        resetBtn
      };
    });

    if (!bannerInfo) {
      throw new Error('❌ 未找到 .timeline-filter-banner 状态指示条！');
    }

    console.log('   ✅ 情绪过滤感知条存在:');
    console.log('      过滤目标:', bannerInfo.target);
    console.log('      条数统计:', bannerInfo.count);
    console.log('      重置按键:', bannerInfo.resetBtn);

    if (!bannerInfo.target.includes('正面发展')) {
      throw new Error(`❌ 过滤目标应为正面发展，实际为: ${bannerInfo.target}`);
    }

    // 4. 截图三套主题与多端视觉凭证
    console.log('[5/5] 截图三套主题与多端视觉凭证...');

    // 4.1 暗色主题截图
    await page.screenshot({ path: path.join(screenshotsDir, 'timeline-filter-banner-dark.png') });
    console.log('   📸 已保存暗色截图: screenshots/timeline-filter-banner-dark.png');

    // 4.2 淡色主题截图
    await page.evaluate(() => {
      const btn = document.querySelector('.theme-capsule-container button[title*="羊皮纸"]');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(screenshotsDir, 'timeline-filter-banner-light.png') });
    console.log('   📸 已保存淡色截图: screenshots/timeline-filter-banner-light.png');

    // 4.3 多巴胺主题截图
    await page.evaluate(() => {
      const btn = document.querySelector('.theme-capsule-container button[title*="多巴胺"]');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(screenshotsDir, 'timeline-filter-banner-dopamine.png') });
    console.log('   📸 已保存多巴胺截图: screenshots/timeline-filter-banner-dopamine.png');

    // 4.4 移动端 (390px) 截图
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(screenshotsDir, 'timeline-filter-banner-mobile.png') });
    console.log('   📸 已保存移动端截图: screenshots/timeline-filter-banner-mobile.png');

    // 5. 校验点击重置按键后恢复全部领域
    console.log('   -> 校验点击重置按键...');
    await page.evaluate(() => {
      const resetBtn = document.querySelector('.timeline-filter-reset-btn');
      if (resetBtn) resetBtn.click();
    });
    const idleBannerHandle = await page.waitForSelector('.timeline-filter-banner-idle', { timeout: 15000 });
    const postResetText = await idleBannerHandle.evaluate(el => el.innerText);
    console.log('   ✅ 重置按键点击后，感知条平滑还原为就绪态:', postResetText.replace(/\n/g, ' '));
    if (!postResetText.includes('全天全领域连续流就绪')) {
      throw new Error(`❌ 重置后未恢复为全天全领域连续流就绪状态: ${postResetText}`);
    }

    console.log('\n🎉 [E2E 验证全部通过！] 24H 时空轴常驻全维感知条已完美就绪！');
  } finally {
    await browser.close();
    await new Promise(r => staticServer.close(r));
    if (backendProc) {
      backendProc.kill('SIGTERM');
    }
  }
}

run().catch(err => {
  console.error('❌ E2E 测试异常:', err);
  process.exit(1);
});

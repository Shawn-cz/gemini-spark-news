import puppeteer from 'puppeteer-core';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'node:assert/strict';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '..', 'dist');

// 设置生产模式以提供静态构建产物
process.env.NODE_ENV = 'production';

// 导入后端应用
const { app } = await import('../server/mock-server.mjs');

// 兼容性挂载：确保 SPA 路由与静态资源均可正常访问
const express = (await import('express')).default;
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distDir, 'index.html'));
  });
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
  throw new Error('未在系统常规路径找到 Chrome 或 Edge 浏览器');
}

async function verifyClientCache() {
  console.log('🚀 启动本地集成服务器与前端构建产物...');
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`📡 集成测试服务运行在: ${baseUrl}`);

  const browserPath = getBrowserPath();
  console.log(`🌐 启动无头浏览器: ${browserPath}`);
  const browser = await puppeteer.launch({
    executablePath: browserPath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const newsApiRequests = [];
  page.on('request', (req) => {
    if (req.url().includes('/api/news')) {
      newsApiRequests.push({
        url: req.url(),
        method: req.method(),
        timestamp: Date.now()
      });
    }
  });

  try {
    console.log('\n[Phase 1] 访问首页并等待初始首屏加载...');
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForSelector('.category-pill-btn', { timeout: 10000 });
    // 等待首屏初始请求稳定
    await new Promise(r => setTimeout(r, 1000));

    const initialRequestCount = newsApiRequests.length;
    console.log(`   首屏初始 /api/news 请求次数: ${initialRequestCount} (预期: 1 次全量批次拉取)`);
    assert.ok(initialRequestCount >= 1, '首屏必须发起至少 1 次批次数据拉取');

    // 记录基准数量
    let baselineCount = initialRequestCount;

    console.log('\n[Phase 2] 测试分类胶囊连续切换 (AI -> 金融 -> 地缘 -> 气候 -> 全部)...');
    const categoryLabels = ['全球 AI 算力', '宏观金融', '地缘经贸', '气候能源', '我的收藏', '全部领域'];

    for (const label of categoryLabels) {
      const clicked = await page.evaluate((btnText) => {
        const buttons = Array.from(document.querySelectorAll('.category-pill-btn'));
        const target = buttons.find(b => b.textContent.includes(btnText));
        if (target) {
          target.click();
          return true;
        }
        return false;
      }, label);

      assert.ok(clicked, `未找到分类胶囊: ${label}`);
      // 等待可能触发的微任务/DOM渲染
      await new Promise(r => setTimeout(r, 200));
    }

    const afterCategoryCount = newsApiRequests.length;
    const categoryExtraRequests = afterCategoryCount - baselineCount;
    console.log(`   连续切换 6 次分类胶囊后额外发起的 /api/news 请求数: ${categoryExtraRequests}`);
    assert.strictEqual(categoryExtraRequests, 0, `❌ 严重错误: 切换分类产生了 ${categoryExtraRequests} 次额外网络请求！预期必须为 0`);
    console.log('   ✅ 分类切换 0 网络请求验证通过 (纯前端 0ms 即时切片)');
    baselineCount = afterCategoryCount;

    console.log('\n[Phase 3] 测试情绪滤镜连续切换 (正面 -> 中性 -> 预警 -> 全部)...');
    const sentimentLabels = ['正面发展', '中性观察', '风险预警', '全部情绪'];

    for (const label of sentimentLabels) {
      const clicked = await page.evaluate((btnText) => {
        const buttons = Array.from(document.querySelectorAll('.filter-sentiment-btn'));
        const target = buttons.find(b => b.textContent.includes(btnText));
        if (target) {
          target.click();
          return true;
        }
        return false;
      }, label);

      assert.ok(clicked, `未找到情绪滤镜: ${label}`);
      await new Promise(r => setTimeout(r, 150));
    }

    const afterSentimentCount = newsApiRequests.length;
    const sentimentExtraRequests = afterSentimentCount - baselineCount;
    console.log(`   连续切换 4 次情绪滤镜后额外发起的 /api/news 请求数: ${sentimentExtraRequests}`);
    assert.strictEqual(sentimentExtraRequests, 0, `❌ 严重错误: 切换情绪产生了 ${sentimentExtraRequests} 次额外网络请求！预期必须为 0`);
    console.log('   ✅ 情绪过滤 0 网络请求验证通过 (纯前端 0ms 即时切片)');
    baselineCount = afterSentimentCount;

    console.log('\n[Phase 4] 测试关键词搜索与清空输入...');
    await page.type('.category-search-input', 'AI');
    await new Promise(r => setTimeout(r, 200));

    await page.evaluate(() => {
      const clearBtn = document.querySelector('.category-search-clear');
      if (clearBtn) clearBtn.click();
    });
    await new Promise(r => setTimeout(r, 200));

    const afterSearchCount = newsApiRequests.length;
    const searchExtraRequests = afterSearchCount - baselineCount;
    console.log(`   搜索输入与清空后额外发起的 /api/news 请求数: ${searchExtraRequests}`);
    assert.strictEqual(searchExtraRequests, 0, `❌ 严重错误: 关键词搜索产生了 ${searchExtraRequests} 次额外网络请求！预期必须为 0`);
    console.log('   ✅ 关键词搜索 0 网络请求验证通过 (纯前端 0ms 即时切片)');

    console.log('\n🎉 ========================================================');
    console.log('🎉 客户端全量内存缓存与 0ms 响应式过滤验证 100% 全部通过！');
    console.log('🎉 ========================================================\n');

  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
    console.log('🧹 浏览器与集成测试服务已干净释放。\n');
  }
}

verifyClientCache().catch((err) => {
  console.error('\n❌ 验证执行失败:', err);
  process.exit(1);
});

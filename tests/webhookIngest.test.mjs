import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { app } from '../server/mock-server.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Gemini Spark Webhook Ingest Endpoint', () => {
  const originalAdminKey = process.env.ADMIN_KEY;
  const TEST_KEY = 'test_webhook_secret_key_2026';
  process.env.ADMIN_KEY = TEST_KEY;

  after(() => {
    process.env.ADMIN_KEY = originalAdminKey;
    const testDates = ['2026-09-28', '2026-09-29', '2026-09-30'];
    for (const d of testDates) {
      const p = path.resolve(__dirname, `../data/briefings/${d}.json`);
      if (fs.existsSync(p)) {
        try { fs.unlinkSync(p); } catch {}
      }
    }
  });

  it('未提供鉴权密钥时应返回 HTTP 401', async () => {
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    try {
      const res = await fetch(`http://localhost:${port}/api/spark/webhook/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [] })
      });
      assert.strictEqual(res.status, 401);
      const json = await res.json();
      assert.strictEqual(json.code, 401);
      assert.match(json.message, /缺少鉴权密钥/);
    } finally {
      server.close();
    }
  });

  it('提供错误鉴权密钥 (wrong-secret-key) 时应安全拦截并返回 HTTP 401', async () => {
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    try {
      const res = await fetch(`http://localhost:${port}/api/spark/webhook/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': 'wrong-secret-key'
        },
        body: JSON.stringify({ items: [] })
      });
      assert.strictEqual(res.status, 401);
      const json = await res.json();
      assert.strictEqual(json.code, 401);
      assert.match(json.message, /鉴权密钥无效/);
    } finally {
      server.close();
    }
  });

  it('鉴权通过但 payload 为空 items: [] 时应返回 HTTP 400', async () => {
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    try {
      const res = await fetch(`http://localhost:${port}/api/spark/webhook/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': TEST_KEY
        },
        body: JSON.stringify({ items: [] })
      });
      assert.strictEqual(res.status, 400);
      const json = await res.json();
      assert.strictEqual(json.code, 400);
      assert.match(json.message, /至少一条 items 资讯/);
    } finally {
      server.close();
    }
  });

  it('支持通过 X-Admin-Key 请求头鉴权并成功接收纯净 JSON 简报', async () => {
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    const mockDate = '2026-09-28';
    const payload = {
      date: mockDate,
      batchStatus: {
        status: 'COMPLETED',
        generatedTime: `${mockDate} 08:30:00`,
        progress: 100
      },
      items: [
        {
          id: `webhook-${mockDate}-01`,
          title: '全球前沿 AI 算力与智能体架构新突破',
          category: 'ai',
          impactLevel: 'critical',
          summary: '测试生成的深度研报内容摘要。',
          sentiment: 'positive',
          sentimentScore: 0.9,
          tags: ['AI', 'Agent'],
          nlpKeyEntities: ['Gemini', 'Google']
        }
      ]
    };

    try {
      const res = await fetch(`http://localhost:${port}/api/spark/webhook/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': TEST_KEY
        },
        body: JSON.stringify(payload)
      });
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.code, 200);
      assert.strictEqual(json.data.date, mockDate);
      assert.strictEqual(json.data.total, 1);
    } finally {
      server.close();
    }
  });

  it('支持直接传入 Content-Type: text/plain 的原始 Markdown 文本并成功清洗入库 (HTTP 200)', async () => {
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    const mockDate = '2026-09-30';
    const rawMarkdownText = `
这里是来自 Gemini Spark 定时任务的分析简报：
\`\`\`json
{
  "batchStatus": {
    "status": "COMPLETED",
    "generatedTime": "${mockDate} 08:30:00",
    "progress": 100
  },
  "items": [
    {
      "id": "raw-text-${mockDate}-01",
      "title": "原生文本流摄取与高容错 Markdown 清洗验证",
      "category": "tech",
      "impactLevel": "high",
      "summary": "验证 text/plain 原生传入模式解析入库正常。",
      "sentiment": "positive",
      "sentimentScore": 0.88,
      "tags": ["Webhook", "TextPlain"],
      "nlpKeyEntities": ["Express", "Gemini"]
    }
  ]
}
\`\`\`
简报结束。
`;

    try {
      const res = await fetch(`http://localhost:${port}/api/spark/webhook/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'X-Admin-Key': TEST_KEY
        },
        body: rawMarkdownText
      });
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.code, 200);
      assert.strictEqual(json.data.date, mockDate);
      assert.strictEqual(json.data.total, 1);
    } finally {
      server.close();
    }
  });

  it('支持通过 URL Query ?key= 鉴权并容错清洗包含 ```json Markdown 代码块的内容', async () => {
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    const mockDate = '2026-09-29';
    const rawMarkdownText = `
这里是来自 Gemini Spark 定时任务的分析简报：
\`\`\`json
{
  "batchStatus": {
    "status": "COMPLETED",
    "generatedTime": "${mockDate} 08:30:00",
    "progress": 100
  },
  "items": [
    {
      "id": "item-${mockDate}-01",
      "title": "全球宏观金融与地缘避险流动性分析",
      "category": "finance",
      "impactLevel": "high",
      "summary": "金融流动性研报摘要。",
      "sentiment": "neutral",
      "sentimentScore": 0.1,
      "tags": ["Finance"],
      "nlpKeyEntities": ["Fed"]
    }
  ]
}
\`\`\`
以上简报已生成完毕。
`;

    try {
      const res = await fetch(`http://localhost:${port}/api/spark/webhook/ingest?key=${TEST_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawContent: rawMarkdownText })
      });
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.code, 200);
      assert.strictEqual(json.data.date, mockDate);
      assert.strictEqual(json.data.total, 1);
    } finally {
      server.close();
    }
  });

  it('投递无任何有效新闻条目时应拦截并返回 HTTP 400', async () => {
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    try {
      const res = await fetch(`http://localhost:${port}/api/spark/webhook/ingest?key=${TEST_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawContent: '这不是一个合法的简报' })
      });
      assert.strictEqual(res.status, 400);
      const json = await res.json();
      assert.strictEqual(json.code, 400);
    } finally {
      server.close();
    }
  });
});

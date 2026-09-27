import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { app } from '../server/mock-server.mjs';

describe('Gemini Spark Webhook Ingest Endpoint', () => {
  const TEST_KEY = 'test_webhook_secret_key_2026';
  process.env.ADMIN_KEY = TEST_KEY;

  it('未提供鉴权密钥或密钥错误时应返回 HTTP 401', async () => {
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

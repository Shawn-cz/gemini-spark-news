import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDailyNobelQuote, NOBEL_QUOTES_ARCHIVE } from '../server/services/nobelQuoteService.mjs';
import { saveBriefing, getBatchStatus, getNewsList } from '../server/repository.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_DATE_1 = '2099-01-01';
const TEST_DATE_2 = '2099-01-02';
const TEST_FILE_1 = path.resolve(__dirname, `../data/briefings/${TEST_DATE_1}.json`);
const TEST_FILE_2 = path.resolve(__dirname, `../data/briefings/${TEST_DATE_2}.json`);

describe('Nobel Quote Pipeline & Persistence Suite', () => {
  after(() => {
    // 清理测试生成的临时物理归档文件
    if (fs.existsSync(TEST_FILE_1)) fs.unlinkSync(TEST_FILE_1);
    if (fs.existsSync(TEST_FILE_2)) fs.unlinkSync(TEST_FILE_2);
  });

  test('1. 确定性哈希派发算法：同日期绝对幂等且结构完整', () => {
    const quoteA = getDailyNobelQuote('2026-10-14');
    const quoteB = getDailyNobelQuote('2026-10-14');

    assert.equal(quoteA.zh, quoteB.zh, '相同日期派发的中文名言必须完全一致');
    assert.equal(quoteA.author, quoteB.author, '相同日期派发的作者必须完全一致');
    assert.equal(quoteA.work, quoteB.work, '相同日期派发的代表作品必须完全一致');
    assert.equal(quoteA.batchDate, '2026-10-14');
    assert.ok(quoteA.year.includes('诺贝尔文学奖'));
    assert.ok(typeof quoteA.en === 'string' && quoteA.en.length > 0);
  });

  test('2. 确定性哈希派发算法：不同日期能够命中智库中不同名言', () => {
    const q1 = getDailyNobelQuote('2026-09-01');
    const q2 = getDailyNobelQuote('2026-09-02');
    const q3 = getDailyNobelQuote('2026-09-03');

    // 至少应产生多样性
    const set = new Set([q1.author, q2.author, q3.author]);
    assert.ok(set.size >= 2, '连续不同日期应能派发不同的大师名言');
  });

  test('3. saveBriefing 双写持久化：未显式提供名言时自动调用确定性引擎补齐并持久化', async () => {
    const mockPayload = {
      items: [
        {
          id: `gemini-${TEST_DATE_1}-001`,
          title: '前沿 AI 芯片制程与算力架构突破',
          category: 'ai',
          impactLevel: 'critical',
          summary: '深度自包含研报内容...',
          sentiment: 'positive',
          sentimentScore: 0.8
        }
      ]
    };

    const saveRes = await saveBriefing(TEST_DATE_1, mockPayload);
    assert.ok(saveRes.nobelQuote, 'saveBriefing 返回值必须包含自动补齐的 nobelQuote');
    assert.equal(saveRes.nobelQuote.batchDate, TEST_DATE_1);

    // 验证物理文件是否存在并持久化写入了 nobelQuote
    assert.ok(fs.existsSync(TEST_FILE_1), '本地 briefing 文件必须成功创建');
    const diskContent = JSON.parse(fs.readFileSync(TEST_FILE_1, 'utf-8'));
    assert.ok(diskContent.nobelQuote, '本地持久化 JSON 必须包含 nobelQuote 字段');
    assert.equal(diskContent.nobelQuote.zh, saveRes.nobelQuote.zh);

    // 验证 getBatchStatus 能够读出该持久化名言
    const status = await getBatchStatus(TEST_DATE_1);
    assert.ok(status.nobelQuote, 'getBatchStatus 必须返回固化的 nobelQuote');
    assert.equal(status.nobelQuote.zh, saveRes.nobelQuote.zh);

    // 验证 getNewsList 能够读出该持久化名言
    const newsRes = await getNewsList({ date: TEST_DATE_1 });
    assert.ok(newsRes.nobelQuote, 'getNewsList 必须返回固化的 nobelQuote');
    assert.equal(newsRes.nobelQuote.zh, saveRes.nobelQuote.zh);
  });

  test('4. saveBriefing 双写持久化：支持保留外部传入的自定义诺奖名言', async () => {
    const customQuote = {
      year: '1957 诺贝尔文学奖',
      author: '阿尔贝·加缪',
      work: '局外人',
      enAuthor: 'Albert Camus',
      enWork: 'The Stranger',
      zh: '“今天，妈妈死了。也许是昨天，我不知道。”',
      en: '“Mother died today. Or maybe yesterday; I can\'t be sure.”',
      batchDate: TEST_DATE_2
    };

    const mockPayload = {
      nobelQuote: customQuote,
      items: [
        {
          id: `gemini-${TEST_DATE_2}-001`,
          title: '全球宏观资本与清洁能源投资动态',
          category: 'finance',
          impactLevel: 'high',
          summary: '金融研报内容...',
          sentiment: 'neutral',
          sentimentScore: 0.1
        }
      ]
    };

    const saveRes = await saveBriefing(TEST_DATE_2, mockPayload);
    assert.ok(saveRes.nobelQuote, 'saveBriefing 必须保留自定义名言');
    assert.equal(saveRes.nobelQuote.zh, customQuote.zh);

    // 验证物理文件中存储的是自定义名言
    const diskContent = JSON.parse(fs.readFileSync(TEST_FILE_2, 'utf-8'));
    assert.equal(diskContent.nobelQuote.zh, customQuote.zh);

    // 验证查询接口读取自定义名言
    const status = await getBatchStatus(TEST_DATE_2);
    assert.equal(status.nobelQuote.zh, customQuote.zh);
    assert.equal(status.nobelQuote.work, '局外人');
  });
});

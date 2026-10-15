import { test } from 'node:test';
import assert from 'node:assert/strict';
import { searchCrossArchiveNews } from '../server/repository.mjs';

test('Cross-Archive Search - 关键词跨批次检索与元数据装配', async () => {
  // 1. 检索全球 AI / 算力通用词
  const res = await searchCrossArchiveNews({ query: 'AI', limit: 10 });
  assert.equal(typeof res.total, 'number');
  assert.ok(Array.isArray(res.items));
  assert.equal(res.query, 'AI');
  
  if (res.items.length > 0) {
    const item = res.items[0];
    assert.ok(item.id, '命中项必须有 id');
    assert.ok(item.title, '命中项必须有 title');
    assert.ok(item.briefingDate, '命中项必须带有所属归档批次 briefingDate');
  }

  // 2. 空检索词或无意义空白字符防御
  const emptyRes = await searchCrossArchiveNews({ query: '   ', limit: 10 });
  assert.equal(emptyRes.total, 0);
  assert.deepEqual(emptyRes.items, []);

  // 3. 边界限制：最大条目数限制 (limit clamp)
  const clampedRes = await searchCrossArchiveNews({ query: 'AI', limit: 999 });
  assert.ok(clampedRes.items.length <= 50, '单次跨期检索最大限制为 50 条');
});

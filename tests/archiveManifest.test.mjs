import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getArchiveManifest, invalidateArchiveManifestCache } from '../server/repository.mjs';

test('Archive Manifest - 结构完整性与毫秒级轻量索引', async () => {
  invalidateArchiveManifestCache();
  const manifest = await getArchiveManifest();

  assert.ok(manifest, 'Manifest 对象必须存在');
  assert.ok(Array.isArray(manifest.availableDates), 'availableDates 必须为数组');
  assert.ok(manifest.availableDates.length > 0, '归档日期不能为空');
  assert.equal(typeof manifest.latestDate, 'string');
  assert.ok(Array.isArray(manifest.years), 'years 必须为数组');
  assert.ok(manifest.years.length > 0, 'years 必须非空');
  assert.ok(manifest.monthMapByYear, 'monthMapByYear 必须存在');
  assert.ok(manifest.totalCountByYear, 'totalCountByYear 必须存在');
  assert.ok(manifest.lastUpdated, 'lastUpdated 时间戳必须存在');

  // 校验年份下月份结构
  const latestYear = manifest.years[0];
  const months = manifest.monthMapByYear[latestYear];
  assert.ok(Array.isArray(months), '年份下月份必须为数组');
  if (months.length > 0) {
    assert.ok(months[0].month, '月份标识必须存在');
    assert.ok(months[0].label, '月份显示标签必须存在');
    assert.equal(typeof months[0].count, 'number');
  }

  // 第二次读取应命中内存缓存
  const start = performance.now();
  const cachedManifest = await getArchiveManifest();
  const duration = performance.now() - start;
  assert.deepEqual(cachedManifest.availableDates, manifest.availableDates);
  assert.ok(duration < 15, `缓存命中耗时应低于 15ms，实际: ${duration}ms`);
});

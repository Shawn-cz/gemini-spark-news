import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 动态读取并编译 src/utils/dateGrouping.ts，确保测试套件直接验证核心源码
const tsFilePath = path.resolve(__dirname, '../src/utils/dateGrouping.ts');
const tsCode = fs.readFileSync(tsFilePath, 'utf8');
const jsCode = ts.transpileModule(tsCode, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { 
  groupDatesByYearAndMonth, 
  filterAndPaginateDates 
} = await import(`data:text/javascript;base64,${Buffer.from(jsCode).toString('base64')}`);

const mockDates = [
  '2026-10-14',
  '2026-10-13',
  '2026-10-12',
  '2026-10-11',
  '2026-10-10',
  '2026-10-09',
  '2026-10-08',
  '2026-09-27',
  '2026-09-26',
  '2026-09-25',
  '2025-12-31',
  '2025-12-30'
];

test('Date Grouping - 正确提取年份与对应实际有效月份', () => {
  const groups = groupDatesByYearAndMonth(mockDates);
  assert.equal(groups.years.length, 2);
  assert.deepEqual(groups.years, ['2026', '2025']);

  // 2026 年包含 10月 (7期) 与 09月 (3期)
  const months2026 = groups.monthMapByYear['2026'];
  assert.equal(months2026.length, 2);
  assert.equal(months2026[0].month, '10');
  assert.equal(months2026[0].count, 7);
  assert.equal(months2026[1].month, '09');
  assert.equal(months2026[1].count, 3);

  // 2025 年包含 12月 (2期)
  const months2025 = groups.monthMapByYear['2025'];
  assert.equal(months2025.length, 1);
  assert.equal(months2025[0].month, '12');
  assert.equal(months2025[0].count, 2);
});

test('Date Grouping - 年份和月份过滤及固定每页 6 条分页切片', () => {
  // 1. 2026 年全月（共 10 条）：第 1 页应展示 6 条，总页数为 2
  const page1 = filterAndPaginateDates(mockDates, {
    year: '2026',
    month: 'all',
    page: 1,
    pageSize: 6
  });
  assert.equal(page1.totalCount, 10);
  assert.equal(page1.totalPages, 2);
  assert.equal(page1.pagedDates.length, 6);
  assert.equal(page1.pagedDates[0], '2026-10-14');
  assert.equal(page1.pagedDates[5], '2026-10-09');

  // 第 2 页展示剩余 4 条
  const page2 = filterAndPaginateDates(mockDates, {
    year: '2026',
    month: 'all',
    page: 2,
    pageSize: 6
  });
  assert.equal(page2.pagedDates.length, 4);
  assert.equal(page2.pagedDates[0], '2026-10-08');

  // 2. 指定月份：2026-09（共 3 条），单页即可展示完全，总页数为 1
  const sepRes = filterAndPaginateDates(mockDates, {
    year: '2026',
    month: '09',
    page: 1,
    pageSize: 6
  });
  assert.equal(sepRes.totalCount, 3);
  assert.equal(sepRes.totalPages, 1);
  assert.equal(sepRes.pagedDates.length, 3);
  assert.equal(sepRes.pagedDates[0], '2026-09-27');
});

test('Date Grouping - 边界保护与防非法输入容错', () => {
  const emptyRes = filterAndPaginateDates([], { year: '2026', month: 'all', page: 1 });
  assert.equal(emptyRes.totalCount, 0);
  assert.equal(emptyRes.totalPages, 1);
  assert.deepEqual(emptyRes.pagedDates, []);

  // 页码超出范围自动规整
  const clampRes = filterAndPaginateDates(mockDates, { year: '2026', month: 'all', page: 99, pageSize: 6 });
  assert.equal(clampRes.currentPage, 2);
});

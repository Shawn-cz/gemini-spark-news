export interface MonthBucket {
  month: string;  // 两位月份，如 "10"
  label: string;  // 如 "10月"
  count: number;  // 批次期数
}

export interface DateGroupingResult {
  years: string[];
  monthMapByYear: Record<string, MonthBucket[]>;
  totalCountByYear: Record<string, number>;
}

export interface FilterDatesOptions {
  year?: string;
  month?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedDatesResult {
  filteredDates: string[];
  pagedDates: string[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

/**
 * 将平铺日期数组聚合为年份与月份桶
 */
export function groupDatesByYearAndMonth(dates: string[] = []): DateGroupingResult {
  const yearSet = new Set<string>();
  const yearMonthCounts: Record<string, Record<string, number>> = {};
  const yearTotals: Record<string, number> = {};

  for (const date of dates) {
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    const [year, month] = date.split('-');

    yearSet.add(year);
    yearTotals[year] = (yearTotals[year] || 0) + 1;

    if (!yearMonthCounts[year]) {
      yearMonthCounts[year] = {};
    }
    yearMonthCounts[year][month] = (yearMonthCounts[year][month] || 0) + 1;
  }

  // 年份严格降序
  const years = Array.from(yearSet).sort((a, b) => b.localeCompare(a));
  const monthMapByYear: Record<string, MonthBucket[]> = {};

  for (const y of years) {
    const monthObj = yearMonthCounts[y] || {};
    // 月份严格降序 (从12月到01月)
    const sortedMonths = Object.keys(monthObj).sort((a, b) => b.localeCompare(a));
    monthMapByYear[y] = sortedMonths.map(m => ({
      month: m,
      label: `${parseInt(m, 10)}月`,
      count: monthObj[m]
    }));
  }

  return {
    years,
    monthMapByYear,
    totalCountByYear: yearTotals
  };
}

/**
 * 根据年份、月份与页码执行内存切片过滤
 */
export function filterAndPaginateDates(
  dates: string[] = [],
  options: FilterDatesOptions = {}
): PaginatedDatesResult {
  if (!Array.isArray(dates) || dates.length === 0) {
    return {
      filteredDates: [],
      pagedDates: [],
      totalCount: 0,
      totalPages: 1,
      currentPage: 1,
      pageSize: options.pageSize || 6
    };
  }

  const {
    year,
    month = 'all',
    page = 1,
    pageSize = 6
  } = options;

  let filtered = dates;

  if (year) {
    filtered = filtered.filter(d => d.startsWith(`${year}-`));
  }

  if (month && month !== 'all') {
    const prefix = year ? `${year}-${month}-` : `-${month}-`;
    filtered = filtered.filter(d => d.includes(prefix));
  }

  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const startIndex = (currentPage - 1) * pageSize;
  const pagedDates = filtered.slice(startIndex, startIndex + pageSize);

  return {
    filteredDates: filtered,
    pagedDates,
    totalCount,
    totalPages,
    currentPage,
    pageSize
  };
}

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Sparkles, Check, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { groupDatesByYearAndMonth, filterAndPaginateDates } from '../utils/dateGrouping';

export interface DateStepperCapsuleProps {
  currentDate: string;
  availableDates: string[];
  onDateChange: (date: string) => void;
  isLoading?: boolean;
  hasNewerBatchAvailable?: boolean;
  onJumpToLatest?: () => void;
  onDismissNewerBatch?: () => void;
}

export const DateStepperCapsule: React.FC<DateStepperCapsuleProps> = ({
  currentDate,
  availableDates,
  onDateChange,
  isLoading = false,
  hasNewerBatchAvailable = false,
  onJumpToLatest,
  onDismissNewerBatch
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  const isIosGlass = theme === 'ios-glass' || theme === 'light';
  const isPopDopamine = theme === 'pop-dopamine' || theme === 'dopamine';
  const isCyberHud = theme === 'cyber-hud' || theme === 'dark' || (!isIosGlass && !isPopDopamine);

  // 聚合年份与月份数据
  const dateGroups = useMemo(() => groupDatesByYearAndMonth(availableDates), [availableDates]);
  const currentYear = currentDate ? currentDate.slice(0, 4) : '2026';

  // 年份与月份过滤及分页状态
  const [filterYear, setFilterYear] = useState<string>(() => {
    return dateGroups.years.includes(currentYear) ? currentYear : (dateGroups.years[0] || currentYear);
  });
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const pageSize = 6;

  // 当 availableDates 更新后，如果 filterYear 不在有效年份中，自动对齐
  useEffect(() => {
    if (dateGroups.years.length > 0 && !dateGroups.years.includes(filterYear)) {
      setFilterYear(dateGroups.years[0] || currentYear);
      setFilterMonth('all');
      setPage(1);
    }
  }, [dateGroups.years, filterYear, currentYear]);

  // 当 currentDate 变更时，如果其年份是有效年份且不同于 filterYear，同步 filterYear
  useEffect(() => {
    if (currentDate && currentDate.length >= 4) {
      const year = currentDate.slice(0, 4);
      if (dateGroups.years.includes(year) && year !== filterYear) {
        setFilterYear(year);
        setFilterMonth('all');
        setPage(1);
      }
    }
  }, [currentDate, dateGroups.years, filterYear]);

  const handleYearChange = (year: string) => {
    setFilterYear(year);
    setFilterMonth('all');
    setPage(1);
  };

  const handleMonthChange = (month: string) => {
    setFilterMonth(month);
    setPage(1);
  };

  // 计算当前分页结果
  const paginatedResult = useMemo(() => {
    return filterAndPaginateDates(availableDates, {
      year: filterYear,
      month: filterMonth,
      page,
      pageSize
    });
  }, [availableDates, filterYear, filterMonth, page, pageSize]);

  // 计算当前日期索引 (availableDates 严格降序：索引 0 为最新)
  const currentIndex = availableDates.indexOf(currentDate);
  const isLatest = currentIndex === 0 || (availableDates.length > 0 && currentDate >= availableDates[0]);
  const isEarliest = (currentIndex !== -1 && currentIndex === availableDates.length - 1) ||
    (availableDates.length > 0 && currentDate <= availableDates[availableDates.length - 1]);

  // 步进按钮禁用状态
  const canGoPrevious = !isLoading && !isEarliest && availableDates.length > 1; // 往更早的一天
  const canGoNext = !isLoading && !isLatest && availableDates.length > 1;         // 往更新的一天

  const handlePrevious = () => {
    if (!canGoPrevious) return;
    let nextIdx: number;
    if (currentIndex === -1) {
      nextIdx = availableDates.findIndex(d => d < currentDate);
      if (nextIdx === -1) nextIdx = availableDates.length - 1;
    } else {
      nextIdx = currentIndex + 1;
    }
    if (nextIdx >= 0 && nextIdx < availableDates.length) {
      onDateChange(availableDates[nextIdx]);
    }
  };

  const handleNext = () => {
    if (!canGoNext) return;
    let nextIdx: number;
    if (currentIndex === -1) {
      const revIdx = [...availableDates].reverse().findIndex(d => d > currentDate);
      nextIdx = revIdx === -1 ? 0 : availableDates.length - 1 - revIdx;
    } else {
      nextIdx = currentIndex - 1;
    }
    if (nextIdx >= 0 && nextIdx < availableDates.length) {
      onDateChange(availableDates[nextIdx]);
    }
  };

  // 点击外部收起下拉菜单
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // 按 Esc 键收起下拉菜单
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // 当外部 hasNewerBatchAvailable 改变或日期改变时，重置本地已退出标记
  useEffect(() => {
    setIsDismissed(false);
  }, [hasNewerBatchAvailable, currentDate]);

  const handleDismiss = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsDismissed(true);
    if (onDismissNewerBatch) {
      onDismissNewerBatch();
    }
  };

  // 8秒自动倒计时退出机制：避免通知弹窗永久霸屏，提升浏览沉浸感
  useEffect(() => {
    if (hasNewerBatchAvailable && !isLatest && !isDismissed) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [hasNewerBatchAvailable, isLatest, isDismissed]);

  return (
    <div ref={containerRef} className="relative inline-flex items-center select-none font-mono flex-shrink-0 whitespace-nowrap">
      {/* 实体胶囊主外壳 (与分类胶囊完美高度对齐与主题协调) */}
      <div className={`date-stepper-capsule flex items-center p-0.5 whitespace-nowrap flex-shrink-0 transition-all ${
        isPopDopamine
          ? 'bg-white text-slate-900 rounded-xl border-[2px] border-slate-900 shadow-[2px_2px_0px_0px_#111827]'
          : isIosGlass
          ? 'bg-white text-slate-900 rounded-lg border border-slate-300 shadow-sm'
          : 'bg-slate-950 text-cyan-300 rounded-lg border border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
      }`}>
        {/* 左箭头：前一日 (更早) */}
        <button
          type="button"
          onClick={handlePrevious}
          disabled={!canGoPrevious}
          title={canGoPrevious ? "查看前一日历史简报" : "已是系统内最早归档简报"}
          className={`stepper-btn-prev p-1.5 rounded transition-all duration-150 flex items-center justify-center flex-shrink-0 ${
            canGoPrevious
              ? isPopDopamine
                ? 'hover:bg-slate-100 active:translate-y-0.5 cursor-pointer text-slate-900'
                : isIosGlass
                ? 'hover:bg-slate-100 active:translate-y-0.5 cursor-pointer text-slate-800'
                : 'hover:bg-cyan-500/20 active:translate-y-0.5 cursor-pointer text-cyan-400'
              : 'opacity-30 cursor-not-allowed text-slate-400'
          }`}
          aria-label="前一日"
        >
          <ChevronLeft className="w-4 h-4 flex-shrink-0" />
        </button>

        {/* 中间日期徽章按钮：展开日期下拉列表 */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={`stepper-btn-date px-2 py-1 text-xs font-bold tracking-wider flex items-center gap-1.5 rounded transition-colors cursor-pointer flex-shrink-0 whitespace-nowrap ${
            isPopDopamine
              ? 'hover:bg-slate-100 text-slate-900'
              : isIosGlass
              ? 'hover:bg-slate-100 text-slate-900'
              : 'hover:bg-white/10 text-white'
          }`}
          title="点击展开选择历史简报日期"
        >
          <Calendar className={`stepper-icon-calendar w-3.5 h-3.5 flex-shrink-0 ${
            isPopDopamine ? 'text-pink-500' : isIosGlass ? 'text-blue-600' : 'text-cyan-400'
          }`} />
          <span className="stepper-date-text whitespace-nowrap font-mono">{currentDate}</span>
          {isLatest ? (
            <span className={`badge-status badge-status-latest text-[10px] font-black px-1.5 py-0.2 rounded uppercase tracking-tighter whitespace-nowrap flex-shrink-0 ${
              isPopDopamine
                ? 'bg-emerald-500 text-black border border-slate-900 shadow-[1px_1px_0px_#000]'
                : isIosGlass
                ? 'bg-blue-600 text-white'
                : 'bg-emerald-500 text-black'
            }`}>
              最新
            </span>
          ) : (
            <span className={`badge-status badge-status-archive text-[10px] font-medium px-1.5 py-0.2 rounded uppercase tracking-tighter whitespace-nowrap flex-shrink-0 ${
              isPopDopamine
                ? 'bg-slate-200 text-slate-800'
                : isIosGlass
                ? 'bg-slate-100 text-slate-600 border border-slate-200'
                : 'bg-slate-800 text-slate-300'
            }`}>
              归档
            </span>
          )}
        </button>

        {/* 右箭头：后一日 (更新) */}
        <button
          type="button"
          onClick={handleNext}
          disabled={!canGoNext}
          title={canGoNext ? "查看后一日简报" : "已是最新批次简报"}
          className={`stepper-btn-next p-1.5 rounded transition-all duration-150 flex items-center justify-center flex-shrink-0 ${
            canGoNext
              ? isPopDopamine
                ? 'hover:bg-slate-100 active:translate-y-0.5 cursor-pointer text-slate-900'
                : isIosGlass
                ? 'hover:bg-slate-100 active:translate-y-0.5 cursor-pointer text-slate-800'
                : 'hover:bg-cyan-500/20 active:translate-y-0.5 cursor-pointer text-cyan-400'
              : 'opacity-30 cursor-not-allowed text-slate-400'
          }`}
          aria-label="后一日"
        >
          <ChevronRight className="w-4 h-4 flex-shrink-0" />
        </button>
      </div>

      {/* 下拉历史日期微胶囊与分页选择列表浮层 */}
      {isOpen && (
        <div className={`date-stepper-dropdown absolute top-full left-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-24px)] z-50 p-2 rounded-xl flex flex-col gap-2 select-none ${
          isPopDopamine
            ? 'bg-white text-slate-900 border-2 border-slate-900 shadow-[4px_4px_0px_#000]'
            : isIosGlass
            ? 'bg-white/95 text-slate-900 border border-slate-200 shadow-xl backdrop-blur-md'
            : 'bg-slate-900 text-white border border-cyan-500/50 shadow-[0_0_15px_rgba(0,240,255,0.3)]'
        }`}>
          {/* Row 1: Header */}
          <div className={`date-dropdown-header px-1 py-1 text-xs font-bold border-b flex items-center justify-between gap-2 ${
            isPopDopamine
              ? 'text-slate-800 border-slate-200'
              : isIosGlass
              ? 'text-slate-700 border-slate-100'
              : 'text-slate-300 border-white/10'
          }`}>
            <div className="flex items-center gap-1.5">
              <span>📅 历史归档库</span>
            </div>
            <div className="flex items-center gap-2">
              {dateGroups.years.length > 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    const currentIdx = dateGroups.years.indexOf(filterYear);
                    const nextIdx = (currentIdx + 1) % dateGroups.years.length;
                    handleYearChange(dateGroups.years[nextIdx]);
                  }}
                  title="点击切换年份"
                  className={`year-switch-btn px-1.5 py-0.5 rounded text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                    isPopDopamine
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-900 shadow-[1px_1px_0px_#000]'
                      : isIosGlass
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                      : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40'
                  }`}
                >
                  <span>{filterYear}年</span>
                  <span className="text-[10px]">▾</span>
                </button>
              ) : (
                <span className="font-bold text-xs">{filterYear}年</span>
              )}
              <span className="text-[11px] font-mono opacity-75 whitespace-nowrap">
                {paginatedResult.totalCount} 批次
              </span>
            </div>
          </div>

          {/* Row 2: Month Filter Pills (水平滑动微胶囊栏) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none min-w-0">
            <button
              type="button"
              onClick={() => handleMonthChange('all')}
              className={`month-filter-pill month-pill-all px-2 py-0.5 rounded-full text-xs flex items-center gap-1 flex-shrink-0 transition-all cursor-pointer ${
                filterMonth === 'all'
                  ? isPopDopamine
                    ? 'bg-pink-500 text-white font-bold border border-slate-900 shadow-[1px_1px_0px_#000]'
                    : isCyberHud
                    ? 'bg-cyan-500 text-slate-950 font-bold border border-cyan-400'
                    : 'bg-blue-600 text-white font-semibold shadow-sm'
                  : isPopDopamine
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                  : isCyberHud
                  ? 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-cyan-500/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
              }`}
            >
              <span>全部</span>
              <span className={`text-[10px] px-1 py-0.2 rounded-full font-mono ${
                filterMonth === 'all'
                  ? isCyberHud
                    ? 'bg-slate-950/20 text-slate-950'
                    : 'bg-black/20 text-white'
                  : isCyberHud
                  ? 'bg-white/10 text-cyan-300'
                  : 'bg-slate-200 text-slate-600'
              }`}>
                {dateGroups.totalCountByYear[filterYear] || availableDates.length}
              </span>
            </button>

            {(dateGroups.monthMapByYear[filterYear] || []).map((m) => {
              const isActive = filterMonth === m.month;
              return (
                <button
                  key={m.month}
                  type="button"
                  data-month={m.month}
                  onClick={() => handleMonthChange(m.month)}
                  className={`month-filter-pill px-2 py-0.5 rounded-full text-xs flex items-center gap-1 flex-shrink-0 transition-all cursor-pointer ${
                    isActive
                      ? isPopDopamine
                        ? 'bg-pink-500 text-white font-bold border border-slate-900 shadow-[1px_1px_0px_#000]'
                        : isCyberHud
                        ? 'bg-cyan-500 text-slate-950 font-bold border border-cyan-400'
                        : 'bg-blue-600 text-white font-semibold shadow-sm'
                      : isPopDopamine
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                      : isCyberHud
                      ? 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-cyan-500/20'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
                  }`}
                >
                  <span>{m.label}</span>
                  <span className={`text-[10px] px-1 py-0.2 rounded-full font-mono ${
                    isActive
                      ? isCyberHud
                        ? 'bg-slate-950/20 text-slate-950'
                        : 'bg-black/20 text-white'
                      : isCyberHud
                      ? 'bg-white/10 text-cyan-300'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {m.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Row 3: Paged Date List (固定 6 条) */}
          <div className="flex flex-col gap-1 min-h-[204px]">
            {paginatedResult.pagedDates.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-xs opacity-60 py-8 font-mono">
                当前月份暂无归档
              </div>
            ) : (
              paginatedResult.pagedDates.map((date, idx) => {
                const isSelected = date === currentDate;
                const isDateLatest = idx === 0 && page === 1 && filterMonth === 'all';

                return (
                  <button
                    key={date}
                    type="button"
                    data-date={date}
                    onClick={() => {
                      onDateChange(date);
                      setIsOpen(false);
                    }}
                    className={`date-dropdown-item w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors font-mono cursor-pointer ${
                      isSelected
                        ? isPopDopamine
                          ? 'bg-pink-100 text-pink-700 font-bold border border-pink-300'
                          : isIosGlass
                          ? 'bg-blue-50 text-blue-600 font-bold border border-blue-200'
                          : 'is-selected bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                        : isPopDopamine
                        ? 'hover:bg-slate-100 text-slate-800'
                        : isIosGlass
                        ? 'hover:bg-slate-100 text-slate-700'
                        : 'hover:bg-white/10 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 opacity-60 flex-shrink-0" />
                      <span>{date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isDateLatest && (
                        <span className={`text-[9px] px-1 rounded flex-shrink-0 font-bold ${
                          isPopDopamine
                            ? 'bg-emerald-500/20 text-emerald-700 border border-emerald-400'
                            : isIosGlass
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                        }`}>
                          LATEST
                        </span>
                      )}
                      {isSelected && (
                        <Check className={`w-3.5 h-3.5 flex-shrink-0 ${
                          isPopDopamine ? 'text-pink-600' : isIosGlass ? 'text-blue-600' : 'text-cyan-400'
                        }`} />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Row 4: Micro Pagination Controls (底部微型分页器) */}
          {paginatedResult.totalPages > 1 && (
            <div className={`date-dropdown-pagination flex items-center justify-between pt-1.5 border-t text-xs font-mono select-none ${
              isPopDopamine
                ? 'border-slate-200 text-slate-700'
                : isIosGlass
                ? 'border-slate-100 text-slate-600'
                : 'border-white/10 text-slate-400'
            }`}>
              <button
                type="button"
                disabled={paginatedResult.currentPage <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className={`pagination-btn-prev px-2.5 py-0.5 rounded cursor-pointer transition-colors font-bold text-xs ${
                  paginatedResult.currentPage <= 1
                    ? 'opacity-30 cursor-not-allowed text-slate-400'
                    : isPopDopamine
                    ? 'hover:bg-slate-100 active:translate-y-0.5 text-slate-900'
                    : isIosGlass
                    ? 'hover:bg-slate-100 active:translate-y-0.5 text-slate-800'
                    : 'hover:bg-white/10 active:translate-y-0.5 text-cyan-300'
                }`}
                aria-label="上一页"
                title="上一页"
              >
                &lt;
              </button>

              <span className="text-[11px] font-mono opacity-80">
                第 {paginatedResult.currentPage} / {paginatedResult.totalPages} 页
              </span>

              <button
                type="button"
                disabled={paginatedResult.currentPage >= paginatedResult.totalPages}
                onClick={() => setPage(p => Math.min(paginatedResult.totalPages, p + 1))}
                className={`pagination-btn-next px-2.5 py-0.5 rounded cursor-pointer transition-colors font-bold text-xs ${
                  paginatedResult.currentPage >= paginatedResult.totalPages
                    ? 'opacity-30 cursor-not-allowed text-slate-400'
                    : isPopDopamine
                    ? 'hover:bg-slate-100 active:translate-y-0.5 text-slate-900'
                    : isIosGlass
                    ? 'hover:bg-slate-100 active:translate-y-0.5 text-slate-800'
                    : 'hover:bg-white/10 active:translate-y-0.5 text-cyan-300'
                }`}
                aria-label="下一页"
                title="下一页"
              >
                &gt;
              </button>
            </div>
          )}
        </div>
      )}

      {/* 实时新批次漂浮轻提示 (当用户回溯历史，且后台生成完毕最新批次时呈现；支持手动点击关闭与8秒自动退出) */}
      {!isOpen && hasNewerBatchAvailable && !isLatest && !isDismissed && onJumpToLatest && (
        <div className="absolute top-full left-0 mt-2 z-40 flex items-center shadow-[3px_3px_0px_#000] rounded-md border-2 border-black bg-amber-400 text-black font-mono overflow-hidden whitespace-nowrap animate-in fade-in zoom-in-95 duration-200">
          <button
            type="button"
            onClick={() => {
              handleDismiss();
              onJumpToLatest();
            }}
            className="flex items-center gap-1.5 font-bold text-xs px-2.5 py-1.5 hover:bg-amber-300 active:translate-y-0.5 transition-all cursor-pointer"
            title="点击切换到刚刚生成的今日最新批次"
          >
            <Sparkles className="w-3.5 h-3.5 text-black flex-shrink-0" />
            <span>今日最新研报已就绪 · 点击查看</span>
          </button>
          
          <button
            type="button"
            onClick={handleDismiss}
            className="px-2 py-1.5 border-l-2 border-black hover:bg-amber-500 text-black/80 hover:text-black transition-colors cursor-pointer flex items-center justify-center flex-shrink-0"
            title="关闭并退出提示"
            aria-label="关闭并退出提示"
          >
            <X className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      )}
    </div>
  );
};

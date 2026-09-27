import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Sparkles, Check } from 'lucide-react';

export interface DateStepperCapsuleProps {
  currentDate: string;
  availableDates: string[];
  onDateChange: (date: string) => void;
  isLoading?: boolean;
  hasNewerBatchAvailable?: boolean;
  onJumpToLatest?: () => void;
}

export const DateStepperCapsule: React.FC<DateStepperCapsuleProps> = ({
  currentDate,
  availableDates,
  onDateChange,
  isLoading = false,
  hasNewerBatchAvailable = false,
  onJumpToLatest
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  return (
    <div ref={containerRef} className="relative inline-flex items-center select-none font-mono">
      {/* 实体胶囊主外壳 */}
      <div className="flex items-center bg-black/90 dark:bg-black/90 text-white rounded-lg p-0.5 border-2 border-black dark:border-cyan-500/40 shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_rgba(6,182,212,0.3)]">
        {/* 左箭头：前一日 (更早) */}
        <button
          type="button"
          onClick={handlePrevious}
          disabled={!canGoPrevious}
          title={canGoPrevious ? "查看前一日历史简报" : "已是系统内最早归档简报"}
          className={`p-1.5 rounded transition-all duration-150 flex items-center justify-center ${
            canGoPrevious
              ? 'hover:bg-white/20 active:translate-y-0.5 cursor-pointer text-white'
              : 'opacity-30 cursor-not-allowed text-white/50'
          }`}
          aria-label="前一日"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* 中间日期徽章按钮：展开日期下拉列表 */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className="px-2.5 py-1 text-xs font-bold tracking-wider flex items-center gap-1.5 hover:bg-white/10 rounded transition-colors cursor-pointer text-white"
          title="点击展开选择历史简报日期"
        >
          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
          <span>{currentDate}</span>
          {isLatest ? (
            <span className="text-[10px] bg-emerald-500 text-black font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">
              最新
            </span>
          ) : (
            <span className="text-[10px] bg-slate-700 text-white font-medium px-1.5 py-0.5 rounded uppercase tracking-tighter">
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
          className={`p-1.5 rounded transition-all duration-150 flex items-center justify-center ${
            canGoNext
              ? 'hover:bg-white/20 active:translate-y-0.5 cursor-pointer text-white'
              : 'opacity-30 cursor-not-allowed text-white/50'
          }`}
          aria-label="后一日"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 下拉历史日期选择列表浮层 */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-56 max-h-64 overflow-y-auto bg-slate-900 dark:bg-slate-900 text-white border-2 border-black dark:border-cyan-500/50 rounded-lg shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_rgba(6,182,212,0.4)] z-50 p-1.5 flex flex-col gap-1">
          <div className="px-2 py-1 text-[11px] font-bold text-slate-400 dark:text-cyan-400/80 border-b border-white/10 flex items-center justify-between">
            <span>历史简报归档库</span>
            <span className="text-[10px] opacity-75">{availableDates.length} 批次</span>
          </div>

          {availableDates.map((date, idx) => {
            const isSelected = date === currentDate;
            const isDateLatest = idx === 0;

            return (
              <button
                key={date}
                type="button"
                onClick={() => {
                  onDateChange(date);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded text-xs flex items-center justify-between transition-colors font-mono cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                    : 'hover:bg-white/10 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 opacity-60" />
                  <span>{date}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {isDateLatest && (
                    <span className="text-[9px] bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 px-1 rounded">
                      LATEST
                    </span>
                  )}
                  {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* 实时新批次漂浮轻提示 (当用户回溯历史，且后台生成完毕最新批次时呈现) */}
      {!isOpen && hasNewerBatchAvailable && onJumpToLatest && (
        <div className="absolute top-full right-0 mt-2 z-40 whitespace-nowrap">
          <button
            type="button"
            onClick={onJumpToLatest}
            className="flex items-center gap-1.5 bg-amber-400 text-black font-mono font-bold text-xs px-2.5 py-1 rounded-md border-2 border-black shadow-[3px_3px_0px_#000] hover:bg-amber-300 active:translate-y-0.5 transition-all animate-bounce cursor-pointer"
            title="点击切换到刚刚生成的今日最新批次"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>今日最新研报已就绪 · 点击查看</span>
          </button>
        </div>
      )}
    </div>
  );
};

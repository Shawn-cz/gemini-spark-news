import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  total,
  pageSize,
  onPageChange
}) => {
  if (totalPages <= 1) return null;

  const startIdx = (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(currentPage * pageSize, total);

  return (
    <div className="pagination-container flex flex-col sm:flex-row items-center justify-between gap-3 mt-8 pt-6 border-t border-white/10 font-mono text-xs">
      
      {/* 统计信息 */}
      <div className="pagination-stat text-slate-400">
        DISPLAYING <span className="font-bold text-cyan-400">{startIdx}-{endIdx}</span> OF{' '}
        <span className="font-bold text-white">{total}</span> GLOBAL INTELLIGENCE ITEMS
      </div>

      {/* 翻页按钮组 */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="pagination-arrow-btn p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition"
          title="上一页"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              type="button"
              onClick={() => onPageChange(pageNum)}
              className={`pagination-page-btn min-w-8 h-8 px-2 rounded-lg text-xs font-mono font-semibold transition ${
                pageNum === currentPage
                  ? 'pagination-page-active bg-cyan-500 text-obsidian-950 font-bold shadow-glow-blue'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {pageNum}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="pagination-arrow-btn p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition"
          title="下一页"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};

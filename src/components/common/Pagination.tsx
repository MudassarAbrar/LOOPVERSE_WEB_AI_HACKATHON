import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange
}) => {
  if (totalItems === 0) return null;

  const startIdx = (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 bg-[#F7F7F3] dark:bg-slate-900 border-t border-[#DDE3E8] dark:border-slate-800 text-xs text-[#68717D] dark:text-slate-400 font-ui">
      <div className="flex items-center gap-2">
        <span>
          Showing <span className="font-bold text-[#08090B] dark:text-slate-100">{startIdx}</span> to{' '}
          <span className="font-bold text-[#08090B] dark:text-slate-100">{endIdx}</span> of{' '}
          <span className="font-bold text-[#08090B] dark:text-slate-100">{totalItems}</span> results
        </span>
        {onPageSizeChange && (
          <div className="hidden md:flex items-center gap-1.5 ml-4">
            <label htmlFor="pageSizeSelect" className="text-xs">Per page:</label>
            <select
              id="pageSizeSelect"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              aria-label="Items per page"
              className="text-xs py-1 px-2.5 border border-[#DDE3E8] dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-[#08090B] dark:text-slate-200"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1.5 rounded-xl border border-[#DDE3E8] dark:border-slate-700 hover:bg-[#8ECCFF] hover:text-[#08090B] disabled:opacity-40 disabled:cursor-not-allowed text-[#08090B] dark:text-slate-300 transition"
          title="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="px-3 py-1 font-bold text-[#08090B] dark:text-slate-200 bg-white dark:bg-slate-800 rounded-xl border border-[#DDE3E8] dark:border-slate-700">
          Page {currentPage} of {Math.max(1, totalPages)}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-xl border border-[#DDE3E8] dark:border-slate-700 hover:bg-[#8ECCFF] hover:text-[#08090B] disabled:opacity-40 disabled:cursor-not-allowed text-[#08090B] dark:text-slate-300 transition"
          title="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

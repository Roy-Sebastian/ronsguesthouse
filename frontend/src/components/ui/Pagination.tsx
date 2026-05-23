import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange?: (newPage: number) => void;
}

export function Pagination({ page, limit, total, totalPages, onPageChange }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage < 1 || newPage > totalPages) return;
      if (onPageChange) {
        onPageChange(newPage);
        return;
      }
      const params = new URLSearchParams(searchParams);
      params.set('page', String(newPage));
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams, totalPages, onPageChange],
  );

  if (totalPages <= 1) return null;

  const startLabel = (page - 1) * limit + 1;
  const endLabel = Math.min(page * limit, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 bg-white border-t border-gray-100">
      <div className="text-sm font-medium text-gray-500">
        Menampilkan <span className="font-bold text-gray-900">{startLabel}</span> hingga <span className="font-bold text-gray-900">{endLabel}</span> dari <span className="font-bold text-gray-900">{total}</span> data
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => handlePageChange(1)}
          disabled={page === 1}
          className="p-1.5 min-w-[32px] min-h-[32px] text-gray-500 hover:bg-gray-100 hover:text-gray-900 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-gray-200 disabled:border-transparent flex items-center justify-center"
          title="First Page"
        >
          <ChevronsLeft size={16} />
        </button>
        <button
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1}
          className="p-1.5 min-w-[32px] min-h-[32px] text-gray-500 hover:bg-gray-100 hover:text-gray-900 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-gray-200 disabled:border-transparent flex items-center justify-center"
          title="Previous Page"
        >
          <ChevronLeft size={16} />
        </button>
        
        <div className="px-3 min-w-[80px] text-center text-sm font-semibold text-gray-700">
          Page {page} of {totalPages}
        </div>

        <button
          onClick={() => handlePageChange(page + 1)}
          disabled={page === totalPages}
          className="p-1.5 min-w-[32px] min-h-[32px] text-gray-500 hover:bg-gray-100 hover:text-gray-900 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-gray-200 disabled:border-transparent flex items-center justify-center"
          title="Next Page"
        >
          <ChevronRight size={16} />
        </button>
        <button
          onClick={() => handlePageChange(totalPages)}
          disabled={page === totalPages}
          className="p-1.5 min-w-[32px] min-h-[32px] text-gray-500 hover:bg-gray-100 hover:text-gray-900 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-gray-200 disabled:border-transparent flex items-center justify-center"
          title="Last Page"
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    </div>
  );
}

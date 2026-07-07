'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = buildPages(page, totalPages);

  return (
    <div className="flex items-center justify-center gap-0.5">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="flex h-8 w-8 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-30"
      >
        <ChevronLeft size={15} />
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span
            key={`dots-${i}`}
            className="flex h-8 w-8 items-center justify-center text-sm text-text-muted/50"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(Number(p))}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-xl text-sm font-medium transition-all',
              Number(p) === page
                ? 'bg-brand-500 text-white'
                : 'text-text-muted hover:bg-surface-muted hover:text-text-primary',
            )}
          >
            {p}
          </button>
        ),
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="flex h-8 w-8 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-30"
      >
        <ChevronRight size={15} />
      </button>
    </div>
  );
}

function buildPages(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | '...')[] = [];
  const delta = 2;

  pages.push(1);
  if (current > delta + 2) pages.push('...');
  for (
    let i = Math.max(2, current - delta);
    i <= Math.min(total - 1, current + delta);
    i++
  ) {
    pages.push(i);
  }
  if (current < total - delta - 1) pages.push('...');
  pages.push(total);

  return pages;
}

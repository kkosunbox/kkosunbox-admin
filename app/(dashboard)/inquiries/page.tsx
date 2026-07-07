'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ChevronRight, MessageSquare } from 'lucide-react';
import { inquiriesApi } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { INQUIRY_STATUS_MAP, formatDateTime, cn } from '@/lib/utils';
import type { Inquiry } from '@/types';

const STATUS_FILTERS = [
  { value: '', label: '전체' },
  { value: 'pending', label: '대기중' },
  { value: 'in_progress', label: '처리중' },
  { value: 'resolved', label: '해결됨' },
];

const LIMIT = 20;

export default function InquiriesPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['inquiries', page, statusFilter],
    queryFn: () =>
      inquiriesApi.getList({ page, limit: LIMIT, status: statusFilter || undefined }),
  });

  const inquiries: Inquiry[] = data?.items ?? [];
  const total: number = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5">
      <div className="card p-4">
        <div className="flex rounded-xl border border-border bg-surface-muted p-1 gap-1 w-fit">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setStatusFilter(f.value); setPage(1); }}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                statusFilter === f.value
                  ? 'bg-white text-text-primary shadow-card'
                  : 'text-text-muted hover:text-text-secondary',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-border px-5 py-3">
          <p className="text-sm text-text-secondary">
            총 <span className="font-bold text-text-primary">{total}</span>건
          </p>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" />
          </div>
        ) : inquiries.length === 0 ? (
          <EmptyState icon={MessageSquare} title="문의가 없습니다." />
        ) : (
          <div className="divide-y divide-border">
            {inquiries.map((inquiry) => {
              const isDeleted = inquiry.deletedAt !== null && inquiry.deletedAt !== undefined;
              const statusInfo = INQUIRY_STATUS_MAP[inquiry.status];
              const deletedInfo = INQUIRY_STATUS_MAP['deleted'];
              return (
                <Link
                  key={inquiry.id}
                  href={`/inquiries/${inquiry.id}`}
                  className={cn(
                    'flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-muted/50',
                    isDeleted && 'opacity-60',
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {isDeleted && deletedInfo && (
                        <Badge label={deletedInfo.label} color={deletedInfo.color} />
                      )}
                      {statusInfo && <Badge label={statusInfo.label} color={statusInfo.color} />}
                      <p className={cn('truncate font-medium text-text-primary', isDeleted && 'line-through')}>{inquiry.title}</p>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-text-muted">
                      <span>{inquiry.user?.email ?? '-'}</span>
                      <span>{formatDateTime(inquiry.createdAt)}</span>
                      {isDeleted && (
                        <span className="text-gray-400">삭제: {formatDateTime(inquiry.deletedAt)}</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} className="flex-shrink-0 text-text-muted" />
                </Link>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="border-t border-border px-5 py-4">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}

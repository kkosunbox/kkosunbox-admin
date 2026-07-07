'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CreditCard } from 'lucide-react';
import { subscriptionsApi } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { SubscriptionDetailModal } from '@/components/subscriptions/SubscriptionDetailModal';
import { SUBSCRIPTION_STATUS_MAP, formatCurrency, formatDate, cn } from '@/lib/utils';
import type { UserSubscription } from '@/types';

const STATUS_FILTERS = [
  { value: '', label: '전체' },
  { value: 'active', label: '구독중' },
  { value: 'cancelled', label: '취소됨' },
  { value: 'paymentFailed', label: '결제 실패' },
  { value: 'suspended', label: '정지' },
];

const LIMIT = 20;

export default function SubscriptionsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['subscriptions', page, statusFilter],
    queryFn: () =>
      subscriptionsApi.getList({
        page,
        limit: LIMIT,
        status: statusFilter || undefined,
      }),
  });

  const subscriptions: UserSubscription[] = data?.items ?? [];
  const total: number = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="filter-tabs w-fit">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => { setStatusFilter(f.value); setPage(1); }}
            className={cn('filter-tab', statusFilter === f.value && 'filter-tab-active')}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="border-b border-border px-5 py-3">
          <p className="text-sm text-text-secondary">
            총 <span className="font-bold text-text-primary">{total}</span>건
          </p>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="spinner" />
          </div>
        ) : subscriptions.length === 0 ? (
          <EmptyState icon={CreditCard} title="구독 내역이 없습니다." description="조건에 맞는 구독이 없어요." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-surface-muted">
                <tr>
                  <th className="table-th">ID</th>
                  <th className="table-th">고객</th>
                  <th className="table-th">플랜</th>
                  <th className="table-th">반려견</th>
                  <th className="table-th">상태</th>
                  <th className="table-th">수량</th>
                  <th className="table-th">다음 결제일</th>
                  <th className="table-th">월 청구액</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {subscriptions.map((sub) => {
                  const subStatus = SUBSCRIPTION_STATUS_MAP[sub.status];
                  return (
                    <tr
                      key={sub.id}
                      onClick={() => setSelectedId(sub.id)}
                      className="cursor-pointer transition-colors hover:bg-surface-muted/60 active:bg-surface-muted"
                    >
                      <td className="table-td font-mono text-xs text-text-muted">
                        #{sub.id}
                      </td>
                      <td className="table-td text-text-primary">
                        {sub.user?.email ?? '-'}
                      </td>
                      <td className="table-td font-medium text-text-primary">
                        {sub.plan?.name ?? '-'}
                      </td>
                      <td className="table-td text-text-secondary">
                        {sub.petProfile?.name ?? '-'}
                      </td>
                      <td className="table-td">
                        {sub.isPaused
                          ? <Badge label="쉬어가기" color="bg-blue-100 text-blue-700" />
                          : subStatus && <Badge label={subStatus.label} color={subStatus.color} />
                        }
                      </td>
                      <td className="table-td text-center text-text-secondary">
                        {sub.quantity ?? 1}
                      </td>
                      <td className="table-td text-text-secondary">
                        <span>{formatDate(sub.nextBillingDate)}</span>
                        {sub.isPaused && (
                          <span className="ml-1.5 text-xs font-medium text-blue-500">(건너뜀)</span>
                        )}
                      </td>
                      <td className="table-td font-semibold text-brand-500">
                        {sub.plan?.monthlyPrice
                          ? formatCurrency(sub.plan.monthlyPrice * (sub.quantity ?? 1))
                          : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="border-t border-border px-5 py-4">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      <SubscriptionDetailModal
        subscriptionId={selectedId}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}

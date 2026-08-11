'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Truck, Package, XCircle, Undo2 } from 'lucide-react';
import { ordersApi } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { DeliveryModal } from '@/components/orders/DeliveryModal';
import { PaymentDetailModal } from '@/components/orders/PaymentDetailModal';
import { CancelPaymentModal } from '@/components/orders/CancelPaymentModal';
import { RefundPaymentModal } from '@/components/orders/RefundPaymentModal';
import {
  PAYMENT_STATUS_MAP,
  DELIVERY_STATUS_MAP,
  formatCurrency,
  formatDateTime,
  cn,
} from '@/lib/utils';
import type { Payment } from '@/types';

const STATUS_FILTERS = [
  { value: 'completed', label: '결제 완료' },
  { value: 'refunded', label: '환불' },
  { value: '', label: '전체' },
];

const DELIVERY_FILTERS = [
  { value: '', label: '전체' },
  { value: 'PendingDelivery', label: '배송 대기' },
  { value: 'DeliveryInProgress', label: '배송중' },
  { value: 'DeliveryCompleted', label: '배송 완료' },
];

const LIMIT = 20;

export function SubscriptionOrderList() {
  const { admin } = useAuth();
  const isAdmin = admin?.role === 'admin';
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('completed');
  const [deliveryFilter, setDeliveryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [cancelPayment, setCancelPayment] = useState<Payment | null>(null);
  const [refundPayment, setRefundPayment] = useState<Payment | null>(null);
  const [detailPaymentId, setDetailPaymentId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page, statusFilter, deliveryFilter],
    queryFn: () =>
      ordersApi.getList({
        page,
        limit: LIMIT,
        status: statusFilter || undefined,
        deliveryStatus: deliveryFilter || undefined,
      }),
  });

  const payments: Payment[] = data?.items ?? [];
  const total: number = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);

  function handleStatusFilterChange(status: string) {
    setStatusFilter(status);
    setDeliveryFilter('');
    setPage(1);
  }

  function handleDeliveryFilterChange(status: string) {
    setDeliveryFilter(status);
    setPage(1);
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        {/* 결제 상태 필터 */}
        <div className="filter-tabs">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => handleStatusFilterChange(f.value)}
              className={cn('filter-tab', statusFilter === f.value && 'filter-tab-active')}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* 배송 상태 필터 */}
        {statusFilter === 'completed' && (
          <div className="filter-tabs">
            {DELIVERY_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => handleDeliveryFilterChange(f.value)}
                className={cn('filter-tab', deliveryFilter === f.value && 'filter-tab-active')}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        <div className="search-wrapper sm:ml-auto">
          <Search size={13} className="shrink-0 text-text-muted" />
          <input
            type="text"
            placeholder="이메일로 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-0 w-40 bg-transparent text-xs outline-none placeholder-text-muted"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <p className="text-sm font-medium text-text-secondary">
            총 <span className="font-bold text-text-primary">{total}</span>건
          </p>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="spinner" />
          </div>
        ) : payments.length === 0 ? (
          <EmptyState
            icon={Package}
            title="구독 주문 내역이 없습니다."
            description="조건에 맞는 주문이 없어요."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-surface-muted">
                <tr>
                  <th className="table-th">주문 ID</th>
                  <th className="table-th">고객</th>
                  <th className="table-th">플랜</th>
                  <th className="table-th">금액</th>
                  <th className="table-th">결제 상태</th>
                  <th className="table-th">배송 상태</th>
                  <th className="table-th">결제일시</th>
                  <th className="table-th">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map((payment) => {
                  const paymentStatus = PAYMENT_STATUS_MAP[payment.status];
                  const deliveryStatus = payment.deliveryStatus
                    ? DELIVERY_STATUS_MAP[payment.deliveryStatus]
                    : null;
                  const canDeliver =
                    payment.status === 'completed' &&
                    payment.deliveryStatus === 'PendingDelivery';
                  const canCancel =
                    payment.status === 'completed' &&
                    payment.deliveryStatus === 'PendingDelivery';
                  const canRefund = payment.status === 'completed';

                  return (
                    <tr
                      key={payment.id}
                      onClick={() => setDetailPaymentId(payment.id)}
                      className="cursor-pointer transition-colors hover:bg-surface-muted/60 active:bg-surface-muted"
                    >
                      <td className="table-td font-mono text-xs text-text-muted">
                        #{payment.id}
                      </td>
                      <td className="table-td">
                        <p className="text-sm text-text-primary">
                          {payment.subscription?.user?.email ?? '-'}
                        </p>
                      </td>
                      <td className="table-td">
                        <p className="font-medium text-text-primary">
                          {payment.planName ?? payment.subscription?.plan?.name ?? '-'}
                        </p>
                      </td>
                      <td className="table-td font-semibold text-text-primary">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="table-td">
                        {paymentStatus && (
                          <Badge label={paymentStatus.label} color={paymentStatus.color} />
                        )}
                      </td>
                      <td className="table-td">
                        {deliveryStatus ? (
                          <div>
                            <Badge label={deliveryStatus.label} color={deliveryStatus.color} />
                            {payment.trackingNumber && (
                              <p className="mt-0.5 text-xs text-text-muted">
                                {payment.trackingNumber}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-text-muted">-</span>
                        )}
                      </td>
                      <td className="table-td text-text-secondary">
                        {formatDateTime(payment.approvedAt)}
                      </td>
                      <td className="table-td">
                        <div className="flex items-center gap-1.5">
                          {canDeliver && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPayment(payment);
                              }}
                              className="flex items-center gap-1 rounded-lg bg-brand-500 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-brand-600"
                            >
                              <Truck size={12} />
                              배송처리
                            </button>
                          )}
                          {isAdmin && canCancel && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCancelPayment(payment);
                              }}
                              className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
                            >
                              <XCircle size={12} />
                              결제취소
                            </button>
                          )}
                          {isAdmin && canRefund && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setRefundPayment(payment);
                              }}
                              className="flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-600 transition-colors hover:bg-amber-100"
                            >
                              <Undo2 size={12} />
                              환불
                            </button>
                          )}
                        </div>
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

      <DeliveryModal payment={selectedPayment} onClose={() => setSelectedPayment(null)} />
      <CancelPaymentModal payment={cancelPayment} onClose={() => setCancelPayment(null)} />
      <RefundPaymentModal payment={refundPayment} onClose={() => setRefundPayment(null)} />
      <PaymentDetailModal paymentId={detailPaymentId} onClose={() => setDetailPaymentId(null)} />
    </div>
  );
}

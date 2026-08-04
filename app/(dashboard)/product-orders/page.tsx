'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Truck, Package, XCircle, Undo2 } from 'lucide-react';
import { productOrdersApi } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { DeliveryModal } from '@/components/product-orders/DeliveryModal';
import { CancelOrderModal } from '@/components/product-orders/CancelOrderModal';
import { RefundOrderModal } from '@/components/product-orders/RefundOrderModal';
import { ProductOrderDetailModal } from '@/components/product-orders/ProductOrderDetailModal';
import {
  PAYMENT_STATUS_MAP,
  DELIVERY_STATUS_MAP,
  formatCurrency,
  formatDateTime,
  cn,
} from '@/lib/utils';
import type { ProductOrder } from '@/types';

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

export default function ProductOrdersPage() {
  const { admin } = useAuth();
  const isAdmin = admin?.role === 'admin';
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('completed');
  const [deliveryFilter, setDeliveryFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<ProductOrder | null>(null);
  const [cancelOrder, setCancelOrder] = useState<ProductOrder | null>(null);
  const [refundOrder, setRefundOrder] = useState<ProductOrder | null>(null);
  const [detailOrderId, setDetailOrderId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['product-orders', page, statusFilter, deliveryFilter],
    queryFn: () =>
      productOrdersApi.getList({
        page,
        limit: LIMIT,
        status: statusFilter || undefined,
        deliveryStatus: deliveryFilter || undefined,
      }),
  });

  const orders: ProductOrder[] = data?.items ?? [];
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
        ) : orders.length === 0 ? (
          <EmptyState icon={Package} title="주문 내역이 없습니다." description="조건에 맞는 주문이 없어요." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-surface-muted">
                <tr>
                  <th className="table-th">주문 ID</th>
                  <th className="table-th">고객</th>
                  <th className="table-th">상품</th>
                  <th className="table-th">수량</th>
                  <th className="table-th">금액</th>
                  <th className="table-th">결제 상태</th>
                  <th className="table-th">배송 상태</th>
                  <th className="table-th">결제일시</th>
                  <th className="table-th">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((order) => {
                  const paymentStatus = PAYMENT_STATUS_MAP[order.status];
                  const deliveryStatus = order.deliveryStatus
                    ? DELIVERY_STATUS_MAP[order.deliveryStatus]
                    : null;
                  const canDeliver =
                    order.status === 'completed' && order.deliveryStatus === 'PendingDelivery';
                  const canCancel =
                    order.status === 'completed' && order.deliveryStatus === 'PendingDelivery';
                  const canRefund = order.status === 'completed';

                  return (
                    <tr
                      key={order.id}
                      onClick={() => setDetailOrderId(order.id)}
                      className="cursor-pointer transition-colors hover:bg-surface-muted/60 active:bg-surface-muted"
                    >
                      <td className="table-td font-mono text-xs text-text-muted">#{order.id}</td>
                      <td className="table-td">
                        <p className="text-sm text-text-primary">{order.user?.email ?? '-'}</p>
                      </td>
                      <td className="table-td">
                        <p className="font-medium text-text-primary">{order.productName}</p>
                      </td>
                      <td className="table-td text-text-secondary">{order.quantity}</td>
                      <td className="table-td font-semibold text-text-primary">
                        {formatCurrency(order.amount)}
                      </td>
                      <td className="table-td">
                        {paymentStatus && <Badge label={paymentStatus.label} color={paymentStatus.color} />}
                      </td>
                      <td className="table-td">
                        {deliveryStatus ? (
                          <div>
                            <Badge label={deliveryStatus.label} color={deliveryStatus.color} />
                            {order.trackingNumber && (
                              <p className="mt-0.5 text-xs text-text-muted">{order.trackingNumber}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-text-muted">-</span>
                        )}
                      </td>
                      <td className="table-td text-text-secondary">{formatDateTime(order.approvedAt)}</td>
                      <td className="table-td">
                        <div className="flex items-center gap-1.5">
                          {canDeliver && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOrder(order);
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
                                setCancelOrder(order);
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
                                setRefundOrder(order);
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

      <DeliveryModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      <CancelOrderModal order={cancelOrder} onClose={() => setCancelOrder(null)} />
      <RefundOrderModal order={refundOrder} onClose={() => setRefundOrder(null)} />
      <ProductOrderDetailModal orderId={detailOrderId} onClose={() => setDetailOrderId(null)} />
    </div>
  );
}

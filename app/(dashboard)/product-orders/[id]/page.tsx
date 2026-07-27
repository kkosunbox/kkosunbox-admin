'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Truck, Package, MapPin, User } from 'lucide-react';
import { productOrdersApi } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { DeliveryModal } from '@/components/product-orders/DeliveryModal';
import { PAYMENT_STATUS_MAP, DELIVERY_STATUS_MAP, formatCurrency, formatDateTime } from '@/lib/utils';
import type { ProductOrder } from '@/types';

export default function ProductOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);

  const { data: order, isLoading } = useQuery<ProductOrder>({
    queryKey: ['product-orders', id],
    queryFn: () => productOrdersApi.getById(Number(id)),
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!order) {
    return <div className="text-center py-16 text-text-muted">주문을 찾을 수 없습니다.</div>;
  }

  const paymentStatus = PAYMENT_STATUS_MAP[order.status];
  const deliveryStatusInfo = order.deliveryStatus ? DELIVERY_STATUS_MAP[order.deliveryStatus] : null;
  const deliveryAddress = order.deliveryAddress;
  const canDeliver = order.status === 'completed' && order.deliveryStatus === 'PendingDelivery';

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-text-primary"
      >
        <ArrowLeft size={16} />
        목록으로
      </button>

      {/* Hero */}
      <div className="detail-hero shadow-card">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-mono text-sm text-text-muted">주문 #{order.id}</p>
          {paymentStatus && <Badge label={paymentStatus.label} color={paymentStatus.color} />}
          {deliveryStatusInfo && (
            <Badge label={deliveryStatusInfo.label} color={deliveryStatusInfo.color} />
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold leading-tight text-text-primary">
              {order.productName}
              {order.quantity > 1 && (
                <span className="ml-1.5 text-sm font-normal text-text-muted">× {order.quantity}</span>
              )}
            </h1>
            <p className="mt-0.5 break-all text-sm text-text-muted">{order.user?.email}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold tracking-tight text-brand-600">
              {formatCurrency(order.amount)}
            </p>
            <p className="text-xs text-text-muted">결제일시: {formatDateTime(order.approvedAt)}</p>
          </div>
        </div>

        {canDeliver && (
          <button onClick={() => setShowDeliveryModal(true)} className="btn-primary mt-4">
            <Truck size={16} />
            배송 처리하기
          </button>
        )}
      </div>

      {order.trackingNumber && (
        <div className="detail-callout bg-green-50">
          <div className="detail-callout-icon">
            <Truck size={16} className="text-green-600" />
          </div>
          <div>
            <p className="text-xs text-green-700">배송 완료</p>
            <p className="text-sm font-semibold text-green-800">송장번호 {order.trackingNumber}</p>
            <p className="text-xs text-green-600">배송완료: {formatDateTime(order.deliveredAt)}</p>
          </div>
        </div>
      )}

      <div className="card p-6">
        <div className="detail-sections">
          {order.user && (
            <section className="detail-section">
              <div className="detail-section-label">
                <User size={13} className="text-brand-400" />
                고객 정보
              </div>
              <dl className="space-y-1.5">
                <div className="detail-row">
                  <dt className="shrink-0 text-text-muted">이메일</dt>
                  <dd className="truncate font-medium text-text-primary">{order.user.email}</dd>
                </div>
                {order.user.phone && (
                  <div className="detail-row">
                    <dt className="text-text-muted">연락처</dt>
                    <dd className="font-medium text-text-primary">{order.user.phone}</dd>
                  </div>
                )}
              </dl>
            </section>
          )}

          {deliveryAddress && (
            <section className="detail-section">
              <div className="detail-section-label">
                <MapPin size={13} className="text-brand-400" />
                배송지
              </div>
              <div className="space-y-0.5 text-sm">
                <p className="font-semibold text-text-primary">
                  {deliveryAddress.receiverName}
                  {deliveryAddress.nickname && (
                    <span className="ml-1.5 text-xs font-normal text-text-muted">
                      ({deliveryAddress.nickname})
                    </span>
                  )}
                </p>
                <p className="text-text-secondary">{deliveryAddress.phoneNumber}</p>
                <p className="text-text-secondary">
                  [{deliveryAddress.zipCode}] {deliveryAddress.address}
                  {deliveryAddress.addressDetail && ` ${deliveryAddress.addressDetail}`}
                </p>
                {deliveryAddress.memo && (
                  <p className="text-xs text-text-muted">메모: {deliveryAddress.memo}</p>
                )}
              </div>
            </section>
          )}

          <section className="detail-section">
            <div className="detail-section-label">
              <Package size={13} className="text-brand-400" />
              결제 상세
            </div>
            <dl className="space-y-1.5">
              <div className="detail-row">
                <dt className="text-text-muted">상품</dt>
                <dd className="font-medium text-text-primary">
                  {order.productName} × {order.quantity}
                </dd>
              </div>
              <div className="detail-row">
                <dt className="text-text-muted">공급가</dt>
                <dd className="font-medium text-text-primary">{formatCurrency(order.baseAmount)}</dd>
              </div>
              <div className="detail-row">
                <dt className="text-text-muted">부가세</dt>
                <dd className="font-medium text-text-primary">{formatCurrency(order.taxAmount)}</dd>
              </div>
              {order.method && (
                <div className="detail-row">
                  <dt className="text-text-muted">결제 수단</dt>
                  <dd className="text-text-primary">{order.method}</dd>
                </div>
              )}
              {order.orderId && (
                <div className="detail-row">
                  <dt className="shrink-0 text-text-muted">주문 ID</dt>
                  <dd className="truncate font-mono text-xs text-text-muted">{order.orderId}</dd>
                </div>
              )}
              <div className="detail-row rounded-xl bg-surface-muted px-3 py-2.5 !mt-3">
                <dt className="font-semibold text-text-primary">최종 결제금액</dt>
                <dd className="font-bold text-brand-600">{formatCurrency(order.amount)}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>

      <DeliveryModal order={showDeliveryModal ? order : null} onClose={() => setShowDeliveryModal(false)} />
    </div>
  );
}

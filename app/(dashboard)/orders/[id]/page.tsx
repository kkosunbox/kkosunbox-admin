'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Truck, Package, MapPin, User } from 'lucide-react';
import { ordersApi } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { DeliveryModal } from '@/components/orders/DeliveryModal';
import { PetProfileCard } from '@/components/shared/PetProfileCard';
import {
  PAYMENT_STATUS_MAP,
  DELIVERY_STATUS_MAP,
  formatCurrency,
  formatDateTime,
} from '@/lib/utils';
import type { Payment } from '@/types';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);

  const { data: payment, isLoading } = useQuery<Payment>({
    queryKey: ['orders', id],
    queryFn: () => ordersApi.getById(Number(id)),
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="text-center py-16 text-text-muted">주문을 찾을 수 없습니다.</div>
    );
  }

  const paymentStatus = PAYMENT_STATUS_MAP[payment.status];
  const deliveryStatusInfo = payment.deliveryStatus
    ? DELIVERY_STATUS_MAP[payment.deliveryStatus]
    : null;
  const subscription = payment.subscription;
  const petProfile = subscription?.petProfile;
  const deliveryAddress = subscription?.deliveryAddress;
  const canDeliver =
    payment.status === 'completed' && payment.deliveryStatus === 'PendingDelivery';

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      {/* Back */}
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
          <p className="font-mono text-sm text-text-muted">주문 #{payment.id}</p>
          {paymentStatus && (
            <Badge label={paymentStatus.label} color={paymentStatus.color} />
          )}
          {deliveryStatusInfo && (
            <Badge label={deliveryStatusInfo.label} color={deliveryStatusInfo.color} />
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold leading-tight text-text-primary">
              {payment.planName ?? subscription?.plan?.name ?? '구독 박스'}
            </h1>
            <p className="mt-0.5 break-all text-sm text-text-muted">{subscription?.user?.email}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold tracking-tight text-brand-600">{formatCurrency(payment.amount)}</p>
            <p className="text-xs text-text-muted">
              결제일시: {formatDateTime(payment.approvedAt)}
            </p>
          </div>
        </div>

        {canDeliver && (
          <button
            onClick={() => setShowDeliveryModal(true)}
            className="btn-primary mt-4"
          >
            <Truck size={16} />
            배송 처리하기
          </button>
        )}
      </div>

      {/* Tracking callout */}
      {payment.deliveryStatus === 'DeliveryCompleted' && payment.trackingNumber && (
        <div className="detail-callout bg-green-50">
          <div className="detail-callout-icon">
            <Truck size={16} className="text-green-600" />
          </div>
          <div>
            <p className="text-xs text-green-700">배송 완료</p>
            <p className="text-sm font-semibold text-green-800">송장번호 {payment.trackingNumber}</p>
            <p className="text-xs text-green-600">배송완료: {formatDateTime(payment.deliveredAt)}</p>
          </div>
        </div>
      )}

      {payment.deliveryStatus === 'DeliveryInProgress' && payment.trackingNumber && (
        <div className="detail-callout bg-blue-50">
          <div className="detail-callout-icon">
            <Truck size={16} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-blue-700">배송중</p>
            <p className="text-sm font-semibold text-blue-800">송장번호 {payment.trackingNumber}</p>
            <p className="text-xs text-blue-600">택배사 배송완료 확인 후 자동으로 배송완료 처리됩니다.</p>
          </div>
        </div>
      )}

      {/* Sections */}
      <div className="card p-6">
        <div className="detail-sections">
          {/* 고객 정보 */}
          {subscription?.user && (
            <section className="detail-section">
              <div className="detail-section-label">
                <User size={13} className="text-brand-400" />
                고객 정보
              </div>
              <dl className="space-y-1.5">
                <div className="detail-row">
                  <dt className="shrink-0 text-text-muted">이메일</dt>
                  <dd className="truncate font-medium text-text-primary">{subscription.user.email}</dd>
                </div>
                {subscription.user.phone && (
                  <div className="detail-row">
                    <dt className="text-text-muted">연락처</dt>
                    <dd className="font-medium text-text-primary">{subscription.user.phone}</dd>
                  </div>
                )}
              </dl>
            </section>
          )}

          {/* 반려견 정보 (체크리스트·추천 결과 포함) */}
          {petProfile && (
            <section className="detail-section">
              <PetProfileCard petProfile={petProfile} />
            </section>
          )}

          {/* 배송지 */}
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
                    <span className="ml-1.5 text-xs font-normal text-text-muted">({deliveryAddress.nickname})</span>
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

          {/* 결제 상세 */}
          <section className="detail-section">
            <div className="detail-section-label">
              <Package size={13} className="text-brand-400" />
              결제 상세
            </div>
            <dl className="space-y-1.5">
              <div className="detail-row">
                <dt className="text-text-muted">기본 금액</dt>
                <dd className="font-medium text-text-primary">{formatCurrency(payment.baseAmount)}</dd>
              </div>
              <div className="detail-row">
                <dt className="text-text-muted">부가세</dt>
                <dd className="font-medium text-text-primary">{formatCurrency(payment.taxAmount)}</dd>
              </div>
              {payment.method && (
                <div className="detail-row">
                  <dt className="text-text-muted">결제 수단</dt>
                  <dd className="text-text-primary">{payment.method}</dd>
                </div>
              )}
              {payment.orderId && (
                <div className="detail-row">
                  <dt className="shrink-0 text-text-muted">주문 ID</dt>
                  <dd className="truncate font-mono text-xs text-text-muted">{payment.orderId}</dd>
                </div>
              )}
              <div className="detail-row rounded-xl bg-surface-muted px-3 py-2.5 !mt-3">
                <dt className="font-semibold text-text-primary">최종 결제금액</dt>
                <dd className="font-bold text-brand-600">{formatCurrency(payment.amount)}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>

      <DeliveryModal
        payment={showDeliveryModal ? payment : null}
        onClose={() => setShowDeliveryModal(false)}
      />
    </div>
  );
}

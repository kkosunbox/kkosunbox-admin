'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Truck, Package, MapPin, User, Dog } from 'lucide-react';
import { ordersApi } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { DeliveryModal } from '@/components/orders/DeliveryModal';
import {
  PAYMENT_STATUS_MAP,
  DELIVERY_STATUS_MAP,
  formatCurrency,
  formatDateTime,
  formatDate,
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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" />
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

      {/* Header */}
      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-mono text-sm text-text-muted">주문 #{payment.id}</p>
              {paymentStatus && (
                <Badge label={paymentStatus.label} color={paymentStatus.color} />
              )}
              {deliveryStatusInfo && (
                <Badge label={deliveryStatusInfo.label} color={deliveryStatusInfo.color} />
              )}
            </div>
            <h1 className="mt-1 text-xl font-bold text-text-primary">
              {subscription?.plan?.name ?? payment.planName ?? '구독 박스'}
            </h1>
            <p className="mt-0.5 break-all text-text-muted">{subscription?.user?.email}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-brand-500">{formatCurrency(payment.amount)}</p>
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

        {payment.trackingNumber && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3">
            <Truck size={16} className="text-green-600" />
            <div>
              <p className="text-xs text-green-700">배송 완료</p>
              <p className="font-semibold text-green-800">송장번호: {payment.trackingNumber}</p>
              <p className="text-xs text-green-600">배송완료: {formatDateTime(payment.deliveredAt)}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* 고객 정보 */}
        {subscription?.user && (
          <div className="card p-5">
            <div className="mb-3 flex items-center gap-2">
              <User size={16} className="text-brand-500" />
              <h2 className="section-title">고객 정보</h2>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-text-muted">이메일</dt>
                <dd className="font-medium text-text-primary">{subscription.user.email}</dd>
              </div>
              {subscription.user.phone && (
                <div className="flex justify-between">
                  <dt className="text-text-muted">연락처</dt>
                  <dd className="font-medium text-text-primary">{subscription.user.phone}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* 반려견 정보 */}
        {petProfile && (
          <div className="card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Dog size={16} className="text-brand-500" />
              <h2 className="section-title">반려견 정보</h2>
            </div>
            <dl className="space-y-2 text-sm">
              {petProfile.name && (
                <div className="flex justify-between">
                  <dt className="text-text-muted">이름</dt>
                  <dd className="font-medium text-text-primary">{petProfile.name}</dd>
                </div>
              )}
              {petProfile.breed && (
                <div className="flex justify-between">
                  <dt className="text-text-muted">견종</dt>
                  <dd className="font-medium text-text-primary">{petProfile.breed}</dd>
                </div>
              )}
              {petProfile.weight && (
                <div className="flex justify-between">
                  <dt className="text-text-muted">체중</dt>
                  <dd className="font-medium text-text-primary">{petProfile.weight}kg</dd>
                </div>
              )}
              {petProfile.birthDate && (
                <div className="flex justify-between">
                  <dt className="text-text-muted">생년월일</dt>
                  <dd className="font-medium text-text-primary">{formatDate(petProfile.birthDate)}</dd>
                </div>
              )}
              {petProfile.gender && (
                <div className="flex justify-between">
                  <dt className="text-text-muted">성별</dt>
                  <dd className="font-medium text-text-primary">
                    {petProfile.gender === 'male' ? '수컷' : '암컷'}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* 배송지 */}
        {deliveryAddress && (
          <div className="card p-5">
            <div className="mb-3 flex items-center gap-2">
              <MapPin size={16} className="text-brand-500" />
              <h2 className="section-title">배송지</h2>
            </div>
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-text-primary">
                {deliveryAddress.receiverName}
                {deliveryAddress.nickname && (
                  <span className="ml-2 text-xs text-text-muted">({deliveryAddress.nickname})</span>
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
          </div>
        )}

        {/* 결제 상세 */}
        <div className="card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Package size={16} className="text-brand-500" />
            <h2 className="section-title">결제 상세</h2>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-text-muted">기본 금액</dt>
              <dd className="font-medium text-text-primary">{formatCurrency(payment.baseAmount)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-muted">부가세</dt>
              <dd className="font-medium text-text-primary">{formatCurrency(payment.taxAmount)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2">
              <dt className="font-semibold text-text-primary">최종 결제금액</dt>
              <dd className="font-bold text-brand-500">{formatCurrency(payment.amount)}</dd>
            </div>
            {payment.method && (
              <div className="flex justify-between">
                <dt className="text-text-muted">결제 수단</dt>
                <dd className="text-text-primary">{payment.method}</dd>
              </div>
            )}
            {payment.orderId && (
              <div className="flex justify-between">
                <dt className="text-text-muted">주문 ID</dt>
                <dd className="font-mono text-xs text-text-muted">{payment.orderId}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      <DeliveryModal
        payment={showDeliveryModal ? payment : null}
        onClose={() => setShowDeliveryModal(false)}
      />
    </div>
  );
}

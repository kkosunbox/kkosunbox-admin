'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Truck, Package, MapPin, User, XCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { DeliveryModal } from '@/components/orders/DeliveryModal';
import { CancelPaymentModal } from '@/components/orders/CancelPaymentModal';
import { PetProfileCard } from '@/components/shared/PetProfileCard';
import { ordersApi } from '@/lib/api';
import {
  PAYMENT_STATUS_MAP,
  DELIVERY_STATUS_MAP,
  formatCurrency,
  formatDateTime,
  formatDate,
} from '@/lib/utils';
import type { Payment } from '@/types';

interface PaymentDetailModalProps {
  paymentId: number | null;
  onClose: () => void;
}

export function PaymentDetailModal({ paymentId, onClose }: PaymentDetailModalProps) {
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const { data: payment, isLoading } = useQuery<Payment>({
    queryKey: ['orders', paymentId],
    queryFn: () => ordersApi.getById(paymentId!),
    enabled: paymentId !== null,
  });

  const paymentStatus = payment ? PAYMENT_STATUS_MAP[payment.status] : null;
  const deliveryStatusInfo =
    payment?.deliveryStatus ? DELIVERY_STATUS_MAP[payment.deliveryStatus] : null;
  const subscription = payment?.subscription;
  const petProfile = subscription?.petProfile;
  const deliveryAddress = subscription?.deliveryAddress;
  const canDeliver =
    payment?.status === 'completed' && payment?.deliveryStatus === 'PendingDelivery';
  const canCancel =
    payment?.status === 'completed' && payment?.deliveryStatus === 'PendingDelivery';

  return (
    <>
      <Modal
        isOpen={paymentId !== null}
        onClose={onClose}
        title="결제 상세"
        size="lg"
      >
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" />
          </div>
        ) : payment ? (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between rounded-xl bg-surface-muted p-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-text-muted">
                    주문 #{payment.id}
                  </span>
                  {paymentStatus && (
                    <Badge label={paymentStatus.label} color={paymentStatus.color} />
                  )}
                  {deliveryStatusInfo && (
                    <Badge label={deliveryStatusInfo.label} color={deliveryStatusInfo.color} />
                  )}
                </div>
                <p className="mt-1 font-bold text-text-primary">
                  {subscription?.plan?.name ?? payment.planName ?? '구독 박스'}
                </p>
                <p className="text-sm text-text-muted">
                  {subscription?.user?.email ?? '-'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-brand-500">
                  {formatCurrency(payment.amount)}
                </p>
                <p className="text-xs text-text-muted">
                  {formatDateTime(payment.approvedAt)}
                </p>
              </div>
            </div>

            {/* Actions */}
            {(canDeliver || canCancel) && (
              <div className="flex gap-2">
                {canDeliver && (
                  <button
                    onClick={() => setShowDeliveryModal(true)}
                    className="btn-primary flex-1"
                  >
                    <Truck size={15} />
                    배송 처리하기
                  </button>
                )}
                {canCancel && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
                  >
                    <XCircle size={15} />
                    결제 취소
                  </button>
                )}
              </div>
            )}

            {/* Cancelled info */}
            {payment.status === 'refunded' && payment.cancelledAt && (
              <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3">
                <XCircle size={15} className="shrink-0 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-600">환불 처리됨</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {formatDateTime(payment.cancelledAt)}
                  </p>
                </div>
              </div>
            )}

            {/* Tracking info */}
            {payment.trackingNumber && (
              <div className="flex items-center gap-3 rounded-xl bg-green-50 px-4 py-3">
                <Truck size={15} className="shrink-0 text-green-600" />
                <div>
                  <p className="text-xs text-green-700">배송 완료</p>
                  <p className="font-semibold text-green-800">
                    송장번호: {payment.trackingNumber}
                  </p>
                  <p className="text-xs text-green-600">
                    {formatDateTime(payment.deliveredAt)}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Customer */}
              {subscription?.user && (
                <div className="space-y-2 rounded-xl border border-border p-4">
                  <div className="flex items-center gap-1.5">
                    <User size={14} className="text-brand-500" />
                    <span className="text-sm font-semibold text-text-primary">고객 정보</span>
                  </div>
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between gap-2">
                      <dt className="shrink-0 text-text-muted">이메일</dt>
                      <dd className="truncate font-medium text-text-primary">
                        {subscription.user.email}
                      </dd>
                    </div>
                    {subscription.user.phone && (
                      <div className="flex justify-between gap-2">
                        <dt className="shrink-0 text-text-muted">연락처</dt>
                        <dd className="font-medium text-text-primary">
                          {subscription.user.phone}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}

              {/* Pet */}
              {petProfile && (
                <PetProfileCard
                  petProfile={petProfile}
                  className={
                    (petProfile.checklistAnswers?.length ?? 0) > 0
                      ? 'sm:col-span-2'
                      : ''
                  }
                />
              )}

              {/* Delivery Address */}
              {deliveryAddress && (
                <div className="space-y-2 rounded-xl border border-border p-4">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-brand-500" />
                    <span className="text-sm font-semibold text-text-primary">배송지</span>
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
                </div>
              )}

              {/* Payment detail */}
              <div className="space-y-2 rounded-xl border border-border p-4">
                <div className="flex items-center gap-1.5">
                  <Package size={14} className="text-brand-500" />
                  <span className="text-sm font-semibold text-text-primary">결제 상세</span>
                </div>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-text-muted">기본 금액</dt>
                    <dd className="font-medium text-text-primary">
                      {formatCurrency(payment.baseAmount)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-muted">부가세</dt>
                    <dd className="font-medium text-text-primary">
                      {formatCurrency(payment.taxAmount)}
                    </dd>
                  </div>
                  <div className="flex justify-between border-t border-border pt-1">
                    <dt className="font-semibold text-text-primary">최종 결제금액</dt>
                    <dd className="font-bold text-brand-500">
                      {formatCurrency(payment.amount)}
                    </dd>
                  </div>
                  {payment.method && (
                    <div className="flex justify-between">
                      <dt className="text-text-muted">결제 수단</dt>
                      <dd className="text-text-primary">{payment.method}</dd>
                    </div>
                  )}
                  {payment.orderId && (
                    <div className="flex justify-between gap-2">
                      <dt className="shrink-0 text-text-muted">주문 ID</dt>
                      <dd className="truncate font-mono text-xs text-text-muted">
                        {payment.orderId}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-text-muted">
            결제 정보를 찾을 수 없습니다.
          </p>
        )}
      </Modal>

      {payment && (
        <DeliveryModal
          payment={showDeliveryModal ? payment : null}
          onClose={() => setShowDeliveryModal(false)}
        />
      )}

      {payment && (
        <CancelPaymentModal
          payment={showCancelModal ? payment : null}
          onClose={() => setShowCancelModal(false)}
          onSuccess={onClose}
        />
      )}
    </>
  );
}

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Truck, Package, MapPin, User, XCircle, Undo2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { DeliveryModal } from '@/components/orders/DeliveryModal';
import { CancelPaymentModal } from '@/components/orders/CancelPaymentModal';
import { RefundPaymentModal } from '@/components/orders/RefundPaymentModal';
import { PetProfileCard } from '@/components/shared/PetProfileCard';
import { ordersApi } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';
import {
  PAYMENT_STATUS_MAP,
  DELIVERY_STATUS_MAP,
  formatCurrency,
  formatDateTime,
} from '@/lib/utils';
import type { Payment } from '@/types';

interface PaymentDetailModalProps {
  paymentId: number | null;
  onClose: () => void;
}

export function PaymentDetailModal({ paymentId, onClose }: PaymentDetailModalProps) {
  const { admin } = useAuth();
  const isAdmin = admin?.role === 'admin';
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);

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
  const canRefund = payment?.status === 'completed';

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
            <div className="spinner" />
          </div>
        ) : payment ? (
          <div className="space-y-5">
            {/* Hero */}
            <div className="detail-hero">
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
              <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-lg font-bold leading-tight text-text-primary">
                    {payment.planName ?? subscription?.plan?.name ?? '구독 박스'}
                  </p>
                  <p className="mt-0.5 text-sm text-text-muted">
                    {subscription?.user?.email ?? '-'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold tracking-tight text-brand-600">
                    {formatCurrency(payment.amount)}
                  </p>
                  <p className="text-xs text-text-muted">
                    {formatDateTime(payment.approvedAt)}
                  </p>
                </div>
              </div>

              {/* Actions */}
              {(canDeliver || (isAdmin && (canCancel || canRefund))) && (
                <div className="mt-4 flex gap-2">
                  {canDeliver && (
                    <button
                      onClick={() => setShowDeliveryModal(true)}
                      className="btn-primary flex-1"
                    >
                      <Truck size={15} />
                      배송 처리하기
                    </button>
                  )}
                  {isAdmin && canCancel && (
                    <button
                      onClick={() => setShowCancelModal(true)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white/70 px-4 py-2 text-sm font-medium text-red-500 backdrop-blur-sm transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <XCircle size={15} />
                      결제 취소
                    </button>
                  )}
                  {isAdmin && canRefund && (
                    <button
                      onClick={() => setShowRefundModal(true)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white/70 px-4 py-2 text-sm font-medium text-amber-600 backdrop-blur-sm transition-colors hover:bg-amber-50 hover:text-amber-700"
                    >
                      <Undo2 size={15} />
                      환불
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Cancelled info */}
            {payment.status === 'refunded' && payment.cancelledAt && (
              <div className="detail-callout bg-gray-50">
                <div className="detail-callout-icon">
                  <XCircle size={16} className="text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">환불 처리됨</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {formatDateTime(payment.cancelledAt)}
                  </p>
                </div>
              </div>
            )}

            {/* Tracking info */}
            {payment.deliveryStatus === 'DeliveryCompleted' && payment.trackingNumber && (
              <div className="detail-callout bg-green-50">
                <div className="detail-callout-icon">
                  <Truck size={16} className="text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-green-700">배송 완료</p>
                  <p className="text-sm font-semibold text-green-800">
                    송장번호 {payment.trackingNumber}
                  </p>
                  <p className="text-xs text-green-600">
                    {formatDateTime(payment.deliveredAt)}
                  </p>
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
                  <p className="text-sm font-semibold text-blue-800">
                    송장번호 {payment.trackingNumber}
                  </p>
                  <p className="text-xs text-blue-600">
                    택배사 배송완료 확인 후 자동으로 배송완료 처리됩니다.
                  </p>
                </div>
              </div>
            )}

            {/* Sections */}
            <div className="detail-sections">
              {subscription?.user && (
                <section className="detail-section">
                  <div className="detail-section-label">
                    <User size={13} className="text-brand-400" />
                    고객 정보
                  </div>
                  <dl className="space-y-1.5">
                    <div className="detail-row">
                      <dt className="shrink-0 text-text-muted">이메일</dt>
                      <dd className="truncate font-medium text-text-primary">
                        {subscription.user.email}
                      </dd>
                    </div>
                    {subscription.user.phone && (
                      <div className="detail-row">
                        <dt className="shrink-0 text-text-muted">연락처</dt>
                        <dd className="font-medium text-text-primary">
                          {subscription.user.phone}
                        </dd>
                      </div>
                    )}
                  </dl>
                </section>
              )}

              {petProfile && (
                <section className="detail-section">
                  <PetProfileCard petProfile={petProfile} />
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
                    <dt className="text-text-muted">기본 금액</dt>
                    <dd className="font-medium text-text-primary">
                      {formatCurrency(payment.baseAmount)}
                    </dd>
                  </div>
                  <div className="detail-row">
                    <dt className="text-text-muted">부가세</dt>
                    <dd className="font-medium text-text-primary">
                      {formatCurrency(payment.taxAmount)}
                    </dd>
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
                      <dd className="truncate font-mono text-xs text-text-muted">
                        {payment.orderId}
                      </dd>
                    </div>
                  )}
                  <div className="detail-row rounded-xl bg-surface-muted px-3 py-2.5 !mt-3">
                    <dt className="font-semibold text-text-primary">최종 결제금액</dt>
                    <dd className="font-bold text-brand-600">
                      {formatCurrency(payment.amount)}
                    </dd>
                  </div>
                </dl>
              </section>
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

      {payment && (
        <RefundPaymentModal
          payment={showRefundModal ? payment : null}
          onClose={() => setShowRefundModal(false)}
          onSuccess={onClose}
        />
      )}
    </>
  );
}

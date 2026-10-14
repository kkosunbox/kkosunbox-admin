'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Truck, Package, MapPin, User, XCircle, Undo2, RotateCcw } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { ProductOrderCustomer } from '@/components/product-orders/ProductOrderCustomer';
import { DeliveryModal } from '@/components/product-orders/DeliveryModal';
import { CancelOrderModal } from '@/components/product-orders/CancelOrderModal';
import { RefundOrderModal } from '@/components/product-orders/RefundOrderModal';
import { ProductCouponDetailSection } from '@/components/shared/CouponReferralInfo';
import { productOrdersApi } from '@/lib/api';
import { SendDeliveryDelayAlimtalkButton } from '@/components/alimtalk/SendDeliveryDelayAlimtalkButton';
import { useAuth } from '@/providers/AuthProvider';
import {
  PAYMENT_STATUS_MAP,
  DELIVERY_STATUS_MAP,
  formatCurrency,
  formatDateTime,
  canCancelProductOrder,
  canDeliverProductOrder,
  canRefundProductOrder,
  getKoreaPostTrackingUrl,
  getProductOrderShipping,
  isGuestProductOrder,
  formatPhone,
  remainingItemQuantity,
  cn,
} from '@/lib/utils';
import type { ProductOrder } from '@/types';

interface ProductOrderDetailModalProps {
  orderId: number | null;
  onClose: () => void;
}

export function ProductOrderDetailModal({ orderId, onClose }: ProductOrderDetailModalProps) {
  const { admin } = useAuth();
  const isAdmin = admin?.role === 'admin';
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);

  const { data: order, isLoading } = useQuery<ProductOrder>({
    queryKey: ['product-orders', orderId],
    queryFn: () => productOrdersApi.getById(orderId!),
    enabled: orderId !== null,
  });

  const paymentStatus = order ? PAYMENT_STATUS_MAP[order.status] : null;
  const deliveryStatusInfo = order?.deliveryStatus ? DELIVERY_STATUS_MAP[order.deliveryStatus] : null;
  const shipping = order ? getProductOrderShipping(order) : null;
  const refundSummary = order ? summarizeRefund(order) : null;
  const canDeliver = !!order && canDeliverProductOrder(order);
  const canCancel = !!order && canCancelProductOrder(order);
  const canRefund = !!order && canRefundProductOrder(order);

  return (
    <>
      <Modal isOpen={orderId !== null} onClose={onClose} title="주문 상세" size="lg">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="spinner" />
          </div>
        ) : order ? (
          <div className="space-y-5">
            {/* Hero */}
            <div className="detail-hero">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-text-muted">주문 #{order.id}</span>
                {paymentStatus && <Badge label={paymentStatus.label} color={paymentStatus.color} />}
                {deliveryStatusInfo && (
                  <Badge label={deliveryStatusInfo.label} color={deliveryStatusInfo.color} />
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-lg font-bold leading-tight text-text-primary">
                    {order.orderName}
                  </p>
                  <ProductOrderCustomer order={order} className="mt-0.5 text-sm text-text-muted" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold tracking-tight text-brand-600">
                    {formatCurrency(order.amount)}
                  </p>
                  {order.refundedAmount > 0 && (
                    <p className="text-sm font-semibold text-red-600">
                      환불 -{formatCurrency(order.refundedAmount)}
                    </p>
                  )}
                  <p className="text-xs text-text-muted">{formatDateTime(order.approvedAt)}</p>
                </div>
              </div>

              {(canDeliver || isAdmin) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {canDeliver && (
                  <button onClick={() => setShowDeliveryModal(true)} className="btn-primary flex-1">
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
                    강제 환불
                  </button>
                )}
                {isAdmin && (
                <SendDeliveryDelayAlimtalkButton
                  phone={shipping?.phoneNumber ?? order.ordererPhone ?? undefined}
                  email={order.user?.email}
                  label={
                    shipping
                      ? `${shipping.receiverName}${shipping.nickname ? ` (${shipping.nickname})` : ''}`
                      : undefined
                  }
                />
                )}
              </div>
              )}
            </div>

            {order.status === 'partially_refunded' && order.deliveryStatus === 'PendingDelivery' && (
              <div className="detail-callout bg-amber-50">
                <div className="detail-callout-icon">
                  <Truck size={16} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-amber-700">부분 환불 · 남은 상품 발송</p>
                  <p className="text-sm font-semibold text-amber-800">
                    환불된 라인은 제외하고 남은 수량만 송장 1개로 발송합니다.
                  </p>
                </div>
              </div>
            )}

            {refundSummary && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="detail-callout-icon">
                    <RotateCcw size={16} className="text-red-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-red-700">
                      {refundSummary.isFull ? '전액 환불된 주문입니다' : '일부 상품이 취소(환불)된 주문입니다'}
                    </p>
                    <p className="text-xs text-red-600">
                      환불 {refundSummary.refundedQuantity}개 · -{formatCurrency(order.refundedAmount)}
                      {refundSummary.lastRefundedAt &&
                        ` · ${formatDateTime(refundSummary.lastRefundedAt)}`}
                    </p>
                  </div>
                  {!refundSummary.isFull && (
                    <div className="shrink-0 text-right">
                      <p className="text-[11px] text-red-600">남은 금액</p>
                      <p className="text-sm font-bold text-red-700">
                        {formatCurrency(order.amount - order.refundedAmount)}
                      </p>
                    </div>
                  )}
                </div>
                {refundSummary.items.length > 0 && (
                  <ul className="mt-2.5 space-y-1 border-t border-red-200 pt-2.5 text-xs">
                    {refundSummary.items.map((item) => (
                      <li key={item.id} className="flex justify-between gap-3 text-red-700">
                        <span className="truncate">
                          {item.productName}{' '}
                          <span className="font-semibold">
                            {item.refundedQuantity}/{item.quantity}개 취소
                          </span>
                        </span>
                        <span className="shrink-0 font-medium">-{formatCurrency(item.refundedAmount)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {order.deliveryStatus === 'DeliveryCompleted' && order.trackingNumber && (
              <div className="detail-callout bg-green-50">
                <div className="detail-callout-icon">
                  <Truck size={16} className="text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-green-700">배송 완료</p>
                  <p className="text-sm font-semibold text-green-800">
                    송장번호{' '}
                    <a
                      href={getKoreaPostTrackingUrl(order.trackingNumber)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2 hover:opacity-80"
                    >
                      {order.trackingNumber}
                    </a>
                  </p>
                  <p className="text-xs text-green-600">{formatDateTime(order.deliveredAt)}</p>
                </div>
              </div>
            )}

            {order.deliveryStatus === 'DeliveryInProgress' && order.trackingNumber && (
              <div className="detail-callout bg-blue-50">
                <div className="detail-callout-icon">
                  <Truck size={16} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-blue-700">배송중</p>
                  <p className="text-sm font-semibold text-blue-800">
                    송장번호{' '}
                    <a
                      href={getKoreaPostTrackingUrl(order.trackingNumber)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2 hover:opacity-80"
                    >
                      {order.trackingNumber}
                    </a>
                  </p>
                  <p className="text-xs text-blue-600">
                    택배사 배송완료 확인 후 자동으로 배송완료 처리됩니다.
                  </p>
                </div>
              </div>
            )}

            <div className="detail-sections">
              <section className="detail-section">
                <div className="detail-section-label">
                  <User size={13} className="text-brand-400" />
                  고객 정보
                  {isGuestProductOrder(order) && (
                    <Badge label="비회원" color="bg-purple-100 text-purple-800" />
                  )}
                </div>
                <dl className="space-y-1.5">
                  {order.user ? (
                    <>
                      <div className="detail-row">
                        <dt className="shrink-0 text-text-muted">이메일</dt>
                        <dd className="truncate font-medium text-text-primary">{order.user.email}</dd>
                      </div>
                      {order.user.phone && (
                        <div className="detail-row">
                          <dt className="shrink-0 text-text-muted">연락처</dt>
                          <dd className="font-medium text-text-primary">{order.user.phone}</dd>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="detail-row">
                        <dt className="shrink-0 text-text-muted">주문자</dt>
                        <dd className="truncate font-medium text-text-primary">
                          {order.ordererName ?? '-'}
                        </dd>
                      </div>
                      <div className="detail-row">
                        <dt className="shrink-0 text-text-muted">연락처</dt>
                        <dd className="font-medium text-text-primary">
                          {formatPhone(order.ordererPhone)}
                        </dd>
                      </div>
                    </>
                  )}
                </dl>
              </section>

              {shipping && (
                <section className="detail-section">
                  <div className="detail-section-label">
                    <MapPin size={13} className="text-brand-400" />
                    배송지
                  </div>
                  <div className="space-y-0.5 text-sm">
                    <p className="font-semibold text-text-primary">
                      {shipping.receiverName}
                      {shipping.nickname && (
                        <span className="ml-1.5 text-xs font-normal text-text-muted">
                          ({shipping.nickname})
                        </span>
                      )}
                    </p>
                    <p className="text-text-secondary">{formatPhone(shipping.phoneNumber)}</p>
                    <p className="text-text-secondary">
                      [{shipping.zipCode}] {shipping.address}
                      {shipping.addressDetail && ` ${shipping.addressDetail}`}
                    </p>
                    {shipping.memo && (
                      <p className="text-xs text-text-muted">메모: {shipping.memo}</p>
                    )}
                  </div>
                </section>
              )}

              <section className="detail-section">
                <div className="detail-section-label">
                  <Package size={13} className="text-brand-400" />
                  주문 상품
                </div>
                <div className="space-y-2">
                  {(order.items ?? []).map((item) => {
                    const remaining = remainingItemQuantity(item);
                    const isFullyRefunded = item.refundedQuantity > 0 && remaining === 0;
                    const isPartiallyRefunded = item.refundedQuantity > 0 && remaining > 0;
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          'flex items-start justify-between gap-3 text-sm',
                          item.refundedQuantity > 0 &&
                            '-mx-2 rounded-xl border-l-4 border-red-400 bg-red-50/60 px-2 py-1.5',
                        )}
                      >
                        <div className="flex min-w-0 items-start gap-2.5">
                          {item.imageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.imageUrl}
                              alt={item.productName}
                              className={cn(
                                'h-10 w-10 shrink-0 rounded-lg object-cover',
                                isFullyRefunded && 'opacity-40 grayscale',
                              )}
                            />
                          )}
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <p
                                className={cn(
                                  'font-medium text-text-primary',
                                  isFullyRefunded && 'text-text-muted line-through',
                                )}
                              >
                                {item.productName}
                              </p>
                              {isFullyRefunded && (
                                <Badge label="전체 취소" color="bg-red-100 text-red-700" />
                              )}
                              {isPartiallyRefunded && (
                                <Badge
                                  label={`${item.refundedQuantity}개 취소`}
                                  color="bg-red-100 text-red-700"
                                />
                              )}
                            </div>
                            <p className="text-xs text-text-muted">
                              단가 {formatCurrency(item.unitPrice)} · 수량 {item.quantity}
                            </p>
                            {item.refundedQuantity > 0 && (
                              <p className="text-xs font-semibold text-red-600">
                                취소 {item.refundedQuantity}개 · 남은 수량 {remaining}개
                                {item.refundedAt && ` · ${formatDateTime(item.refundedAt)}`}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[11px] text-text-muted">상품금액</p>
                          <p
                            className={cn(
                              'font-medium text-text-primary',
                              isFullyRefunded && 'text-text-muted line-through',
                            )}
                          >
                            {formatCurrency(item.itemAmount)}
                          </p>
                          {item.refundedAmount > 0 && (
                            <p className="text-xs font-semibold text-red-600">
                              환불 -{formatCurrency(item.refundedAmount)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <ProductCouponDetailSection coupon={order.coupon} />

              <section className="detail-section">
                <div className="detail-section-label">
                  <Package size={13} className="text-brand-400" />
                  결제 상세
                </div>
                <dl className="space-y-1.5">
                  <div className="detail-row">
                    <dt className="text-text-muted">상품 합계</dt>
                    <dd className="font-medium text-text-primary">{formatCurrency(order.itemsAmount)}</dd>
                  </div>
                  {order.couponDiscountAmount > 0 && (
                    <div className="detail-row">
                      <dt className="text-text-muted">
                        쿠폰 할인
                        {order.coupon?.code ? ` (${order.coupon.code})` : ''}
                      </dt>
                      <dd className="font-medium text-text-primary">
                        -{formatCurrency(order.couponDiscountAmount)}
                      </dd>
                    </div>
                  )}
                  <div className="detail-row">
                    <dt className="text-text-muted">배송비</dt>
                    <dd className="font-medium text-text-primary">{formatCurrency(order.shippingFee)}</dd>
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
                    <dt className="font-semibold text-text-primary">결제금액</dt>
                    <dd className="font-bold text-brand-600">{formatCurrency(order.amount)}</dd>
                  </div>
                  {order.refundedAmount > 0 && (
                    <>
                      <div className="detail-row rounded-xl bg-red-50 px-3 py-2.5">
                        <dt className="font-semibold text-red-700">환불액</dt>
                        <dd className="font-bold text-red-600">
                          -{formatCurrency(order.refundedAmount)}
                        </dd>
                      </div>
                      <div className="detail-row px-3">
                        <dt className="font-semibold text-text-primary">남은 금액</dt>
                        <dd className="font-bold text-text-primary">
                          {formatCurrency(order.amount - order.refundedAmount)}
                        </dd>
                      </div>
                    </>
                  )}
                </dl>
              </section>
            </div>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-text-muted">주문 정보를 찾을 수 없습니다.</p>
        )}
      </Modal>

      {order && (
        <DeliveryModal order={showDeliveryModal ? order : null} onClose={() => setShowDeliveryModal(false)} />
      )}

      {order && (
        <CancelOrderModal
          order={showCancelModal ? order : null}
          onClose={() => setShowCancelModal(false)}
          onSuccess={onClose}
        />
      )}

      {order && (
        <RefundOrderModal
          order={showRefundModal ? order : null}
          onClose={() => setShowRefundModal(false)}
          onSuccess={onClose}
        />
      )}
    </>
  );
}

type RefundSummary = {
  isFull: boolean;
  refundedQuantity: number;
  lastRefundedAt: string | null;
  items: NonNullable<ProductOrder['items']>;
};

/** 환불 내역 요약. 환불이 없으면 null. */
function summarizeRefund(order: ProductOrder): RefundSummary | null {
  if (order.refundedAmount <= 0 && order.status !== 'refunded') return null;
  const items = (order.items ?? []).filter((item) => item.refundedQuantity > 0);
  const lastRefundedAt =
    items
      .map((item) => item.refundedAt)
      .filter((date): date is string => !!date)
      .sort()
      .at(-1) ?? null;
  return {
    isFull: order.status === 'refunded',
    refundedQuantity: items.reduce((sum, item) => sum + item.refundedQuantity, 0),
    lastRefundedAt,
    items,
  };
}

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Truck, Package, MapPin, User, XCircle, Undo2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { DeliveryModal } from '@/components/product-orders/DeliveryModal';
import { CancelOrderModal } from '@/components/product-orders/CancelOrderModal';
import { RefundOrderModal } from '@/components/product-orders/RefundOrderModal';
import { productOrdersApi } from '@/lib/api';
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
  const deliveryAddress = order?.deliveryAddress;
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
                  <p className="mt-0.5 text-sm text-text-muted">{order.user?.email ?? '-'}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold tracking-tight text-brand-600">
                    {formatCurrency(order.amount)}
                  </p>
                  {order.refundedAmount > 0 && (
                    <p className="text-xs text-text-muted">
                      환불 {formatCurrency(order.refundedAmount)}
                    </p>
                  )}
                  <p className="text-xs text-text-muted">{formatDateTime(order.approvedAt)}</p>
                </div>
              </div>

              {(canDeliver || (isAdmin && (canCancel || canRefund))) && (
                <div className="mt-4 flex gap-2">
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

            {(order.status === 'refunded' || order.status === 'partially_refunded') &&
              order.cancelledAt && (
              <div className="detail-callout bg-gray-50">
                <div className="detail-callout-icon">
                  <XCircle size={16} className="text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">
                    {order.status === 'refunded' ? '전액 환불 처리됨' : '부분 환불 처리됨'}
                  </p>
                  <p className="text-sm font-semibold text-gray-800">
                    {formatDateTime(order.cancelledAt)}
                  </p>
                </div>
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
                        <dt className="shrink-0 text-text-muted">연락처</dt>
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
                  주문 상품
                </div>
                <div className="space-y-2">
                  {(order.items ?? []).map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
                      <div className="flex min-w-0 items-start gap-2.5">
                        {item.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            className="h-10 w-10 shrink-0 rounded-lg object-cover"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-text-primary">{item.productName}</p>
                          <p className="text-xs text-text-muted">
                            단가 {formatCurrency(item.unitPrice)} · 수량 {item.quantity}
                            {item.refundedQuantity > 0 && ` · 환불 ${item.refundedQuantity}개`}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[11px] text-text-muted">상품금액</p>
                        <p className="font-medium text-text-primary">{formatCurrency(item.itemAmount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

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
                      <dt className="text-text-muted">쿠폰 할인</dt>
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
                      <div className="detail-row">
                        <dt className="text-text-muted">환불액</dt>
                        <dd className="font-medium text-text-primary">
                          -{formatCurrency(order.refundedAmount)}
                        </dd>
                      </div>
                      <div className="detail-row">
                        <dt className="text-text-muted">남은 금액</dt>
                        <dd className="font-medium text-text-primary">
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

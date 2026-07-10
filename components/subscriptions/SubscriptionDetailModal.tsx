'use client';

import { useQuery } from '@tanstack/react-query';
import { CreditCard, MapPin, User, PauseCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { PetProfileCard } from '@/components/shared/PetProfileCard';
import { subscriptionsApi } from '@/lib/api';
import {
  SUBSCRIPTION_STATUS_MAP,
  formatCurrency,
  formatDate,
} from '@/lib/utils';
import type { UserSubscription } from '@/types';

interface SubscriptionDetailModalProps {
  subscriptionId: number | null;
  onClose: () => void;
}

export function SubscriptionDetailModal({
  subscriptionId,
  onClose,
}: SubscriptionDetailModalProps) {
  const { data: subscription, isLoading } = useQuery<UserSubscription>({
    queryKey: ['subscriptions', subscriptionId],
    queryFn: () => subscriptionsApi.getById(subscriptionId!),
    enabled: subscriptionId !== null,
  });

  const statusInfo = subscription ? SUBSCRIPTION_STATUS_MAP[subscription.status] : null;
  const petProfile = subscription?.petProfile;
  const deliveryAddress = subscription?.deliveryAddress;

  return (
    <Modal
      isOpen={subscriptionId !== null}
      onClose={onClose}
      title="구독 상세"
      size="lg"
    >
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="spinner" />
        </div>
      ) : subscription ? (
        <div className="space-y-5">
          {/* Hero */}
          <div className="detail-hero">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-text-muted">
                구독 #{subscription.id}
              </span>
              {statusInfo && (
                <Badge label={statusInfo.label} color={statusInfo.color} />
              )}
              {subscription.isPaused && (
                <Badge label="쉬어가기" color="bg-blue-50 text-blue-600" />
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-lg font-bold leading-tight text-text-primary">
                  {subscription.plan?.name ?? '구독 플랜'}
                </p>
                <p className="mt-0.5 text-sm text-text-muted">
                  {subscription.user?.email ?? '-'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold tracking-tight text-brand-600">
                  {subscription.plan?.monthlyPrice
                    ? formatCurrency(
                        subscription.plan.monthlyPrice * (subscription.quantity ?? 1),
                      )
                    : '-'}
                </p>
                <p className="text-xs text-text-muted">
                  월 청구액
                  {(subscription.quantity ?? 1) > 1 && (
                    <span className="ml-1">
                      ({formatCurrency(subscription.plan!.monthlyPrice)} × {subscription.quantity})
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* 쉬어가기 안내 */}
          {subscription.isPaused && (
            <div className="detail-callout bg-blue-50">
              <div className="detail-callout-icon">
                <PauseCircle size={16} className="text-blue-500" />
              </div>
              <p className="text-sm text-blue-700">
                쉬어가기가 활성화되어 있습니다. 이번 결제일에 결제가 건너뜁니다.
              </p>
            </div>
          )}

          {/* 주요 일정: 스탯 타일 */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="detail-stat">
              <p className="text-xs text-text-muted">다음 결제일</p>
              <p className="mt-0.5 text-sm font-semibold text-text-primary">
                {formatDate(subscription.nextBillingDate)}
                {subscription.isPaused && (
                  <span className="ml-1 text-xs font-medium text-blue-500">건너뜀</span>
                )}
              </p>
            </div>
            {subscription.anchorDay != null && (
              <div className="detail-stat">
                <p className="text-xs text-text-muted">결제 기준일</p>
                <p className="mt-0.5 text-sm font-semibold text-text-primary">
                  매월 {subscription.anchorDay}일
                </p>
              </div>
            )}
            <div className="detail-stat">
              <p className="text-xs text-text-muted">구독 시작</p>
              <p className="mt-0.5 text-sm font-semibold text-text-primary">
                {formatDate(subscription.createdAt)}
              </p>
            </div>
            {subscription.cancelledAt && (
              <div className="detail-stat">
                <p className="text-xs text-text-muted">취소일</p>
                <p className="mt-0.5 text-sm font-semibold text-text-primary">
                  {formatDate(subscription.cancelledAt)}
                </p>
              </div>
            )}
            {subscription.renewalFailureCount > 0 && (
              <div className="detail-stat bg-red-50">
                <p className="text-xs text-red-400">결제 실패</p>
                <p className="mt-0.5 text-sm font-semibold text-red-500">
                  {subscription.renewalFailureCount}회
                </p>
              </div>
            )}
          </div>

          {/* Sections */}
          <div className="detail-sections">
            {subscription.user && (
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
                      <dt className="text-text-muted">연락처</dt>
                      <dd className="font-medium text-text-primary">
                        {subscription.user.phone}
                      </dd>
                    </div>
                  )}
                </dl>
              </section>
            )}

            {subscription.plan && (
              <section className="detail-section">
                <div className="detail-section-label">
                  <CreditCard size={13} className="text-brand-400" />
                  플랜 정보
                </div>
                <dl className="space-y-1.5">
                  <div className="detail-row">
                    <dt className="text-text-muted">플랜명</dt>
                    <dd className="font-medium text-text-primary">{subscription.plan.name}</dd>
                  </div>
                  <div className="detail-row">
                    <dt className="text-text-muted">단가</dt>
                    <dd className="font-medium text-text-primary">
                      {formatCurrency(subscription.plan.monthlyPrice)}
                    </dd>
                  </div>
                  <div className="detail-row">
                    <dt className="text-text-muted">수량</dt>
                    <dd className="font-medium text-text-primary">
                      {subscription.quantity ?? 1}개
                    </dd>
                  </div>
                  {subscription.plan.description && (
                    <div className="detail-row">
                      <dt className="shrink-0 text-text-muted">설명</dt>
                      <dd className="text-right text-text-secondary">
                        {subscription.plan.description}
                      </dd>
                    </div>
                  )}
                  <div className="detail-row rounded-xl bg-surface-muted px-3 py-2.5 !mt-3">
                    <dt className="font-semibold text-text-primary">월 청구액</dt>
                    <dd className="font-bold text-brand-600">
                      {formatCurrency(
                        subscription.plan.monthlyPrice * (subscription.quantity ?? 1),
                      )}
                    </dd>
                  </div>
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
          </div>
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-text-muted">
          구독 정보를 찾을 수 없습니다.
        </p>
      )}
    </Modal>
  );
}

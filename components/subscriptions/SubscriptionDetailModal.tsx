'use client';

import { useQuery } from '@tanstack/react-query';
import { CreditCard, MapPin, User, Calendar, PauseCircle } from 'lucide-react';
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
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" />
        </div>
      ) : subscription ? (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between rounded-xl bg-surface-muted p-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-text-muted">
                  구독 #{subscription.id}
                </span>
                {statusInfo && (
                  <Badge label={statusInfo.label} color={statusInfo.color} />
                )}
                {subscription.isPaused && (
                  <Badge label="쉬어가기" color="bg-blue-100 text-blue-700" />
                )}
              </div>
              <p className="mt-1 font-bold text-text-primary">
                {subscription.plan?.name ?? '구독 플랜'}
              </p>
              <p className="text-sm text-text-muted">
                {subscription.user?.email ?? '-'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-brand-500">
                {subscription.plan?.monthlyPrice
                  ? formatCurrency(
                      subscription.plan.monthlyPrice * (subscription.quantity ?? 1),
                    )
                  : '-'}
              </p>
              <p className="text-xs text-text-muted">
                월 청구액
                {(subscription.quantity ?? 1) > 1 && (
                  <span className="ml-1 text-text-muted">
                    ({formatCurrency(subscription.plan!.monthlyPrice)} × {subscription.quantity})
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* 쉬어가기 안내 */}
          {subscription.isPaused && (
            <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              <PauseCircle size={15} className="shrink-0 text-blue-500" />
              <span>쉬어가기가 활성화되어 있습니다. 이번 결제일에 결제가 건너뜁니다.</span>
            </div>
          )}

          {/* Next billing & dates */}
          <div className="flex items-center gap-3 rounded-xl border border-border px-4 py-3">
            <Calendar size={15} className="shrink-0 text-brand-500" />
            <div className="flex flex-wrap gap-x-8 gap-y-1 text-sm">
              <div>
                <span className="text-text-muted">다음 결제일 </span>
                <span className="font-semibold text-text-primary">
                  {formatDate(subscription.nextBillingDate)}
                </span>
                {subscription.isPaused && (
                  <span className="ml-1.5 text-xs font-medium text-blue-500">(건너뜀)</span>
                )}
              </div>
              {subscription.anchorDay != null && (
                <div>
                  <span className="text-text-muted">결제 기준일 </span>
                  <span className="font-medium text-text-primary">
                    매월 {subscription.anchorDay}일
                  </span>
                </div>
              )}
              <div>
                <span className="text-text-muted">구독 시작 </span>
                <span className="font-medium text-text-primary">
                  {formatDate(subscription.createdAt)}
                </span>
              </div>
              {subscription.cancelledAt && (
                <div>
                  <span className="text-text-muted">취소일 </span>
                  <span className="font-medium text-text-primary">
                    {formatDate(subscription.cancelledAt)}
                  </span>
                </div>
              )}
              {subscription.renewalFailureCount > 0 && (
                <div>
                  <span className="text-text-muted">결제 실패 </span>
                  <span className="font-medium text-red-500">
                    {subscription.renewalFailureCount}회
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Customer */}
            {subscription.user && (
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
                    <div className="flex justify-between">
                      <dt className="text-text-muted">연락처</dt>
                      <dd className="font-medium text-text-primary">
                        {subscription.user.phone}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* Plan */}
            {subscription.plan && (
              <div className="space-y-2 rounded-xl border border-border p-4">
                <div className="flex items-center gap-1.5">
                  <CreditCard size={14} className="text-brand-500" />
                  <span className="text-sm font-semibold text-text-primary">플랜 정보</span>
                </div>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-text-muted">플랜명</dt>
                    <dd className="font-medium text-text-primary">{subscription.plan.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-muted">단가</dt>
                    <dd className="font-medium text-text-primary">
                      {formatCurrency(subscription.plan.monthlyPrice)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-muted">수량</dt>
                    <dd className="font-medium text-text-primary">
                      {subscription.quantity ?? 1}개
                    </dd>
                  </div>
                  <div className="flex justify-between border-t border-border pt-1">
                    <dt className="text-text-muted">월 청구액</dt>
                    <dd className="font-semibold text-brand-500">
                      {formatCurrency(
                        subscription.plan.monthlyPrice * (subscription.quantity ?? 1),
                      )}
                    </dd>
                  </div>
                  {subscription.plan.description && (
                    <div className="flex justify-between gap-2">
                      <dt className="shrink-0 text-text-muted">설명</dt>
                      <dd className="text-right text-text-secondary">
                        {subscription.plan.description}
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

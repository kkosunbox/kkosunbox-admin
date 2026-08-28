'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Dog, MapPin, CreditCard, Package, TrendingUp } from 'lucide-react';
import { usersApi, getErrorMessage } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { PetProfileCard } from '@/components/shared/PetProfileCard';
import { InfluencerProfileModal } from '@/components/influencers/InfluencerProfileModal';
import {
  USER_STATUS_MAP,
  SUBSCRIPTION_STATUS_MAP,
  PAYMENT_STATUS_MAP,
  formatDateTime,
  formatCurrency,
  cn,
} from '@/lib/utils';
import type { UserStatus } from '@/types';

const STATUS_OPTIONS: { value: UserStatus; label: string }[] = [
  { value: 'active', label: '활성' },
  { value: 'inactive', label: '비활성' },
  { value: 'suspended', label: '정지' },
];

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { admin } = useAuth();
  const isAdmin = admin?.role === 'admin';

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showInfluencerModal, setShowInfluencerModal] = useState(false);
  const [newStatus, setNewStatus] = useState<UserStatus>('active');
  const [error, setError] = useState('');
  const [influencerError, setInfluencerError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['users', id],
    queryFn: () => usersApi.getById(Number(id)),
  });

  const mutation = useMutation({
    mutationFn: (status: UserStatus) => usersApi.updateStatus(Number(id), status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowStatusModal(false);
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const unassignInfluencerMutation = useMutation({
    mutationFn: () => usersApi.setInfluencer(Number(id), { isInfluencer: false }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users', id] });
      void queryClient.invalidateQueries({ queryKey: ['influencers'] });
      setInfluencerError('');
    },
    onError: (err) => setInfluencerError(getErrorMessage(err)),
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  const user = data?.user;
  if (!user) return <div className="text-center py-16 text-text-muted">고객을 찾을 수 없습니다.</div>;

  const statusInfo = USER_STATUS_MAP[user.status];
  const isInfluencer = user.isInfluencer === true;
  const influencerProfile = data?.influencerProfile ?? user.influencerProfile ?? null;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary">
        <ArrowLeft size={16} /> 목록으로
      </button>

      {/* Hero */}
      <div className="detail-hero shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-mono text-sm text-text-muted">#{user.id}</p>
              {statusInfo && <Badge label={statusInfo.label} color={statusInfo.color} />}
              {isInfluencer && (
                <Badge label="인플루언서" color="bg-violet-50 text-violet-600" />
              )}
            </div>
            <h1 className="mt-1.5 break-all text-xl font-bold text-text-primary">{user.email}</h1>
            {user.phone && <p className="mt-0.5 text-sm text-text-muted">{user.phone}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && isInfluencer && (
              <button
                onClick={() => router.push(`/influencers/${user.id}`)}
                className="flex items-center gap-1.5 btn-secondary text-sm"
              >
                <TrendingUp size={14} />
                인플루언서 상세
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() =>
                  isInfluencer
                    ? unassignInfluencerMutation.mutate()
                    : setShowInfluencerModal(true)
                }
                disabled={unassignInfluencerMutation.isPending}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all',
                  isInfluencer
                    ? 'bg-purple-100/80 text-purple-600 hover:bg-purple-100'
                    : 'bg-white/70 text-text-secondary backdrop-blur-sm hover:bg-brand-50 hover:text-brand-600',
                )}
              >
                <TrendingUp size={14} />
                {unassignInfluencerMutation.isPending
                  ? '처리 중...'
                  : isInfluencer
                    ? '인플루언서 해제'
                    : '인플루언서 지정'}
              </button>
            )}
            <button
              onClick={() => { setNewStatus(user.status); setShowStatusModal(true); }}
              className="btn-secondary text-sm"
            >
              상태 변경
            </button>
          </div>
        </div>
        {influencerError && (
          <p className="mt-2 text-xs text-red-500">{influencerError}</p>
        )}
        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="rounded-xl bg-white/60 px-4 py-3 backdrop-blur-sm">
            <p className="text-xs text-text-muted">가입일</p>
            <p className="mt-0.5 text-sm font-semibold text-text-primary">{formatDateTime(user.createdAt)}</p>
          </div>
          <div className="rounded-xl bg-white/60 px-4 py-3 backdrop-blur-sm">
            <p className="text-xs text-text-muted">마지막 로그인</p>
            <p className="mt-0.5 text-sm font-semibold text-text-primary">{formatDateTime(user.lastLoginAt)}</p>
          </div>
          <div className="rounded-xl bg-white/60 px-4 py-3 backdrop-blur-sm">
            <p className="text-xs text-text-muted">마케팅 동의</p>
            <p className={cn('mt-0.5 text-sm font-semibold', user.isAllowMarketing ? 'text-green-600' : 'text-text-muted')}>
              {user.isAllowMarketing ? '동의' : '미동의'}
            </p>
          </div>
        </div>
      </div>

      {/* 상세 정보: 하나의 카드 안에 개방형 섹션으로 통합 */}
      <div className="card p-6">
        <div className="detail-sections">
          {/* 반려견 프로필 (체크리스트 포함) */}
          {(data?.petProfiles ?? []).length > 0 && (
            <section className="detail-section">
              <div className="detail-section-label">
                <Dog size={13} className="text-brand-400" />
                반려견
                <span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[11px] font-bold text-brand-600">
                  {data.petProfiles.length}
                </span>
              </div>
              <div className="divide-y divide-border-light">
                {data.petProfiles.map((pet: any) => (
                  <div key={pet.id} className="py-4 first:pt-0 last:pb-0">
                    <PetProfileCard petProfile={pet} hideLabel />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 배송지 */}
          {(data?.deliveryAddresses ?? []).length > 0 && (
            <section className="detail-section">
              <div className="detail-section-label">
                <MapPin size={13} className="text-brand-400" />
                배송지
                <span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[11px] font-bold text-brand-600">
                  {data.deliveryAddresses.length}
                </span>
              </div>
              <div className="divide-y divide-border-light">
                {data.deliveryAddresses.map((addr: any) => (
                  <div key={addr.id} className="py-3 text-sm first:pt-0 last:pb-0">
                    <p className="font-semibold text-text-primary">
                      {addr.receiverName}
                      {addr.nickname && <span className="ml-2 text-xs font-normal text-text-muted">({addr.nickname})</span>}
                    </p>
                    <p className="text-text-secondary">{addr.phoneNumber}</p>
                    <p className="text-xs text-text-muted">[{addr.zipCode}] {addr.address} {addr.addressDetail ?? ''}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 구독 현황 */}
          {(data?.subscriptions ?? []).length > 0 && (
            <section className="detail-section">
              <div className="detail-section-label">
                <CreditCard size={13} className="text-brand-400" />
                구독 현황
              </div>
              <div className="divide-y divide-border-light">
                {data.subscriptions.map((sub: any) => {
                  const subStatus = SUBSCRIPTION_STATUS_MAP[sub.status];
                  return (
                    <div key={sub.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div>
                        <p className="text-sm font-medium text-text-primary">{sub.plan?.name ?? '-'}</p>
                        <p className="text-xs text-text-muted">
                          다음 결제일: {sub.nextBillingDate}
                          {sub.isPaused && (
                            <span className="ml-1.5 font-medium text-blue-500">(건너뜀)</span>
                          )}
                        </p>
                      </div>
                      <div className="flex flex-wrap justify-end gap-1">
                        {sub.isPaused
                          ? <Badge label="쉬어가기" color="bg-blue-50 text-blue-600" />
                          : subStatus && <Badge label={subStatus.label} color={subStatus.color} />
                        }
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 결제 이력 */}
          {(data?.payments ?? []).length > 0 && (
            <section className="detail-section">
              <div className="detail-section-label">
                <Package size={13} className="text-brand-400" />
                결제 이력
              </div>
              <div className="-mx-6 overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-light">
                      <th className="table-th first:pl-6">ID</th>
                      <th className="table-th">플랜</th>
                      <th className="table-th">금액</th>
                      <th className="table-th">상태</th>
                      <th className="table-th last:pr-6">결제일시</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light">
                    {data.payments.slice(0, 10).map((payment: any) => {
                      const ps = PAYMENT_STATUS_MAP[payment.status];
                      return (
                        <tr key={payment.id} className="transition-colors hover:bg-surface-muted">
                          <td className="table-td first:pl-6 font-mono text-xs text-text-muted">#{payment.id}</td>
                          <td className="table-td text-text-primary">{payment.planName ?? '-'}</td>
                          <td className="table-td font-semibold text-text-primary">{formatCurrency(payment.amount)}</td>
                          <td className="table-td">{ps && <Badge label={ps.label} color={ps.color} />}</td>
                          <td className="table-td last:pr-6 text-text-secondary">{formatDateTime(payment.approvedAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      </div>

      <InfluencerProfileModal
        isOpen={showInfluencerModal}
        mode="assign"
        userId={Number(id)}
        queryKeyId={id}
        initialDisplayName={influencerProfile?.displayName ?? ''}
        initialSlug={influencerProfile?.slug ?? ''}
        initialProfileImageUrl={influencerProfile?.profileImageUrl ?? null}
        onClose={() => setShowInfluencerModal(false)}
      />

      {/* Status Modal */}
      <Modal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} title="고객 상태 변경" size="sm">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setNewStatus(opt.value)}
                className={cn(
                  'rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                  newStatus === opt.value
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-surface-input/50 text-text-secondary hover:bg-surface-input',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button onClick={() => setShowStatusModal(false)} className="btn-secondary flex-1">취소</button>
            <button
              onClick={() => mutation.mutate(newStatus)}
              disabled={mutation.isPending}
              className="btn-primary flex-1"
            >
              {mutation.isPending ? '변경 중...' : '변경하기'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

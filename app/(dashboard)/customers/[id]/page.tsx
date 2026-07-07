'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Dog, MapPin, CreditCard, Package, TrendingUp } from 'lucide-react';
import { usersApi, getErrorMessage } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  USER_STATUS_MAP,
  SUBSCRIPTION_STATUS_MAP,
  PAYMENT_STATUS_MAP,
  formatDateTime,
  formatDate,
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

  const influencerMutation = useMutation({
    mutationFn: (isInfluencer: boolean) => usersApi.setInfluencer(Number(id), isInfluencer),
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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" />
      </div>
    );
  }

  const user = data?.user;
  if (!user) return <div className="text-center py-16 text-text-muted">고객을 찾을 수 없습니다.</div>;

  const statusInfo = USER_STATUS_MAP[user.status];
  const isInfluencer = (user as any).isInfluencer === true;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary">
        <ArrowLeft size={16} /> 목록으로
      </button>

      {/* Header */}
      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-mono text-sm text-text-muted">#{user.id}</p>
              {statusInfo && <Badge label={statusInfo.label} color={statusInfo.color} />}
              {isInfluencer && (
                <Badge label="인플루언서" color="bg-purple-100 text-purple-700" />
              )}
            </div>
            <h1 className="mt-1 break-all text-xl font-bold text-text-primary">{user.email}</h1>
            {user.phone && <p className="text-text-muted">{user.phone}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && isInfluencer && (
              <button
                onClick={() => router.push(`/influencers/${user.id}`)}
                className="flex items-center gap-1.5 btn-secondary text-sm"
              >
                <TrendingUp size={14} />
                포인트 정산
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => influencerMutation.mutate(!isInfluencer)}
                disabled={influencerMutation.isPending}
                className={cn(
                  'flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-all',
                  isInfluencer
                    ? 'border-purple-200 bg-purple-50 text-purple-600 hover:bg-purple-100'
                    : 'border-border text-text-secondary hover:border-brand-200 hover:bg-brand-50',
                )}
              >
                <TrendingUp size={14} />
                {influencerMutation.isPending
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
        <div className="mt-4 grid grid-cols-1 gap-3 border-t border-border pt-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-text-muted">가입일</p>
            <p className="font-medium text-text-primary">{formatDateTime(user.createdAt)}</p>
          </div>
          <div>
            <p className="text-text-muted">마지막 로그인</p>
            <p className="font-medium text-text-primary">{formatDateTime(user.lastLoginAt)}</p>
          </div>
          <div>
            <p className="text-text-muted">마케팅 동의</p>
            <p className={cn('font-medium', user.isAllowMarketing ? 'text-green-600' : 'text-text-muted')}>
              {user.isAllowMarketing ? '동의' : '미동의'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* 반려견 프로필 */}
        {(data?.petProfiles ?? []).length > 0 && (
          <div className="card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Dog size={16} className="text-brand-500" />
              <h2 className="section-title">반려견 ({data.petProfiles.length})</h2>
            </div>
            <div className="space-y-3">
              {data.petProfiles.map((pet: any) => (
                <div key={pet.id} className="space-y-2 rounded-xl border border-border p-3 text-sm">
                  <div>
                    <p className="font-semibold text-text-primary">{pet.name ?? '이름 없음'}</p>
                    <p className="text-text-muted">{pet.breed ?? '-'} · {pet.gender === 'male' ? '수컷' : pet.gender === 'female' ? '암컷' : '-'} · {pet.weight ? `${pet.weight}kg` : '-'}</p>
                    {pet.birthDate && <p className="text-xs text-text-muted">생일: {formatDate(pet.birthDate)}</p>}
                  </div>
                  <div className="rounded-lg bg-amber-50 px-2.5 py-2">
                    <p className="mb-0.5 text-xs font-semibold text-amber-700">특이사항</p>
                    {pet.specialNotes ? (
                      <p className="whitespace-pre-wrap text-xs leading-relaxed text-amber-900">{pet.specialNotes}</p>
                    ) : (
                      <p className="text-xs text-amber-600/60">없음</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 배송지 */}
        {(data?.deliveryAddresses ?? []).length > 0 && (
          <div className="card p-5">
            <div className="mb-3 flex items-center gap-2">
              <MapPin size={16} className="text-brand-500" />
              <h2 className="section-title">배송지 ({data.deliveryAddresses.length})</h2>
            </div>
            <div className="space-y-3">
              {data.deliveryAddresses.map((addr: any) => (
                <div key={addr.id} className="rounded-xl border border-border p-3 text-sm">
                  <p className="font-semibold text-text-primary">
                    {addr.receiverName}
                    {addr.nickname && <span className="ml-2 text-xs text-text-muted">({addr.nickname})</span>}
                  </p>
                  <p className="text-text-secondary">{addr.phoneNumber}</p>
                  <p className="text-text-muted text-xs">[{addr.zipCode}] {addr.address} {addr.addressDetail ?? ''}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 구독 현황 */}
      {(data?.subscriptions ?? []).length > 0 && (
        <div className="card p-5">
          <div className="mb-3 flex items-center gap-2">
            <CreditCard size={16} className="text-brand-500" />
            <h2 className="section-title">구독 현황</h2>
          </div>
          <div className="space-y-2">
            {data.subscriptions.map((sub: any) => {
              const subStatus = SUBSCRIPTION_STATUS_MAP[sub.status];
              return (
                <div key={sub.id} className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                  <div>
                    <p className="font-medium text-text-primary">{sub.plan?.name ?? '-'}</p>
                    <p className="text-xs text-text-muted">
                      다음 결제일: {sub.nextBillingDate}
                      {sub.isPaused && (
                        <span className="ml-1.5 font-medium text-blue-500">(건너뜀)</span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-1">
                    {sub.isPaused
                      ? <Badge label="쉬어가기" color="bg-blue-100 text-blue-700" />
                      : subStatus && <Badge label={subStatus.label} color={subStatus.color} />
                    }
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 결제 이력 */}
      {(data?.payments ?? []).length > 0 && (
        <div className="card overflow-hidden">
          <div className="border-b border-border px-5 py-3">
            <div className="flex items-center gap-2">
              <Package size={16} className="text-brand-500" />
              <h2 className="section-title">결제 이력</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-surface-muted">
                <tr>
                  <th className="table-th">ID</th>
                  <th className="table-th">플랜</th>
                  <th className="table-th">금액</th>
                  <th className="table-th">상태</th>
                  <th className="table-th">결제일시</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.payments.slice(0, 10).map((payment: any) => {
                  const ps = PAYMENT_STATUS_MAP[payment.status];
                  return (
                    <tr key={payment.id}>
                      <td className="table-td font-mono text-xs text-text-muted">#{payment.id}</td>
                      <td className="table-td text-text-primary">{payment.planName ?? '-'}</td>
                      <td className="table-td font-semibold text-text-primary">{formatCurrency(payment.amount)}</td>
                      <td className="table-td">{ps && <Badge label={ps.label} color={ps.color} />}</td>
                      <td className="table-td text-text-secondary">{formatDateTime(payment.approvedAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Status Modal */}
      <Modal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} title="고객 상태 변경" size="sm">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setNewStatus(opt.value)}
                className={cn(
                  'rounded-xl border px-3 py-2 text-sm font-medium transition-all',
                  newStatus === opt.value
                    ? 'border-brand-400 bg-brand-50 text-brand-600'
                    : 'border-border text-text-secondary hover:border-brand-200',
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

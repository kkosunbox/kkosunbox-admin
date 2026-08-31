'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  TrendingUp,
  Coins,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Trash2,
  FileText,
  Link,
  Copy,
  Pencil,
  User,
} from 'lucide-react';
import { influencersApi, getErrorMessage } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { InfluencerProfileModal } from '@/components/influencers/InfluencerProfileModal';
import { USER_STATUS_MAP, formatCurrency, formatDateTime, cn } from '@/lib/utils';
import type { InfluencerDetail, InfluencerMonthlySummaryItem, InfluencerSettlement } from '@/types';

const MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
const LIMIT = 20;

export default function InfluencerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [year, setYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [pointsPage, setPointsPage] = useState(1);

  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settleTarget, setSettleTarget] = useState<{ year: number; month: number } | null>(null);
  const [settleNote, setSettleNote] = useState('');
  const [settleError, setSettleError] = useState('');

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<InfluencerSettlement | null>(null);
  const [cancelError, setCancelError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const userId = Number(id);

  const { data: influencerDetail, isLoading: detailLoading } = useQuery<InfluencerDetail>({
    queryKey: ['influencer-detail', userId],
    queryFn: () => influencersApi.getById(userId),
    enabled: !!userId,
  });

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['influencer-summary', userId, year],
    queryFn: () => influencersApi.getMonthlySummary(userId, year),
    enabled: !!userId,
  });

  const { data: pointsData, isLoading: pointsLoading } = useQuery({
    queryKey: ['influencer-points', userId, year, selectedMonth, pointsPage],
    queryFn: () =>
      influencersApi.getPoints(userId, {
        year,
        month: selectedMonth,
        page: pointsPage,
        limit: LIMIT,
      }),
    enabled: !!userId,
  });

  const { data: settlements } = useQuery({
    queryKey: ['influencer-settlements', userId],
    queryFn: () => influencersApi.getSettlements(userId),
    enabled: !!userId,
  });

  const settleMutation = useMutation({
    mutationFn: (data: { year: number; month: number; note?: string }) =>
      influencersApi.createSettlement(userId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['influencer-summary', userId] });
      void queryClient.invalidateQueries({ queryKey: ['influencer-settlements', userId] });
      void queryClient.invalidateQueries({ queryKey: ['influencer-detail', userId] });
      setShowSettleModal(false);
      setSettleNote('');
      setSettleError('');
    },
    onError: (err) => setSettleError(getErrorMessage(err)),
  });

  const cancelMutation = useMutation({
    mutationFn: (settlementId: number) =>
      influencersApi.deleteSettlement(userId, settlementId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['influencer-summary', userId] });
      void queryClient.invalidateQueries({ queryKey: ['influencer-settlements', userId] });
      void queryClient.invalidateQueries({ queryKey: ['influencer-detail', userId] });
      setShowCancelModal(false);
      setCancelTarget(null);
      setCancelError('');
    },
    onError: (err) => setCancelError(getErrorMessage(err)),
  });

  if (summaryLoading || detailLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!summaryData || !influencerDetail) {
    return <div className="py-16 text-center text-text-muted">인플루언서를 찾을 수 없습니다.</div>;
  }

  const monthlyItems: InfluencerMonthlySummaryItem[] = summaryData.items ?? [];
  const totalAccumulatedAmount: number = summaryData.totalAccumulatedAmount ?? 0;
  const influencerProfile = influencerDetail.influencerProfile ?? null;

  function copyToClipboard(text: string) {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const settlementMap = new Map<string, InfluencerSettlement>();
  (settlements ?? []).forEach((s: InfluencerSettlement) => {
    settlementMap.set(`${s.year}-${s.month}`, s);
  });

  function getMonthItem(month: number) {
    return monthlyItems.find((item) => item.month === month);
  }

  function openSettleModal(y: number, m: number) {
    setSettleTarget({ year: y, month: m });
    setSettleNote('');
    setSettleError('');
    setShowSettleModal(true);
  }

  function openCancelModal(settlement: InfluencerSettlement) {
    setCancelTarget(settlement);
    setCancelError('');
    setShowCancelModal(true);
  }

  const selectedMonthItem = getMonthItem(selectedMonth);
  const selectedSettlement = settlementMap.get(`${year}-${selectedMonth}`);
  const points = pointsData?.items ?? [];
  const pointsTotal = pointsData?.total ?? 0;
  const pointsTotalPages = Math.ceil(pointsTotal / LIMIT);

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary"
      >
        <ArrowLeft size={16} /> 목록으로
      </button>

      {/* Header */}
      <div className="card p-5">
        <div className="flex flex-wrap items-start gap-4">
          {/* 프로필 이미지 or 아이콘 */}
          {influencerProfile?.profileImageUrl ? (
            <img
              src={influencerProfile.profileImageUrl}
              alt={influencerProfile.displayName}
              className="h-14 w-14 flex-shrink-0 rounded-2xl object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-50">
              <TrendingUp size={22} className="text-brand-500" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-mono text-sm text-text-muted">#{userId}</p>
              {influencerProfile && (
                <>
                  <Badge
                    label={influencerProfile.isActive ? '활성' : '비활성'}
                    color={influencerProfile.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-surface-input text-text-muted'}
                  />
                  <Badge
                    label={(influencerProfile.isPageVisible ?? true) ? '페이지 공개' : '페이지 비공개'}
                    color={(influencerProfile.isPageVisible ?? true) ? 'bg-blue-50 text-blue-600' : 'bg-surface-input text-text-muted'}
                  />
                </>
              )}
            </div>

            {/* displayName + email */}
            {influencerProfile ? (
              <>
                <p className="mt-0.5 text-xl font-bold text-text-primary">{influencerProfile.displayName}</p>
                <p className="text-sm text-text-muted">{influencerDetail.email}</p>
              </>
            ) : (
              <p className="mt-0.5 text-xl font-bold text-text-primary">
                {influencerDetail.email}
              </p>
            )}

            {/* 레퍼럴 코드 + 링크 + 할인율 */}
            {influencerProfile && (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {influencerProfile.slug && (
                  <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-muted px-3 py-1.5">
                    <span className="text-xs text-text-muted">slug</span>
                    <span className="font-mono text-sm font-bold text-text-primary">
                      {influencerProfile.slug}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-muted px-3 py-1.5">
                  <span className="text-xs text-text-muted">레퍼럴 코드</span>
                  <span className="font-mono text-sm font-bold text-text-primary">
                    {influencerProfile.referralCode}
                  </span>
                  <button
                    onClick={() => copyToClipboard(influencerProfile.referralCode)}
                    className="ml-1 text-text-muted hover:text-text-primary"
                    title="복사"
                  >
                    <Copy size={13} className={copied ? 'text-green-500' : ''} />
                  </button>
                </div>

                <div className="flex items-center gap-1 rounded-lg border border-border bg-surface-muted px-3 py-1.5 text-xs">
                  <span className="text-text-muted">할인율</span>
                  <span className="font-bold text-text-primary">
                    {(influencerProfile.discountRate * 100).toFixed(0)}%
                  </span>
                </div>

                <a
                  href={influencerProfile.referralLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-brand-500 hover:underline"
                >
                  <Link size={12} />
                  {influencerProfile.referralLink}
                </a>
              </div>
            )}

            {/* 계약 만료일 */}
            {influencerDetail.influencerContractExpiresAt && (
              <p className="mt-2 text-xs text-text-muted">
                계약 만료:{' '}
                <span className="font-medium text-text-secondary">
                  {formatDateTime(influencerDetail.influencerContractExpiresAt)}
                </span>
              </p>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={() => router.push(`/customers/${userId}`)}
              className="btn-secondary text-sm"
            >
              <User size={14} />
              고객 상세
            </button>
            <button
              type="button"
              onClick={() => setShowEditModal(true)}
              className="btn-secondary text-sm"
            >
              <Pencil size={14} />
              프로필 수정
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 border-t border-border pt-4 sm:grid-cols-2">
          <div className="rounded-xl bg-brand-50 px-4 py-3">
            <p className="text-xs text-brand-600">전체 누적 포인트</p>
            <p className="mt-0.5 text-2xl font-bold text-brand-700">
              {formatCurrency(totalAccumulatedAmount)}
            </p>
          </div>
          <div className="rounded-xl bg-surface-muted px-4 py-3">
            <p className="text-xs text-text-muted">{year}년 {selectedMonth}월 포인트</p>
            <p className="mt-0.5 text-2xl font-bold text-text-primary">
              {formatCurrency(selectedMonthItem?.totalAmount ?? 0)}
            </p>
            <p className="mt-0.5 text-xs">
              {selectedSettlement ? (
                <span className="text-green-600 font-medium">정산 완료</span>
              ) : selectedMonthItem ? (
                <span className="text-orange-500 font-medium">미정산</span>
              ) : (
                <span className="text-text-muted">내역 없음</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Year selector + Monthly Summary */}
      <div className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins size={16} className="text-brand-500" />
            <h2 className="section-title">월별 포인트 내역</h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setYear((y) => y - 1); setPointsPage(1); }}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-text-muted hover:bg-surface-muted"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="min-w-[4rem] text-center text-sm font-semibold text-text-primary">
              {year}년
            </span>
            <button
              onClick={() => { setYear((y) => y + 1); setPointsPage(1); }}
              disabled={year >= currentYear}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-text-muted hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {MONTH_NAMES.map((name, i) => {
            const month = i + 1;
            const item = getMonthItem(month);
            const settlement = settlementMap.get(`${year}-${month}`);
            const isSelected = selectedMonth === month;

            return (
              <button
                key={month}
                onClick={() => { setSelectedMonth(month); setPointsPage(1); }}
                className={cn(
                  'relative flex flex-col items-center rounded-xl border p-3 text-xs transition-all',
                  isSelected
                    ? 'border-brand-400 bg-brand-50 shadow-sm'
                    : item
                      ? 'border-border bg-white hover:border-brand-200 hover:bg-brand-50/30'
                      : 'border-border bg-surface-muted/30 opacity-50',
                )}
              >
                <span className={cn('font-semibold', isSelected ? 'text-brand-600' : 'text-text-primary')}>
                  {name}
                </span>
                {item ? (
                  <>
                    <span className={cn('mt-1 font-bold', isSelected ? 'text-brand-700' : 'text-text-primary')}>
                      {(item.totalAmount / 1000).toFixed(0)}K
                    </span>
                    {settlement ? (
                      <CheckCircle2 size={12} className="mt-1 text-green-500" />
                    ) : (
                      <Clock size={12} className="mt-1 text-orange-400" />
                    )}
                  </>
                ) : (
                  <span className="mt-1 text-text-muted">-</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Month Detail */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-brand-500" />
            <h2 className="section-title">
              {year}년 {selectedMonth}월 적립 내역
            </h2>
            {selectedMonthItem && (
              <Badge
                label={formatCurrency(selectedMonthItem.totalAmount)}
                color="bg-brand-50 text-brand-700"
              />
            )}
          </div>

          <div className="flex items-center gap-2">
            {selectedSettlement ? (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                  <CheckCircle2 size={13} />
                  정산 완료 ({formatDateTime(selectedSettlement.settledAt)})
                </span>
                <button
                  onClick={() => openCancelModal(selectedSettlement)}
                  className="flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1 text-xs text-red-500 hover:bg-red-50"
                >
                  <Trash2 size={12} />
                  취소
                </button>
              </div>
            ) : selectedMonthItem ? (
              <button
                onClick={() => openSettleModal(year, selectedMonth)}
                className="btn-primary text-xs py-1.5 px-3"
              >
                정산 처리
              </button>
            ) : null}
          </div>
        </div>

        {pointsLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="spinner h-6 w-6" />
          </div>
        ) : points.length === 0 ? (
          <EmptyState icon={Coins} title="해당 월 적립 내역이 없습니다." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-surface-muted">
                <tr>
                  <th className="table-th">ID</th>
                  <th className="table-th">유형</th>
                  <th className="table-th">포인트</th>
                  <th className="table-th">설명</th>
                  <th className="table-th">레퍼럴 코드</th>
                  <th className="table-th">적립일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {points.map((point: any) => (
                  <tr key={point.id}>
                    <td className="table-td font-mono text-xs text-text-muted">#{point.id}</td>
                    <td className="table-td">
                      <Badge label="레퍼럴 보상" color="bg-blue-50 text-blue-600" />
                    </td>
                    <td className="table-td font-semibold text-brand-600">
                      +{formatCurrency(point.amount)}
                    </td>
                    <td className="table-td text-text-secondary">{point.description ?? '-'}</td>
                    <td className="table-td font-mono text-xs text-text-muted">
                      {point.referralCode ?? '-'}
                    </td>
                    <td className="table-td text-text-secondary">{formatDateTime(point.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pointsTotalPages > 1 && (
          <div className="border-t border-border px-5 py-4">
            <Pagination page={pointsPage} totalPages={pointsTotalPages} onPageChange={setPointsPage} />
          </div>
        )}
      </div>

      {/* Settlement Modal */}
      <Modal
        isOpen={showSettleModal}
        onClose={() => setShowSettleModal(false)}
        title="정산 처리"
        size="sm"
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-surface-muted p-4 text-sm">
            <p className="text-text-muted">정산 대상</p>
            <p className="mt-1 text-lg font-bold text-text-primary">
              {settleTarget?.year}년 {settleTarget?.month}월
            </p>
            {settleTarget && getMonthItem(settleTarget.month) && (
              <p className="mt-0.5 font-semibold text-brand-600">
                {formatCurrency(getMonthItem(settleTarget.month)!.totalAmount)}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-secondary">
              메모 (선택)
            </label>
            <input
              type="text"
              value={settleNote}
              onChange={(e) => setSettleNote(e.target.value)}
              placeholder="예: 6월 정산 완료"
              className="input-base w-full"
            />
          </div>

          {settleError && <p className="text-xs text-red-500">{settleError}</p>}

          <div className="flex gap-2">
            <button
              onClick={() => setShowSettleModal(false)}
              className="btn-secondary flex-1"
            >
              취소
            </button>
            <button
              onClick={() => {
                if (!settleTarget) return;
                settleMutation.mutate({
                  year: settleTarget.year,
                  month: settleTarget.month,
                  note: settleNote || undefined,
                });
              }}
              disabled={settleMutation.isPending}
              className="btn-primary flex-1"
            >
              {settleMutation.isPending ? '처리 중...' : '정산 확정'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Cancel Settlement Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="정산 취소"
        size="sm"
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-red-50 p-4 text-sm">
            <p className="font-medium text-red-700">정산을 취소하시겠습니까?</p>
            {cancelTarget && (
              <p className="mt-1 text-red-600">
                {cancelTarget.year}년 {cancelTarget.month}월 —{' '}
                {formatCurrency(cancelTarget.totalAmount)}
              </p>
            )}
          </div>

          {cancelError && <p className="text-xs text-red-500">{cancelError}</p>}

          <div className="flex gap-2">
            <button
              onClick={() => setShowCancelModal(false)}
              className="btn-secondary flex-1"
            >
              닫기
            </button>
            <button
              onClick={() => {
                if (!cancelTarget) return;
                cancelMutation.mutate(cancelTarget.id);
              }}
              disabled={cancelMutation.isPending}
              className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
            >
              {cancelMutation.isPending ? '취소 중...' : '정산 취소'}
            </button>
          </div>
        </div>
      </Modal>

      <InfluencerProfileModal
        isOpen={showEditModal}
        mode="edit"
        userId={userId}
        queryKeyId={String(userId)}
        initialDisplayName={influencerProfile?.displayName ?? ''}
        initialSlug={influencerProfile?.slug ?? ''}
        initialProfileImageUrl={influencerProfile?.profileImageUrl ?? null}
        initialIsPageVisible={influencerProfile?.isPageVisible ?? true}
        onClose={() => setShowEditModal(false)}
      />
    </div>
  );
}

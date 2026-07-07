'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Image as ImageIcon, Eye, EyeOff, Loader2, ExternalLink } from 'lucide-react';
import { reviewsApi, plansApi, getErrorMessage } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDateTime, formatCurrency, cn } from '@/lib/utils';
import type { Review, SubscriptionPlan } from '@/types';

const LIMIT = 20;

type HiddenFilter = 'all' | 'true' | 'false';

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;

  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={12}
          className={cn(
            i < full
              ? 'fill-yellow-400 text-yellow-400'
              : i === full && half
                ? 'fill-yellow-200 text-yellow-400'
                : 'fill-gray-100 text-gray-300',
          )}
        />
      ))}
      <span className="ml-1 text-xs font-medium text-text-primary">{rating}</span>
    </span>
  );
}

export default function ReviewsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [hiddenFilter, setHiddenFilter] = useState<HiddenFilter>('all');
  const [planIdFilter, setPlanIdFilter] = useState<string>('');
  const [selectedReviewId, setSelectedReviewId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['reviews', page, hiddenFilter, planIdFilter],
    queryFn: () =>
      reviewsApi.getList({
        page,
        limit: LIMIT,
        planId: planIdFilter ? Number(planIdFilter) : undefined,
        isHidden:
          hiddenFilter === 'true'
            ? true
            : hiddenFilter === 'false'
              ? false
              : undefined,
      }),
  });

  const { data: plansData } = useQuery({
    queryKey: ['plans'],
    queryFn: () => plansApi.getList(),
  });

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['reviews', selectedReviewId],
    queryFn: () => reviewsApi.getById(selectedReviewId!),
    enabled: selectedReviewId !== null,
  });

  const hideMutation = useMutation({
    mutationFn: (id: number) => reviewsApi.hide(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
    onError: (err) => alert(getErrorMessage(err)),
  });

  const unhideMutation = useMutation({
    mutationFn: (id: number) => reviewsApi.unhide(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
    onError: (err) => alert(getErrorMessage(err)),
  });

  const reviews: Review[] = data?.items ?? [];
  const total: number = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);
  const plans: SubscriptionPlan[] = plansData?.plans ?? [];

  function handleFilterChange(filter: HiddenFilter) {
    setHiddenFilter(filter);
    setPage(1);
  }

  function handlePlanChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setPlanIdFilter(e.target.value);
    setPage(1);
  }

  function openDetail(id: number) {
    setSelectedReviewId(id);
  }

  function closeDetail() {
    setSelectedReviewId(null);
  }

  const detail: Review | undefined = detailData;
  const isTogglePending = hideMutation.isPending || unhideMutation.isPending;

  const HIDDEN_FILTERS: { label: string; value: HiddenFilter }[] = [
    { label: '전체', value: 'all' },
    { label: '노출 중', value: 'false' },
    { label: '숨김', value: 'true' },
  ];

  return (
    <div className="space-y-4">
      {/* 필터 */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="filter-tabs">
          {HIDDEN_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => handleFilterChange(f.value)}
              className={cn('filter-tab', hiddenFilter === f.value && 'filter-tab-active')}
            >
              {f.label}
            </button>
          ))}
        </div>

        <select
          value={planIdFilter}
          onChange={handlePlanChange}
          className="rounded-xl border border-border bg-white px-3 py-2 text-xs font-medium text-text-secondary outline-none transition-colors focus:border-brand-400 hover:bg-surface-muted"
        >
          <option value="">전체 플랜</option>
          {plans.map((plan) => (
            <option key={plan.id} value={String(plan.id)}>
              {plan.name}
            </option>
          ))}
        </select>
      </div>

      {/* 테이블 */}
      <div className="card overflow-hidden">
        <div className="border-b border-border px-5 py-3">
          <p className="text-sm text-text-secondary">
            총 <span className="font-bold text-text-primary">{total}</span>개
          </p>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="spinner" />
          </div>
        ) : reviews.length === 0 ? (
          <EmptyState icon={Star} title="등록된 리뷰가 없습니다." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-surface-muted">
                <tr>
                  <th className="table-th">ID</th>
                  <th className="table-th">플랜</th>
                  <th className="table-th">작성자</th>
                  <th className="table-th">별점</th>
                  <th className="table-th">내용</th>
                  <th className="table-th">이미지</th>
                  <th className="table-th">상태</th>
                  <th className="table-th">작성일</th>
                  <th className="table-th">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reviews.map((review) => (
                  <tr
                    key={review.id}
                    onClick={() => openDetail(review.id)}
                    className={cn(
                      'cursor-pointer transition-colors hover:bg-surface-muted/50',
                      review.isHidden && 'opacity-60',
                    )}
                  >
                    <td className="table-td font-mono text-xs text-text-muted">
                      #{review.id}
                    </td>
                    <td className="table-td text-sm text-text-primary">
                      {review.plan?.name ?? '-'}
                    </td>
                    <td className="table-td max-w-[160px]">
                      <p className="truncate text-xs text-text-secondary">
                        {review.snapshotUserEmail ?? '-'}
                      </p>
                    </td>
                    <td className="table-td">
                      <StarRating rating={review.rating} />
                    </td>
                    <td className="table-td max-w-[200px]">
                      <p className="truncate text-sm text-text-secondary">
                        {review.content}
                      </p>
                    </td>
                    <td className="table-td">
                      {review.imageUrls && review.imageUrls.length > 0 ? (
                        <span className="flex items-center gap-1 rounded-lg bg-brand-50 px-2 py-1 text-xs font-medium text-brand-600">
                          <ImageIcon size={11} />
                          {review.imageUrls.length}장
                        </span>
                      ) : (
                        <span className="text-xs text-text-muted">없음</span>
                      )}
                    </td>
                    <td className="table-td">
                      <Badge
                        label={review.isHidden ? '숨김' : '노출'}
                        color={
                          review.isHidden
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-green-100 text-green-800'
                        }
                      />
                    </td>
                    <td className="table-td whitespace-nowrap text-xs text-text-secondary">
                      {formatDateTime(review.createdAt)}
                    </td>
                    <td className="table-td" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() =>
                          review.isHidden
                            ? unhideMutation.mutate(review.id)
                            : hideMutation.mutate(review.id)
                        }
                        disabled={isTogglePending}
                        className={cn(
                          'rounded px-2 py-1 text-xs font-medium disabled:opacity-50',
                          review.isHidden
                            ? 'bg-green-50 text-green-600 hover:bg-green-100'
                            : 'bg-red-50 text-red-500 hover:bg-red-100',
                        )}
                      >
                        {review.isHidden ? '노출' : '숨김'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="border-t border-border px-5 py-4">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* 상세 모달 */}
      <Modal
        isOpen={selectedReviewId !== null}
        onClose={closeDetail}
        title="리뷰 상세"
        size="lg"
      >
        {detailLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 size={24} className="animate-spin text-brand-400" />
          </div>
        ) : detail ? (
          <div className="space-y-5">
            {/* 펫 프로필 + 작성자 */}
            <div className="flex items-center gap-3">
              {detail.snapshotPetProfileImageUrl ? (
                <img
                  src={detail.snapshotPetProfileImageUrl}
                  alt={detail.snapshotPetName ?? '펫'}
                  className="h-12 w-12 rounded-full object-cover ring-2 ring-border"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-2xl ring-2 ring-border">
                  🐾
                </div>
              )}
              <div>
                <p className="font-semibold text-text-primary">
                  {detail.snapshotPetName ?? '이름 없음'}
                </p>
                {detail.snapshotUserEmail ? (
                  detail.userId != null ? (
                    <Link
                      href={`/customers/${detail.userId}`}
                      className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 hover:underline"
                      onClick={closeDetail}
                    >
                      {detail.snapshotUserEmail}
                      <ExternalLink size={10} />
                    </Link>
                  ) : (
                    <p className="text-xs text-text-muted">{detail.snapshotUserEmail} (탈퇴)</p>
                  )
                ) : (
                  <p className="text-xs text-text-muted">이메일 정보 없음</p>
                )}
              </div>
            </div>

            {/* 메타 정보 */}
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-surface-muted p-4 text-sm sm:grid-cols-3">
              <div>
                <p className="mb-0.5 text-xs text-text-muted">리뷰 ID</p>
                <p className="font-mono font-medium text-text-primary">#{detail.id}</p>
              </div>
              <div>
                <p className="mb-0.5 text-xs text-text-muted">플랜</p>
                <p className="font-medium text-text-primary">
                  {detail.plan?.name ?? '-'}
                  {detail.plan?.monthlyPrice != null && (
                    <span className="ml-1 text-xs font-normal text-text-muted">
                      ({formatCurrency(detail.plan.monthlyPrice)})
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="mb-0.5 text-xs text-text-muted">결제 ID</p>
                {detail.subscriptionPaymentId != null ? (
                  <Link
                    href={`/orders/${detail.subscriptionPaymentId}`}
                    className="inline-flex items-center gap-1 font-mono text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline"
                    onClick={closeDetail}
                  >
                    #{detail.subscriptionPaymentId}
                    <ExternalLink size={11} />
                  </Link>
                ) : (
                  <p className="text-sm text-text-muted">-</p>
                )}
              </div>
              <div>
                <p className="mb-0.5 text-xs text-text-muted">별점</p>
                <StarRating rating={detail.rating} />
              </div>
              <div>
                <p className="mb-0.5 text-xs text-text-muted">상태</p>
                <Badge
                  label={detail.isHidden ? '숨김' : '노출'}
                  color={
                    detail.isHidden
                      ? 'bg-gray-100 text-gray-600'
                      : 'bg-green-100 text-green-800'
                  }
                />
              </div>
              <div>
                <p className="mb-0.5 text-xs text-text-muted">작성일</p>
                <p className="text-text-primary">{formatDateTime(detail.createdAt)}</p>
              </div>
            </div>

            {/* 리뷰 내용 */}
            <div>
              <p className="mb-2 text-sm font-medium text-text-secondary">리뷰 내용</p>
              <p className="whitespace-pre-wrap rounded-xl border border-border bg-white p-4 text-sm leading-relaxed text-text-primary">
                {detail.content}
              </p>
            </div>

            {/* 이미지 */}
            {detail.imageUrls && detail.imageUrls.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-text-secondary">
                  첨부 이미지 ({detail.imageUrls.length}장)
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {detail.imageUrls.map((url, idx) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group overflow-hidden rounded-xl border border-border"
                    >
                      <img
                        src={url}
                        alt={`리뷰 이미지 ${idx + 1}`}
                        className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* 숨김/해제 버튼 */}
            <div className="flex justify-end border-t border-border pt-4">
              <button
                onClick={() => {
                  if (detail.isHidden) {
                    unhideMutation.mutate(detail.id);
                  } else {
                    hideMutation.mutate(detail.id);
                  }
                  closeDetail();
                }}
                disabled={isTogglePending}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all disabled:opacity-50',
                  detail.isHidden
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-red-500 text-white hover:bg-red-600',
                )}
              >
                {detail.isHidden ? (
                  <>
                    <Eye size={15} /> 노출 처리
                  </>
                ) : (
                  <>
                    <EyeOff size={15} /> 숨김 처리
                  </>
                )}
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

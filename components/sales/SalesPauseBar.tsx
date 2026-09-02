'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Loader2, Pause, Play } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { plansApi, productsApi, salesApi, getErrorMessage } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';
import { cn } from '@/lib/utils';
import type { Product, SubscriptionPlan } from '@/types';

function toProductList(data: unknown): Product[] {
  if (Array.isArray(data)) return data as Product[];
  if (data && typeof data === 'object' && Array.isArray((data as { products?: unknown }).products)) {
    return (data as { products: Product[] }).products;
  }
  return [];
}

export function SalesPauseBar() {
  const { admin } = useAuth();
  const queryClient = useQueryClient();
  const [confirmTarget, setConfirmTarget] = useState<boolean | null>(null);
  const [error, setError] = useState('');

  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getList(),
    enabled: admin?.role === 'admin',
  });

  const { data: plansData } = useQuery({
    queryKey: ['plans'],
    queryFn: () => plansApi.getList(),
    enabled: admin?.role === 'admin',
  });

  const products = toProductList(productsData);
  const plans: SubscriptionPlan[] = plansData?.plans ?? [];
  const totalCount = products.length + plans.length;
  const pausedProductCount = products.filter((p) => p.isSalesPaused).length;
  const pausedPlanCount = plans.filter((p) => p.isSalesPaused).length;
  const pausedCount = pausedProductCount + pausedPlanCount;
  const allPaused = totalCount > 0 && pausedCount === totalCount;
  const somePaused = pausedCount > 0;

  const mutation = useMutation({
    mutationFn: (isSalesPaused: boolean) => salesApi.pauseAll(isSalesPaused),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      void queryClient.invalidateQueries({ queryKey: ['plans'] });
      setConfirmTarget(null);
      setError('');
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  if (admin?.role !== 'admin') return null;
  if (totalCount === 0) return null;

  const isPausing = confirmTarget === true;

  function openConfirm(isSalesPaused: boolean) {
    setError('');
    setConfirmTarget(isSalesPaused);
  }

  function closeConfirm() {
    if (mutation.isPending) return;
    setConfirmTarget(null);
    setError('');
  }

  return (
    <>
      <div
        className={cn(
          'detail-callout flex-wrap',
          allPaused ? 'bg-amber-50' : somePaused ? 'bg-orange-50' : 'bg-surface-muted',
        )}
      >
        <div className="detail-callout-icon">
          {allPaused || somePaused ? (
            <Pause size={16} className="text-amber-600" aria-hidden="true" />
          ) : (
            <Play size={16} className="text-brand-500" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text-primary">
            {allPaused
              ? '전체 판매가 일시중단되어 있습니다'
              : somePaused
                ? '일부 상품·플랜이 판매 중단 상태입니다'
                : '판매가 진행 중입니다'}
          </p>
          <p className="mt-0.5 text-xs text-text-muted">
            단건 {pausedProductCount}/{products.length} · 구독 {pausedPlanCount}/{plans.length} 중단
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          {somePaused && (
            <button
              type="button"
              onClick={() => openConfirm(false)}
              className="btn-secondary py-2 text-xs"
            >
              전체 판매 재개
            </button>
          )}
          {!allPaused && (
            <button
              type="button"
              onClick={() => openConfirm(true)}
              className="btn-danger py-2 text-xs"
            >
              전체 판매 중단
            </button>
          )}
        </div>
      </div>

      <Modal
        isOpen={confirmTarget !== null}
        onClose={closeConfirm}
        title={isPausing ? '전체 판매 중단' : '전체 판매 재개'}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-text-secondary">
            {isPausing
              ? '등록된 단건 상품과 구독 플랜을 모두 판매 일시중단합니다. 고객은 해당 상품을 새로 구매하거나 구독할 수 없습니다.'
              : '모든 단건 상품과 구독 플랜의 판매를 재개합니다. 개별 중단한 항목도 함께 재개됩니다.'}
          </p>
          <div className="rounded-xl bg-surface-muted px-4 py-3 text-sm text-text-secondary">
            단건 상품 {products.length}개 · 구독 플랜 {plans.length}개
          </div>
          {error && (
            <div className="form-error-banner">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={closeConfirm}
              disabled={mutation.isPending}
              className="btn-secondary flex-1"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => confirmTarget !== null && mutation.mutate(confirmTarget)}
              disabled={mutation.isPending}
              className={cn('flex-1', isPausing ? 'btn-danger' : 'btn-primary')}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                  처리 중...
                </>
              ) : isPausing ? (
                '전체 중단'
              ) : (
                '전체 재개'
              )}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

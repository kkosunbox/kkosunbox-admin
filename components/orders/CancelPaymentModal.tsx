'use client';

import { useState } from 'react';
import { Loader2, XCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { ordersApi, getErrorMessage } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { Payment } from '@/types';

interface CancelPaymentModalProps {
  payment: Payment | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CancelPaymentModal({ payment, onClose, onSuccess }: CancelPaymentModalProps) {
  const queryClient = useQueryClient();
  const [cancelSubscription, setCancelSubscription] = useState(false);
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: ({ id, cancelSubscription }: { id: number; cancelSubscription: boolean }) =>
      ordersApi.cancelPayment(id, cancelSubscription),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      void queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      onSuccess?.();
      onClose();
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  function handleClose() {
    if (mutation.isPending) return;
    setCancelSubscription(false);
    setError('');
    onClose();
  }

  function handleConfirm() {
    if (!payment) return;
    setError('');
    mutation.mutate({ id: payment.id, cancelSubscription });
  }

  return (
    <Modal isOpen={!!payment} onClose={handleClose} title="결제 취소 (환불)" size="sm">
      {payment && (
        <div className="space-y-4">
          {/* 대상 결제 정보 */}
          <div className="rounded-xl bg-surface-muted p-4 text-sm">
            <p className="text-text-muted">취소 대상</p>
            <p className="mt-1 font-semibold text-text-primary">
              {payment.subscription?.plan?.name ?? payment.planName ?? '구독 박스'}
            </p>
            <p className="text-text-secondary">
              {payment.subscription?.user?.email ?? `주문 #${payment.id}`}
            </p>
            <p className="mt-1 font-bold text-brand-500">
              {formatCurrency(payment.amount)}
            </p>
          </div>

          {/* 구독 함께 취소 옵션 */}
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-surface-muted/60">
            <input
              type="checkbox"
              checked={cancelSubscription}
              onChange={(e) => setCancelSubscription(e.target.checked)}
              className="mt-0.5 h-4 w-4 cursor-pointer accent-brand-500"
            />
            <div>
              <p className="text-sm font-medium text-text-primary">구독도 함께 취소</p>
              <p className="text-xs text-text-muted">
                체크 시 해당 구독이 즉시 취소됩니다.
              </p>
            </div>
          </label>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={mutation.isPending}
              className="btn-secondary flex-1"
            >
              닫기
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={mutation.isPending}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  처리 중...
                </>
              ) : (
                <>
                  <XCircle size={14} />
                  결제 취소
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

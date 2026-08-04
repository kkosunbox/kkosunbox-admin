'use client';

import { useState } from 'react';
import { Loader2, Undo2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { FormTextarea } from '@/components/ui/FormField';
import { ordersApi, getErrorMessage } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { Payment } from '@/types';

interface RefundPaymentModalProps {
  payment: Payment | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RefundPaymentModal({ payment, onClose, onSuccess }: RefundPaymentModalProps) {
  const queryClient = useQueryClient();
  const [refundReason, setRefundReason] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: ({ id, refundReason }: { id: number; refundReason: string }) =>
      ordersApi.refundPayment(id, refundReason || undefined),
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
    setRefundReason('');
    setError('');
    onClose();
  }

  function handleConfirm() {
    if (!payment) return;
    setError('');
    mutation.mutate({ id: payment.id, refundReason });
  }

  return (
    <Modal isOpen={!!payment} onClose={handleClose} title="환불 처리" size="sm">
      {payment && (
        <div className="space-y-4">
          <div className="rounded-xl bg-surface-muted p-4 text-sm">
            <p className="text-text-muted">환불 대상</p>
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

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            배송 상태와 무관하게 이 결제 건만 즉시 PG 환불이 처리됩니다. 구독 자체는 취소되지
            않습니다. 구독까지 함께 취소하려면 결제 취소(구독도 함께 취소) 기능을 이용해주세요.
          </div>

          <FormTextarea
            label="환불 사유"
            optional
            hint="입력하지 않으면 기본 사유로 기록됩니다."
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
            rows={2}
          />

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
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  처리 중...
                </>
              ) : (
                <>
                  <Undo2 size={14} />
                  환불하기
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

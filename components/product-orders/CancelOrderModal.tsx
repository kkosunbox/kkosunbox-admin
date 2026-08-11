'use client';

import { useState } from 'react';
import { Loader2, XCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { FormTextarea } from '@/components/ui/FormField';
import { productOrdersApi, getErrorMessage } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { ProductOrder } from '@/types';

interface CancelOrderModalProps {
  order: ProductOrder | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CancelOrderModal({ order, onClose, onSuccess }: CancelOrderModalProps) {
  const queryClient = useQueryClient();
  const [cancelReason, setCancelReason] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: ({ id, cancelReason }: { id: number; cancelReason: string }) =>
      productOrdersApi.cancel(id, cancelReason || undefined),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['product-orders'] });
      void queryClient.invalidateQueries({ queryKey: ['calendar'] });
      onSuccess?.();
      onClose();
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  function handleClose() {
    if (mutation.isPending) return;
    setCancelReason('');
    setError('');
    onClose();
  }

  function handleConfirm() {
    if (!order) return;
    setError('');
    mutation.mutate({ id: order.id, cancelReason });
  }

  return (
    <Modal isOpen={!!order} onClose={handleClose} title="결제 취소 (환불)" size="sm">
      {order && (
        <div className="space-y-4">
          <div className="rounded-xl bg-surface-muted p-4 text-sm">
            <p className="text-text-muted">취소 대상</p>
            <p className="mt-1 font-semibold text-text-primary">
              {order.productName} {order.quantity > 1 && `× ${order.quantity}`}
            </p>
            <p className="text-text-secondary">{order.user?.email ?? `주문 #${order.id}`}</p>
            <p className="mt-1 font-bold text-brand-500">{formatCurrency(order.amount)}</p>
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            배송 시작 전 주문만 취소할 수 있으며, 토스 결제 취소(환불)까지 함께 처리됩니다.
          </div>

          <FormTextarea
            label="취소 사유"
            optional
            hint="입력하지 않으면 '고객 요청 취소'로 기록됩니다."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
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

'use client';

import { useEffect, useState } from 'react';
import { Loader2, XCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { FormTextarea } from '@/components/ui/FormField';
import {
  ProductOrderItemQuantityPicker,
  selectedRefundItems,
} from '@/components/product-orders/ProductOrderItemQuantityPicker';
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
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    if (!order) return;
    setCancelReason('');
    setQuantities({});
    setError('');
  }, [order]);

  const mutation = useMutation({
    mutationFn: ({
      id,
      cancelReason,
      items,
    }: {
      id: number;
      cancelReason?: string;
      items?: { itemId: number; quantity: number }[];
    }) => productOrdersApi.cancel(id, { cancelReason, items }),
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
    onClose();
  }

  function handlePartialCancel() {
    if (!order) return;
    const items = selectedRefundItems(quantities);
    if (items.length === 0) {
      setError('취소할 수량을 입력해주세요.');
      return;
    }
    setError('');
    mutation.mutate({
      id: order.id,
      cancelReason: cancelReason || undefined,
      items,
    });
  }

  function handleFullCancel() {
    if (!order) return;
    setError('');
    mutation.mutate({
      id: order.id,
      cancelReason: cancelReason || undefined,
    });
  }

  return (
    <Modal isOpen={!!order} onClose={handleClose} title="결제 취소 (환불)" size="md">
      {order && (
        <div className="space-y-4">
          <div className="rounded-xl bg-surface-muted p-4 text-sm">
            <p className="text-text-muted">취소 대상</p>
            <p className="mt-1 font-semibold text-text-primary">{order.orderName}</p>
            <p className="text-text-secondary">{order.user?.email ?? `주문 #${order.id}`}</p>
            <p className="mt-1 font-bold text-brand-500">{formatCurrency(order.amount)}</p>
            {order.refundedAmount > 0 && (
              <p className="text-xs text-text-muted">
                이미 환불 {formatCurrency(order.refundedAmount)}
              </p>
            )}
          </div>

          <ProductOrderItemQuantityPicker
            items={order.items ?? []}
            quantities={quantities}
            onChange={(itemId, quantity) =>
              setQuantities((prev) => ({ ...prev, [itemId]: quantity }))
            }
          />

          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            배송 시작 전 주문만 취소할 수 있으며, 토스 결제 취소(환불)까지 함께 처리됩니다.
            부분 취소 후에도 남은 상품은 주문당 송장 1개로 발송할 수 있습니다.
          </div>
          <p className="text-xs text-text-muted">
            부분 취소 후 남은 상품 정가 합계가 무료배송 기준 밑이면 배송비가 다시 붙어 환불액이
            줄어듭니다. 배송비까지 포함해 남은 금액을 모두 돌려주려면 남은 전량 취소를 사용하세요.
          </p>

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
              onClick={handlePartialCancel}
              disabled={mutation.isPending}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
            >
              {mutation.isPending ? <Loader2 size={14} className="animate-spin" /> : '선택 수량 취소'}
            </button>
          </div>
          <button
            type="button"
            onClick={handleFullCancel}
            disabled={mutation.isPending}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
          >
            {mutation.isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                처리 중...
              </>
            ) : (
              <>
                <XCircle size={14} />
                남은 전량 취소
              </>
            )}
          </button>
        </div>
      )}
    </Modal>
  );
}

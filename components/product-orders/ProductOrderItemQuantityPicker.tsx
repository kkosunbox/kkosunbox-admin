'use client';

import { formatCurrency, remainingItemQuantity } from '@/lib/utils';
import type { ProductOrderItem } from '@/types';

interface ProductOrderItemQuantityPickerProps {
  items: ProductOrderItem[];
  quantities: Record<number, number>;
  onChange: (itemId: number, quantity: number) => void;
}

export function selectedRefundItems(quantities: Record<number, number>) {
  return Object.entries(quantities)
    .map(([itemId, quantity]) => ({ itemId: Number(itemId), quantity }))
    .filter((item) => item.quantity > 0);
}

export function ProductOrderItemQuantityPicker({
  items,
  quantities,
  onChange,
}: ProductOrderItemQuantityPickerProps) {
  return (
    <div className="space-y-2">
      {(items ?? []).map((item) => {
        const remaining = remainingItemQuantity(item);
        const value = quantities[item.id] ?? 0;

        return (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-text-primary">{item.productName}</p>
              <p className="text-xs text-text-muted">
                남은 {remaining}개 · {formatCurrency(item.unitPrice)}
                {item.refundedQuantity > 0 && ` · 환불 ${item.refundedQuantity}개`}
              </p>
            </div>
            {remaining > 0 ? (
              <input
                type="number"
                min={0}
                max={remaining}
                value={value}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  if (!Number.isFinite(next)) return;
                  onChange(item.id, Math.min(remaining, Math.max(0, Math.trunc(next))));
                }}
                className="w-16 rounded-lg border border-border bg-surface-input/50 px-2 py-1.5 text-center text-sm outline-none focus:border-brand-400"
              />
            ) : (
              <span className="text-xs text-text-muted">환불 완료</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

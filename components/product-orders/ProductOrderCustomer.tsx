import { Badge } from '@/components/ui/Badge';
import { cn, getProductOrderCustomerLabel, isGuestProductOrder } from '@/lib/utils';
import type { ProductOrder } from '@/types';

interface ProductOrderCustomerProps {
  order: ProductOrder;
  className?: string;
}

/** 고객 라벨. 비회원 주문이면 '비회원' 배지를 함께 표시한다. */
export function ProductOrderCustomer({ order, className }: ProductOrderCustomerProps) {
  return (
    <span className={cn('inline-flex min-w-0 items-center gap-1.5', className)}>
      <span className="truncate">{getProductOrderCustomerLabel(order)}</span>
      {isGuestProductOrder(order) && (
        <Badge label="비회원" color="bg-purple-100 text-purple-800" className="shrink-0" />
      )}
    </span>
  );
}

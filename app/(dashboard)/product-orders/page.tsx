'use client';

import { Suspense } from 'react';
import { ProductOrderList } from '@/components/product-orders/ProductOrderList';

export default function ProductOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <div className="spinner" />
        </div>
      }
    >
      <ProductOrderList />
    </Suspense>
  );
}

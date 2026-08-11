'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShoppingBag, ShoppingCart } from 'lucide-react';
import { SubscriptionOrderList } from '@/components/orders/SubscriptionOrderList';
import { ProductOrderList } from '@/components/product-orders/ProductOrderList';
import { cn } from '@/lib/utils';

type OrderTab = 'subscription' | 'product';

const TABS: {
  value: OrderTab;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}[] = [
  { value: 'subscription', label: '구독 주문', icon: ShoppingBag },
  { value: 'product', label: '단건 주문', icon: ShoppingCart },
];

function OrdersTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab: OrderTab = searchParams.get('tab') === 'product' ? 'product' : 'subscription';

  function handleTabChange(tab: OrderTab) {
    router.replace(tab === 'product' ? '/orders?tab=product' : '/orders', { scroll: false });
  }

  return (
    <div className="space-y-4">
      <div className="page-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={cn('page-tab', activeTab === tab.value && 'page-tab-active')}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'product' ? <ProductOrderList /> : <SubscriptionOrderList />}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <div className="spinner" />
        </div>
      }
    >
      <OrdersTabs />
    </Suspense>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, History, Search } from "lucide-react";
import { couponsApi, productCouponsApi } from "@/lib/api";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDateTime, SUBSCRIPTION_STATUS_MAP } from "@/lib/utils";
import type { CouponUsageLog, ProductCouponUsageLog } from "@/types";

const LIMIT = 20;

type UsageKind = "subscription" | "product";

interface CouponUsageLogsViewProps {
  kind: UsageKind;
}

export function CouponUsageLogsView({ kind }: CouponUsageLogsViewProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const backHref = kind === "subscription" ? "/coupons" : "/product-coupons";
  const queryKey =
    kind === "subscription" ? "coupon-usage-logs" : "product-coupon-usage-logs";
  const relatedLabel = kind === "subscription" ? "구독" : "주문";

  const { data, isLoading } = useQuery({
    queryKey: [queryKey, page, search],
    queryFn: () => {
      const params = {
        page,
        limit: LIMIT,
        search: search || undefined,
      };
      return kind === "subscription"
        ? couponsApi.getUsageLogs(params)
        : productCouponsApi.getUsageLogs(params);
    },
  });

  const items: Array<CouponUsageLog | ProductCouponUsageLog> = data?.items ?? [];
  const total: number = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={backHref}
          className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary"
        >
          <ArrowLeft size={16} /> 쿠폰 목록으로
        </Link>

        <form onSubmit={handleSearch} className="search-wrapper sm:ml-auto">
          <Search size={13} className="shrink-0 text-text-muted" />
          <input
            type="text"
            placeholder="쿠폰 코드, 쿠폰명, 이메일 검색"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="min-w-0 w-56 bg-transparent text-xs outline-none placeholder-text-muted"
          />
        </form>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-border px-5 py-3">
          <p className="text-sm text-text-secondary">
            총 <span className="font-bold text-text-primary">{total}</span>건
          </p>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="spinner" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={History}
            title="사용 내역이 없습니다"
            description={
              search
                ? "검색 조건을 바꿔 보세요."
                : "아직 사용된 쿠폰이 없어요."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-surface-muted">
                <tr>
                  <th className="table-th">사용일시</th>
                  <th className="table-th">쿠폰 코드</th>
                  <th className="table-th">쿠폰명</th>
                  <th className="table-th">사용자</th>
                  <th className="table-th">{relatedLabel}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-surface-muted/50"
                  >
                    <td className="table-td text-text-secondary">
                      {formatDateTime(item.usedAt)}
                    </td>
                    <td className="table-td font-mono font-bold text-brand-600">
                      {item.coupon?.code ?? "-"}
                    </td>
                    <td className="table-td text-text-primary">
                      {item.coupon?.name ?? "-"}
                    </td>
                    <td className="table-td">
                      {item.user ? (
                        <Link
                          href={`/customers/${item.user.id}`}
                          className="text-text-primary hover:text-brand-600"
                        >
                          {item.user.email}
                        </Link>
                      ) : (
                        <span className="text-text-muted">-</span>
                      )}
                    </td>
                    <td className="table-td">
                      {kind === "subscription" ? (
                        <SubscriptionCell item={item as CouponUsageLog} />
                      ) : (
                        <OrderCell item={item as ProductCouponUsageLog} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="border-t border-border px-5 py-4">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function SubscriptionCell({ item }: { item: CouponUsageLog }) {
  const subscription = item.subscription;
  if (!subscription) {
    return <span className="text-text-muted">-</span>;
  }

  const status = subscription.status
    ? SUBSCRIPTION_STATUS_MAP[subscription.status]
    : undefined;

  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-medium text-text-primary">
        {subscription.plan?.name ?? `구독 #${subscription.id}`}
      </span>
      <span className="text-xs text-text-muted">
        #{subscription.id}
        {status ? ` · ${status.label}` : ""}
      </span>
    </div>
  );
}

function OrderCell({ item }: { item: ProductCouponUsageLog }) {
  const order = item.order;
  if (!order) {
    return <span className="text-text-muted">-</span>;
  }

  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-medium text-text-primary">
        {order.productName ?? `주문 #${order.id}`}
      </span>
      <span className="text-xs text-text-muted">
        #{order.id}
        {order.amount != null ? ` · ${formatCurrency(order.amount)}` : ""}
      </span>
    </div>
  );
}

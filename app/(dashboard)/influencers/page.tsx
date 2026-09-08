"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { TrendingUp, AlertCircle } from "lucide-react";
import { influencersApi } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { USER_STATUS_MAP, formatDateTime, cn } from "@/lib/utils";
import type { Influencer } from "@/types";

const LIMIT = 20;

export default function InfluencersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [hasUnsettled, setHasUnsettled] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["influencers", page, hasUnsettled],
    queryFn: () =>
      influencersApi.getList({
        page,
        limit: LIMIT,
        hasUnsettled: hasUnsettled || undefined,
      }),
  });

  const influencers: Influencer[] = data?.items ?? [];
  const total: number = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex rounded-xl border border-border bg-surface-muted p-1 gap-1">
            <button
              onClick={() => {
                setHasUnsettled(false);
                setPage(1);
              }}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                !hasUnsettled
                  ? "bg-white text-text-primary shadow-card"
                  : "text-text-muted hover:text-text-secondary",
              )}
            >
              전체
            </button>
            <button
              onClick={() => {
                setHasUnsettled(true);
                setPage(1);
              }}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                hasUnsettled
                  ? "bg-white text-text-primary shadow-card"
                  : "text-text-muted hover:text-text-secondary",
              )}
            >
              <AlertCircle size={12} />
              미정산 있음
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <p className="text-sm font-medium text-text-secondary">
            총 <span className="font-bold text-text-primary">{total}</span>명
          </p>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" />
          </div>
        ) : influencers.length === 0 ? (
          <EmptyState icon={TrendingUp} title="인플루언서가 없습니다." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-surface-muted">
                <tr>
                  <th className="table-th">ID</th>
                  <th className="table-th">이메일</th>
                  <th className="table-th">표기이름</th>
                  <th className="table-th">상태</th>
                  <th className="table-th">가입일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {influencers.map((influencer) => {
                  const statusInfo = USER_STATUS_MAP[influencer.status];
                  const displayName =
                    influencer.displayName?.trim() ||
                    influencer.influencerProfile?.displayName?.trim();
                  return (
                    <tr
                      key={influencer.id}
                      onClick={() =>
                        router.push(`/influencers/${influencer.id}`)
                      }
                      className="cursor-pointer transition-colors hover:bg-surface-muted/50"
                    >
                      <td className="table-td font-mono text-xs text-text-muted">
                        #{influencer.id}
                      </td>
                      <td className="table-td font-medium text-text-primary">
                        {influencer.email}
                      </td>
                      <td className="table-td text-text-secondary">
                        {displayName ? (
                          displayName
                        ) : (
                          <span className="text-text-muted">없음</span>
                        )}
                      </td>
                      <td className="table-td">
                        {statusInfo && (
                          <Badge
                            label={statusInfo.label}
                            color={statusInfo.color}
                          />
                        )}
                      </td>
                      <td className="table-td text-text-secondary">
                        {formatDateTime(influencer.createdAt)}
                      </td>
                    </tr>
                  );
                })}
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

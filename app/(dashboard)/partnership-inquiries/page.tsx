"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Handshake } from "lucide-react";
import { partnershipInquiriesApi } from "@/lib/api";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTime } from "@/lib/utils";
import type { PartnershipInquiry } from "@/types";

const LIMIT = 20;

export default function PartnershipInquiriesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["partnership-inquiries", page],
    queryFn: () => partnershipInquiriesApi.getList({ page, limit: LIMIT }),
  });

  const inquiries: PartnershipInquiry[] = data?.items ?? [];
  const total: number = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5">
      <div className="card overflow-hidden">
        <div className="border-b border-border px-5 py-3">
          <p className="text-sm text-text-secondary">
            총 <span className="font-bold text-text-primary">{total}</span>건
          </p>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" />
          </div>
        ) : inquiries.length === 0 ? (
          <EmptyState icon={Handshake} title="제휴문의가 없습니다." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-light bg-surface-muted/60">
                  <th className="table-th">ID</th>
                  <th className="table-th">회사 / 브랜드</th>
                  <th className="table-th">담당자</th>
                  <th className="table-th">연락처</th>
                  <th className="table-th">이메일</th>
                  <th className="table-th">작성 회원</th>
                  <th className="table-th">접수일시</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {inquiries.map((inquiry) => (
                  <tr
                    key={inquiry.id}
                    onClick={() =>
                      router.push(`/partnership-inquiries/${inquiry.id}`)
                    }
                    className="cursor-pointer transition-colors hover:bg-surface-muted/50"
                  >
                    <td className="table-td font-mono text-xs text-text-muted">
                      #{inquiry.id}
                    </td>
                    <td className="table-td font-medium text-text-primary">
                      {inquiry.companyName}
                    </td>
                    <td className="table-td text-text-secondary">
                      {inquiry.contactName}
                    </td>
                    <td className="table-td text-text-secondary">
                      {inquiry.phone}
                    </td>
                    <td className="table-td text-text-secondary">
                      {inquiry.email}
                    </td>
                    <td className="table-td text-text-secondary">
                      {inquiry.user?.email ?? "-"}
                    </td>
                    <td className="table-td text-text-secondary">
                      {formatDateTime(inquiry.createdAt)}
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

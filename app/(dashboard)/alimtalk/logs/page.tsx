'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, History } from 'lucide-react';
import { alimtalkApi, getErrorMessage, type AlimtalkLog } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDateTime } from '@/lib/utils';

const LIMIT = 20;

const TEMPLATE_LABELS: Record<string, string> = {
  holiday_delivery_notice: '배송지연 안내',
};

function templateLabel(templateType: string) {
  return TEMPLATE_LABELS[templateType] ?? templateType;
}

export default function AlimtalkLogsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['alimtalk-logs', 'list', page],
    queryFn: () => alimtalkApi.getLogs({ page, limit: LIMIT }),
  });

  const logs: AlimtalkLog[] = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5">
      <Link
        href="/alimtalk"
        className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary"
      >
        <ArrowLeft size={16} /> 알림톡으로
      </Link>

      <div className="card overflow-hidden">
        <div className="border-b border-border px-5 py-3">
          <p className="text-sm text-text-secondary">
            총 <span className="font-bold text-text-primary">{total.toLocaleString('ko-KR')}</span>건
          </p>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="spinner" />
          </div>
        ) : isError ? (
          <div className="flex h-64 items-center justify-center px-5 text-center text-sm text-red-500">
            {getErrorMessage(error)}
          </div>
        ) : logs.length === 0 ? (
          <EmptyState icon={History} title="발송 이력이 없습니다." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-light bg-surface-muted/60">
                  <th className="table-th">발송일시</th>
                  <th className="table-th">템플릿</th>
                  <th className="table-th">내용</th>
                  <th className="table-th">대상</th>
                  <th className="table-th">시도</th>
                  <th className="table-th">성공</th>
                  <th className="table-th">실패</th>
                  <th className="table-th">발송자</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => router.push(`/alimtalk/logs/${log.id}`)}
                    className="cursor-pointer transition-colors hover:bg-surface-muted/50"
                  >
                    <td className="table-td text-text-secondary">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="table-td font-medium text-text-primary">
                      {templateLabel(log.templateType)}
                      {log.errorMessage && (
                        <p className="mt-0.5 max-w-xs truncate text-xs font-normal text-red-500">
                          {log.errorMessage}
                        </p>
                      )}
                    </td>
                    <td className="table-td">
                      <p className="font-medium text-text-primary">{log.holidayName || '-'}</p>
                      <p className="mt-0.5 text-xs text-text-muted">
                        {log.holidayStartDate} – {log.holidayEndDate} · 재개 {log.resumeDate}
                      </p>
                    </td>
                    <td className="table-td">
                      <Badge
                        label={log.sendToAllUsers ? '전체' : '선택'}
                        color={
                          log.sendToAllUsers
                            ? 'bg-brand-50 text-brand-700'
                            : 'bg-surface-input text-text-secondary'
                        }
                      />
                    </td>
                    <td className="table-td text-text-secondary">
                      {log.recipientCount.toLocaleString('ko-KR')}
                    </td>
                    <td className="table-td text-text-secondary">
                      {log.successCount.toLocaleString('ko-KR')}
                    </td>
                    <td
                      className={
                        log.failureCount > 0
                          ? 'table-td font-medium text-red-600'
                          : 'table-td text-text-secondary'
                      }
                    >
                      {log.failureCount.toLocaleString('ko-KR')}
                    </td>
                    <td className="table-td text-text-secondary">{log.admin?.name ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="border-t border-border px-5 py-4">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}

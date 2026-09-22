'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ArrowLeft } from 'lucide-react';
import { alimtalkApi, getErrorMessage } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { formatDateTime, formatPhone } from '@/lib/utils';

const TEMPLATE_LABELS: Record<string, string> = {
  holiday_delivery_notice: '배송지연 안내',
};

function templateLabel(templateType: string) {
  return TEMPLATE_LABELS[templateType] ?? templateType;
}

function PhoneList({ numbers }: { numbers: string[] }) {
  if (numbers.length === 0) {
    return <p className="text-sm text-text-muted">없음</p>;
  }

  return (
    <ul className="max-h-80 overflow-y-auto rounded-xl bg-surface-muted p-4 font-mono text-sm text-text-primary">
      {numbers.map((phone, index) => (
        <li key={`${phone}-${index}`} className="py-0.5">
          {formatPhone(phone)}
        </li>
      ))}
    </ul>
  );
}

export default function AlimtalkLogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const logId = Number(id);

  const { data: log, isLoading, isError, error } = useQuery({
    queryKey: ['alimtalk-logs', 'detail', logId],
    queryFn: () => alimtalkApi.getLog(logId),
    enabled: Number.isInteger(logId) && logId > 0,
    retry: (failureCount, err) => {
      if (err instanceof AxiosError && err.response?.status === 404) return false;
      return failureCount < 2;
    },
  });

  if (!Number.isInteger(logId) || logId <= 0) {
    return (
      <div className="py-16 text-center text-text-muted">발송 이력을 찾을 수 없습니다.</div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (isError || !log) {
    const notFound = error instanceof AxiosError && error.response?.status === 404;
    return (
      <div className="space-y-5">
        <button
          onClick={() => router.push('/alimtalk/logs')}
          className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary"
        >
          <ArrowLeft size={16} /> 목록으로
        </button>
        <div className="py-16 text-center text-sm text-text-muted">
          {notFound ? '발송 이력을 찾을 수 없습니다.' : getErrorMessage(error)}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <button
        onClick={() => router.push('/alimtalk/logs')}
        className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary"
      >
        <ArrowLeft size={16} /> 목록으로
      </button>

      <div className="detail-hero shadow-card">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-mono text-xs text-text-muted">#{log.id}</p>
          <Badge
            label={log.sendToAllUsers ? '전체 발송' : '선택 발송'}
            color={
              log.sendToAllUsers
                ? 'bg-brand-50 text-brand-700'
                : 'bg-white text-text-secondary'
            }
          />
        </div>
        <h1 className="mt-1 text-xl font-bold text-text-primary">
          {templateLabel(log.templateType)}
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          {formatDateTime(log.createdAt)} · {log.admin?.name ?? '-'}
        </p>
      </div>

      <div className="card p-5">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <p className="mb-0.5 text-xs text-text-muted">연휴명</p>
            <p className="text-sm font-medium text-text-primary">{log.holidayName || '-'}</p>
          </div>
          <div>
            <p className="mb-0.5 text-xs text-text-muted">연휴 시작</p>
            <p className="text-sm font-medium text-text-primary">{log.holidayStartDate || '-'}</p>
          </div>
          <div>
            <p className="mb-0.5 text-xs text-text-muted">연휴 종료</p>
            <p className="text-sm font-medium text-text-primary">{log.holidayEndDate || '-'}</p>
          </div>
          <div>
            <p className="mb-0.5 text-xs text-text-muted">배송 재개</p>
            <p className="text-sm font-medium text-text-primary">{log.resumeDate || '-'}</p>
          </div>
          <div>
            <p className="mb-0.5 text-xs text-text-muted">시도</p>
            <p className="text-sm font-medium text-text-primary">
              {log.recipientCount.toLocaleString('ko-KR')}
            </p>
          </div>
          <div>
            <p className="mb-0.5 text-xs text-text-muted">성공 / 실패</p>
            <p className="text-sm font-medium text-text-primary">
              {log.successCount.toLocaleString('ko-KR')}
              <span className="mx-1 text-text-muted">/</span>
              <span className={log.failureCount > 0 ? 'text-red-600' : undefined}>
                {log.failureCount.toLocaleString('ko-KR')}
              </span>
            </p>
          </div>
        </div>
      </div>

      {log.errorMessage && (
        <div className="form-error-banner">{log.errorMessage}</div>
      )}

      <div className="card p-5">
        <h2 className="mb-3 section-title">
          발송 번호
          <span className="ml-2 text-sm font-normal text-text-muted">
            {log.phoneNumbers.length.toLocaleString('ko-KR')}
          </span>
        </h2>
        <PhoneList numbers={log.phoneNumbers} />
      </div>

      <div className="card p-5">
        <h2 className="mb-1 section-title">
          제외된 번호
          <span className="ml-2 text-sm font-normal text-text-muted">
            {log.invalidPhoneNumbers.length.toLocaleString('ko-KR')}
          </span>
        </h2>
        <p className="mb-3 text-xs text-text-muted">
          전체 발송 시 형식이 맞지 않아 제외된 번호입니다.
        </p>
        <PhoneList numbers={log.invalidPhoneNumbers} />
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send, Loader2, Trash2 } from 'lucide-react';
import { inquiriesApi, getErrorMessage } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { INQUIRY_STATUS_MAP, formatDateTime } from '@/lib/utils';
import type { Inquiry } from '@/types';

export default function InquiryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');

  const { data: inquiry, isLoading } = useQuery<Inquiry>({
    queryKey: ['inquiries', id],
    queryFn: () => inquiriesApi.getById(Number(id)),
  });

  const mutation = useMutation({
    mutationFn: (text: string) => inquiriesApi.answer(Number(id), text),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['inquiries'] });
      setAnswer('');
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!inquiry) return <div className="text-center py-16 text-text-muted">문의를 찾을 수 없습니다.</div>;

  const statusInfo = INQUIRY_STATUS_MAP[inquiry.status];
  const isDeleted = inquiry.deletedAt !== null && inquiry.deletedAt !== undefined;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary">
        <ArrowLeft size={16} /> 목록으로
      </button>

      {isDeleted && (
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          <Trash2 size={15} className="flex-shrink-0 text-gray-400" />
          <span>
            유저가 삭제한 문의입니다.
            <span className="ml-1 text-gray-400">({formatDateTime(inquiry.deletedAt)})</span>
          </span>
        </div>
      )}

      {/* 문의 내용 */}
      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {statusInfo && <Badge label={statusInfo.label} color={statusInfo.color} />}
              <p className="font-mono text-xs text-text-muted">#{inquiry.id}</p>
            </div>
            <h1 className="mt-1 text-lg font-bold text-text-primary">{inquiry.title}</h1>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-text-muted">
          <span>{inquiry.user?.email ?? '-'}</span>
          {inquiry.contact && <span>연락처: {inquiry.contact}</span>}
          <span>{formatDateTime(inquiry.createdAt)}</span>
        </div>

        <div className="mt-4 rounded-xl bg-surface-muted p-4 text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
          {inquiry.content}
        </div>

        {inquiry.attachmentUrl && (
          <a
            href={inquiry.attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-xs text-brand-500 hover:underline"
          >
            첨부파일 보기
          </a>
        )}
      </div>

      {/* 기존 답변 */}
      {inquiry.answer && (
        <div className="card border-brand-200 p-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-brand-600">관리자 답변</p>
            <p className="text-xs text-text-muted">{formatDateTime(inquiry.answeredAt)}</p>
          </div>
          <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
            {inquiry.answer}
          </p>
        </div>
      )}

      {/* 답변 작성 */}
      <div className="card p-5">
        <h2 className="mb-3 section-title">
          {inquiry.answer ? '답변 수정' : '답변 작성'}
        </h2>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder={inquiry.answer ?? '답변을 입력해주세요...'}
          rows={5}
          className="input-base resize-none"
        />
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        <button
          onClick={() => { setError(''); mutation.mutate(answer); }}
          disabled={!answer.trim() || mutation.isPending}
          className="btn-primary mt-3"
        >
          {mutation.isPending ? (
            <><Loader2 size={14} className="animate-spin" /> 등록 중...</>
          ) : (
            <><Send size={14} /> 답변 등록</>
          )}
        </button>
      </div>
    </div>
  );
}

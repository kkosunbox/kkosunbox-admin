"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Paperclip } from "lucide-react";
import { partnershipInquiriesApi } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import type { PartnershipInquiry } from "@/types";

function isImageUrl(url: string): boolean {
  return /\.(jpe?g|png|gif|webp|svg)(\?|$)/i.test(url);
}

function fileNameFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    return decodeURIComponent(path.split("/").pop() || url);
  } catch {
    return url;
  }
}

export default function PartnershipInquiryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: inquiry, isLoading } = useQuery<PartnershipInquiry>({
    queryKey: ["partnership-inquiries", id],
    queryFn: () => partnershipInquiriesApi.getById(Number(id)),
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!inquiry) {
    return (
      <div className="text-center py-16 text-text-muted">
        제휴문의를 찾을 수 없습니다.
      </div>
    );
  }

  const referenceLinks = inquiry.referenceLinks?.filter(Boolean) ?? [];
  const attachmentUrls = inquiry.attachmentUrls?.filter(Boolean) ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <button
        onClick={() => router.push("/partnership-inquiries")}
        className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary"
      >
        <ArrowLeft size={16} /> 목록으로
      </button>

      <div className="detail-hero shadow-card">
        <p className="font-mono text-xs text-text-muted">#{inquiry.id}</p>
        <h1 className="mt-1 text-xl font-bold text-text-primary">
          {inquiry.companyName}
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          접수 {formatDateTime(inquiry.createdAt)}
        </p>
      </div>

      <div className="card p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-0.5 text-xs text-text-muted">담당자명</p>
            <p className="text-sm font-medium text-text-primary">
              {inquiry.contactName}
            </p>
          </div>
          <div>
            <p className="mb-0.5 text-xs text-text-muted">연락처</p>
            <p className="text-sm font-medium text-text-primary">
              {inquiry.phone}
            </p>
          </div>
          <div>
            <p className="mb-0.5 text-xs text-text-muted">이메일</p>
            <a
              href={`mailto:${inquiry.email}`}
              className="text-sm font-medium text-brand-600 hover:underline"
            >
              {inquiry.email}
            </a>
          </div>
          <div>
            <p className="mb-0.5 text-xs text-text-muted">작성 회원</p>
            {inquiry.user ? (
              <Link
                href={`/customers/${inquiry.userId}`}
                className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline"
              >
                {inquiry.user.email}
                <ExternalLink size={11} />
              </Link>
            ) : (
              <p className="text-sm text-text-muted">-</p>
            )}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="mb-3 section-title">문의 내용</h2>
        <div className="rounded-xl bg-surface-muted p-4 text-sm leading-relaxed text-text-primary whitespace-pre-wrap">
          {inquiry.content}
        </div>
      </div>

      {referenceLinks.length > 0 && (
        <div className="card p-5">
          <h2 className="mb-3 section-title">참고 링크</h2>
          <ul className="space-y-2">
            {referenceLinks.map((url) => (
              <li key={url}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex max-w-full items-center gap-1.5 text-sm text-brand-600 hover:underline"
                >
                  <ExternalLink size={13} className="shrink-0" />
                  <span className="truncate">{url}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {attachmentUrls.length > 0 && (
        <div className="card p-5">
          <h2 className="mb-3 section-title">첨부파일</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {attachmentUrls.map((url) =>
              isImageUrl(url) ? (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group overflow-hidden rounded-xl bg-surface-muted"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={fileNameFromUrl(url)}
                    className="h-28 w-full object-cover transition-opacity group-hover:opacity-90"
                  />
                </a>
              ) : (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl bg-surface-muted px-3 py-3 text-sm text-text-primary hover:bg-surface-input"
                >
                  <Paperclip size={14} className="shrink-0 text-text-muted" />
                  <span className="truncate">{fileNameFromUrl(url)}</span>
                  <ExternalLink size={12} className="ml-auto shrink-0 text-text-muted" />
                </a>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}

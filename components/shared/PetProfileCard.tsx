'use client';

import { Dog, ClipboardList } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { PetProfile } from '@/types';

interface PetProfileCardProps {
  petProfile: PetProfile;
  /** 2-col grid 안에서 full-width(col-span-2)로 표시할지 여부 — 외부에서 제어 가능 */
  className?: string;
}

export function PetProfileCard({ petProfile, className }: PetProfileCardProps) {
  const answers = petProfile.checklistAnswers ?? [];
  const hasChecklist = answers.length > 0;

  return (
    <div className={`space-y-3 rounded-xl border border-border p-4 ${className ?? ''}`}>
      {/* 헤더 */}
      <div className="flex items-center gap-1.5">
        <Dog size={14} className="text-brand-500" />
        <span className="text-sm font-semibold text-text-primary">반려견 정보</span>
      </div>

      {/* 기본 정보 — 체크리스트가 있으면 2열 grid로 압축 */}
      <dl
        className={`text-sm ${
          hasChecklist
            ? 'grid grid-cols-2 gap-x-6 gap-y-1.5'
            : 'space-y-1.5'
        }`}
      >
        {petProfile.name && (
          <div className="flex justify-between gap-2">
            <dt className="shrink-0 text-text-muted">이름</dt>
            <dd className="font-medium text-text-primary">{petProfile.name}</dd>
          </div>
        )}
        {petProfile.breed && (
          <div className="flex justify-between gap-2">
            <dt className="shrink-0 text-text-muted">견종</dt>
            <dd className="truncate font-medium text-text-primary">{petProfile.breed}</dd>
          </div>
        )}
        {petProfile.weight != null && (
          <div className="flex justify-between gap-2">
            <dt className="shrink-0 text-text-muted">체중</dt>
            <dd className="font-medium text-text-primary">{petProfile.weight}kg</dd>
          </div>
        )}
        {petProfile.gender && (
          <div className="flex justify-between gap-2">
            <dt className="shrink-0 text-text-muted">성별</dt>
            <dd className="font-medium text-text-primary">
              {petProfile.gender === 'male' ? '수컷' : '암컷'}
            </dd>
          </div>
        )}
        {petProfile.birthDate && (
          <div className="flex justify-between gap-2">
            <dt className="shrink-0 text-text-muted">생년월일</dt>
            <dd className="font-medium text-text-primary">{formatDate(petProfile.birthDate)}</dd>
          </div>
        )}
      </dl>

      {/* 특이사항 */}
      <div className="rounded-lg bg-amber-50 px-3 py-2.5 text-sm">
        <p className="mb-0.5 text-xs font-semibold text-amber-700">특이사항</p>
        {petProfile.specialNotes ? (
          <p className="whitespace-pre-wrap leading-relaxed text-amber-900">{petProfile.specialNotes}</p>
        ) : (
          <p className="text-xs text-amber-600/60">없음</p>
        )}
      </div>

      {/* 체크리스트 답변 */}
      {hasChecklist && (
        <div className="space-y-3 border-t border-border pt-3">
          <div className="flex items-center gap-1.5">
            <ClipboardList size={13} className="text-text-muted" />
            <span className="text-xs font-semibold text-text-muted">체크리스트 답변</span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {answers.map((answer) => (
              <div key={answer.questionId} className="space-y-1.5">
                <p className="text-xs font-medium text-text-secondary">
                  {answer.questionText}
                </p>
                <div className="flex flex-wrap gap-1">
                  {answer.selectedOptions.length > 0 ? (
                    answer.selectedOptions.map((opt) => (
                      <span
                        key={opt.id}
                        className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-0.5 text-[11px] font-medium text-brand-700"
                      >
                        {opt.text}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-text-muted">선택 없음</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

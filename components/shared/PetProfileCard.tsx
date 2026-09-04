'use client';

import { Dog, ClipboardList, Sparkles } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { PetProfile } from '@/types';

interface PetProfileCardProps {
  petProfile: PetProfile;
  className?: string;
  /** 상위 섹션에 이미 라벨이 있을 때 내부 "반려견 정보" 라벨을 숨김 */
  hideLabel?: boolean;
}

/** 상세 화면의 개방형 섹션(detail-section) 안에서 사용되는 반려견 정보 블록 */
export function PetProfileCard({ petProfile, className, hideLabel }: PetProfileCardProps) {
  const answers = petProfile.checklistAnswers ?? [];
  const hasChecklist = answers.length > 0;
  const recommendedPlan = petProfile.recommendedPlan ?? null;
  const reasons = petProfile.recommendReasons ?? [];
  const hasRecommendation = recommendedPlan != null || reasons.length > 0;

  return (
    <div className={`space-y-3 ${className ?? ''}`}>
      {/* 헤더 */}
      {!hideLabel && (
        <div className="detail-section-label">
          <Dog size={13} className="text-brand-400" />
          반려견 정보
        </div>
      )}

      {/* 기본 정보 */}
      <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-3">
        {petProfile.name && (
          <div className="detail-row">
            <dt className="shrink-0 text-text-muted">이름</dt>
            <dd className="font-medium text-text-primary">{petProfile.name}</dd>
          </div>
        )}
        {petProfile.breed && (
          <div className="detail-row">
            <dt className="shrink-0 text-text-muted">견종</dt>
            <dd className="truncate font-medium text-text-primary">{petProfile.breed}</dd>
          </div>
        )}
        {petProfile.weight != null && (
          <div className="detail-row">
            <dt className="shrink-0 text-text-muted">체중</dt>
            <dd className="font-medium text-text-primary">{petProfile.weight}kg</dd>
          </div>
        )}
        {petProfile.gender && (
          <div className="detail-row">
            <dt className="shrink-0 text-text-muted">성별</dt>
            <dd className="font-medium text-text-primary">
              {petProfile.gender === 'male' ? '수컷' : '암컷'}
            </dd>
          </div>
        )}
        {petProfile.birthDate && (
          <div className="detail-row">
            <dt className="shrink-0 text-text-muted">생년월일</dt>
            <dd className="font-medium text-text-primary">{formatDate(petProfile.birthDate)}</dd>
          </div>
        )}
      </dl>

      {/* 특이사항 */}
      <div className="rounded-xl bg-amber-50/70 px-3.5 py-2.5 text-sm">
        <p className="mb-0.5 text-xs font-semibold text-amber-700">특이사항</p>
        {petProfile.specialNotes ? (
          <p className="whitespace-pre-wrap leading-relaxed text-amber-900">{petProfile.specialNotes}</p>
        ) : (
          <p className="text-xs text-amber-600/60">없음</p>
        )}
      </div>

      {/* 체크리스트 답변 */}
      {hasChecklist && (
        <div className="space-y-3 pt-1">
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
                        className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-700"
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

      {/* 고객에게 표시된 추천 결과 */}
      {hasRecommendation && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-1.5">
            <Sparkles size={13} className="text-text-muted" />
            <span className="text-xs font-semibold text-text-muted">고객에게 표시된 추천</span>
          </div>

          <div className="space-y-3 rounded-xl bg-brand-50/70 px-3.5 py-3">
            {recommendedPlan && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-brand-700">추천 플랜</span>
                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-brand-700">
                  {recommendedPlan.name}
                </span>
              </div>
            )}

            {reasons.length > 0 && (
              <div className="space-y-2.5">
                {reasons.map((reason, index) => (
                  <div key={`${reason.title}-${index}`} className="text-sm">
                    <p className="font-semibold leading-snug text-brand-900">{reason.title}</p>
                    <p className="mt-0.5 whitespace-pre-wrap text-xs leading-relaxed text-brand-800/80">
                      {reason.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

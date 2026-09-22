'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Ticket, Gift } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatRewardRatePercent,
} from '@/lib/utils';
import type { AppliedCoupon, AppliedProductCoupon, SubscriptionReferral } from '@/types';

function couponLabel(coupon: { code: string; name?: string | null }) {
  return coupon.name ? `${coupon.code} · ${coupon.name}` : coupon.code;
}

function referralLabel(referral: { code: string; displayName?: string | null }) {
  return referral.displayName ? `${referral.code} · ${referral.displayName}` : referral.code;
}

function formatCouponDiscount(coupon: AppliedCoupon) {
  if (coupon.discountType === 'fixed') {
    return formatCurrency(coupon.discountAmount ?? 0);
  }
  if (coupon.discountRate != null) {
    return `${coupon.discountRate}%`;
  }
  if (coupon.discountAmount != null) {
    return formatCurrency(coupon.discountAmount);
  }
  return '-';
}

export function PromoListCell({
  coupon,
  referral,
}: {
  coupon?: { code: string; name?: string | null } | null;
  referral?: { code: string; displayName?: string | null } | null;
}) {
  if (!coupon && !referral) {
    return <span className="text-text-muted">-</span>;
  }

  return (
    <div className="flex flex-col items-start gap-1">
      {coupon && (
        <Badge label={`쿠폰 ${couponLabel(coupon)}`} color="bg-violet-50 text-violet-700" />
      )}
      {referral && (
        <Badge label={`초대 ${referralLabel(referral)}`} color="bg-teal-50 text-teal-700" />
      )}
    </div>
  );
}

function DetailRow({
  label,
  children,
  muted,
}: {
  label: string;
  children: ReactNode;
  muted?: boolean;
}) {
  return (
    <div className="detail-row">
      <dt className="shrink-0 text-text-muted">{label}</dt>
      <dd className={muted ? 'truncate font-mono text-xs text-text-muted' : 'font-medium text-text-primary'}>
        {children}
      </dd>
    </div>
  );
}

export function CouponDetailSection({ coupon }: { coupon?: AppliedCoupon | null }) {
  if (!coupon) return null;

  return (
    <section className="detail-section">
      <div className="detail-section-label">
        <Ticket size={13} className="text-brand-400" />
        쿠폰
      </div>
      <dl className="space-y-1.5">
        <DetailRow label="코드">{coupon.code}</DetailRow>
        {coupon.name && <DetailRow label="이름">{coupon.name}</DetailRow>}
        {coupon.description && (
          <div className="detail-row">
            <dt className="shrink-0 text-text-muted">설명</dt>
            <dd className="text-right text-text-secondary">{coupon.description}</dd>
          </div>
        )}
        {(coupon.discountType || coupon.discountRate != null || coupon.discountAmount != null) && (
          <DetailRow label="할인">{formatCouponDiscount(coupon)}</DetailRow>
        )}
        {coupon.applyCount != null && (
          <DetailRow label="적용 횟수">{coupon.applyCount}회</DetailRow>
        )}
        {coupon.isActive != null && (
          <DetailRow label="상태">{coupon.isActive ? '활성' : '비활성'}</DetailRow>
        )}
        {(coupon.startDate || coupon.endDate) && (
          <DetailRow label="기간">
            {coupon.startDate ? formatDate(coupon.startDate) : '시작일 없음'}
            {' ~ '}
            {coupon.endDate ? formatDate(coupon.endDate) : '무기한'}
          </DetailRow>
        )}
        {coupon.createdAt && (
          <DetailRow label="생성일">{formatDateTime(coupon.createdAt)}</DetailRow>
        )}
        {coupon.updatedAt && (
          <DetailRow label="수정일">{formatDateTime(coupon.updatedAt)}</DetailRow>
        )}
      </dl>
    </section>
  );
}

export function ProductCouponDetailSection({
  coupon,
}: {
  coupon?: AppliedProductCoupon | null;
}) {
  if (!coupon) return null;

  return (
    <section className="detail-section">
      <div className="detail-section-label">
        <Ticket size={13} className="text-brand-400" />
        쿠폰
      </div>
      <dl className="space-y-1.5">
        <DetailRow label="코드">{coupon.code}</DetailRow>
        {coupon.name && <DetailRow label="이름">{coupon.name}</DetailRow>}
        {coupon.description && (
          <div className="detail-row">
            <dt className="shrink-0 text-text-muted">설명</dt>
            <dd className="text-right text-text-secondary">{coupon.description}</dd>
          </div>
        )}
        {coupon.discountRate != null && (
          <DetailRow label="할인율">{coupon.discountRate}%</DetailRow>
        )}
        {coupon.maxDiscountAmount != null && (
          <DetailRow label="최대 할인">{formatCurrency(coupon.maxDiscountAmount)}</DetailRow>
        )}
        {coupon.isActive != null && (
          <DetailRow label="상태">{coupon.isActive ? '활성' : '비활성'}</DetailRow>
        )}
        {(coupon.startDate || coupon.endDate) && (
          <DetailRow label="기간">
            {coupon.startDate ? formatDate(coupon.startDate) : '시작일 없음'}
            {' ~ '}
            {coupon.endDate ? formatDate(coupon.endDate) : '무기한'}
          </DetailRow>
        )}
        {coupon.createdAt && (
          <DetailRow label="생성일">{formatDateTime(coupon.createdAt)}</DetailRow>
        )}
        {coupon.updatedAt && (
          <DetailRow label="수정일">{formatDateTime(coupon.updatedAt)}</DetailRow>
        )}
      </dl>
    </section>
  );
}

export function ReferralDetailSection({ referral }: { referral?: SubscriptionReferral | null }) {
  if (!referral) return null;

  return (
    <section className="detail-section">
      <div className="detail-section-label">
        <Gift size={13} className="text-brand-400" />
        초대코드
      </div>
      <dl className="space-y-1.5">
        {referral.profileImageUrl && (
          <div className="mb-2 flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={referral.profileImageUrl}
              alt={referral.displayName ?? referral.code}
              className="h-10 w-10 rounded-xl object-cover"
            />
            <div>
              <p className="text-sm font-semibold text-text-primary">
                {referral.displayName ?? referral.code}
              </p>
              {referral.slug && (
                <p className="font-mono text-xs text-text-muted">{referral.slug}</p>
              )}
            </div>
          </div>
        )}
        <DetailRow label="코드">{referral.code}</DetailRow>
        {referral.displayName && <DetailRow label="이름">{referral.displayName}</DetailRow>}
        {referral.influencerUserId != null && (
          <div className="detail-row">
            <dt className="shrink-0 text-text-muted">인플루언서</dt>
            <dd className="font-medium text-text-primary">
              <Link
                href={`/influencers/${referral.influencerUserId}`}
                className="text-brand-500 hover:underline"
              >
                #{referral.influencerUserId}
                {referral.influencerEmail ? ` · ${referral.influencerEmail}` : ''}
              </Link>
            </dd>
          </div>
        )}
        {referral.influencerEmail && referral.influencerUserId == null && (
          <DetailRow label="이메일">{referral.influencerEmail}</DetailRow>
        )}
        {referral.phone && <DetailRow label="연락처">{referral.phone}</DetailRow>}
        {referral.slug && !referral.profileImageUrl && (
          <DetailRow label="slug" muted>
            {referral.slug}
          </DetailRow>
        )}
        {referral.discountRate != null && (
          <DetailRow label="할인율">{formatRewardRatePercent(referral.discountRate)}</DetailRow>
        )}
        {referral.rewardRate != null && (
          <DetailRow label="적립률">{formatRewardRatePercent(referral.rewardRate)}</DetailRow>
        )}
        {referral.isActive != null && (
          <DetailRow label="상태">{referral.isActive ? '활성' : '비활성'}</DetailRow>
        )}
        {referral.isPageVisible != null && (
          <DetailRow label="페이지">{referral.isPageVisible ? '공개' : '비공개'}</DetailRow>
        )}
        {referral.referralLink && (
          <div className="detail-row">
            <dt className="shrink-0 text-text-muted">링크</dt>
            <dd className="truncate text-right">
              <a
                href={referral.referralLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-brand-500 hover:underline"
              >
                {referral.referralLink}
              </a>
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
}

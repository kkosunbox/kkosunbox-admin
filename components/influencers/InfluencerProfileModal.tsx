'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, ImagePlus, Loader2, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import {
  usersApi,
  influencersApi,
  settingsApi,
  uploadInfluencerProfileImage,
  getErrorMessage,
} from '@/lib/api';
import {
  formatRewardRatePercent,
  getSystemReferralRewardRate,
  percentInputToRate,
  rateToPercentInput,
} from '@/lib/utils';

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ALLOWED_IMAGE_EXT = ['jpg', 'jpeg', 'png', 'webp'];
const PUBLIC_REFERRAL_BASE = 'https://kkosunbox.com/r';

interface InfluencerProfileModalProps {
  isOpen: boolean;
  mode: 'assign' | 'reassign' | 'edit';
  userId: number;
  queryKeyId: string;
  initialDisplayName?: string;
  initialSlug?: string;
  initialProfileImageUrl?: string | null;
  initialIsPageVisible?: boolean;
  initialRewardRate?: number | null;
  onClose: () => void;
}

export function InfluencerProfileModal({
  isOpen,
  mode,
  userId,
  queryKeyId,
  initialDisplayName = '',
  initialSlug = '',
  initialProfileImageUrl = null,
  initialIsPageVisible = true,
  initialRewardRate = null,
  onClose,
}: InfluencerProfileModalProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEdit = mode === 'edit';
  const isReassign = mode === 'reassign';

  const [displayName, setDisplayName] = useState('');
  const [slug, setSlug] = useState('');
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [rewardRatePercent, setRewardRatePercent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState<{
    displayName?: string;
    slug?: string;
    rewardRate?: string;
  }>({});

  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.getList(),
    enabled: isOpen,
  });
  const systemRewardRate = getSystemReferralRewardRate(settingsData?.settings);

  useEffect(() => {
    if (!isOpen) return;
    setDisplayName(initialDisplayName);
    setSlug(initialSlug);
    setIsPageVisible(initialIsPageVisible);
    setRewardRatePercent(rateToPercentInput(initialRewardRate));
    setFile(null);
    setPreviewUrl(initialProfileImageUrl);
    setImageRemoved(false);
    setError('');
    setFieldError({});
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [
    isOpen,
    initialDisplayName,
    initialSlug,
    initialProfileImageUrl,
    initialIsPageVisible,
    initialRewardRate,
  ]);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const mutation = useMutation({
    mutationFn: async () => {
      const trimmedName = displayName.trim();
      let uploadedImageUrl: string | undefined;
      if (file) {
        uploadedImageUrl = await uploadInfluencerProfileImage(file);
      }

      const rewardRate = percentInputToRate(rewardRatePercent);

      if (isEdit) {
        let profileImageUrl: string | null | undefined;
        if (uploadedImageUrl) profileImageUrl = uploadedImageUrl;
        else if (imageRemoved) profileImageUrl = null;

        return influencersApi.updateProfile(userId, {
          displayName: trimmedName,
          slug,
          isPageVisible,
          rewardRate,
          ...(profileImageUrl !== undefined ? { profileImageUrl } : {}),
        });
      }

      if (isReassign) {
        const payload: {
          isInfluencer: true;
          displayName?: string;
          slug?: string;
          profileImageUrl?: string;
          isPageVisible?: boolean;
          rewardRate?: number | null;
        } = { isInfluencer: true };

        if (trimmedName !== initialDisplayName.trim()) {
          payload.displayName = trimmedName;
        }
        if (slug !== initialSlug) {
          payload.slug = slug;
        }
        if (uploadedImageUrl) {
          payload.profileImageUrl = uploadedImageUrl;
        }
        if (isPageVisible !== initialIsPageVisible) {
          payload.isPageVisible = isPageVisible;
        }
        if (rewardRate !== (initialRewardRate ?? null)) {
          payload.rewardRate = rewardRate;
        }

        return usersApi.setInfluencer(userId, payload);
      }

      return usersApi.setInfluencer(userId, {
        isInfluencer: true,
        displayName: trimmedName,
        slug,
        isPageVisible,
        ...(rewardRate != null ? { rewardRate } : {}),
        ...(uploadedImageUrl ? { profileImageUrl: uploadedImageUrl } : {}),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users', queryKeyId] });
      void queryClient.invalidateQueries({ queryKey: ['influencers'] });
      void queryClient.invalidateQueries({ queryKey: ['influencer-detail', userId] });
      onClose();
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  function handleClose() {
    if (mutation.isPending) return;
    onClose();
  }

  function handleSlugChange(value: string) {
    setSlug(value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
    if (fieldError.slug) setFieldError((e) => ({ ...e, slug: undefined }));
  }

  function handleFileChange(selected: File | null) {
    if (!selected) return;
    const ext = selected.name.split('.').pop()?.toLowerCase() ?? '';
    if (!ALLOWED_IMAGE_EXT.includes(ext)) {
      setError('jpg, jpeg, png, webp 파일만 업로드할 수 있습니다.');
      return;
    }
    setError('');
    setImageRemoved(false);
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  }

  function clearImage() {
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (isEdit) {
      setPreviewUrl(null);
      setImageRemoved(true);
      return;
    }
    setPreviewUrl(initialProfileImageUrl);
    setImageRemoved(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextFieldError: { displayName?: string; slug?: string; rewardRate?: string } = {};
    if (!displayName.trim()) {
      nextFieldError.displayName = '초대 페이지에 표시할 이름을 입력해 주세요.';
    }
    if (!SLUG_REGEX.test(slug)) {
      nextFieldError.slug = '소문자, 숫자, 하이픈만 사용할 수 있습니다. (예: kim-pet)';
    }
    if (rewardRatePercent.trim()) {
      const percent = Number(rewardRatePercent);
      if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
        nextFieldError.rewardRate = '0~100 사이 숫자를 입력해 주세요. (예: 8 = 8%)';
      }
    }
    setFieldError(nextFieldError);
    if (Object.keys(nextFieldError).length > 0) return;

    setError('');
    mutation.mutate();
  }

  const showClearButton = Boolean(previewUrl) && (isEdit || Boolean(file));
  const title = isEdit ? '프로필 수정' : isReassign ? '인플루언서 재지정' : '인플루언서 지정';
  const submitLabel = isEdit ? '저장' : isReassign ? '재지정하기' : '지정하기';
  const pendingLabel = isEdit ? '저장 중...' : isReassign ? '재지정 중...' : '지정 중...';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {isReassign && (
          <p className="rounded-xl bg-surface-muted px-4 py-3 text-xs text-text-secondary">
            기존 프로필이 있습니다. 그대로 저장하면 다시 활성화됩니다. 해제 중에도 초대 페이지
            (<span className="font-medium">/r/{initialSlug || 'slug'}</span>)는 열리지만 비활성 상태입니다.
          </p>
        )}
        <FormField
          label="표시 이름"
          value={displayName}
          onChange={(e) => {
            setDisplayName(e.target.value);
            if (fieldError.displayName) setFieldError((err) => ({ ...err, displayName: undefined }));
          }}
          error={fieldError.displayName}
          hint="초대 페이지에 표시되는 이름입니다."
          maxLength={50}
          autoComplete="off"
        />

        <div>
          <FormField
            label="slug"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            error={fieldError.slug}
            autoComplete="off"
            spellCheck={false}
          />
          {!fieldError.slug && (
            <p className="mt-1.5 pl-1 text-xs text-text-muted">
              URL에 표시되는 값입니다. 소문자·숫자·하이픈만 사용할 수 있습니다.
              {slug ? (
                <>
                  {' '}
                  미리보기:{' '}
                  <span className="font-medium text-text-secondary">
                    {PUBLIC_REFERRAL_BASE}/{slug}
                  </span>
                </>
              ) : (
                <> 예: {PUBLIC_REFERRAL_BASE}/kkosuntv</>
              )}
            </p>
          )}
        </div>

        <div>
          <p className="form-label form-label-optional">프로필 이미지</p>
          <div className="flex items-center gap-3">
            {previewUrl ? (
              <div className="relative h-16 w-16 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="프로필 미리보기"
                  className="h-16 w-16 rounded-2xl object-cover"
                />
                {showClearButton && (
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-text-primary text-white"
                    aria-label="이미지 제거"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-surface-input text-text-muted">
                <ImagePlus size={20} />
              </div>
            )}
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary text-sm"
              >
                이미지 선택
              </button>
              <p className="mt-1.5 text-xs text-text-muted">jpg, jpeg, png, webp</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        <FormField
          label="보상 적립률 (%)"
          optional
          type="number"
          min={0}
          max={100}
          step="any"
          value={rewardRatePercent}
          onChange={(e) => {
            setRewardRatePercent(e.target.value);
            if (fieldError.rewardRate) setFieldError((err) => ({ ...err, rewardRate: undefined }));
          }}
          error={fieldError.rewardRate}
          hint={`비우면 시스템 설정값을 사용합니다. 현재 기본값 ${formatRewardRatePercent(systemRewardRate)}`}
        />

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-surface-muted/60">
          <input
            type="checkbox"
            checked={isPageVisible}
            onChange={(e) => setIsPageVisible(e.target.checked)}
            className="mt-0.5 h-4 w-4 cursor-pointer accent-brand-500"
          />
          <div>
            <p className="text-sm font-medium text-text-primary">인플루언서 페이지 공개</p>
            <p className="text-xs text-text-muted">
              {'체크하면 초대 페이지(/r/{slug})가 공개됩니다. 해제하면 페이지가 표시되지 않습니다.'}
            </p>
          </div>
        </label>

        {error && (
          <div className="form-error-banner">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={handleClose}
            disabled={mutation.isPending}
            className="btn-secondary flex-1"
          >
            취소
          </button>
          <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
            {mutation.isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {pendingLabel}
              </>
            ) : (
              submitLabel
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

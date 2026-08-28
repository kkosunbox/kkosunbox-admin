'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, ImagePlus, Loader2, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import {
  usersApi,
  uploadInfluencerProfileImage,
  getErrorMessage,
} from '@/lib/api';

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ALLOWED_IMAGE_EXT = ['jpg', 'jpeg', 'png', 'webp'];
const PUBLIC_REFERRAL_BASE = 'https://kkosunbox.com/r';

interface InfluencerAssignModalProps {
  isOpen: boolean;
  userId: number;
  queryKeyId: string;
  initialDisplayName?: string;
  initialSlug?: string;
  initialProfileImageUrl?: string | null;
  onClose: () => void;
}

export function InfluencerAssignModal({
  isOpen,
  userId,
  queryKeyId,
  initialDisplayName = '',
  initialSlug = '',
  initialProfileImageUrl = null,
  onClose,
}: InfluencerAssignModalProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState('');
  const [slug, setSlug] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState<{ displayName?: string; slug?: string }>({});

  useEffect(() => {
    if (!isOpen) return;
    setDisplayName(initialDisplayName);
    setSlug(initialSlug);
    setFile(null);
    setPreviewUrl(initialProfileImageUrl);
    setError('');
    setFieldError({});
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [isOpen, initialDisplayName, initialSlug, initialProfileImageUrl]);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const mutation = useMutation({
    mutationFn: async () => {
      let profileImageUrl: string | undefined;
      if (file) {
        profileImageUrl = await uploadInfluencerProfileImage(file);
      } else if (initialProfileImageUrl) {
        profileImageUrl = initialProfileImageUrl;
      }

      return usersApi.setInfluencer(userId, {
        isInfluencer: true,
        displayName: displayName.trim(),
        slug,
        ...(profileImageUrl ? { profileImageUrl } : {}),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users', queryKeyId] });
      void queryClient.invalidateQueries({ queryKey: ['influencers'] });
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
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  }

  function clearImage() {
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(initialProfileImageUrl);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextFieldError: { displayName?: string; slug?: string } = {};
    if (!displayName.trim()) {
      nextFieldError.displayName = '초대 페이지에 표시할 이름을 입력해 주세요.';
    }
    if (!SLUG_REGEX.test(slug)) {
      nextFieldError.slug = '소문자, 숫자, 하이픈만 사용할 수 있습니다. (예: kim-pet)';
    }
    setFieldError(nextFieldError);
    if (Object.keys(nextFieldError).length > 0) return;

    setError('');
    mutation.mutate();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="인플루언서 지정">
      <form onSubmit={handleSubmit} className="space-y-4">
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
                {file && (
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-text-primary text-white"
                    aria-label="선택한 이미지 제거"
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
                지정 중...
              </>
            ) : (
              '지정하기'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

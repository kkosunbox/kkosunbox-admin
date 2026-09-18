'use client';

import { useRef } from 'react';
import { ImagePlus } from 'lucide-react';

const ALLOWED_IMAGE_EXT = ['jpg', 'jpeg', 'png', 'webp'];

interface CatalogImageFieldProps {
  previewUrl: string | null;
  onFileSelect: (file: File, previewUrl: string) => void;
  onError: (message: string) => void;
  disabled?: boolean;
}

export function CatalogImageField({
  previewUrl,
  onFileSelect,
  onError,
  disabled,
}: CatalogImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(selected: File | null) {
    if (!selected) return;
    const ext = selected.name.split('.').pop()?.toLowerCase() ?? '';
    if (!ALLOWED_IMAGE_EXT.includes(ext)) {
      onError('jpg, jpeg, png, webp 파일만 업로드할 수 있습니다.');
      return;
    }
    onFileSelect(selected, URL.createObjectURL(selected));
  }

  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-text-muted">
        썸네일 <span className="ml-1.5 font-normal opacity-50">선택</span>
      </p>
      <div className="flex items-center gap-3">
        {previewUrl ? (
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="썸네일 미리보기" className="h-16 w-16 object-cover" />
          </div>
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-surface-input text-text-muted">
            <ImagePlus size={20} />
          </div>
        )}
        <div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            className="btn-secondary text-sm"
          >
            이미지 선택
          </button>
          <p className="mt-1.5 text-xs text-text-muted">jpg, jpeg, png, webp</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
        />
      </div>
    </div>
  );
}

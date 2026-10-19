'use client';

import { useEffect } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Trash2, X } from 'lucide-react';

interface ImageLightboxProps {
  images: string[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  /** 지정 시 현재 이미지 제거 버튼을 노출한다 */
  onRemove?: (url: string) => void;
  isRemoving?: boolean;
}

export function ImageLightbox({
  images,
  index,
  onClose,
  onIndexChange,
  onRemove,
  isRemoving = false,
}: ImageLightboxProps) {
  const isOpen = index !== null && images.length > 0;
  const current = isOpen ? Math.min(index, images.length - 1) : 0;
  const hasMultiple = images.length > 1;

  function showPrev() {
    onIndexChange((current - 1 + images.length) % images.length);
  }

  function showNext() {
    onIndexChange((current + 1) % images.length);
  }

  useEffect(() => {
    if (!isOpen) return;
    // 하위 Modal의 Escape 핸들러보다 먼저 처리하기 위해 capture 단계에서 가로챈다
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      } else if (e.key === 'ArrowLeft' && hasMultiple) {
        showPrev();
      } else if (e.key === 'ArrowRight' && hasMultiple) {
        showNext();
      }
    }
    const prevOverflow = document.body.style.overflow;
    window.addEventListener('keydown', handleKeyDown, true);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      document.body.style.overflow = prevOverflow;
    };
  });

  if (!isOpen) return null;

  const url = images[current];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 animate-overlay-in"
      onClick={onClose}
    >
      {/* 상단 바 */}
      <div
        className="absolute inset-x-0 top-0 flex items-center justify-between px-4 py-3 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-sm font-medium">
          {current + 1} / {images.length}
        </span>
        <div className="flex items-center gap-2">
          {onRemove && (
            <button
              onClick={() => onRemove(url)}
              disabled={isRemoving}
              className="flex items-center gap-1.5 rounded-full bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
            >
              {isRemoving ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              이미지 제거
            </button>
          )}
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {hasMultiple && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            showPrev();
          }}
          className="absolute left-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          aria-label="이전 이미지"
        >
          <ChevronLeft size={22} />
        </button>
      )}

      <img
        src={url}
        alt={`이미지 ${current + 1}`}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] max-w-[90vw] select-none object-contain"
      />

      {hasMultiple && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            showNext();
          }}
          className="absolute right-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          aria-label="다음 이미지"
        >
          <ChevronRight size={22} />
        </button>
      )}
    </div>
  );
}

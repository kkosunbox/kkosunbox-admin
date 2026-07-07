'use client';

import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}: ModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px] animate-overlay-in"
        onClick={onClose}
      />

      {/* 모달 패널 */}
      <div
        className={cn(
          'relative z-10 flex w-full flex-col bg-white',
          'rounded-t-3xl animate-sheet-in',
          'sm:rounded-3xl sm:animate-modal-in sm:shadow-modal',
          'max-h-[92vh]',
          sizeClasses[size],
        )}
      >
        {/* 모바일 핸들 바 */}
        <div className="flex justify-center pb-1 pt-3 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-surface-input" />
        </div>

        {/* 헤더 */}
        <div className="flex flex-shrink-0 items-center justify-between px-6 pb-2 pt-5 sm:pt-6">
          <h2 className="text-lg font-bold text-text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-input text-text-muted transition-all duration-200 hover:bg-surface-input/70 hover:text-text-primary active:scale-95"
          >
            <X size={15} />
          </button>
        </div>

        {/* 스크롤 가능한 콘텐츠 */}
        <div className="overflow-y-auto px-6 pb-6 pt-4">{children}</div>
      </div>
    </div>
  );
}

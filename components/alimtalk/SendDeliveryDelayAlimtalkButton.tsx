'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { HolidayDeliveryNoticeForm } from '@/components/alimtalk/HolidayDeliveryNoticeForm';
import { useAuth } from '@/providers/AuthProvider';

interface SendDeliveryDelayAlimtalkButtonProps {
  phone?: string | null;
  email?: string;
  label?: string;
  className?: string;
}

export function SendDeliveryDelayAlimtalkButton({
  phone,
  email,
  label,
  className = 'btn-secondary text-sm',
}: SendDeliveryDelayAlimtalkButtonProps) {
  const { admin } = useAuth();
  const [open, setOpen] = useState(false);
  const trimmed = phone?.trim() ?? '';

  if (admin?.role !== 'admin') return null;

  return (
    <>
      <button
        type="button"
        disabled={!trimmed}
        title={
          trimmed
            ? '이 주문의 배송지로 배송지연 알림톡을 보냅니다'
            : '배송지 연락처가 없어 발송할 수 없습니다'
        }
        onClick={() => setOpen(true)}
        className={className}
      >
        <Bell size={14} />
        배송지연 알림톡
      </button>
      {typeof document !== 'undefined' &&
        createPortal(
          <Modal
            isOpen={open}
            onClose={() => setOpen(false)}
            title="배송지연 알림톡"
            size="lg"
          >
            {trimmed && (
              <HolidayDeliveryNoticeForm
                fixedRecipient={{ email, phone: trimmed, label }}
              />
            )}
          </Modal>,
          document.body,
        )}
    </>
  );
}

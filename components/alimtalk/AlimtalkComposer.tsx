'use client';

import { useState } from 'react';
import Link from 'next/link';
import { History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HolidayDeliveryNoticeForm } from '@/components/alimtalk/HolidayDeliveryNoticeForm';
import type { DeliveryContact } from '@/types';

const TEMPLATES = [
  {
    id: 'holiday-delivery',
    label: '배송지연 안내',
    description: '연휴로 배송이 지연될 때 일정 변수를 넣어 발송합니다.',
  },
] as const;

type TemplateId = (typeof TEMPLATES)[number]['id'];

interface AlimtalkComposerProps {
  layout?: 'page' | 'modal';
  customer?: {
    email: string;
    phone?: string | null;
    deliveryContacts?: DeliveryContact[];
  };
  fixedRecipient?: {
    email?: string;
    phone: string;
    label?: string;
  };
}

export function AlimtalkComposer({
  layout = 'page',
  customer,
  fixedRecipient,
}: AlimtalkComposerProps) {
  const [templateId, setTemplateId] = useState<TemplateId>('holiday-delivery');

  const templateList = (
    <ul className="space-y-1">
      {TEMPLATES.map((template) => {
        const active = template.id === templateId;
        return (
          <li key={template.id}>
            <button
              type="button"
              onClick={() => setTemplateId(template.id)}
              className={cn(
                'w-full rounded-xl px-3 py-2.5 text-left transition-colors',
                active
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-text-secondary hover:bg-surface-muted',
              )}
            >
              <p className="text-sm font-semibold">{template.label}</p>
              <p className={cn('mt-0.5 text-xs', active ? 'text-brand-600/80' : 'text-text-muted')}>
                {template.description}
              </p>
            </button>
          </li>
        );
      })}
    </ul>
  );

  const form = templateId === 'holiday-delivery' && (
    <HolidayDeliveryNoticeForm
      key={templateId}
      customer={customer}
      fixedRecipient={fixedRecipient}
    />
  );

  if (layout === 'modal') {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Link href="/alimtalk/logs" className="btn-secondary">
            <History size={16} /> 발송이력
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-0">
          <div className="sm:border-r sm:border-border sm:pr-4">
            <p className="px-1 text-xs font-semibold text-text-muted">템플릿</p>
            <div className="mt-2">{templateList}</div>
          </div>
          <div className="sm:pl-5">{form}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
      <div className="card p-4">
        <p className="px-1 text-xs font-semibold text-text-muted">템플릿</p>
        <div className="mt-2">{templateList}</div>
      </div>
      <div className="card p-5 sm:p-6">{form}</div>
    </div>
  );
}

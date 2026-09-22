'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { HolidayDeliveryNoticeForm } from '@/components/alimtalk/HolidayDeliveryNoticeForm';

const TEMPLATES = [
  {
    id: 'holiday-delivery',
    label: '배송지연 안내',
    description: '연휴로 배송이 지연될 때 일정 변수를 넣어 발송합니다.',
  },
] as const;

type TemplateId = (typeof TEMPLATES)[number]['id'];

export default function AlimtalkPage() {
  const [templateId, setTemplateId] = useState<TemplateId>('holiday-delivery');

  return (
    <div className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
      <div className="card p-4">
        <p className="px-1 text-xs font-semibold text-text-muted">템플릿</p>
        <ul className="mt-2 space-y-1">
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
      </div>

      <div className="card p-5 sm:p-6">
        {templateId === 'holiday-delivery' && <HolidayDeliveryNoticeForm />}
      </div>
    </div>
  );
}

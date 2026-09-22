'use client';

import Link from 'next/link';
import { History } from 'lucide-react';
import { AlimtalkComposer } from '@/components/alimtalk/AlimtalkComposer';

export default function AlimtalkPage() {
  return (
    <div className="space-y-4">
      <div className="mx-auto flex max-w-5xl justify-end">
        <Link href="/alimtalk/logs" className="btn-secondary">
          <History size={16} /> 발송이력
        </Link>
      </div>
      <AlimtalkComposer />
    </div>
  );
}

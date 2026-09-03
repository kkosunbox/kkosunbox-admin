'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Save, Settings, Loader2, AlertCircle } from 'lucide-react';
import { settingsApi, getErrorMessage } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { FormField, FormTextarea } from '@/components/ui/FormField';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDateTime, REFERRAL_REWARD_RATE_KEY } from '@/lib/utils';
import type { SystemSetting } from '@/types';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [editSetting, setEditSetting] = useState<SystemSetting | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newForm, setNewForm] = useState({ key: '', value: '', description: '' });
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.getList(),
  });

  const settings: SystemSetting[] = data?.settings ?? [];

  const updateMutation = useMutation({
    mutationFn: () =>
      settingsApi.update(editSetting!.key, { value: editValue, description: editDesc }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['settings'] });
      setEditSetting(null);
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const createMutation = useMutation({
    mutationFn: () => settingsApi.create(newForm),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['settings'] });
      setShowCreateModal(false);
      setNewForm({ key: '', value: '', description: '' });
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  function openEdit(setting: SystemSetting) {
    setEditSetting(setting);
    setEditValue(setting.value);
    setEditDesc(setting.description ?? '');
    setError('');
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          <Plus size={16} /> 설정 추가
        </button>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="spinner" />
        </div>
      ) : settings.length === 0 ? (
        <div className="card p-8">
          <EmptyState icon={Settings} title="시스템 설정이 없습니다." />
        </div>
      ) : (
        <div className="card divide-y divide-border overflow-hidden">
          {settings.map((setting) => (
            <div key={setting.id} className="px-5 py-4">
              {editSetting?.id === setting.id ? (
                <div className="space-y-3">
                  <div>
                    <p className="font-mono text-sm font-bold text-brand-600">{setting.key}</p>
                    {setting.description && (
                      <p className="text-xs text-text-muted">{setting.description}</p>
                    )}
                    {setting.key === REFERRAL_REWARD_RATE_KEY && (
                      <p className="text-xs text-text-muted">
                        인플루언서 레퍼럴 보상 기본 적립률입니다. 0~1 사이 값 (예: 0.05 = 5%). 인플루언서별로 따로 지정하지 않으면 이 값을 사용하고, 설정도 없으면 5%입니다.
                      </p>
                    )}
                  </div>
                  <FormTextarea
                    label="값"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    rows={3}
                    className="font-mono"
                  />
                  <FormField
                    label="설명"
                    optional
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                  />
                  {error && (
                    <div className="form-error-banner">
                      <AlertCircle size={15} className="mt-0.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setEditSetting(null)} className="btn-secondary">취소</button>
                    <button
                      onClick={() => updateMutation.mutate()}
                      disabled={updateMutation.isPending}
                      className="btn-primary"
                    >
                      {updateMutation.isPending ? (
                        <><Loader2 size={14} className="animate-spin" /> 저장 중...</>
                      ) : (
                        <><Save size={14} /> 저장</>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm font-bold text-brand-600">{setting.key}</p>
                    </div>
                    {setting.description && (
                      <p className="text-xs text-text-muted">{setting.description}</p>
                    )}
                    {setting.key === REFERRAL_REWARD_RATE_KEY && (
                      <p className="text-xs text-text-muted">
                        인플루언서 레퍼럴 보상 기본 적립률입니다. 0~1 사이 값 (예: 0.05 = 5%). 인플루언서별로 따로 지정하지 않으면 이 값을 사용하고, 설정도 없으면 5%입니다.
                      </p>
                    )}
                    <p className="mt-2 rounded-xl bg-surface-input/50 px-4 py-3 font-mono text-sm text-text-primary">
                      {setting.value}
                    </p>
                    <p className="mt-1 text-xs text-text-muted">
                      수정: {formatDateTime(setting.updatedAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => openEdit(setting)}
                    className="btn-secondary text-xs"
                  >
                    수정
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="설정 추가" size="sm">
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
          <FormField
            label="키"
            value={newForm.key}
            onChange={(e) => setNewForm((f) => ({ ...f, key: e.target.value }))}
            className="font-mono"
            required
          />
          <FormTextarea
            label="값"
            value={newForm.value}
            onChange={(e) => setNewForm((f) => ({ ...f, value: e.target.value }))}
            rows={3}
            required
          />
          <FormField
            label="설명"
            optional
            value={newForm.description}
            onChange={(e) => setNewForm((f) => ({ ...f, description: e.target.value }))}
          />
          {error && (
            <div className="form-error-banner">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary flex-1">취소</button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1">
              {createMutation.isPending ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

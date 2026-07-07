'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Tag, Loader2, Trash2, AlertCircle } from 'lucide-react';
import { plansApi, planTagsApi, getErrorMessage } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { FormField, FormTextarea } from '@/components/ui/FormField';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency, cn } from '@/lib/utils';
import type { SubscriptionPlan, PlanTag } from '@/types';

// ─── 태그 뱃지 ────────────────────────────────────────────────────────────────

function TagBadge({ tag }: { tag: Pick<PlanTag, 'name' | 'bgColor' | 'textColor'> }) {
  return (
    <span
      className="rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: tag.bgColor, color: tag.textColor }}
    >
      {tag.name}
    </span>
  );
}

// ─── 메인 페이지 ──────────────────────────────────────────────────────────────

export default function PlansPage() {
  const queryClient = useQueryClient();

  // ── 플랜 모달 상태
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editPlan, setEditPlan] = useState<SubscriptionPlan | null>(null);
  const [planForm, setPlanForm] = useState({
    name: '',
    description: '',
    monthlyPrice: '',
    originalPrice: '',
    discountRate: '',
    sortOrder: '0',
  });
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [planError, setPlanError] = useState('');

  // ── 태그 모달 상태
  const [showTagModal, setShowTagModal] = useState(false);
  const [editTag, setEditTag] = useState<PlanTag | null>(null);
  const [tagForm, setTagForm] = useState({ name: '', bgColor: '#3B82F6', textColor: '#FFFFFF' });
  const [tagError, setTagError] = useState('');

  // ── 쿼리
  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => plansApi.getList(),
  });

  const { data: tagsData, isLoading: tagsLoading } = useQuery({
    queryKey: ['plan-tags'],
    queryFn: () => planTagsApi.getList(),
  });

  const plans: SubscriptionPlan[] = plansData?.plans ?? [];
  const tags: PlanTag[] = tagsData?.tags ?? tagsData ?? [];

  // ── 플랜 뮤테이션
  const createPlanMutation = useMutation({
    mutationFn: () =>
      plansApi.create({
        name: planForm.name,
        description: planForm.description || undefined,
        monthlyPrice: Number(planForm.monthlyPrice),
        originalPrice: planForm.originalPrice ? Number(planForm.originalPrice) : null,
        discountRate: planForm.discountRate ? Number(planForm.discountRate) : null,
        sortOrder: Number(planForm.sortOrder),
        tagIds: selectedTagIds,
      }),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['plans'] }); closePlanModal(); },
    onError: (err) => setPlanError(getErrorMessage(err)),
  });

  const updatePlanMutation = useMutation({
    mutationFn: () =>
      plansApi.update(editPlan!.id, {
        name: planForm.name,
        description: planForm.description,
        monthlyPrice: Number(planForm.monthlyPrice),
        originalPrice: planForm.originalPrice ? Number(planForm.originalPrice) : null,
        discountRate: planForm.discountRate ? Number(planForm.discountRate) : null,
        sortOrder: Number(planForm.sortOrder),
        tagIds: selectedTagIds,
      }),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['plans'] }); closePlanModal(); },
    onError: (err) => setPlanError(getErrorMessage(err)),
  });

  const togglePlanMutation = useMutation({
    mutationFn: (plan: SubscriptionPlan) =>
      plansApi.update(plan.id, { isActive: !plan.isActive }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['plans'] }),
  });

  // ── 태그 뮤테이션
  const createTagMutation = useMutation({
    mutationFn: () => planTagsApi.create(tagForm),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['plan-tags'] }); closeTagModal(); },
    onError: (err) => setTagError(getErrorMessage(err)),
  });

  const updateTagMutation = useMutation({
    mutationFn: () => planTagsApi.update(editTag!.id, tagForm),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['plan-tags'] }); closeTagModal(); },
    onError: (err) => setTagError(getErrorMessage(err)),
  });

  const deleteTagMutation = useMutation({
    mutationFn: (id: number) => planTagsApi.delete(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['plan-tags'] }),
  });

  // ── 플랜 모달 핸들러
  function openCreatePlan() {
    setEditPlan(null);
    setPlanForm({ name: '', description: '', monthlyPrice: '', originalPrice: '', discountRate: '', sortOrder: '0' });
    setSelectedTagIds([]);
    setPlanError('');
    setShowPlanModal(true);
  }

  function openEditPlan(plan: SubscriptionPlan) {
    setEditPlan(plan);
    setPlanForm({
      name: plan.name,
      description: plan.description ?? '',
      monthlyPrice: String(plan.monthlyPrice),
      originalPrice: plan.originalPrice ? String(plan.originalPrice) : '',
      discountRate: plan.discountRate ? String(plan.discountRate) : '',
      sortOrder: String(plan.sortOrder),
    });
    setSelectedTagIds(plan.tags?.map((t) => t.id) ?? []);
    setPlanError('');
    setShowPlanModal(true);
  }

  function closePlanModal() {
    setShowPlanModal(false);
    setEditPlan(null);
  }

  function handlePlanSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPlanError('');
    if (editPlan) updatePlanMutation.mutate();
    else createPlanMutation.mutate();
  }

  function toggleTagSelection(id: number) {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

  // ── 태그 모달 핸들러
  function openCreateTag() {
    setEditTag(null);
    setTagForm({ name: '', bgColor: '#3B82F6', textColor: '#FFFFFF' });
    setTagError('');
    setShowTagModal(true);
  }

  function openEditTag(tag: PlanTag) {
    setEditTag(tag);
    setTagForm({ name: tag.name, bgColor: tag.bgColor, textColor: tag.textColor });
    setTagError('');
    setShowTagModal(true);
  }

  function closeTagModal() {
    setShowTagModal(false);
    setEditTag(null);
  }

  function handleTagSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTagError('');
    if (editTag) updateTagMutation.mutate();
    else createTagMutation.mutate();
  }

  const isPlanPending = createPlanMutation.isPending || updatePlanMutation.isPending;
  const isTagPending = createTagMutation.isPending || updateTagMutation.isPending;

  return (
    <div className="space-y-8">
      {/* ── 플랜 목록 ────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="section-title">구독 플랜</h2>
          <button onClick={openCreatePlan} className="btn-primary">
            <Plus size={16} /> 플랜 추가
          </button>
        </div>

        {plansLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" />
          </div>
        ) : plans.length === 0 ? (
          <div className="card p-8">
            <EmptyState icon={Tag} title="등록된 플랜이 없습니다." />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <div key={plan.id} className={cn('card p-5 transition-all', !plan.isActive && 'opacity-60')}>
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50">
                    <Tag size={18} className="text-brand-500" />
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditPlan(plan)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-surface-muted hover:text-text-primary"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => togglePlanMutation.mutate(plan)}
                      className={cn(
                        'rounded-lg px-2 py-0.5 text-xs font-medium transition-colors',
                        plan.isActive
                          ? 'bg-red-50 text-red-500 hover:bg-red-100'
                          : 'bg-green-50 text-green-600 hover:bg-green-100',
                      )}
                    >
                      {plan.isActive ? '비활성화' : '활성화'}
                    </button>
                  </div>
                </div>

                {/* 태그 뱃지 */}
                {(plan.tags ?? []).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {plan.tags!.map((tag) => (
                      <TagBadge key={tag.id} tag={tag} />
                    ))}
                  </div>
                )}

                <h3 className="mt-3 font-bold text-text-primary">{plan.name}</h3>
                {plan.description && (
                  <p className="mt-1 text-xs text-text-muted">{plan.description}</p>
                )}

                {/* 가격 */}
                <div className="mt-3">
                  <div className="flex items-center gap-2">
                    {plan.originalPrice && (
                      <p className="text-sm text-text-muted line-through">
                        {formatCurrency(plan.originalPrice)}
                      </p>
                    )}
                    {plan.discountRate != null && (
                      <span className="rounded-md bg-red-50 px-1.5 py-0.5 text-xs font-bold text-red-500">
                        {plan.discountRate}% 할인
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-brand-500">
                    {formatCurrency(plan.monthlyPrice)}
                    <span className="text-sm font-normal text-text-muted">/월</span>
                  </p>
                </div>

                <p className="mt-1 text-xs text-text-muted">정렬 순서: {plan.sortOrder}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── 태그 관리 ────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="section-title">플랜 태그 관리</h2>
          <button onClick={openCreateTag} className="btn-secondary">
            <Plus size={16} /> 태그 추가
          </button>
        </div>

        <div className="card overflow-hidden">
          {tagsLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" />
            </div>
          ) : tags.length === 0 ? (
            <div className="p-8">
              <EmptyState icon={Tag} title="등록된 태그가 없습니다." />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {tags.map((tag) => (
                <div key={tag.id} className={cn('flex items-center justify-between px-5 py-3', !tag.isActive && 'opacity-50')}>
                  <div className="flex items-center gap-3">
                    <TagBadge tag={tag} />
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <span className="flex items-center gap-1">
                        <span
                          className="h-3 w-3 rounded-sm border border-border"
                          style={{ backgroundColor: tag.bgColor }}
                        />
                        {tag.bgColor}
                      </span>
                      <span className="flex items-center gap-1">
                        <span
                          className="h-3 w-3 rounded-sm border border-border"
                          style={{ backgroundColor: tag.textColor }}
                        />
                        {tag.textColor}
                      </span>
                    </div>
                    {!tag.isActive && (
                      <span className="text-xs text-text-muted">(비활성)</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditTag(tag)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-surface-muted hover:text-text-primary"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => deleteTagMutation.mutate(tag.id)}
                      disabled={deleteTagMutation.isPending}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── 플랜 생성/수정 모달 ───────────────────────────────────── */}
      <Modal
        isOpen={showPlanModal}
        onClose={closePlanModal}
        title={editPlan ? '플랜 수정' : '플랜 추가'}
        size="sm"
      >
        <form onSubmit={handlePlanSubmit} className="space-y-4">
          <FormField
            label="플랜 이름"
            value={planForm.name}
            onChange={(e) => setPlanForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <FormTextarea
            label="설명"
            optional
            value={planForm.description}
            onChange={(e) => setPlanForm((f) => ({ ...f, description: e.target.value }))}
            rows={2}
          />
          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="월 가격 (원)"
              type="number"
              value={planForm.monthlyPrice}
              onChange={(e) => setPlanForm((f) => ({ ...f, monthlyPrice: e.target.value }))}
              required
              min={0}
            />
            <FormField
              label="할인 전 가격"
              optional
              type="number"
              value={planForm.originalPrice}
              onChange={(e) => setPlanForm((f) => ({ ...f, originalPrice: e.target.value }))}
              min={0}
            />
            <FormField
              label="할인율 (%)"
              optional
              type="number"
              value={planForm.discountRate}
              onChange={(e) => setPlanForm((f) => ({ ...f, discountRate: e.target.value }))}
              min={0}
              max={100}
            />
            <FormField
              label="정렬 순서"
              type="number"
              value={planForm.sortOrder}
              onChange={(e) => setPlanForm((f) => ({ ...f, sortOrder: e.target.value }))}
              min={0}
            />
          </div>

          {/* 태그 선택 */}
          {tags.filter((t) => t.isActive).length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-text-muted">
                태그 <span className="opacity-50">선택</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {tags.filter((t) => t.isActive).map((tag) => {
                  const selected = selectedTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTagSelection(tag.id)}
                      className={cn(
                        'rounded-full px-3 py-1 text-xs font-semibold ring-2 transition-all',
                        selected ? 'ring-brand-500' : 'ring-transparent opacity-50 hover:opacity-80',
                      )}
                      style={{ backgroundColor: tag.bgColor, color: tag.textColor }}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {planError && (
            <div className="form-error-banner">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{planError}</span>
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={closePlanModal} className="btn-secondary flex-1">취소</button>
            <button type="submit" disabled={isPlanPending} className="btn-primary flex-1">
              {isPlanPending ? <><Loader2 size={14} className="animate-spin" /> 저장 중...</> : '저장'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── 태그 생성/수정 모달 ───────────────────────────────────── */}
      <Modal
        isOpen={showTagModal}
        onClose={closeTagModal}
        title={editTag ? '태그 수정' : '태그 추가'}
        size="sm"
      >
        <form onSubmit={handleTagSubmit} className="space-y-4">
          <FormField
            label="태그 이름"
            value={tagForm.name}
            onChange={(e) => setTagForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-text-muted">배경색</p>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={tagForm.bgColor}
                  onChange={(e) => setTagForm((f) => ({ ...f, bgColor: e.target.value }))}
                  className="h-[52px] w-12 cursor-pointer rounded-xl border border-border p-1"
                />
                <FormField
                  label="HEX"
                  value={tagForm.bgColor}
                  onChange={(e) => setTagForm((f) => ({ ...f, bgColor: e.target.value }))}
                  className="flex-1 font-mono"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-text-muted">텍스트색</p>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={tagForm.textColor}
                  onChange={(e) => setTagForm((f) => ({ ...f, textColor: e.target.value }))}
                  className="h-[52px] w-12 cursor-pointer rounded-xl border border-border p-1"
                />
                <FormField
                  label="HEX"
                  value={tagForm.textColor}
                  onChange={(e) => setTagForm((f) => ({ ...f, textColor: e.target.value }))}
                  className="flex-1 font-mono"
                />
              </div>
            </div>
          </div>

          {/* 미리보기 */}
          <div className="flex items-center gap-2.5 rounded-xl bg-surface-input/40 px-4 py-3.5">
            <span className="text-xs text-text-muted">미리보기</span>
            <TagBadge tag={tagForm} />
          </div>

          {tagError && (
            <div className="form-error-banner">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{tagError}</span>
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={closeTagModal} className="btn-secondary flex-1">취소</button>
            <button type="submit" disabled={isTagPending} className="btn-primary flex-1">
              {isTagPending ? <><Loader2 size={14} className="animate-spin" /> 저장 중...</> : '저장'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

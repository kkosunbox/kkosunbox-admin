'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Package, AlertCircle, Loader2 } from 'lucide-react';
import { productsApi, getErrorMessage } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { FormField, FormTextarea } from '@/components/ui/FormField';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency, cn } from '@/lib/utils';
import type { Product } from '@/types';

export default function ProductsPage() {
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
  });
  const [error, setError] = useState('');

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => productsApi.getList(),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      productsApi.create({
        name: form.name,
        description: form.description || undefined,
        price: Number(form.price),
        imageUrl: form.imageUrl || undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      closeModal();
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      productsApi.update(editProduct!.id, {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        imageUrl: form.imageUrl,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      closeModal();
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (product: Product) =>
      productsApi.update(product.id, { isActive: !product.isActive }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['products'] }),
  });

  function openCreate() {
    setEditProduct(null);
    setForm({ name: '', description: '', price: '', imageUrl: '' });
    setError('');
    setShowModal(true);
  }

  function openEdit(product: Product) {
    setEditProduct(product);
    setForm({
      name: product.name,
      description: product.description ?? '',
      price: String(product.price),
      imageUrl: product.imageUrl ?? '',
    });
    setError('');
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditProduct(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (editProduct) updateMutation.mutate();
    else createMutation.mutate();
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="section-title">단건 판매 상품</h2>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} /> 상품 추가
        </button>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="spinner" />
        </div>
      ) : !products || products.length === 0 ? (
        <div className="card p-8">
          <EmptyState icon={Package} title="등록된 상품이 없습니다." />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <div
              key={product.id}
              className={cn('card overflow-hidden transition-all', !product.isActive && 'opacity-60')}
            >
              <div className="flex h-36 items-center justify-center bg-surface-muted">
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Package size={28} className="text-text-muted/50" />
                )}
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-text-primary">{product.name}</h3>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => openEdit(product)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-surface-muted hover:text-text-primary"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => toggleActiveMutation.mutate(product)}
                      disabled={toggleActiveMutation.isPending}
                      className={cn(
                        'rounded-lg px-2 py-0.5 text-xs font-medium transition-colors',
                        product.isActive
                          ? 'bg-red-50 text-red-500 hover:bg-red-100'
                          : 'bg-green-50 text-green-600 hover:bg-green-100',
                      )}
                    >
                      {product.isActive ? '비활성화' : '활성화'}
                    </button>
                  </div>
                </div>
                {product.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-text-muted">{product.description}</p>
                )}
                <p className="mt-3 text-xl font-bold text-brand-500">
                  {formatCurrency(product.price)}
                </p>
                {!product.isActive && (
                  <p className="mt-1 text-xs text-text-muted">비활성 · 고객 페이지에 노출되지 않음</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editProduct ? '상품 수정' : '상품 추가'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            label="상품 이름"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
            maxLength={100}
          />
          <FormTextarea
            label="설명"
            optional
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={2}
          />
          <FormField
            label="판매가 (원, 부가세 포함)"
            type="number"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            required
            min={0}
          />
          <FormField
            label="이미지 URL"
            optional
            value={form.imageUrl}
            onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
            hint="외부에 호스팅된 이미지 주소를 입력하세요."
          />

          {error && (
            <div className="form-error-banner">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={closeModal} className="btn-secondary flex-1">
              취소
            </button>
            <button type="submit" disabled={isPending} className="btn-primary flex-1">
              {isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> 저장 중...
                </>
              ) : (
                '저장'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

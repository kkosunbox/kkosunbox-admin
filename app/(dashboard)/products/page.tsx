'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Package, AlertCircle, Loader2, Trash2, Layers } from 'lucide-react';
import {
  productsApi,
  productCategoriesApi,
  plansApi,
  uploadCatalogImage,
  getErrorMessage,
} from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { FormField, FormTextarea } from '@/components/ui/FormField';
import { EmptyState } from '@/components/ui/EmptyState';
import { SalesPauseBar } from '@/components/sales/SalesPauseBar';
import { CatalogImageField } from '@/components/shared/CatalogImageField';
import { formatCurrency, cn } from '@/lib/utils';
import type { Product, ProductCategory, SubscriptionPlan } from '@/types';

const EMPTY_PRODUCT_FORM = {
  name: '',
  description: '',
  price: '',
  originalPrice: '',
  categoryId: '',
  imageUrl: '',
  stockUnlimited: true,
  stockQuantity: '',
  relatedPlanId: '',
};

const EMPTY_CATEGORY_FORM = {
  name: '',
  sortOrder: '0',
  isActive: true,
};

export default function ProductsPage() {
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_PRODUCT_FORM);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editCategory, setEditCategory] = useState<ProductCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY_FORM);
  const [categoryError, setCategoryError] = useState('');

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => productsApi.getList(),
  });

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['product-categories'],
    queryFn: () => productCategoriesApi.getList(),
  });
  const categories: ProductCategory[] = [...(categoriesData?.categories ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.id - b.id,
  );

  const { data: plansData } = useQuery({
    queryKey: ['plans'],
    queryFn: () => plansApi.getList(),
  });
  const plans: SubscriptionPlan[] = plansData?.plans ?? [];

  function buildProductPayload() {
    return {
      stockQuantity: form.stockUnlimited ? null : Number(form.stockQuantity),
      relatedPlanId: form.relatedPlanId ? Number(form.relatedPlanId) : null,
      originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
      categoryId: form.categoryId ? Number(form.categoryId) : null,
    };
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      const imageUrl = imageFile
        ? await uploadCatalogImage(imageFile)
        : form.imageUrl || undefined;
      return productsApi.create({
        name: form.name,
        description: form.description || undefined,
        price: Number(form.price),
        imageUrl,
        ...buildProductPayload(),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      closeModal();
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const imageUrl = imageFile ? await uploadCatalogImage(imageFile) : form.imageUrl;
      return productsApi.update(editProduct!.id, {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        imageUrl,
        ...buildProductPayload(),
      });
    },
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

  const togglePauseMutation = useMutation({
    mutationFn: (product: Product) =>
      productsApi.update(product.id, { isSalesPaused: !product.isSalesPaused }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['products'] }),
  });

  function invalidateCategories() {
    void queryClient.invalidateQueries({ queryKey: ['product-categories'] });
    void queryClient.invalidateQueries({ queryKey: ['products'] });
  }

  const createCategoryMutation = useMutation({
    mutationFn: () =>
      productCategoriesApi.create({
        name: categoryForm.name,
        sortOrder: Number(categoryForm.sortOrder),
      }),
    onSuccess: () => {
      invalidateCategories();
      closeCategoryModal();
    },
    onError: (err) => setCategoryError(getErrorMessage(err)),
  });

  const updateCategoryMutation = useMutation({
    mutationFn: () =>
      productCategoriesApi.update(editCategory!.id, {
        name: categoryForm.name,
        sortOrder: Number(categoryForm.sortOrder),
        isActive: categoryForm.isActive,
      }),
    onSuccess: () => {
      invalidateCategories();
      closeCategoryModal();
    },
    onError: (err) => setCategoryError(getErrorMessage(err)),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => productCategoriesApi.delete(id),
    onSuccess: invalidateCategories,
    onError: (err) => alert(getErrorMessage(err)),
  });

  function openCreate() {
    setEditProduct(null);
    setForm(EMPTY_PRODUCT_FORM);
    setError('');
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
  }

  function openEdit(product: Product) {
    setEditProduct(product);
    setForm({
      name: product.name,
      description: product.description ?? '',
      price: String(product.price),
      originalPrice: product.originalPrice != null ? String(product.originalPrice) : '',
      categoryId: product.categoryId != null ? String(product.categoryId) : '',
      imageUrl: product.imageUrl ?? '',
      stockUnlimited: product.stockQuantity == null,
      stockQuantity: product.stockQuantity == null ? '' : String(product.stockQuantity),
      relatedPlanId: product.relatedPlanId != null ? String(product.relatedPlanId) : '',
    });
    setError('');
    setImageFile(null);
    setImagePreview(product.imageUrl ?? null);
    setShowModal(true);
  }

  function closeModal() {
    if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setShowModal(false);
    setEditProduct(null);
    setImageFile(null);
    setImagePreview(null);
  }

  function handleImageSelect(file: File, previewUrl: string) {
    if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(previewUrl);
    setError('');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.stockUnlimited) {
      const qty = Number(form.stockQuantity);
      if (!Number.isInteger(qty) || qty < 0) {
        setError('재고 수량은 0 이상의 정수로 입력해주세요.');
        return;
      }
    }
    if (editProduct) updateMutation.mutate();
    else createMutation.mutate();
  }

  function openCreateCategory() {
    setEditCategory(null);
    setCategoryForm(EMPTY_CATEGORY_FORM);
    setCategoryError('');
    setShowCategoryModal(true);
  }

  function openEditCategory(category: ProductCategory) {
    setEditCategory(category);
    setCategoryForm({
      name: category.name,
      sortOrder: String(category.sortOrder),
      isActive: category.isActive,
    });
    setCategoryError('');
    setShowCategoryModal(true);
  }

  function closeCategoryModal() {
    setShowCategoryModal(false);
    setEditCategory(null);
  }

  function handleCategorySubmit(e: React.FormEvent) {
    e.preventDefault();
    setCategoryError('');
    const sortOrder = Number(categoryForm.sortOrder);
    if (!Number.isInteger(sortOrder)) {
      setCategoryError('정렬 순서는 정수로 입력해주세요.');
      return;
    }
    if (editCategory) updateCategoryMutation.mutate();
    else createCategoryMutation.mutate();
  }

  function handleDeleteCategory(category: ProductCategory) {
    if (
      !window.confirm(
        `"${category.name}" 카테고리를 삭제할까요? 연결된 상품은 미분류로 바뀝니다.`,
      )
    ) {
      return;
    }
    deleteCategoryMutation.mutate(category.id);
  }

  function stockLabel(product: Product) {
    if (product.stockQuantity == null) return { text: '무제한', soldOut: false };
    if (product.stockQuantity === 0) return { text: '품절', soldOut: true };
    return { text: `재고 ${product.stockQuantity}`, soldOut: false };
  }

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isCategoryPending = createCategoryMutation.isPending || updateCategoryMutation.isPending;

  return (
    <div className="space-y-8">
      <SalesPauseBar />

      <section className="space-y-4">
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
            {products.map((product) => {
              const stock = stockLabel(product);
              const categoryName = product.category?.name;
              return (
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
                    <div className="min-w-0">
                      <h3 className="font-bold text-text-primary">{product.name}</h3>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium',
                            stock.soldOut
                              ? 'bg-red-50 text-red-600'
                              : 'bg-surface-muted text-text-secondary',
                          )}
                        >
                          {stock.text}
                        </span>
                        {categoryName ? (
                          <span className="inline-flex rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700">
                            {categoryName}
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-text-muted">
                            미분류
                          </span>
                        )}
                        {product.isSalesPaused && (
                          <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                            판매 중단
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openEdit(product)}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-text-muted hover:bg-surface-muted hover:text-text-primary"
                      aria-label="상품 수정"
                    >
                      <Pencil size={13} />
                    </button>
                  </div>
                  {product.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-text-muted">{product.description}</p>
                  )}
                  {product.relatedPlanId != null && (
                    <p className="mt-1 text-xs text-text-muted">
                      구독 리뷰 공유:{' '}
                      {plans.find((plan) => plan.id === product.relatedPlanId)?.name ??
                        `플랜 #${product.relatedPlanId}`}
                    </p>
                  )}
                  <div className="mt-3">
                    {product.originalPrice != null && (
                      <p className="text-sm text-text-muted line-through">
                        {formatCurrency(product.originalPrice)}
                      </p>
                    )}
                    <p className="text-xl font-bold text-brand-500">
                      {formatCurrency(product.price)}
                    </p>
                  </div>
                  {product.isSalesPaused && (
                    <p className="mt-1 text-xs text-amber-600">판매 일시중단 · 신규 구매 불가</p>
                  )}
                  {!product.isActive && (
                    <p className="mt-1 text-xs text-text-muted">비활성 · 고객 페이지에 노출되지 않음</p>
                  )}
                  <div className="mt-4 flex gap-1">
                    <button
                      type="button"
                      onClick={() => togglePauseMutation.mutate(product)}
                      disabled={togglePauseMutation.isPending}
                      className={cn(
                        'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                        product.isSalesPaused
                          ? 'bg-green-50 text-green-600 hover:bg-green-100'
                          : 'bg-amber-50 text-amber-700 hover:bg-amber-100',
                      )}
                    >
                      {product.isSalesPaused ? '판매재개' : '판매중단'}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleActiveMutation.mutate(product)}
                      disabled={toggleActiveMutation.isPending}
                      className={cn(
                        'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                        product.isActive
                          ? 'bg-red-50 text-red-500 hover:bg-red-100'
                          : 'bg-green-50 text-green-600 hover:bg-green-100',
                      )}
                    >
                      {product.isActive ? '비활성화' : '활성화'}
                    </button>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="section-title">상품 카테고리</h2>
          <button onClick={openCreateCategory} className="btn-secondary">
            <Plus size={16} /> 카테고리 추가
          </button>
        </div>

        <div className="card overflow-hidden">
          {categoriesLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="spinner h-6 w-6" />
            </div>
          ) : categories.length === 0 ? (
            <div className="p-8">
              <EmptyState icon={Layers} title="등록된 카테고리가 없습니다." />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className={cn(
                    'flex items-center justify-between px-5 py-3',
                    !category.isActive && 'opacity-50',
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="font-medium text-text-primary">{category.name}</span>
                    <span className="text-xs text-text-muted">정렬 {category.sortOrder}</span>
                    {!category.isActive && (
                      <span className="text-xs text-text-muted">(유저 필터 숨김)</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => openEditCategory(category)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-surface-muted hover:text-text-primary"
                      aria-label="카테고리 수정"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(category)}
                      disabled={deleteCategoryMutation.isPending}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-red-50 hover:text-red-500"
                      aria-label="카테고리 삭제"
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

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editProduct ? '상품 수정' : '상품 추가'}
        size="md"
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
          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="판매가 (원, 부가세 포함)"
              type="number"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              required
              min={0}
            />
            <FormField
              label="원래가격 (원)"
              optional
              type="number"
              value={form.originalPrice}
              onChange={(e) => setForm((f) => ({ ...f, originalPrice: e.target.value }))}
              min={0}
              hint="비우면 유저 화면에 할인 표시가 없습니다."
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">
              카테고리
              <span className="ml-1.5 font-normal opacity-50">선택</span>
            </label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
              className="w-full rounded-xl border border-border bg-surface-input/50 px-4 py-3 text-sm text-text-primary outline-none transition-colors focus:border-brand-400 focus:bg-white"
            >
              <option value="">미분류</option>
              {categories.map((category) => (
                <option key={category.id} value={String(category.id)}>
                  {category.name}
                  {category.isActive ? '' : ' (숨김)'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-text-muted">재고</p>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, stockUnlimited: true }))}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                  form.stockUnlimited
                    ? 'bg-brand-500 text-white'
                    : 'bg-surface-muted text-text-secondary hover:bg-surface-input',
                )}
              >
                무제한
              </button>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, stockUnlimited: false }))}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                  !form.stockUnlimited
                    ? 'bg-brand-500 text-white'
                    : 'bg-surface-muted text-text-secondary hover:bg-surface-input',
                )}
              >
                수량 지정
              </button>
            </div>
            {!form.stockUnlimited && (
              <div className="mt-3">
                <FormField
                  label="재고 수량"
                  type="number"
                  value={form.stockQuantity}
                  onChange={(e) => setForm((f) => ({ ...f, stockQuantity: e.target.value }))}
                  required
                  min={0}
                  hint="0이면 품절입니다. 목록에는 노출되고 신규 주문만 막힙니다."
                />
              </div>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">
              연관 구독 플랜
              <span className="ml-1.5 font-normal opacity-50">선택</span>
            </label>
            <select
              value={form.relatedPlanId}
              onChange={(e) => setForm((f) => ({ ...f, relatedPlanId: e.target.value }))}
              className="w-full rounded-xl border border-border bg-surface-input/50 px-4 py-3 text-sm text-text-primary outline-none transition-colors focus:border-brand-400 focus:bg-white"
            >
              <option value="">없음 (독립 상품 리뷰)</option>
              {plans.map((plan) => (
                <option key={plan.id} value={String(plan.id)}>
                  {plan.name}
                </option>
              ))}
            </select>
            <p className="mt-1.5 pl-1 text-xs text-text-muted">
              설정하면 해당 플랜 리뷰를 공유합니다. 비우면 독립 상품 리뷰입니다.
            </p>
          </div>
          <CatalogImageField
            previewUrl={imagePreview}
            onFileSelect={handleImageSelect}
            onError={setError}
            disabled={isPending}
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

      <Modal
        isOpen={showCategoryModal}
        onClose={closeCategoryModal}
        title={editCategory ? '카테고리 수정' : '카테고리 추가'}
        size="sm"
      >
        <form onSubmit={handleCategorySubmit} className="space-y-4">
          <FormField
            label="카테고리 이름"
            value={categoryForm.name}
            onChange={(e) => setCategoryForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <FormField
            label="정렬 순서"
            type="number"
            value={categoryForm.sortOrder}
            onChange={(e) => setCategoryForm((f) => ({ ...f, sortOrder: e.target.value }))}
            hint="작을수록 유저 필터에서 앞에 표시됩니다."
          />
          {editCategory && (
            <div>
              <p className="mb-2 text-xs font-medium text-text-muted">유저 필터 노출</p>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setCategoryForm((f) => ({ ...f, isActive: true }))}
                  className={cn(
                    'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                    categoryForm.isActive
                      ? 'bg-brand-500 text-white'
                      : 'bg-surface-muted text-text-secondary hover:bg-surface-input',
                  )}
                >
                  노출
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryForm((f) => ({ ...f, isActive: false }))}
                  className={cn(
                    'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                    !categoryForm.isActive
                      ? 'bg-brand-500 text-white'
                      : 'bg-surface-muted text-text-secondary hover:bg-surface-input',
                  )}
                >
                  숨김
                </button>
              </div>
              <p className="mt-1.5 pl-1 text-xs text-text-muted">
                숨기면 유저 카테고리 필터에서만 빠집니다. 연결된 상품은 그대로입니다.
              </p>
            </div>
          )}

          {categoryError && (
            <div className="form-error-banner">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{categoryError}</span>
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={closeCategoryModal} className="btn-secondary flex-1">
              취소
            </button>
            <button type="submit" disabled={isCategoryPending} className="btn-primary flex-1">
              {isCategoryPending ? (
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

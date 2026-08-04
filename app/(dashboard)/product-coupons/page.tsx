"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, TicketPercent, Loader2, AlertCircle } from "lucide-react";
import { productCouponsApi, getErrorMessage } from "@/lib/api";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, formatCurrency, cn } from "@/lib/utils";
import type { ProductCoupon } from "@/types";

const LIMIT = 20;

export default function ProductCouponsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editCoupon, setEditCoupon] = useState<ProductCoupon | null>(null);
  const [form, setForm] = useState({
    code: "",
    name: "",
    description: "",
    discountRate: "",
    maxDiscountAmount: "",
    startDate: "",
    endDate: "",
  });
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["product-coupons", page],
    queryFn: () => productCouponsApi.getList({ page, limit: LIMIT }),
  });

  const coupons: ProductCoupon[] = data?.items ?? [];
  const total: number = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);

  const createMutation = useMutation({
    mutationFn: () =>
      productCouponsApi.create({
        code: form.code,
        name: form.name || undefined,
        description: form.description || undefined,
        discountRate: Number(form.discountRate),
        maxDiscountAmount: form.maxDiscountAmount
          ? Number(form.maxDiscountAmount)
          : undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["product-coupons"] });
      closeModal();
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      productCouponsApi.update(editCoupon!.id, {
        name: form.name || undefined,
        description: form.description || undefined,
        discountRate: Number(form.discountRate),
        maxDiscountAmount: form.maxDiscountAmount
          ? Number(form.maxDiscountAmount)
          : null,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["product-coupons"] });
      closeModal();
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const toggleMutation = useMutation({
    mutationFn: (coupon: ProductCoupon) =>
      productCouponsApi.update(coupon.id, { isActive: !coupon.isActive }),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["product-coupons"] }),
  });

  function openCreate() {
    setEditCoupon(null);
    setForm({
      code: "",
      name: "",
      description: "",
      discountRate: "",
      maxDiscountAmount: "",
      startDate: "",
      endDate: "",
    });
    setError("");
    setShowModal(true);
  }

  function openEdit(coupon: ProductCoupon) {
    setEditCoupon(coupon);
    setForm({
      code: coupon.code,
      name: coupon.name ?? "",
      description: coupon.description ?? "",
      discountRate: String(coupon.discountRate),
      maxDiscountAmount:
        coupon.maxDiscountAmount != null ? String(coupon.maxDiscountAmount) : "",
      startDate: coupon.startDate ? coupon.startDate.slice(0, 10) : "",
      endDate: coupon.endDate ? coupon.endDate.slice(0, 10) : "",
    });
    setError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditCoupon(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (editCoupon) updateMutation.mutate();
    else createMutation.mutate();
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} /> 쿠폰 추가
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-border px-5 py-3">
          <p className="text-sm text-text-secondary">
            총 <span className="font-bold text-text-primary">{total}</span>개
          </p>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="spinner" />
          </div>
        ) : coupons.length === 0 ? (
          <EmptyState icon={TicketPercent} title="등록된 쿠폰이 없습니다" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-surface-muted">
                <tr>
                  <th className="table-th">코드</th>
                  <th className="table-th">이름</th>
                  <th className="table-th">할인율</th>
                  <th className="table-th">최대 할인</th>
                  <th className="table-th">상태</th>
                  <th className="table-th">유효기간</th>
                  <th className="table-th">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {coupons.map((coupon) => (
                  <tr
                    key={coupon.id}
                    className={cn(
                      "transition-colors hover:bg-surface-muted/50",
                      !coupon.isActive && "opacity-60",
                    )}
                  >
                    <td className="table-td font-mono font-bold text-brand-600">
                      {coupon.code}
                    </td>
                    <td className="table-td text-text-primary">
                      {coupon.name ?? "-"}
                    </td>
                    <td className="table-td font-bold text-text-primary">
                      {coupon.discountRate}%
                    </td>
                    <td className="table-td text-text-secondary">
                      {coupon.maxDiscountAmount != null
                        ? formatCurrency(coupon.maxDiscountAmount)
                        : "상한 없음"}
                    </td>
                    <td className="table-td">
                      <Badge
                        label={coupon.isActive ? "활성" : "비활성"}
                        color={
                          coupon.isActive
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-surface-input text-text-muted"
                        }
                      />
                    </td>
                    <td className="table-td text-xs text-text-secondary">
                      {coupon.startDate
                        ? formatDate(coupon.startDate)
                        : "무기한"}{" "}
                      ~ {coupon.endDate ? formatDate(coupon.endDate) : "무기한"}
                    </td>
                    <td className="table-td">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(coupon)}
                          className="text-xs text-brand-500 hover:text-brand-600"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => toggleMutation.mutate(coupon)}
                          className={cn(
                            "rounded px-2 py-0.5 text-xs font-medium",
                            coupon.isActive
                              ? "bg-red-50 text-red-500"
                              : "bg-green-50 text-green-600",
                          )}
                        >
                          {coupon.isActive ? "비활성화" : "활성화"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="border-t border-border px-5 py-4">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editCoupon ? "쿠폰 수정" : "쿠폰 추가"}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editCoupon && (
            <FormField
              label="쿠폰 코드"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              required
            />
          )}
          <FormField
            label="쿠폰 이름"
            optional
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="할인율 (%)"
              type="number"
              value={form.discountRate}
              onChange={(e) =>
                setForm((f) => ({ ...f, discountRate: e.target.value }))
              }
              required
              min={1}
              max={100}
            />
            <FormField
              label="최대 할인 금액"
              optional
              hint="비워두면 상한 없음"
              type="number"
              value={form.maxDiscountAmount}
              onChange={(e) =>
                setForm((f) => ({ ...f, maxDiscountAmount: e.target.value }))
              }
              min={0}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="시작일"
              optional
              type="date"
              value={form.startDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, startDate: e.target.value }))
              }
            />
            <FormField
              label="종료일"
              optional
              type="date"
              value={form.endDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, endDate: e.target.value }))
              }
            />
          </div>
          {error && (
            <div className="form-error-banner">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={closeModal}
              className="btn-secondary flex-1"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="btn-primary flex-1"
            >
              {isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> 저장 중...
                </>
              ) : (
                "저장"
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

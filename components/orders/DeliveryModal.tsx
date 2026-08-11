"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, Loader2, Truck } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { ordersApi, getErrorMessage } from "@/lib/api";
import type { Payment } from "@/types";

const schema = z.object({
  trackingNumber: z
    .string()
    .min(1, "송장번호를 입력해주세요.")
    .max(100, "송장번호가 너무 깁니다."),
});

type FormData = z.infer<typeof schema>;

interface DeliveryModalProps {
  payment: Payment | null;
  onClose: () => void;
}

export function DeliveryModal({ payment, onClose }: DeliveryModalProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { trackingNumber: payment?.trackingNumber ?? "" },
  });

  const mutation = useMutation({
    mutationFn: ({
      id,
      trackingNumber,
    }: {
      id: number;
      trackingNumber: string;
    }) => ordersApi.updateDelivery(id, trackingNumber),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({ queryKey: ["calendar"] });
      onClose();
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  function onSubmit(data: FormData) {
    if (!payment) return;
    setError("");
    mutation.mutate({ id: payment.id, trackingNumber: data.trackingNumber });
  }

  return (
    <Modal isOpen={!!payment} onClose={onClose} title="배송 처리" size="sm">
      {payment && (
        <div className="space-y-4">
          {/* 주문 정보 요약 */}
          <div className="rounded-xl bg-surface-input/50 p-4 text-sm">
            <p className="text-xs font-medium text-text-muted">주문 정보</p>
            <p className="mt-1.5 font-semibold text-text-primary">
              {payment.planName ??
                payment.subscription?.plan?.name ??
                "구독 박스"}
            </p>
            <p className="text-text-secondary">
              {payment.subscription?.user?.email ?? `주문 #${payment.id}`}
            </p>
            <p className="mt-1 font-semibold text-brand-500">
              {payment.amount.toLocaleString()}원
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              {...register("trackingNumber")}
              label="송장번호"
              autoFocus
              error={errors.trackingNumber?.message}
            />

            {error && (
              <div className="form-error-banner">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="btn-primary flex-1"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    처리 중...
                  </>
                ) : (
                  <>
                    <Truck size={14} />
                    배송 처리
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </Modal>
  );
}

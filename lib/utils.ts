import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
  }).format(amount);
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "yyyy.MM.dd", { locale: ko });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "yyyy.MM.dd HH:mm", { locale: ko });
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "-";
  return phone.replace(/(\d{3})(\d{3,4})(\d{4})/, "$1-$2-$3");
}

export const PAYMENT_STATUS_MAP: Record<
  string,
  { label: string; color: string }
> = {
  pending: { label: "결제 대기", color: "bg-yellow-100 text-yellow-800" },
  completed: { label: "결제 완료", color: "bg-green-100 text-green-800" },
  failed: { label: "결제 실패", color: "bg-red-100 text-red-800" },
  refunded: { label: "환불", color: "bg-gray-100 text-gray-800" },
  partially_refunded: {
    label: "부분 환불",
    color: "bg-orange-100 text-orange-800",
  },
};

export const DELIVERY_STATUS_MAP: Record<
  string,
  { label: string; color: string }
> = {
  PendingDelivery: {
    label: "배송 대기",
    color: "bg-yellow-100 text-yellow-800",
  },
  DeliveryCompleted: {
    label: "배송 완료",
    color: "bg-green-100 text-green-800",
  },
};

export const INQUIRY_STATUS_MAP: Record<
  string,
  { label: string; color: string }
> = {
  pending: { label: "대기중", color: "bg-red-100 text-red-800" },
  in_progress: { label: "처리중", color: "bg-yellow-100 text-yellow-800" },
  resolved: { label: "해결됨", color: "bg-green-100 text-green-800" },
  deleted: { label: "삭제됨", color: "bg-gray-100 text-gray-500" },
};

export const USER_STATUS_MAP: Record<string, { label: string; color: string }> =
  {
    active: { label: "활성", color: "bg-green-100 text-green-800" },
    inactive: { label: "비활성", color: "bg-gray-100 text-gray-800" },
    suspended: { label: "정지", color: "bg-red-100 text-red-800" },
  };

export const SUBSCRIPTION_STATUS_MAP: Record<
  string,
  { label: string; color: string }
> = {
  active: { label: "구독중", color: "bg-green-100 text-green-800" },
  cancelled: { label: "취소됨", color: "bg-gray-100 text-gray-800" },
  paymentFailed: { label: "결제 실패", color: "bg-red-100 text-red-800" },
  suspended: { label: "정지", color: "bg-orange-100 text-orange-800" },
};

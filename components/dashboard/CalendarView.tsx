"use client";

import { useEffect, useMemo, useState } from "react";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  isSameMonth,
  parseISO,
} from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api";
import { PaymentDetailModal } from "@/components/orders/PaymentDetailModal";
import { SubscriptionDetailModal } from "@/components/subscriptions/SubscriptionDetailModal";
import { ProductOrderDetailModal } from "@/components/product-orders/ProductOrderDetailModal";
import { formatDate } from "@/lib/utils";
import type {
  CalendarScheduledPayment,
  CalendarCompletedPayment,
  CalendarCompletedDelivery,
  DashboardCalendarResponse,
} from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type EventType = "scheduled" | "paused" | "completed" | "in_delivery" | "delivered";

interface CalendarEvent {
  type: EventType;
  title: string;
  date: Date;
  paymentId?: number;
  subscriptionId?: number;
  productOrderId?: number;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const EVENT_CONFIG: Record<
  EventType,
  { dot: string; color: string; label: string }
> = {
  scheduled: { dot: "#3B82F6", color: "#1D4ED8", label: "결제 예정" },
  paused: { dot: "#93C5FD", color: "#2563EB", label: "쉬어가기" },
  completed: { dot: "#22C55E", color: "#15803D", label: "미배송" },
  in_delivery: { dot: "#F59E0B", color: "#B45309", label: "배송중" },
  delivered: { dot: "#C4772A", color: "#92400E", label: "배송완료" },
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildWeeks(year: number, month: number): Date[][] {
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);
  const start = startOfWeek(first, { weekStartsOn: 0 });
  const end = endOfWeek(last, { weekStartsOn: 0 });

  const weeks: Date[][] = [];
  let cur = start;
  while (cur <= end) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cur));
      cur = addDays(cur, 1);
    }
    weeks.push(week);
  }
  return weeks;
}

function dateKey(d: Date) {
  return d.toDateString();
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(TODAY);
  const [detailPaymentId, setDetailPaymentId] = useState<number | null>(null);
  const [detailSubscriptionId, setDetailSubscriptionId] = useState<
    number | null
  >(null);
  const [detailProductOrderId, setDetailProductOrderId] = useState<
    number | null
  >(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { data, isLoading, isError, error } = useQuery<DashboardCalendarResponse>({
    queryKey: ["calendar", year, month],
    queryFn: () => dashboardApi.getCalendar(year, month),
  });

  const events = useMemo<CalendarEvent[]>(() => {
    if (!data) return [];
    const result: CalendarEvent[] = [];

    (data.scheduledPayments ?? []).forEach((sub: CalendarScheduledPayment) => {
      if (!sub.nextBillingDate) return;
      const date = new Date(sub.nextBillingDate);
      if (isNaN(date.getTime())) return;
      date.setHours(0, 0, 0, 0);
      result.push({
        type: sub.isPaused ? "paused" : "scheduled",
        title: `${sub.plan?.name ?? "구독"} · ${sub.user?.email ?? ""}`,
        date,
        subscriptionId: sub.id,
      });
    });

    (data.completedPayments ?? []).forEach((payment: CalendarCompletedPayment) => {
      if (!payment.approvedAt) return;
      const date = parseISO(payment.approvedAt);
      if (isNaN(date.getTime())) return;
      date.setHours(0, 0, 0, 0);
      result.push({
        type: payment.deliveryStatus === "DeliveryInProgress" ? "in_delivery" : "completed",
        title: `${payment.label} · ${(payment.amount ?? 0).toLocaleString()}원`,
        date,
        paymentId: payment.orderType === "subscription" ? payment.id : undefined,
        productOrderId: payment.orderType === "product" ? payment.id : undefined,
      });
    });

    (data.completedDeliveries ?? []).forEach((delivery: CalendarCompletedDelivery) => {
      if (!delivery.deliveredAt) return;
      const date = parseISO(delivery.deliveredAt);
      if (isNaN(date.getTime())) return;
      date.setHours(0, 0, 0, 0);
      result.push({
        type: "delivered",
        title: `송장번호: ${delivery.trackingNumber ?? "-"}`,
        date,
        paymentId: delivery.orderType === "subscription" ? delivery.id : undefined,
        productOrderId: delivery.orderType === "product" ? delivery.id : undefined,
      });
    });

    return result;
  }, [data]);

  // Group events by date key
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((e) => {
      const k = dateKey(e.date);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(e);
    });
    return map;
  }, [events]);

  const TYPE_ORDER: Record<EventType, number> = {
    completed: 0,
    in_delivery: 1,
    scheduled: 2,
    paused: 3,
    delivered: 4,
  };

  // Events for selected date in panel — completed first
  const selectedDateEvents = useMemo<CalendarEvent[]>(() => {
    if (!selectedDate) return [];
    const list = eventsByDate.get(dateKey(selectedDate)) ?? [];
    return [...list].sort((a, b) => TYPE_ORDER[a.type] - TYPE_ORDER[b.type]);
  }, [eventsByDate, selectedDate]);

  const weeks = useMemo(() => buildWeeks(year, month), [year, month]);

  // 달력 그리드 실제 높이: 요일 헤더(38px) + 주 행(80px × n) + 테두리(2px) — 데스크탑 기준
  const calendarGridHeight = 38 + weeks.length * 80 + 2;

  // 데스크탑(lg+) 여부 — height 스타일을 데스크탑에서만 적용
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  function prevMonth() {
    setCurrentDate(new Date(year, month - 2, 1));
    setSelectedDate(null);
  }
  function nextMonth() {
    setCurrentDate(new Date(year, month, 1));
    setSelectedDate(null);
  }

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="section-title">결제 / 배송 달력</h2>
        <div className="flex items-center gap-4 text-xs">
          {(
            Object.entries(EVENT_CONFIG) as [
              EventType,
              (typeof EVENT_CONFIG)[EventType],
            ][]
          ).map(([type, cfg]) => (
            <div key={type} className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: cfg.dot }}
              />
              <span className="text-text-secondary">{cfg.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        {/* Calendar grid */}
        <div className="min-w-0 flex-1">
          {/* Month nav — 달력 그리드 기준 중앙 정렬 */}
          <div className="mb-3 flex items-center justify-center gap-3">
            <button
              onClick={prevMonth}
              className="flex h-7 w-7 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary"
              aria-label="이전 달"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="min-w-[110px] text-center text-sm font-semibold text-text-primary">
              {year}년 {month}월
            </span>
            <button
              onClick={nextMonth}
              className="flex h-7 w-7 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary"
              aria-label="다음 달"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          {isLoading ? (
            <div className="flex h-96 items-center justify-center">
              <div className="spinner" />
            </div>
          ) : isError ? (
            <div className="flex h-96 flex-col items-center justify-center gap-2 text-sm text-red-500">
              <span>데이터를 불러오지 못했습니다.</span>
              <span className="text-xs text-text-muted">
                {(error as Error)?.message ?? "알 수 없는 오류"}
              </span>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border">
              {/* Weekday header */}
              <div className="grid grid-cols-7 border-b border-border bg-surface-muted/60">
                {WEEKDAYS.map((day, i) => (
                  <div
                    key={day}
                    className={`py-2.5 text-center text-xs font-semibold ${
                      i === 0
                        ? "text-red-400"
                        : i === 6
                          ? "text-blue-400"
                          : "text-text-muted"
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Weeks */}
              <div className="divide-y divide-border">
                {weeks.map((week, wi) => (
                  <div
                    key={wi}
                    className="grid grid-cols-7 divide-x divide-border"
                  >
                    {week.map((date, di) => {
                      const isCurrentMonth = isSameMonth(
                        date,
                        new Date(year, month - 1, 1),
                      );
                      const isToday = dateKey(date) === dateKey(TODAY);
                      const isSelected =
                        selectedDate && dateKey(date) === dateKey(selectedDate);
                      const dayEvents = eventsByDate.get(dateKey(date)) ?? [];

                      // Group by type → count
                      const grouped: Partial<Record<EventType, number>> = {};
                      dayEvents.forEach((e) => {
                        grouped[e.type] = (grouped[e.type] ?? 0) + 1;
                      });

                      return (
                        <button
                          key={di}
                          onClick={() => setSelectedDate(date)}
                          className={`group relative flex min-h-[60px] flex-col gap-0.5 p-1.5 text-left transition-colors sm:min-h-[80px] sm:p-2 ${
                            isSelected
                              ? "bg-brand-50/60"
                              : "hover:bg-surface-muted/50"
                          } ${!isCurrentMonth ? "opacity-40" : ""}`}
                        >
                          {/* Date number */}
                          <span
                            className={`mb-1 inline-flex h-5 w-5 items-center justify-center self-end rounded-full text-xs font-medium ${
                              isToday
                                ? "bg-brand-500 font-bold text-white"
                                : isSelected
                                  ? "text-brand-600 font-semibold"
                                  : di === 0
                                    ? "text-red-400"
                                    : di === 6
                                      ? "text-blue-400"
                                      : "text-text-secondary"
                            }`}
                          >
                            {date.getDate()}
                          </span>

                          {/* Grouped event chips */}
                          {(
                            Object.entries(EVENT_CONFIG) as [
                              EventType,
                              (typeof EVENT_CONFIG)[EventType],
                            ][]
                          ).map(([type, cfg]) => {
                            const count = grouped[type];
                            if (!count) return null;
                            return (
                              <div
                                key={type}
                                className="flex items-center gap-1"
                              >
                                <span
                                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                                  style={{ backgroundColor: cfg.dot }}
                                />
                                <span
                                  className="truncate text-[10px] font-medium leading-tight"
                                  style={{ color: cfg.color }}
                                >
                                  {cfg.label} {count}건
                                </span>
                              </div>
                            );
                          })}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Day event panel — always visible */}
        <div
          className="w-full lg:w-64 lg:shrink-0"
          style={isDesktop ? { height: calendarGridHeight } : undefined}
        >
          <div
            className={
              isDesktop
                ? "flex h-full flex-col overflow-hidden rounded-xl border border-border bg-white"
                : "flex flex-col rounded-xl border border-border bg-white"
            }
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-semibold text-text-primary">
                {selectedDate ? formatDate(selectedDate) : "일정"}
              </p>
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate(null)}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div
              className={
                isDesktop
                  ? "min-h-0 flex-1 overflow-y-auto p-3"
                  : "max-h-72 overflow-y-auto p-3"
              }
            >
              {!selectedDate ? (
                <div className="mt-10 flex flex-col items-center gap-2 text-center">
                  <p className="text-xs font-medium text-text-muted">
                    날짜를 선택하면
                  </p>
                  <p className="text-xs text-text-muted">
                    해당 날짜의 일정을 확인할 수 있어요.
                  </p>
                </div>
              ) : selectedDateEvents.length === 0 ? (
                <p className="mt-8 text-center text-xs text-text-muted">
                  이 날짜에 일정이 없습니다.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {selectedDateEvents.map((event, idx) => {
                    const cfg = EVENT_CONFIG[event.type];
                    const clickable = !!(
                      event.paymentId ??
                      event.productOrderId ??
                      event.subscriptionId
                    );
                    return (
                      <li key={idx}>
                        <button
                          onClick={() => {
                            if (event.paymentId)
                              setDetailPaymentId(event.paymentId);
                            else if (event.productOrderId)
                              setDetailProductOrderId(event.productOrderId);
                            else if (event.subscriptionId)
                              setDetailSubscriptionId(event.subscriptionId);
                          }}
                          disabled={!clickable}
                          className={`w-full rounded-lg border border-border px-3 py-2 text-left transition-colors ${
                            clickable
                              ? "cursor-pointer hover:bg-surface-muted/60"
                              : "cursor-default"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span
                              className="h-1.5 w-1.5 shrink-0 rounded-full"
                              style={{ backgroundColor: cfg.dot }}
                            />
                            <span
                              className="text-xs font-semibold"
                              style={{ color: cfg.color }}
                            >
                              {cfg.label}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-xs text-text-muted">
                            {event.title}
                          </p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      <PaymentDetailModal
        paymentId={detailPaymentId}
        onClose={() => setDetailPaymentId(null)}
      />
      <SubscriptionDetailModal
        subscriptionId={detailSubscriptionId}
        onClose={() => setDetailSubscriptionId(null)}
      />
      <ProductOrderDetailModal
        orderId={detailProductOrderId}
        onClose={() => setDetailProductOrderId(null)}
      />
    </div>
  );
}

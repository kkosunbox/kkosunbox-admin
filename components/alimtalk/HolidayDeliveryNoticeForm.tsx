"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { alimtalkApi, getErrorMessage, usersApi } from "@/lib/api";
import { FormField } from "@/components/ui/FormField";
import { Pagination } from "@/components/ui/Pagination";
import { Badge } from "@/components/ui/Badge";
import {
  buildContactOptions,
  type AlimtalkContactOption,
} from "@/components/alimtalk/contactOptions";
import { HolidayDeliveryNoticePreview } from "@/components/alimtalk/HolidayDeliveryNoticePreview";
import { USER_STATUS_MAP, cn } from "@/lib/utils";
import type { DeliveryContact, User } from "@/types";

const PICKER_LIMIT = 10;

interface SelectedContact {
  key: string;
  email: string;
  phone: string;
  label: string;
}

interface HolidayFields {
  holidayName: string;
  holidayStartDate: string;
  holidayEndDate: string;
  resumeDate: string;
}

const EMPTY_FIELDS: HolidayFields = {
  holidayName: "",
  holidayStartDate: "",
  holidayEndDate: "",
  resumeDate: "",
};

interface HolidayDeliveryNoticeFormProps {
  /** 고객 한 명의 회원·배송지 연락처 중에서 고릅니다. */
  customer?: {
    email: string;
    phone?: string | null;
    deliveryContacts?: DeliveryContact[];
  };
  /** 주문처럼 받을 번호가 이미 정해진 경우 */
  fixedRecipient?: {
    email?: string;
    phone: string;
    label?: string;
  };
  onSent?: () => void;
}

function formatSendResult(result: unknown): string {
  if (!result || typeof result !== "object")
    return "알림톡 발송을 요청했습니다.";
  const data = result as Record<string, unknown>;
  const sent = data.sentCount ?? data.successCount ?? data.requestedCount;
  if (typeof sent === "number")
    return `${sent.toLocaleString()}건 발송을 요청했습니다.`;
  if (typeof data.message === "string" && data.message) return data.message;
  return "알림톡 발송을 요청했습니다.";
}

function SelectAllToggle({
  label,
  targets,
  selected,
  onChange,
}: {
  label: string;
  targets: SelectedContact[];
  selected: SelectedContact[];
  onChange: (next: SelectedContact[]) => void;
}) {
  if (targets.length === 0) return null;

  const selectedCount = targets.filter((item) =>
    selected.some((current) => current.key === item.key),
  ).length;
  const allChecked = selectedCount === targets.length;

  function toggle() {
    if (allChecked) {
      const keys = new Set(targets.map((item) => item.key));
      onChange(selected.filter((item) => !keys.has(item.key)));
      return;
    }
    const existing = new Set(selected.map((item) => item.key));
    onChange([
      ...selected,
      ...targets.filter((item) => !existing.has(item.key)),
    ]);
  }

  return (
    <label className="flex cursor-pointer items-center gap-2">
      <input
        type="checkbox"
        checked={allChecked}
        ref={(element) => {
          if (element) element.indeterminate = selectedCount > 0 && !allChecked;
        }}
        onChange={toggle}
        className="h-4 w-4 rounded border-border text-brand-500"
      />
      <span className="text-xs font-medium text-text-primary">{label}</span>
    </label>
  );
}

function contactsFromUser(user: User): SelectedContact[] {
  return buildContactOptions(user.id, user.phone, user.deliveryContacts).map(
    (option) => ({
      key: option.key,
      email: user.email,
      phone: option.phone,
      label: option.label,
    }),
  );
}

function ContactChecks({
  options,
  email,
  selected,
  onToggle,
}: {
  options: AlimtalkContactOption[];
  email: string;
  selected: SelectedContact[];
  onToggle: (option: AlimtalkContactOption) => void;
}) {
  if (options.length === 0) {
    return <p className="mt-1 text-xs text-text-muted">연락처 없음</p>;
  }

  return (
    <ul className="mt-2 space-y-1">
      {options.map((option) => {
        const checked = selected.some((item) => item.key === option.key);
        return (
          <li key={option.key}>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1 hover:bg-surface-muted/70">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(option)}
                className="h-4 w-4 rounded border-border text-brand-500"
              />
              <span className="min-w-0 flex-1 text-xs text-text-secondary">
                <span className="font-medium text-text-primary">
                  {option.label}
                </span>
                <span className="ml-1.5">{option.phone}</span>
              </span>
              <span className="sr-only">{email}</span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

export function HolidayDeliveryNoticeForm({
  customer,
  fixedRecipient,
  onSent,
}: HolidayDeliveryNoticeFormProps) {
  const [fields, setFields] = useState<HolidayFields>(EMPTY_FIELDS);
  const [mode, setMode] = useState<"selected" | "all">("selected");
  const [selected, setSelected] = useState<SelectedContact[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const customerOptions = customer
    ? buildContactOptions("customer", customer.phone, customer.deliveryContacts)
    : [];

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const pickerEnabled = !customer && !fixedRecipient && mode === "selected";

  const {
    data,
    isLoading,
    isError,
    error: listError,
  } = useQuery({
    queryKey: ["users", "alimtalk-picker", page, search],
    queryFn: () =>
      usersApi.getList({
        page,
        limit: PICKER_LIMIT,
        search: search || undefined,
      }),
    enabled: pickerEnabled,
  });

  const users: User[] = data?.items ?? [];
  const total: number = data?.total ?? 0;
  const totalPages = Math.ceil(total / PICKER_LIMIT);

  const mutation = useMutation({
    mutationFn: () => {
      const phones = fixedRecipient
        ? [fixedRecipient.phone]
        : mode === "all" && !customer
          ? undefined
          : Array.from(new Set(selected.map((item) => item.phone)));
      return alimtalkApi.sendHolidayDeliveryNotice({
        holidayName: fields.holidayName.trim(),
        holidayStartDate: fields.holidayStartDate.trim(),
        holidayEndDate: fields.holidayEndDate.trim(),
        resumeDate: fields.resumeDate.trim(),
        sendToAllUsers: !customer && !fixedRecipient && mode === "all",
        phoneNumbers: phones,
      });
    },
    onSuccess: (result) => {
      setSuccess(formatSendResult(result));
      setError("");
      setConfirming(false);
      setFields(EMPTY_FIELDS);
      setSelected([]);
      onSent?.();
    },
    onError: (err) => {
      setError(getErrorMessage(err));
      setConfirming(false);
    },
  });

  function updateField(key: keyof HolidayFields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
    setSuccess("");
  }

  function toggleContact(email: string, option: AlimtalkContactOption) {
    setSelected((prev) => {
      const exists = prev.some((item) => item.key === option.key);
      if (exists) return prev.filter((item) => item.key !== option.key);
      return [
        ...prev,
        { key: option.key, email, phone: option.phone, label: option.label },
      ];
    });
    setSuccess("");
  }

  function replaceSelected(next: SelectedContact[]) {
    setSelected(next);
    setSuccess("");
  }

  function validate(): string | null {
    if (!fields.holidayName.trim()) return "연휴명을 입력해주세요.";
    if (!fields.holidayStartDate.trim()) return "시작일을 입력해주세요.";
    if (!fields.holidayEndDate.trim()) return "종료일을 입력해주세요.";
    if (!fields.resumeDate.trim()) return "배송 재개일을 입력해주세요.";
    if (fixedRecipient) {
      if (!fixedRecipient.phone.trim())
        return "배송지 연락처가 없어 발송할 수 없습니다.";
      return null;
    }
    if ((customer || mode === "selected") && selected.length === 0) {
      return "보낼 연락처를 선택해주세요.";
    }
    return null;
  }

  function handleReview() {
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    setError("");
    setSuccess("");
    setConfirming(true);
  }

  const recipientSummary = fixedRecipient
    ? [fixedRecipient.email, fixedRecipient.label, fixedRecipient.phone]
        .filter(Boolean)
        .join(" · ")
    : !customer && mode === "all"
      ? "연락처가 있는 전체 회원"
      : `선택한 연락처 ${selected.length}개`;

  if (confirming) {
    return (
      <div className="space-y-4">
        <div>
          <p className="text-sm font-semibold text-text-primary">
            발송 전 미리보기
          </p>
          <div className="mt-3">
            <HolidayDeliveryNoticePreview
              holidayName={fields.holidayName.trim()}
              holidayStartDate={fields.holidayStartDate.trim()}
              holidayEndDate={fields.holidayEndDate.trim()}
              resumeDate={fields.resumeDate.trim()}
            />
          </div>
        </div>
        <div className="rounded-2xl bg-surface-muted px-4 py-4 text-sm">
          <dl className="space-y-2">
            <SummaryRow label="수신" value={recipientSummary} />
          </dl>
          {!fixedRecipient && (customer || mode === "selected") && (
            <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto">
              {selected.map((item) => (
                <li key={item.key} className="text-xs text-text-secondary">
                  {item.email} · {item.label} · {item.phone}
                </li>
              ))}
            </ul>
          )}
          {!customer && !fixedRecipient && mode === "all" && (
            <p className="mt-3 text-xs font-medium text-amber-700">
              연락처가 있는 전체 회원에게 발송됩니다.
            </p>
          )}
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={mutation.isPending}
            className="btn-secondary flex-1"
          >
            수정
          </button>
          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="btn-primary flex-1"
          >
            {mutation.isPending ? "발송 중..." : "발송하기"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FormField
            label="연휴명"
            value={fields.holidayName}
            onChange={(e) => updateField("holidayName", e.target.value)}
            hint="예: 추석 연휴"
            disabled={mutation.isPending}
          />
        </div>
        <FormField
          label="시작일"
          value={fields.holidayStartDate}
          onChange={(e) => updateField("holidayStartDate", e.target.value)}
          hint="예: 9월 24일(목)"
          disabled={mutation.isPending}
        />
        <FormField
          label="종료일"
          value={fields.holidayEndDate}
          onChange={(e) => updateField("holidayEndDate", e.target.value)}
          hint="예: 9월 27일(일)"
          disabled={mutation.isPending}
        />
        <div className="sm:col-span-2">
          <FormField
            label="배송 재개일"
            value={fields.resumeDate}
            onChange={(e) => updateField("resumeDate", e.target.value)}
            hint="예: 9월 28일(월). 알림톡 문구에 그대로 들어갑니다."
            disabled={mutation.isPending}
          />
        </div>
      </div>

      {fixedRecipient ? (
        <div className="rounded-xl bg-surface-muted px-4 py-3">
          <p className="text-xs text-text-muted">수신 배송지</p>
          {fixedRecipient.email && (
            <p className="mt-0.5 text-sm font-medium text-text-primary">
              {fixedRecipient.email}
            </p>
          )}
          {fixedRecipient.label && (
            <p className="text-sm text-text-secondary">
              {fixedRecipient.label}
            </p>
          )}
          <p className="text-xs text-text-secondary">{fixedRecipient.phone}</p>
        </div>
      ) : customer ? (
        <div className="rounded-xl border border-border px-3 py-3">
          <p className="text-xs text-text-muted">받을 연락처</p>
          <p className="mt-0.5 truncate text-sm font-medium text-text-primary">
            {customer.email}
          </p>
          <div className="mt-2">
            <SelectAllToggle
              label="전체 선택"
              targets={customerOptions.map((option) => ({
                key: option.key,
                email: customer.email,
                phone: option.phone,
                label: option.label,
              }))}
              selected={selected}
              onChange={replaceSelected}
            />
          </div>
          <ContactChecks
            options={customerOptions}
            email={customer.email}
            selected={selected}
            onToggle={(option) => toggleContact(customer.email, option)}
          />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="filter-tabs w-fit">
            <button
              type="button"
              onClick={() => setMode("selected")}
              className={cn(
                "filter-tab",
                mode === "selected" && "filter-tab-active",
              )}
            >
              고객 선택
            </button>
            <button
              type="button"
              onClick={() => setMode("all")}
              className={cn(
                "filter-tab",
                mode === "all" && "filter-tab-active",
              )}
            >
              전체 발송
            </button>
          </div>

          {mode === "all" ? (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
              연락처가 있는 전체 회원에게 발송됩니다.
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-text-muted">
                선택{" "}
                <span className="font-semibold text-text-primary">
                  {selected.length}
                </span>
                개 · 회원 연락처와 배송지 연락처를 각각 고를 수 있습니다.
                (중복되어도 한건만 발송)
              </p>

              <div className="search-wrapper">
                <Search size={13} className="shrink-0 text-text-muted" />
                <input
                  type="text"
                  placeholder="이메일로 검색..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder-text-muted"
                />
              </div>

              <div className="overflow-hidden rounded-xl border border-border">
                {isLoading ? (
                  <div className="flex h-32 items-center justify-center">
                    <div className="spinner" />
                  </div>
                ) : isError ? (
                  <p className="px-4 py-6 text-center text-xs text-red-500">
                    {getErrorMessage(listError)}
                  </p>
                ) : users.length === 0 ? (
                  <p className="px-4 py-6 text-center text-xs text-text-muted">
                    고객이 없습니다.
                  </p>
                ) : (
                  <ul className="divide-y divide-border-light">
                    <li className="bg-surface-muted/60 px-3 py-2.5">
                      <SelectAllToggle
                        label="이 페이지 전체 선택"
                        targets={users.flatMap(contactsFromUser)}
                        selected={selected}
                        onChange={replaceSelected}
                      />
                    </li>
                    {users.map((user) => {
                      const options = buildContactOptions(
                        user.id,
                        user.phone,
                        user.deliveryContacts,
                      );
                      const statusInfo = USER_STATUS_MAP[user.status];
                      return (
                        <li
                          key={user.id}
                          className={cn(
                            "px-3 py-2.5",
                            options.length === 0 && "opacity-50",
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <p className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary">
                              {user.email}
                            </p>
                            {statusInfo && (
                              <Badge
                                label={statusInfo.label}
                                color={statusInfo.color}
                              />
                            )}
                          </div>
                          <ContactChecks
                            options={options}
                            email={user.email}
                            selected={selected}
                            onToggle={(option) =>
                              toggleContact(user.email, option)
                            }
                          />
                        </li>
                      );
                    })}
                  </ul>
                )}
                {totalPages > 1 && (
                  <div className="border-t border-border-light px-3 py-3">
                    <Pagination
                      page={page}
                      totalPages={totalPages}
                      onPageChange={setPage}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
      {success && (
        <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </p>
      )}

      <button
        type="button"
        onClick={handleReview}
        className="btn-primary w-full"
      >
        발송 내용 확인
      </button>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-xs text-text-muted">{label}</dt>
      <dd className="text-right text-sm font-medium text-text-primary">
        {value}
      </dd>
    </div>
  );
}

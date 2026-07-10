"use client";

import {
  forwardRef,
  useState,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type ReactNode,
} from "react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Input FormField ─────────────────────────────────────────────────────────

export interface FormFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "id" | "placeholder"
> {
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  /** 인풋 오른쪽에 붙는 슬롯 (type="password"는 자동으로 눈 아이콘이 붙습니다) */
  suffix?: ReactNode;
  id?: string;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      label,
      error,
      hint,
      optional,
      suffix,
      className,
      id,
      type = "text",
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const fieldId = id ?? `field-${label.replace(/\s+/g, "-")}`;
    const isPassword = type === "password";
    const actualType = isPassword ? (showPassword ? "text" : "password") : type;
    const hasSuffix = Boolean(suffix) || isPassword;

    return (
      <div>
        <div className="relative">
          <input
            ref={ref}
            id={fieldId}
            type={actualType}
            placeholder=" "
            className={cn(
              "peer w-full rounded-xl border",
              "bg-surface-input/50 px-4 pb-[10px] pt-[22px]",
              "text-sm text-text-primary outline-none",
              "transition-all duration-200",
              "border-border placeholder-transparent",
              "focus:border-brand-400 focus:bg-white",
              "disabled:cursor-not-allowed disabled:opacity-50",
              hasSuffix && "pr-12",
              error && "border-red-300 bg-red-50/30 focus:border-red-400",
              className,
            )}
            {...props}
          />
          <label
            htmlFor={fieldId}
            className={cn(
              "pointer-events-none select-none",
              "absolute left-4 transition-all duration-[180ms] ease-out",
              // 값이 있거나 focused 상태 (기본값: 위로 올라간 상태)
              "top-[9px] text-[11px] font-medium",
              // 빈 상태 (placeholder-shown)
              "peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2",
              "peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal",
              // focused 상태 — !important로 placeholder-shown 오버라이드
              "peer-focus:!top-[9px] peer-focus:!translate-y-0",
              "peer-focus:!text-[11px] peer-focus:!font-medium",
              error
                ? "text-red-400 peer-focus:!text-red-500"
                : "text-text-muted peer-focus:!text-brand-500",
            )}
          >
            {label}
            {optional && (
              <span className="ml-1.5 font-normal opacity-50">선택</span>
            )}
          </label>

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text-primary"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
          {!isPassword && suffix && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted">
              {suffix}
            </div>
          )}
        </div>

        {error && (
          <p className="mt-1.5 flex items-center gap-1 pl-1 text-xs text-red-500">
            <AlertCircle size={11} className="shrink-0" />
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="mt-1.5 pl-1 text-xs text-text-muted">{hint}</p>
        )}
      </div>
    );
  },
);

FormField.displayName = "FormField";

// ── Textarea FormField ──────────────────────────────────────────────────────

export interface FormTextareaProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "id" | "placeholder"
> {
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  id?: string;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  (
    { label, error, hint, optional, className, id, rows = 3, ...props },
    ref,
  ) => {
    const fieldId = id ?? `field-${label.replace(/\s+/g, "-")}`;

    return (
      <div>
        <div className="relative">
          <textarea
            ref={ref}
            id={fieldId}
            rows={rows}
            placeholder=" "
            className={cn(
              "peer w-full resize-none rounded-xl border",
              "bg-surface-input/50 px-4 pb-3 pt-[22px]",
              "text-sm text-text-primary outline-none",
              "transition-all duration-200",
              "border-border placeholder-transparent",
              "focus:border-brand-400 focus:bg-white",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-red-300 bg-red-50/30 focus:border-red-400",
              className,
            )}
            {...props}
          />
          <label
            htmlFor={fieldId}
            className={cn(
              "pointer-events-none select-none",
              "absolute left-4 transition-all duration-[180ms] ease-out",
              // 값이 있거나 focused 상태
              "top-[9px] text-[11px] font-medium",
              // 빈 상태
              "peer-placeholder-shown:top-[14px] peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal",
              // focused 상태
              "peer-focus:!top-[9px] peer-focus:!text-[11px] peer-focus:!font-medium",
              error
                ? "text-red-400 peer-focus:!text-red-500"
                : "text-text-muted peer-focus:!text-brand-500",
            )}
          >
            {label}
            {optional && (
              <span className="ml-1.5 font-normal opacity-50">선택</span>
            )}
          </label>
        </div>

        {error && (
          <p className="mt-1.5 flex items-center gap-1 pl-1 text-xs text-red-500">
            <AlertCircle size={11} className="shrink-0" />
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="mt-1.5 pl-1 text-xs text-text-muted">{hint}</p>
        )}
      </div>
    );
  },
);

FormTextarea.displayName = "FormTextarea";

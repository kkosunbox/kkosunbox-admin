"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { getErrorMessage } from "@/lib/api";
import { FormField } from "@/components/ui/FormField";

const loginSchema = z.object({
  username: z.string().min(1, "아이디를 입력해주세요."),
  password: z.string().min(1, "비밀번호를 입력해주세요."),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginForm) {
    setError("");
    try {
      await login(data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-surface-muted to-brand-100 px-4">
      <div className="w-full max-w-sm">
        {/* 로고 영역 */}
        <div className="mb-10 flex flex-col items-center">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-card">
            <Image
              src="/logo.png"
              alt="꼬순박스"
              width={52}
              height={52}
              className="object-contain"
            />
          </div>
          <Image
            src="/logo-big.png"
            alt="꼬순박스"
            width={160}
            height={48}
            className="object-contain"
          />
          <p className="mt-2.5 text-sm text-text-muted">관리자 페이지</p>
        </div>

        {/* 로그인 폼 카드 */}
        <div className="rounded-3xl bg-white p-8 shadow-card">
          <h1 className="mb-8 text-2xl font-bold text-text-primary">로그인</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              {...register("username")}
              label="아이디"
              type="text"
              autoComplete="username"
              error={errors.username?.message}
            />

            <FormField
              {...register("password")}
              label="비밀번호"
              type="password"
              autoComplete="current-password"
              error={errors.password?.message}
            />

            {error && (
              <div className="form-error-banner">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full py-3.5 text-base"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    로그인 중...
                  </>
                ) : (
                  "로그인"
                )}
              </button>
            </div>
          </form>
        </div>

        <p className="mt-8 text-center text-xs text-text-muted">
          © 2025 꼬순박스. All rights reserved.
        </p>
      </div>
    </div>
  );
}

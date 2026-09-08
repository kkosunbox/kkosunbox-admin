"use client";

import { usePathname } from "next/navigation";
import { Menu, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const PAGE_TITLES: Record<string, string> = {
  "/": "대시보드",
  "/orders": "주문 / 배송 관리",
  "/customers": "고객 관리",
  "/inquiries": "문의 관리",
  "/partnership-inquiries": "제휴문의",
  "/subscriptions": "구독 현황",
  "/plans": "구독 플랜",
  "/products": "상품 관리",
  "/coupons/usage-logs": "쿠폰 사용내역",
  "/coupons": "쿠폰 관리",
  "/product-coupons/usage-logs": "단건 쿠폰 사용내역",
  "/product-coupons": "단건 쿠폰 관리",
  "/reviews": "리뷰 관리",
  "/influencers": "인플루언서 관리",
  "/settings": "시스템 설정",
};

function getPageTitle(pathname: string): string {
  if (pathname === "/") return "대시보드";
  const matched = Object.entries(PAGE_TITLES)
    .filter(([key]) => key !== "/" && pathname.startsWith(key))
    .sort((a, b) => b[0].length - a[0].length)[0];
  return matched?.[1] ?? "관리자";
}

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const title = getPageTitle(pathname);

  function handleRefresh() {
    void queryClient.invalidateQueries();
  }

  return (
    <header className="flex h-14 flex-shrink-0 items-center justify-between bg-white px-4 lg:px-6 border-b border-border/60">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-xl text-text-muted",
            "transition-colors hover:bg-surface-muted hover:text-text-primary lg:hidden",
          )}
          aria-label="메뉴 열기"
        >
          <Menu size={18} />
        </button>
        <h1 className="text-base font-bold text-text-primary">{title}</h1>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={handleRefresh}
          className="flex h-8 w-8 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
          title="새로고침"
        >
          <RefreshCw size={14} />
        </button>
      </div>
    </header>
  );
}

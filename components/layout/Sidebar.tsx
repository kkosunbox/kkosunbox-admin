"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  ShoppingCart,
  Package,
  Users,
  MessageSquare,
  CreditCard,
  Tag,
  Ticket,
  TicketPercent,
  Star,
  Settings,
  LogOut,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  adminOnly?: boolean;
}

const NAV_GROUPS: { label?: string; items: NavItem[] }[] = [
  {
    items: [{ label: "대시보드", href: "/", icon: LayoutDashboard }],
  },
  {
    label: "운영 관리",
    items: [
      { label: "주문 / 배송", href: "/orders", icon: ShoppingBag },
      { label: "단건 주문", href: "/product-orders", icon: ShoppingCart },
      { label: "고객 관리", href: "/customers", icon: Users, adminOnly: true },
      {
        label: "문의 관리",
        href: "/inquiries",
        icon: MessageSquare,
        adminOnly: true,
      },
      { label: "구독 현황", href: "/subscriptions", icon: CreditCard },
    ],
  },
  {
    label: "콘텐츠 / 설정",
    items: [
      { label: "구독 플랜", href: "/plans", icon: Tag, adminOnly: true },
      { label: "상품 관리", href: "/products", icon: Package, adminOnly: true },
      { label: "쿠폰 관리", href: "/coupons", icon: Ticket, adminOnly: true },
      {
        label: "단건 쿠폰 관리",
        href: "/product-coupons",
        icon: TicketPercent,
        adminOnly: true,
      },
      { label: "리뷰 관리", href: "/reviews", icon: Star, adminOnly: true },
      {
        label: "인플루언서",
        href: "/influencers",
        icon: TrendingUp,
        adminOnly: true,
      },
      {
        label: "시스템 설정",
        href: "/settings",
        icon: Settings,
        adminOnly: true,
      },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { admin, logout } = useAuth();

  const isAdmin = admin?.role === "admin";

  function isActive(href: string): boolean {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex h-full w-60 flex-col bg-white transition-transform duration-300 ease-in-out",
        "border-r border-border/60",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "lg:static lg:z-auto lg:translate-x-0",
      )}
    >
      {/* Logo */}
      <div className="flex h-16 flex-shrink-0 items-center gap-3 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50">
          <Image
            src="/logo.png"
            alt="꼬순박스"
            width={26}
            height={26}
            className="object-contain"
          />
        </div>
        <div>
          <p className="text-sm font-bold text-text-primary">꼬순박스</p>
          <p className="text-[11px] text-text-muted">Admin</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {NAV_GROUPS.map((group, gi) => {
          const visibleItems = group.items.filter(
            (item) => !item.adminOnly || isAdmin,
          );
          if (visibleItems.length === 0) return null;
          return (
            <div key={gi} className={cn(gi > 0 && "mt-5")}>
              {group.label && (
                <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-text-muted/60">
                  {group.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {visibleItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-all duration-150",
                          active
                            ? "bg-brand-50 font-semibold text-brand-700"
                            : "font-medium text-text-secondary hover:bg-surface-muted hover:text-text-primary",
                        )}
                      >
                        {active && (
                          <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-500" />
                        )}
                        <item.icon
                          size={16}
                          className={
                            active ? "text-brand-500" : "text-text-muted"
                          }
                        />
                        <span className="flex-1 leading-none">
                          {item.label}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-border/60 p-3">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
          {/* 아바타 */}
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-600">
            {admin?.name?.[0] ?? "A"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-text-primary leading-tight">
              {admin?.name}
            </p>
            <p className="truncate text-[11px] text-text-muted leading-tight">
              @{admin?.username}
            </p>
          </div>
          <button
            onClick={logout}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-red-50 hover:text-red-500"
            title="로그아웃"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}

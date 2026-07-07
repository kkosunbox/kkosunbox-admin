"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ShoppingBag,
  Truck,
  Users,
  MessageSquare,
  CreditCard,
  TrendingUp,
} from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { CalendarView } from "@/components/dashboard/CalendarView";
import { dashboardApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";

export default function DashboardPage() {
  const { admin } = useAuth();
  const isAdmin = admin?.role === "admin";

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: dashboardApi.getStats,
    refetchInterval: 60_000,
  });

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-lg font-bold text-text-primary">
          안녕하세요, {admin?.name}님
        </h2>
        <p className="mt-0.5 text-sm text-text-muted">
          꼬순박스 어드민에 오신 것을 환영해요.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {isAdmin && (
          <>
            <StatsCard
              title="이번 달 결제 건수"
              value={isLoading ? "—" : (stats?.totalPaymentsThisMonth ?? 0)}
              subtitle="완료 기준"
              icon={ShoppingBag}
              iconColor="text-brand-500"
              iconBg="bg-brand-50"
            />
            <StatsCard
              title="이번 달 결제 금액"
              value={isLoading ? "—" : formatCurrency(stats?.amountThisMonth ?? 0)}
              subtitle="완료 기준"
              icon={TrendingUp}
              iconColor="text-green-600"
              iconBg="bg-green-50"
            />
          </>
        )}
        <StatsCard
          title="배송 대기"
          value={isLoading ? "—" : (stats?.pendingDelivery ?? 0)}
          subtitle="처리가 필요한 건"
          icon={Truck}
          iconColor="text-yellow-600"
          iconBg="bg-yellow-50"
        />
        {isAdmin && (
          <>
            <StatsCard
              title="미답변 문의"
              value={isLoading ? "—" : (stats?.unansweredInquiries ?? 0)}
              subtitle="빠른 답변이 필요해요"
              icon={MessageSquare}
              iconColor="text-red-500"
              iconBg="bg-red-50"
            />
            <StatsCard
              title="활성 구독자"
              value={isLoading ? "—" : (stats?.totalActiveSubscriptions ?? 0)}
              subtitle="현재 구독 중"
              icon={CreditCard}
              iconColor="text-purple-500"
              iconBg="bg-purple-50"
            />
            <StatsCard
              title="전체 고객"
              value={isLoading ? "—" : (stats?.totalUsers ?? 0)}
              subtitle="활성 회원 기준"
              icon={Users}
              iconColor="text-blue-500"
              iconBg="bg-blue-50"
            />
          </>
        )}
      </div>

      {/* Calendar */}
      <CalendarView />
    </div>
  );
}

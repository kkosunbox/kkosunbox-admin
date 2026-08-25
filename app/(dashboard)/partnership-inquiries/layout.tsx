"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";

export default function PartnershipInquiriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { admin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && admin?.role !== "admin") {
      router.replace("/");
    }
  }, [admin, isLoading, router]);

  if (admin?.role !== "admin") return null;

  return children;
}
